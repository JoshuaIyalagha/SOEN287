/*
Shared Instructor Navbar Functions
Written by: Joshua Iyalagha 40306001
Purpose: Handle dropdown toggle, logout, and active link highlighting across all instructor pages
*/

// Toggle user dropdown menu
function toggleUserDropdown() {
    const toggle = document.getElementById('userDropdownToggle');
    const menu = document.getElementById('userDropdownMenu');
    if (toggle && menu) {
        toggle.classList.toggle('active');
        menu.classList.toggle('show');
    }
}

// Close dropdown when clicking outside
document.addEventListener('click', function(e) {
    const dropdown = document.querySelector('.user-dropdown');
    const toggle = document.getElementById('userDropdownToggle');
    const menu = document.getElementById('userDropdownMenu');

    if (dropdown && toggle && menu && !dropdown.contains(e.target)) {
        toggle.classList.remove('active');
        menu.classList.remove('show');
    }
});

// Handle logout
document.addEventListener('DOMContentLoaded', function() {
    const logoutBtn = document.getElementById('dropdownLogout');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            localStorage.removeItem('token');
            window.location.href = '../login.html';
        });
    }

    // Highlight active nav link based on current page
    const currentPage = window.location.pathname.split('/').pop();
    const navLinks = {
        'instructor-dashboard.html': 'nav-dashboard',
        'create-course.html': 'nav-create',
        'course-templates.html': 'nav-templates',
        'usage-statistics.html': 'nav-stats',
        'instructor-profile.html': null // Profile is in dropdown
    };

    const activeId = navLinks[currentPage];
    if (activeId) {
        const activeLink = document.getElementById(activeId);
        if (activeLink) {
            activeLink.classList.add('active');
        }
    }

    // Load instructor name from token
    const token = localStorage.getItem('token');
    if (token) {
        try {
            const user = JSON.parse(atob(token));
            const nameEl = document.getElementById('instructorName');
            if (nameEl) nameEl.textContent = user.name || 'Instructor';
        } catch (e) {
            console.error('Error parsing token:', e);
        }
    }
});

// Mobile menu toggle (existing function, kept for compatibility)
function toggleMenu() {
    const navMenu = document.getElementById('navMenu');
    if (navMenu) {
        navMenu.classList.toggle('active');
    }
}