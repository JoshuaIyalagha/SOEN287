/*
Instructor Profile JavaScript
Written by: Joshua Iyalagha 40306001
Updated by: Joshua Iyalagha 40306001 on 2026-04-02, 2026-04-03 and 2026-04-04
Purpose: Handle instructor profile management with full API integration
*/

const API_BASE = 'http://localhost:3000/api';
let authToken = null;
let currentProfile = null;

// Dark mode styles (kept for backward compatibility)
const darkModeStyles = `
    body.dark-mode {
        background-color: #1a1a2e;
        color: #eee;
    }
    body.dark-mode .card {
        background-color: #16213e;
        border-color: #0f3460;
    }
    body.dark-mode .navbar {
        background-color: #0f3460;
    }
    body.dark-mode input,
    body.dark-mode select,
    body.dark-mode textarea {
        background-color: #0f3460;
        color: #eee;
        border-color: #1a1a2e;
    }
    body.dark-mode .stat-card {
        background-color: #16213e;
    }
    body.dark-mode .course-card {
        background-color: #16213e;
    }
    body.dark-mode .modal-content {
        background-color: #16213e;
    }
    body.dark-mode .submission-item {
        border-bottom-color: #0f3460;
    }
`;

// Add dark mode styles to document
const styleSheet = document.createElement('style');
styleSheet.textContent = darkModeStyles;
document.head.appendChild(styleSheet);

document.addEventListener('DOMContentLoaded', async function() {
    authToken = localStorage.getItem('token');

    if (!authToken) {
        window.location.href = '../login.html';
        return;
    }

    // Setup event listeners
    setupEventListeners();

    // Load profile data and pre-fill forms
    await loadProfile();

    // Load saved theme
    loadSavedTheme();
});

async function fetchAPI(endpoint, options = {}) {
    const defaultOptions = {
        headers: {
            'Authorization': authToken,
            'Content-Type': 'application/json'
        }
    };

    try {
        const response = await fetch(`${API_BASE}${endpoint}`, { ...defaultOptions, ...options });

        if (response.status === 401) {
            localStorage.removeItem('token');
            window.location.href = '../login.html';
            throw new Error('Unauthorized');
        }

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Request failed');
        }

        return data;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

function setupEventListeners() {
    // Profile form
    const profileForm = document.getElementById('profileForm');
    if (profileForm) {
        profileForm.addEventListener('submit', updateProfile);
    }

    // Password form
    const passwordForm = document.getElementById('passwordForm');
    if (passwordForm) {
        passwordForm.addEventListener('submit', changePassword);
    }

    // Settings save button
    const saveSettingsBtn = document.getElementById('saveSettingsBtn');
    if (saveSettingsBtn) {
        saveSettingsBtn.addEventListener('click', saveSettings);
    }

    // Delete profile button
    const deleteProfileBtn = document.getElementById('deleteProfileBtn');
    if (deleteProfileBtn) {
        deleteProfileBtn.addEventListener('click', showDeleteConfirmation);
    }

    // Confirm delete button in modal
    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', deleteProfile);
    }

    // Checkbox to enable delete button
    const confirmDeleteCheck = document.getElementById('confirmDeleteCheck');
    if (confirmDeleteCheck) {
        confirmDeleteCheck.addEventListener('change', function() {
            const btn = document.getElementById('confirmDeleteBtn');
            if (btn) btn.disabled = !this.checked;
        });
    }

    // Logout in dropdown
    const dropdownLogout = document.getElementById('dropdownLogout');
    if (dropdownLogout) {
        dropdownLogout.addEventListener('click', function(e) {
            e.preventDefault();
            logout();
        });
    }
}

