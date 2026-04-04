// Written by Joshua Iyalagha 40306001
// generate-demo-hashes.js
// Generates password hashes for demo accounts using the SAME method as your auth module
// Usage: node generate-demo-hashes.js

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Auto-detect hashing method from auth module
function detectHashingMethod() {
    const authPath = path.join(__dirname, 'backend', 'routes', 'auth.js');

    if (!fs.existsSync(authPath)) {
        console.warn('⚠️  Warning: backend/routes/auth.js not found. Defaulting to SHA256.');
        return 'sha256';
    }

    const authCode = fs.readFileSync(authPath, 'utf8');

    if (authCode.includes('bcrypt')) {
        console.log('🔐 Detected bcrypt hashing in auth module');
        return 'bcrypt';
    } else if (authCode.includes('pbkdf2')) {
        console.log('🔐 Detected pbkdf2 hashing in auth module');
        return 'pbkdf2';
    } else {
        console.log('🔐 Detected SHA256 hashing in auth module (default)');
        return 'sha256';
    }
}

// Hash functions matching common auth module patterns
function hashSHA256(password, salt) {
    return crypto.createHash('sha256').update(salt + password).digest('hex');
}

async function hashBcrypt(password, salt) {
    // bcrypt uses rounds, not a salt string - use fixed rounds for demo consistency
    const bcrypt = require('bcrypt');
    return await bcrypt.hash(password, 10);
}

function hashPBKDF2(password, salt) {
    return crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha256').toString('hex');
}

// Demo credentials
const demoUsers = [
    { email: 'instructor@test.com', password: 'instructor-password', salt: 'demo_salt_instructor', role: 'instructor' },
    { email: 'instructor2@test.com', password: 'instructor-password', salt: 'demo_salt_instructor', role: 'instructor' },
    { email: 'student@test.com', password: 'password', salt: 'demo_salt_student', role: 'student' },
    { email: 'student2@test.com', password: 'password', salt: 'demo_salt_student', role: 'student' },
    { email: 'student3@test.com', password: 'password', salt: 'demo_salt_student', role: 'student' }
];

async function main() {
    const method = detectHashingMethod();
    console.log('\n===========================================');
    console.log('DEMO PASSWORD HASHES FOR smart_course_companion');
    console.log(`Hashing method: ${method.toUpperCase()}`);
    console.log('===========================================\n');

    for (const user of demoUsers) {
        let hash;
        try {
            if (method === 'bcrypt') {
                hash = await hashBcrypt(user.password, user.salt);
            } else if (method === 'pbkdf2') {
                hash = hashPBKDF2(user.password, user.salt);
            } else {
                hash = hashSHA256(user.password, user.salt);
            }

            console.log(`${user.email} (${user.role})`);
            console.log(`  Password: ${user.password}`);
            console.log(`  Salt: ${user.salt}`);
            console.log(`  Hash: ${hash}`);
            console.log(`  SQL: UPDATE users SET salt = '${user.salt}', passwordHash = '${hash}' WHERE email = '${user.email}';\n`);
        } catch (error) {
            console.error(`❌ Error hashing ${user.email}: ${error.message}`);
            if (method === 'bcrypt') {
                console.error('💡 Tip: Install bcrypt with: npm install bcrypt');
            }
        }
    }

    console.log('===========================================');
    console.log('INSTRUCTIONS:');
    console.log('1. Copy the SQL UPDATE statements above');
    console.log('2. Run: mysql -u root -p smart_course_companion');
    console.log('3. Paste the UPDATE statements and press Enter');
    console.log('4. Test login with the demo credentials');
    console.log('===========================================');
}

main().catch(console.error);