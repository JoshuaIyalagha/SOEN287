/*
Theme Manager - Dark/Light Mode
Written by: Joshua Iyalagha 40306001
Purpose: Handle theme persistence across all instructor pages
*/

// Apply saved theme on page load
function initTheme() {
    const savedTheme = localStorage.getItem('theme');
    const checkbox = document.getElementById('themeToggle');

    if (savedTheme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
        if (checkbox) checkbox.checked = true;
    }
}

// Toggle theme and save preference
function toggleTheme() {
    const checkbox = document.getElementById('themeToggle');
    const isDark = checkbox?.checked || false;

    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTheme);
} else {
    initTheme();
}