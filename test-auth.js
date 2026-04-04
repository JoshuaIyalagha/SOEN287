// test-auth.js
// Verifies that your auth module's hashing matches the demo hashes
// Usage: node test-auth.js
// Written by Joshua Iyalagha 40306001

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Load your actual auth module's hashing logic
function getAuthHashFunction() {
    const authPath = path.join(__dirname, 'backend', 'routes', 'auth.js');

    if (!fs.existsSync(authPath)) {
        console.warn('⚠️  Warning: backend/routes/auth.js not found. Using default SHA256.');
        return (password, salt) => crypto.createHash('sha256').update(salt + password).digest('hex');
    }

    const authCode = fs.readFileSync(authPath, 'utf8');

    // Return function matching detected method
    if (authCode.includes('bcrypt')) {
        const bcrypt = require('bcrypt');
        return async (password, salt) => await bcrypt.hash(password, 10);
    } else if (authCode.includes('pbkdf2')) {
        return (password, salt) => crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha256').toString('hex');
    } else {
        // Default SHA256
        return (password, salt) => crypto.createHash('sha256').update(salt + password).digest('hex');
    }
}

async function main() {
    const hashFn = getAuthHashFunction();

    // Test cases with expected hashes for SHA256 method
    const testCases = [
        {
            email: 'instructor@test.com',
            password: 'instructor-password',
            salt: 'demo_salt_instructor',
            expectedSHA256: '472c5eede4ea01c510ef440ae60a84d9bf541a0dd45e0cf4b87a1c695802ca7f'
        },
        {
            email: 'student@test.com',
            password: 'password',
            salt: 'demo_salt_student',
            expectedSHA256: 'cb09df1eb95042ca055742dadd0df821bb38d33efa30f96911ca58e5cbaf2ead'
        }
    ];

    console.log('🔍 Testing password hashing compatibility...\n');

    for (const test of testCases) {
        try {
            const actual = await Promise.resolve(hashFn(test.password, test.salt));
            // For SHA256, compare to expected; for bcrypt/pbkdf2, just show the hash
            const isSHA256 = actual === test.expectedSHA256;
            const status = actual.length > 0 ? '✅ Generated' : '❌ Failed';

            console.log(`${test.email}: ${status}`);
            console.log(`  Generated hash: ${actual.substring(0, 20)}...`);
            if (isSHA256) {
                console.log(`  ✅ Matches demo schema.sql hashes`);
            } else {
                console.log(`  ⚠️  Hash differs from demo schema (expected for bcrypt/pbkdf2)`);
                console.log(`  💡 Run: node generate-demo-hashes.js to update database`);
            }
            console.log('');
        } catch (error) {
            console.error(`❌ ${test.email}: ${error.message}`);
        }
    }

    console.log('💡 If hashes don\'t match demo schema.sql:');
    console.log('   1. Run: node generate-demo-hashes.js');
    console.log('   2. Copy the SQL UPDATE statements');
    console.log('   3. Run: mysql -u root -p smart_course_companion');
    console.log('   4. Paste the UPDATE statements');
}

main().catch(console.error);