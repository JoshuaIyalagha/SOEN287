/*
Written by: Joshua Iyalagha 40306001
 */

// backend/utils/auth.js
const crypto = require('crypto');

function hashPassword(password, salt) {
    // Convert hex string salt to Buffer for pbkdf2Sync
    const saltBuffer = Buffer.isBuffer(salt) ? salt : Buffer.from(salt, 'hex');
    return crypto.pbkdf2Sync(password, saltBuffer, 1000, 64, 'sha512').toString('hex');
}

function generateSalt() {
    return crypto.randomBytes(16).toString('hex');
}

function verifyPassword(password, salt, storedHash) {
    return hashPassword(password, salt) === storedHash;
}

module.exports = { hashPassword, generateSalt, verifyPassword };