async function loadProfile() {
    try {
        const data = await fetchAPI('/profile');
        currentProfile = data;

        // Fill profile form
        const profile = data.profile || data;
        document.getElementById('firstName').value = profile.first_name || profile.firstName || '';
        document.getElementById('lastName').value = profile.last_name || profile.lastName || '';
        document.getElementById('displayName').value = profile.display_name || profile.displayName || '';
        document.getElementById('title').value = profile.title || '';
        document.getElementById('department').value = profile.department || '';
        document.getElementById('office').value = profile.office || '';
        document.getElementById('email').value = data.email || '';
        document.getElementById('phone').value = profile.phone || '';
        document.getElementById('bio').value = profile.bio || '';

        // Fill account info
        document.getElementById('role').textContent = (data.role || 'instructor') === 'instructor' ? 'Instructor' : 'Student';
        document.getElementById('joinDate').textContent = data.created_at || data.createdAt
            ? new Date(data.created_at || data.createdAt).toLocaleDateString()
            : 'N/A';
        document.getElementById('lastLogin').textContent = data.last_login || data.lastLogin
            ? new Date(data.last_login || data.lastLogin).toLocaleString()
            : 'Never';

        // Fill notification settings
        document.getElementById('emailNotifications').checked = data.email_notifications ?? data.emailNotifications ?? true;
        document.getElementById('submissionReminders').checked = data.submission_reminders ?? data.submissionReminders ?? true;

        // Update instructor name in navbar
        const displayName = profile.display_name || profile.displayName || data.email;
        document.getElementById('instructorName').textContent = displayName;

    } catch (error) {
        console.error('Error loading profile:', error);
        if (typeof toast !== 'undefined') {
            toast.error('Failed to load profile: ' + error.message);
        } else {
            alert('Failed to load profile: ' + error.message);
        }
    }
}

async function updateProfile(e) {
    e.preventDefault();

    const profileData = {
        first_name: document.getElementById('firstName').value,
        last_name: document.getElementById('lastName').value,
        display_name: document.getElementById('displayName').value,
        title: document.getElementById('title').value,
        department: document.getElementById('department').value,
        office: document.getElementById('office').value,
        phone: document.getElementById('phone').value,
        bio: document.getElementById('bio').value
    };

    const saveStatus = document.getElementById('profileSaveStatus');
    saveStatus.textContent = 'Saving...';
    saveStatus.style.color = '#17a2b8';

    try {
        await fetchAPI('/profile', {
            method: 'PUT',
            body: JSON.stringify(profileData)
        });

        saveStatus.textContent = '✓ Saved!';
        saveStatus.style.color = '#28a745';
        if (typeof toast !== 'undefined') {
            toast.success('Profile updated successfully');
        }

        // Update navbar name immediately
        const displayName = profileData.display_name || document.getElementById('email').value;
        document.getElementById('instructorName').textContent = displayName;

        // Refresh profile data
        await loadProfile();

        setTimeout(() => {
            saveStatus.textContent = '';
        }, 3000);

    } catch (error) {
        saveStatus.textContent = '✗ Failed';
        saveStatus.style.color = '#dc3545';
        if (typeof toast !== 'undefined') {
            toast.error('Failed to update profile: ' + error.message);
        } else {
            alert('Failed to update profile: ' + error.message);
        }

        setTimeout(() => {
            saveStatus.textContent = '';
        }, 3000);
    }
}

async function changePassword(e) {
    e.preventDefault();

    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    // Validation (harmonized with login page)
    if (newPassword !== confirmPassword) {
        if (typeof toast !== 'undefined') {
            toast.error('New passwords do not match');
        } else {
            alert('New passwords do not match');
        }
        return;
    }

    if (newPassword.length < 6) {
        if (typeof toast !== 'undefined') {
            toast.error('Password must be at least 6 characters');
        } else {
            alert('Password must be at least 6 characters');
        }
        return;
    }

    const saveStatus = document.getElementById('passwordSaveStatus');
    saveStatus.textContent = 'Changing...';
    saveStatus.style.color = '#17a2b8';

    try {
        await fetchAPI('/profile/password', {
            method: 'PUT',
            body: JSON.stringify({
                current_password: currentPassword,
                new_password: newPassword
            })
        });

        saveStatus.textContent = '✓ Changed!';
        saveStatus.style.color = '#28a745';
        if (typeof toast !== 'undefined') {
            toast.success('Password changed successfully');
        }

        document.getElementById('passwordForm').reset();

        setTimeout(() => {
            saveStatus.textContent = '';
        }, 3000);

    } catch (error) {
        saveStatus.textContent = '✗ ' + error.message;
        saveStatus.style.color = '#dc3545';
        if (typeof toast !== 'undefined') {
            toast.error('Failed to change password: ' + error.message);
        } else {
            alert('Failed to change password: ' + error.message);
        }

        setTimeout(() => {
            saveStatus.textContent = '';
        }, 3000);
    }
}

