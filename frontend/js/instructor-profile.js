//Written by Joshua Iyalagha 40306001
const API_BASE = 'http://localhost:3000/api';
let authToken = null;

// Dark mode styles
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

document.addEventListener('DOMContentLoaded', loadSavedTheme);

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

async function loadProfile() {
    try {
        const data = await fetchAPI('/profile');

        // Fill profile form
        document.getElementById('firstName').value = data.profile.firstName || '';
        document.getElementById('lastName').value = data.profile.lastName || '';
        document.getElementById('displayName').value = data.profile.displayName || '';
        document.getElementById('title').value = data.profile.title || '';
        document.getElementById('department').value = data.profile.department || '';
        document.getElementById('office').value = data.profile.office || '';
        document.getElementById('email').value = data.email || '';
        document.getElementById('phone').value = data.profile.phone || '';
        document.getElementById('bio').value = data.profile.bio || '';

        // Fill account info
        document.getElementById('role').textContent = data.role === 'instructor' ? 'Instructor' : 'Student';
        document.getElementById('joinDate').textContent = data.createdAt ? new Date(data.createdAt).toLocaleDateString() : 'N/A';
        document.getElementById('lastLogin').textContent = data.lastLogin ? new Date(data.lastLogin).toLocaleString() : 'N/A';

        // Fill settings
        if (data.settings) {
            document.getElementById('theme').value = data.settings.theme || 'light';
            document.getElementById('emailNotifications').checked = data.settings.notifications?.email || false;
            document.getElementById('submissionReminders').checked = data.settings.notifications?.submissionReminders || false;
        }

        // Update instructor name in navbar
        const displayName = data.profile.displayName || data.email;
        document.getElementById('instructorName').textContent = displayName;

        // Apply theme from settings
        applyTheme(data.settings?.theme || 'light');

    } catch (error) {
        toast.error('Failed to load profile: ' + error.message);
    }
}

async function updateProfile(e) {
    e.preventDefault();

    const profileData = {
        profile: {
            firstName: document.getElementById('firstName').value,
            lastName: document.getElementById('lastName').value,
            displayName: document.getElementById('displayName').value,
            title: document.getElementById('title').value,
            department: document.getElementById('department').value,
            office: document.getElementById('office').value,
            phone: document.getElementById('phone').value,
            bio: document.getElementById('bio').value
        }
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
        toast.success('Profile updated successfully');

        setTimeout(() => {
            saveStatus.textContent = '';
        }, 3000);

        // Update navbar name
        const displayName = document.getElementById('displayName').value || document.getElementById('email').value;
        document.getElementById('instructorName').textContent = displayName;

    } catch (error) {
        saveStatus.textContent = '✗ Failed to save';
        saveStatus.style.color = '#dc3545';
        toast.error('Failed to update profile: ' + error.message);

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

    if (newPassword !== confirmPassword) {
        toast.error('New passwords do not match');
        return;
    }

    if (newPassword.length < 6) {
        toast.error('Password must be at least 6 characters');
        return;
    }

    const saveStatus = document.getElementById('passwordSaveStatus');
    saveStatus.textContent = 'Changing...';
    saveStatus.style.color = '#17a2b8';

    try {
        await fetchAPI('/profile/password', {
            method: 'PUT',
            body: JSON.stringify({ currentPassword, newPassword })
        });

        saveStatus.textContent = '✓ Password changed!';
        saveStatus.style.color = '#28a745';
        toast.success('Password changed successfully');

        document.getElementById('passwordForm').reset();

        setTimeout(() => {
            saveStatus.textContent = '';
        }, 3000);

    } catch (error) {
        saveStatus.textContent = '✗ ' + error.message;
        saveStatus.style.color = '#dc3545';
        toast.error('Failed to change password: ' + error.message);

        setTimeout(() => {
            saveStatus.textContent = '';
        }, 3000);
    }
}

async function saveSettings() {
    const settingsData = {
        settings: {
            theme: document.getElementById('theme').value,
            notifications: {
                email: document.getElementById('emailNotifications').checked,
                submissionReminders: document.getElementById('submissionReminders').checked
            }
        }
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
        toast.success('Settings saved');

        // Apply theme immediately
        applyTheme(settingsData.settings.theme);

        setTimeout(() => {
            saveStatus.textContent = '';
        }, 3000);

    } catch (error) {
        saveStatus.textContent = '✗ Failed to save';
        saveStatus.style.color = '#dc3545';
        toast.error('Failed to save settings: ' + error.message);

        setTimeout(() => {
            saveStatus.textContent = '';
        }, 3000);
    }
}

function onThemeChange() {
    const theme = document.getElementById('theme').value;
    applyTheme(theme);
}

function applyTheme(theme = null) {
    const currentTheme = theme || document.getElementById('theme')?.value || 'light';

    const isInstructorPage = window.location.pathname.includes('/pages/instructor-') ||
        !window.location.pathname.includes('/pages/student');

    if (!isInstructorPage) {
        return;
    }

    const body = document.body;

    if (currentTheme === 'dark') {
        body.classList.add('dark-mode');
    } else {
        body.classList.remove('dark-mode');
    }

    // Use a separate key for instructor theme
    localStorage.setItem('instructor_theme', currentTheme);
}
function loadSavedTheme() {
    const isInstructorPage = window.location.pathname.includes('/pages/instructor-') ||
        !window.location.pathname.includes('/pages/student');

    if (!isInstructorPage) return;

    const savedTheme = localStorage.getItem('instructor_theme');
    if (savedTheme) {
        applyTheme(savedTheme);
        const themeSelect = document.getElementById('theme');
        if (themeSelect) {
            themeSelect.value = savedTheme;
        }
    }
}

function logout() {
    localStorage.removeItem('token');
    toast.success('Logged out successfully');
    setTimeout(() => {
        window.location.href = '../login.html';
    }, 500);
}

function toggleMenu() {
    const navMenu = document.getElementById('navMenu');
    navMenu.classList.toggle('active');
}