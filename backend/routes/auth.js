/*
Written by Joshua Iyalagha 40306001
 */

const User = require('../models/User');
const { verifyPassword } = require('../utils/auth');
//@TODO for debugging
console.log('Auth module loaded');

function sendJSON(res, statusCode, data) {
    res.writeHead(statusCode, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data));
}

async function login(req, res, body) {
    const { email, password } = body;

    if (!email || !password) {
        sendJSON(res, 400, { error: 'Email and password required' });
        return;
    }

    try {
        const user = await User.findByEmail(email);

        //@TODO for debugging
        console.log('User found:', user ? user.email : 'null');
        console.log('User has passwordHash:', !!user?.passwordHash);
        console.log('User has salt:', !!user?.salt);

        if (!user) {
            sendJSON(res, 401, { error: 'Invalid credentials' });
            return;
        }

        // Check password: support both hashed (new) and plain text (legacy migration)
        let passwordValid = false;

        if (user.passwordHash && user.salt) {
            // New secure path
            passwordValid = verifyPassword(password, user.salt, user.passwordHash);
        } else if (user.password) {
            // Legacy plain-text path (for migration only - remove after all users are updated)
            passwordValid = (user.password === password);
        }

        if (!passwordValid) {
            sendJSON(res, 401, { error: 'Invalid credentials' });
            return;
        }
        // Inside the login function, after the passwordValid check:
        if (!passwordValid && user.passwordHash && user.salt) {
            const { hashPassword } = require('../utils/auth');
            const computedHash = hashPassword(password, user.salt);
            console.log('--- PASSWORD DEBUG ---');
            console.log('Entered password:', password);
            console.log('Salt from DB:', user.salt);
            console.log('Computed hash:', computedHash);
            console.log('Stored hash:  ', user.passwordHash);
            console.log('Match:', computedHash === user.passwordHash);
            console.log('--- END DEBUG ---');
        }

        // updating the last login
        await User.updateLastLogin(user.id);

        // creating a token
        const token = Buffer.from(JSON.stringify({
            id: user.id,
            email: user.email,
            role: user.role,
            name: user.display_name || `${user.first_name} ${user.last_name}`.trim() || user.email
        })).toString('base64');

        sendJSON(res, 200, {
            success: true,
            token: token,
            user: {
                id: user.id,
                email: user.email,
                name: user.display_name || `${user.first_name} ${user.last_name}`.trim() || user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        sendJSON(res, 500, { error: 'Login failed' });
    }
}

module.exports = { login };