async function saveSettings() {
    const settingsData = {
        email_notifications: document.getElementById('emailNotifications').checked,
        submission_reminders: document.getElementById('submissionReminders').checked
    };

    const saveStatus = document.getElementById('settingsSaveStatus');
    saveStatus.textContent = 'Saving...';
    saveStatus.style.color = '#17a2b8';

    try {
        await fetchAPI('/profile', {
            method: 'PUT',
            body: JSON.stringify(settingsData)
        });

        saveStatus.textContent = '✓ Saved!';
        saveStatus.style.color = '#28a745';
        if (typeof toast !== 'undefined') {
            toast.success('Settings saved');
        }

        setTimeout(() => {
            saveStatus.textContent = '';
        }, 3000);

    } catch (error) {
        saveStatus.textContent = '✗ Failed';
        saveStatus.style.color = '#dc3545';
        if (typeof toast !== 'undefined') {
            toast.error('Failed to save settings: ' + error.message);
        } else {
            alert('Failed to save settings: ' + error.message);
        }

        setTimeout(() => {
            saveStatus.textContent = '';
        }, 3000);
    }
}

// === Profile Deletion Functions ===

function showDeleteConfirmation() {
    const modal = document.getElementById('deleteConfirmModal');
    const checkbox = document.getElementById('confirmDeleteCheck');
    const confirmBtn = document.getElementById('confirmDeleteBtn');

    if (checkbox) checkbox.checked = false;
    if (confirmBtn) confirmBtn.disabled = true;

    if (modal) {
        modal.style.display = 'block';
    }
}

async function deleteProfile() {
    const confirmBtn = document.getElementById('confirmDeleteBtn');
    if (!confirmBtn || confirmBtn.disabled) return;

    confirmBtn.textContent = 'Deleting...';
    confirmBtn.disabled = true;

    try {
        await fetchAPI('/profile', {
            method: 'DELETE'
        });

        // Clear local storage and redirect to login
        localStorage.removeItem('token');

        if (typeof toast !== 'undefined') {
            toast.success('Profile deleted successfully');
        }

        // Redirect to login after short delay
        setTimeout(() => {
            window.location.href = '../login.html';
        }, 1000);

    } catch (error) {
        confirmBtn.textContent = 'Delete Permanently';
        confirmBtn.disabled = false;

        if (typeof toast !== 'undefined') {
            toast.error('Failed to delete profile: ' + error.message);
        } else {
            alert('Failed to delete profile: ' + error.message);
        }
    }
}

// Theme Functions

function loadSavedTheme() {
    // Theme is controlled by navbar.js/theme.js
    const savedTheme = localStorage.getItem('theme') || localStorage.getItem('instructor_theme');
    if (savedTheme) {
        // lettign navbar.js handle theme application
        document.dispatchEvent(new CustomEvent('themeLoaded', { detail: { theme: savedTheme } }));
    }
}

function logout() {
    localStorage.removeItem('token');
    if (typeof toast !== 'undefined') {
        toast.success('Logged out successfully');
    }
    setTimeout(() => {
        window.location.href = '../login.html';
    }, 500);
}

// Modal functions (inherited from dashboard)
function openModal(modalId) {
    document.getElementById(modalId).style.display = 'block';
}
function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}
window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = 'none';
    }
}