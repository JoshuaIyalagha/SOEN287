/*
Written by Joshua Iyalagha 40306001
 */
const User = require('../models/User');

function verifyToken(token) {
    try {
        const decoded = Buffer.from(token, 'base64').toString();
        return JSON.parse(decoded);
    } catch (error) {
        return null;
    }
}

function sendJSON(res, statusCode, data) {
    res.writeHead(statusCode, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data));
}

async function getProfile(req, res, token) {
    const userInfo = verifyToken(token);

    if (!userInfo) {
        sendJSON(res, 401, { error: 'Invalid token' });
        return;
    }

    try {
        const user = await User.getProfile(userInfo.id);

        if (!user) {
            sendJSON(res, 404, { error: 'User not found' });
            return;
        }

        sendJSON(res, 200, {
            id: user.id,
            email: user.email,
            role: user.role,
            profile: {
                firstName: user.first_name,
                lastName: user.last_name,
                displayName: user.display_name,
                title: user.title,
                department: user.department,
                office: user.office,
                phone: user.phone,
                bio: user.bio,
                profileImage: user.profile_image,
                studentId: user.student_id,
                program: user.program,
                year: user.year
            },
            settings: {
                theme: user.theme || 'light',
                notifications: {
                    email: user.email_notifications === 1,
                    submissionReminders: user.submission_reminders === 1
                }
            },
            createdAt: user.created_at,
            lastLogin: user.last_login
        });
    } catch (error) {
        console.error('Error loading profile:', error);
        sendJSON(res, 500, { error: 'Failed to load profile' });
    }
}

async function updateProfile(req, res, token, body) {
    const userInfo = verifyToken(token);

    if (!userInfo) {
        sendJSON(res, 401, { error: 'Invalid token' });
        return;
    }

    const { profile, settings } = body;

    try {
        if (profile) {
            await User.updateProfile(userInfo.id, profile);
        }

        if (settings) {
            await User.updateSettings(userInfo.id, {
                theme: settings.theme,
                email_notifications: settings.notifications?.email,
                submission_reminders: settings.notifications?.submissionReminders
            });
        }

        sendJSON(res, 200, {
            success: true,
            message: 'Profile updated successfully'
        });
    } catch (error) {
        console.error('Error updating profile:', error);
        sendJSON(res, 500, { error: 'Failed to update profile' });
    }
}

async function changePassword(req, res, token, body) {
    const userInfo = verifyToken(token);

    if (!userInfo) {
        sendJSON(res, 401, { error: 'Invalid token' });
        return;
    }

    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
        sendJSON(res, 400, { error: 'Current password and new password are required' });
        return;
    }

    try {
        const user = await User.findById(userInfo.id);

        if (!user || user.password !== currentPassword) {
            sendJSON(res, 401, { error: 'Current password is incorrect' });
            return;
        }

        await User.updatePassword(userInfo.id, newPassword);

        sendJSON(res, 200, {
            success: true,
            message: 'Password changed successfully'
        });
    } catch (error) {
        console.error('Error changing password:', error);
        sendJSON(res, 500, { error: 'Failed to change password' });
    }
}

module.exports = { getProfile, updateProfile, changePassword };