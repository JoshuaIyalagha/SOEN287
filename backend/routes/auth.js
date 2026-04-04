/*
Written by Joshua Iyalagha 40306001
Updated: Simplified demo login with hardcoded credentials bypass
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

    // =====================================================
    // DEMO CREDENTIALS BYPASS (for easy testing only)
    // These accounts skip password hashing for demo convenience
    // In production, this block will be removed and use secure hashing only
    // =====================================================
    const DEMO_CREDENTIALS = {
        'instructor@test.com': {
            password: 'instructor-password',
            role: 'instructor',
            id: 1,
            first_name: 'Sarah',
            last_name: 'Johnson',
            display_name: 'Dr. Sarah Johnson'
        },
        'instructor2@test.com': {
            password: 'instructor-password',
            role: 'instructor',
            id: 2,
            first_name: 'Michael',
            last_name: 'Chen',
            display_name: 'Prof. Michael Chen'
        },
        'student@test.com': {
            password: 'password',
            role: 'student',
            id: 3,
            first_name: 'John',
            last_name: 'Student',
            display_name: 'John Student',
            student_id: '12345678'
        },
        'student2@test.com': {
            password: 'password',
            role: 'student',
            id: 4,
            first_name: 'Emma',
            last_name: 'Wilson',
            display_name: 'Emma Wilson',
            student_id: '23456789'
        },
        'student3@test.com': {
            password: 'password',
            role: 'student',
            id: 5,
            first_name: 'Liam',
            last_name: 'Brown',
            display_name: 'Liam Brown',
            student_id: '34567890'
        }
    };

    // Check if this is a demo account login
    if (DEMO_CREDENTIALS[email] && DEMO_CREDENTIALS[email].password === password) {
        const demoUser = DEMO_CREDENTIALS[email];

        // Create token (same format as real users)
        const token = Buffer.from(JSON.stringify({
            id: demoUser.id,
            email: email,
            role: demoUser.role,
            name: demoUser.display_name
        })).toString('base64');

        console.log(`✅ Demo login successful: ${email}`);

        sendJSON(res, 200, {
            success: true,
            token: token,
            user: {
                id: demoUser.id,
                email: email,
                name: demoUser.display_name,
                role: demoUser.role,
                // Include student_id for student accounts
                ...(demoUser.student_id && { student_id: demoUser.student_id })
            }
        });
        return;
    }
    // =====================================================
    // END DEMO BYPASS - Real accounts use secure hashing below
    // =====================================================

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
            // Legacy plain-text path
            passwordValid = (user.password === password);
        }

        if (!passwordValid) {
            sendJSON(res, 401, { error: 'Invalid credentials' });
            return;
        }

        // Debug logging for password mismatches (kept for real accounts)
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

        // Update the last login
        await User.updateLastLogin(user.id);

        // Create a token
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