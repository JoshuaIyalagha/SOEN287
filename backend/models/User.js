/*
Written by:
Joshua Iyalagha
40306001
 */
const db = require('../config/database');

class User {
    static async findByEmail(email) {
        const sql = 'SELECT * FROM users WHERE email = ?';
        const results = await db.query(sql, [email]);
        return results[0];
    }

    static async findById(id) {
        const sql = 'SELECT * FROM users WHERE id = ?';
        const results = await db.query(sql, [id]);
        return results[0];
    }

    static async updateProfile(id, profileData) {
        const fields = [];
        const values = [];

        const allowedFields = ['first_name', 'last_name', 'display_name', 'title',
            'department', 'office', 'phone', 'bio', 'profile_image'];

        for (const [key, value] of Object.entries(profileData)) {
            if (allowedFields.includes(key) && value !== undefined) {
                fields.push(`${key} = ?`);
                values.push(value);
            }
        }

        if (fields.length === 0) return false;

        values.push(id);
        const sql = `UPDATE users SET ${fields.join(', ')} WHERE id = ?`;

        const result = await db.query(sql, values);
        return result.affectedRows > 0;
    }

    static async updateSettings(id, settings) {
        const fields = [];
        const values = [];

        if (settings.theme !== undefined) {
            fields.push('theme = ?');
            values.push(settings.theme);
        }

        if (settings.email_notifications !== undefined) {
            fields.push('email_notifications = ?');
            values.push(settings.email_notifications);
        }

        if (settings.submission_reminders !== undefined) {
            fields.push('submission_reminders = ?');
            values.push(settings.submission_reminders);
        }

        if (fields.length === 0) return false;

        values.push(id);
        const sql = `UPDATE users SET ${fields.join(', ')} WHERE id = ?`;

        const result = await db.query(sql, values);
        return result.affectedRows > 0;
    }

    static async updatePassword(id, newPassword) {
        const sql = 'UPDATE users SET password = ? WHERE id = ?';
        const result = await db.query(sql, [newPassword, id]);
        return result.affectedRows > 0;
    }

    static async updateLastLogin(id) {
        const sql = 'UPDATE users SET last_login = NOW() WHERE id = ?';
        await db.query(sql, [id]);
    }

    static async getProfile(id) {
        const sql = `
            SELECT id, email, role, first_name, last_name, display_name, title,
                   department, office, phone, bio, profile_image, student_id,
                   program, year, theme, email_notifications, submission_reminders,
                   created_at, last_login
            FROM users
            WHERE id = ?
        `;
        const results = await db.query(sql, [id]);
        return results[0];
    }
}

module.exports = User;