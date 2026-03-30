/*
Instructor Dashboard JavaScript
Written by: Joshua Iyalagha 40306001
Purpose: Load dashboard data, handle course management, modals
Note: Navbar, theme, and logout handled by shared navbar.js and theme.js
*/

const API_BASE = 'http://localhost:3000/api';

let authToken = null;
let dashboardData = null;
let editCategoryCount = 0;
let currentEditCourseId = null;

document.addEventListener('DOMContentLoaded', function() {
    authToken = localStorage.getItem('token');

    if (!authToken) {
        window.location.href = '../login.html';
        return;
    }

    loadDashboard();
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
            throw new Error(data.error || 'API request failed');
        }

        return data;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

async function loadDashboard() {
    try {
        const data = await fetchAPI('/instructor/dashboard');
        dashboardData = data;

        // Update stats from API response
        document.getElementById('activeCourses').textContent = data.stats?.activeCourses || 0;
        document.getElementById('totalStudents').textContent = data.stats?.totalStudents || 0;
        document.getElementById('pendingSubmissions').textContent = data.stats?.pendingSubmissions || 0;

        // Load templates count (separate call)
        try {
            const templatesData = await fetchAPI('/templates');
            document.getElementById('totalTemplates').textContent = templatesData.templates?.length || 0;
        } catch (e) {
            document.getElementById('totalTemplates').textContent = '0';
        }

        // Load courses and submissions
        loadCourses(data.courses);
        loadRecentSubmissions(data.recentSubmissions);

    } catch (error) {
        console.error('Error loading dashboard:', error);
        document.getElementById('coursesList').innerHTML =
            '<div class="error-message">Failed to load dashboard. Make sure the backend is running.</div>';
        document.getElementById('recentSubmissions').innerHTML =
            '<div class="error-message">Failed to load submissions.</div>';
    }
}

function loadCourses(courses) {
    const coursesList = document.getElementById('coursesList');

    if (!courses || courses.length === 0) {
        coursesList.innerHTML = '<div class="empty-state">No courses yet. <a href="create-course.html">Create your first course</a></div>';
        return;
    }

    let html = '';

    courses.forEach(course => {
        html += `
            <div class="course-card" data-course-id="${course.id}">
                <div class="course-header">
                    <div>
                        <span class="course-code">${course.code}</span>
                        <span class="course-name"> - ${course.name}</span>
                    </div>
                    <div class="course-status">
                        <div class="toggle-container">
                            <label class="switch">
                                <input type="checkbox" ${course.enabled ? 'checked' : ''} onchange="toggleCourse(${course.id}, this)">
                                <span class="slider"></span>
                            </label>
                            <span class="toggle-status">${course.enabled ? 'Enabled' : 'Disabled'}</span>
                        </div>
                    </div>
                </div>
                <div class="course-details">
                    <span>👥 ${course.students_count || 0} students</span>
                    <span>📚 ${course.term}</span>
                </div>
                <div class="course-description mb-1">
                    ${course.description || 'No description'}
                </div>
                <div class="course-actions">
                    <button onclick="editCourse(${course.id})" class="btn btn-outline">Edit Course</button>
                    <a href="usage-statistics.html?course=${course.id}" class="btn btn-outline">Stats</a>
                </div>
            </div>
        `;
    });

    coursesList.innerHTML = html;
}

function loadRecentSubmissions(submissions) {
    const submissionsDiv = document.getElementById('recentSubmissions');

    if (!submissions || submissions.length === 0) {
        submissionsDiv.innerHTML = '<p class="text-muted">No recent submissions</p>';
        return;
    }

    let html = '<ul class="submission-list">';

    submissions.forEach(item => {
        const statusClass = item.status === 'completed' ? 'status-completed' : 'status-pending';
        html += `
            <li class="submission-item">
                <div class="submission-info">
                    <strong>${item.student_name || item.student_email || 'Unknown'}</strong>
                    <span>${item.assessment_name || 'Unknown assessment'}</span>
                    <span class="course-code-small">${item.course_code || ''}</span>
                </div>
                <div class="submission-status">
                    <span class="${statusClass}">${item.status || 'pending'}</span>
                    ${item.submitted_date ? `<span class="date">${new Date(item.submitted_date).toLocaleDateString()}</span>` : ''}
                </div>
            </li>
        `;
    });

    html += '</ul>';
    submissionsDiv.innerHTML = html;
}

async function toggleCourse(courseId, checkboxElement) {
    try {
        const course = dashboardData.courses.find(c => c.id === courseId);
        if (!course) return;

        const newEnabledStatus = checkboxElement.checked;

        await fetchAPI(`/courses/${courseId}`, {
            method: 'PUT',
            body: JSON.stringify({ enabled: newEnabledStatus })
        });

        // Update local data
        course.enabled = newEnabledStatus;

        // Update the toggle status text
        const toggleContainer = checkboxElement.closest('.toggle-container');
        const statusText = toggleContainer?.querySelector('.toggle-status');
        if (statusText) {
            statusText.textContent = newEnabledStatus ? 'Enabled' : 'Disabled';
        }

        if (typeof toast !== 'undefined') {
            toast.success(`Course ${course.code} has been ${newEnabledStatus ? 'enabled' : 'disabled'}`);
        }
    } catch (error) {
        console.error('Error toggling course:', error);

        // Revert the checkbox if the API call failed
        const course = dashboardData.courses.find(c => c.id === courseId);
        if (checkboxElement && course) {
            checkboxElement.checked = course.enabled;
        }

        if (typeof toast !== 'undefined') {
            toast.error('Failed to toggle course status');
        } else {
            alert('Failed to toggle course status');
        }
    }
}

async function editCourse(courseId) {
    currentEditCourseId = courseId;

    try {
        // Fetch fresh course data WITH assessment categories
        const response = await fetch(`${API_BASE}/courses/${courseId}`, {
            headers: { 'Authorization': authToken }
        });

        let course;

        if (response.ok) {
            const data = await response.json();
            course = data.course || data;
        } else {
            // Fallback: use course from dashboardData if API fails
            course = dashboardData?.courses?.find(c => c.id === courseId);
            if (!course) throw new Error('Course not found');
            console.log('Using cached course data from dashboard');
        }

        // Populate basic course fields
        document.getElementById('editCourseCode').value = course.code;
        document.getElementById('editCourseName').value = course.name;
        document.getElementById('editTerm').value = course.term;
        document.getElementById('editDescription').value = course.description || '';
        document.getElementById('editEnabled').checked = course.enabled;

        // Handle custom term display
        const termSelect = document.getElementById('editTerm');
        const customTermInput = document.getElementById('editCustomTerm');
        if (termSelect && customTermInput) {
            const standardTerms = ['Winter 2026', 'Summer 2026', 'Fall 2026', 'Winter 2027', 'Summer 2027', 'Fall 2027'];
            if (standardTerms.includes(course.term)) {
                termSelect.value = course.term;
                customTermInput.style.display = 'none';
            } else {
                termSelect.value = 'custom';
                customTermInput.value = course.term;
                customTermInput.style.display = 'block';
            }
        }

        // === Preload assessment weighings (just like templates) ===
        const categories = course.assessmentCategories || course.categories || [];
        const container = document.getElementById('editAssessmentCategories');

        if (container) {
            container.innerHTML = '';
        }
        editCategoryCount = 0;

        if (categories.length > 0) {
            categories.forEach(cat => {
                addEditCategory({
                    category: cat.category || cat.category_name,
                    weight: cat.weight
                });
            });
        } else {
            addEditCategory(); // Add one empty row if no categories
        }

        updateEditTotalWeight();

        // Set form data and open modal
        document.getElementById('editCourseForm').dataset.courseId = courseId;
        switchEditTab('details'); // Start on details tab
        openModal('editCourseModal');

    } catch (error) {
        console.error('Error loading course for edit:', error);
        if (typeof toast !== 'undefined') {
            toast.error('Failed to load course details');
        }
    }
}

async function exportCourseStructures() {
    try {
        const data = JSON.stringify(dashboardData?.courses, null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'course-structures.json';
        a.click();
        URL.revokeObjectURL(url);
        if (typeof toast !== 'undefined') toast.success('Courses exported successfully');
    } catch (error) {
        console.error('Export error:', error);
    }
}

// Modal functions (dashboard-specific)
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

// === Assessment Weighings Tab Functions ===

function switchEditTab(tabName) {
    // Hide all tabs
    document.getElementById('editTab-details').style.display = 'none';
    document.getElementById('editTab-weighings').style.display = 'none';

    // Reset button styles
    document.getElementById('tab-details').style.background = '';
    document.getElementById('tab-details').style.color = '';
    document.getElementById('tab-weighings').classList.add('btn-outline');

    // Show selected tab
    document.getElementById(`editTab-${tabName}`).style.display = 'block';

    // Highlight active button
    if (tabName === 'details') {
        document.getElementById('tab-details').style.background = 'var(--primary)';
        document.getElementById('tab-details').style.color = 'white';
        document.getElementById('tab-weighings').classList.remove('active');
    } else {
        document.getElementById('tab-weighings').classList.remove('btn-outline');
        document.getElementById('tab-weighings').style.background = 'var(--primary)';
        document.getElementById('tab-weighings').style.color = 'white';
        loadEditWeighings(); // Load weighings when tab is shown
    }
}

function addEditCategory(category = null) {
    const container = document.getElementById('editAssessmentCategories');
    if (!container) return;

    editCategoryCount++;
    const div = document.createElement('div');
    div.className = 'edit-category-row';
    div.id = `edit-category-${editCategoryCount}`;
    div.style.cssText = 'display: flex; gap: 10px; margin-bottom: 10px; align-items: center;';

    div.innerHTML = `
        <input type="text" placeholder="Assessment name" style="flex: 2; padding: 8px;" class="edit-category-name" value="${category?.category || ''}">
        <input type="number" placeholder="Weight %" min="0" max="100" step="0.1" style="flex: 1; padding: 8px;" class="edit-category-weight" value="${category?.weight || ''}">
        <button type="button" onclick="removeEditCategory('edit-category-${editCategoryCount}')" style="padding: 8px 12px; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer;">×</button>
    `;

    container.appendChild(div);

    // Real-time validation
    const weightInput = div.querySelector('.edit-category-weight');
    if (weightInput) {
        weightInput.addEventListener('input', updateEditTotalWeight);
    }

    updateEditTotalWeight();
}

function removeEditCategory(id) {
    const el = document.getElementById(id);
    if (el) {
        el.remove();
        updateEditTotalWeight();
    }
}

function updateEditTotalWeight() {
    const weights = document.querySelectorAll('.edit-category-weight');
    let total = 0;

    weights.forEach(input => {
        const val = parseFloat(input.value);
        if (!isNaN(val)) total += val;
    });

    const display = document.getElementById('editTotalWeightDisplay');
    if (display) {
        const isExact = Math.abs(total - 100) < 0.1;
        display.innerHTML = `Total Weight: <strong>${total.toFixed(1)}%</strong> ${isExact ? '✓' : '❌ Must equal 100%'}`;
        display.style.color = isExact ? '#28a745' : '#dc3545';
    }

    return Math.abs(total - 100) < 0.1;
}

// Handle custom term input in edit modal
function checkEditCustomTerm() {
    const termSelect = document.getElementById('editTerm');
    const customTermInput = document.getElementById('editCustomTerm');

    if (!termSelect || !customTermInput) return;

    if (termSelect.value === 'custom') {
        customTermInput.style.display = 'block';
        customTermInput.required = true;
    } else {
        customTermInput.style.display = 'none';
        customTermInput.required = false;
        customTermInput.value = '';
    }
}

async function loadEditWeighings() {
    if (!currentEditCourseId) return;

    try {
        // Fetch course details including assessment categories
        const response = await fetch(`${API_BASE}/courses/${currentEditCourseId}`, {
            headers: { 'Authorization': authToken }
        });

        if (response.ok) {
            const data = await response.json();
            const course = data.course || data;

            // Clear existing categories
            const container = document.getElementById('editAssessmentCategories');
            if (container) {
                container.innerHTML = '';
            }
            editCategoryCount = 0;

            // Load categories (handle both formats)
            const categories = course.assessmentCategories || course.categories || [];
            if (categories.length > 0) {
                categories.forEach(cat => {
                    addEditCategory({
                        category: cat.category || cat.category_name,
                        weight: cat.weight
                    });
                });
            } else {
                addEditCategory(); // Add one empty row
            }

            updateEditTotalWeight();
        }
    } catch (error) {
        console.error('Error loading course weighings:', error);
        if (typeof toast !== 'undefined') {
            toast.error('Failed to load assessment weighings');
        }
    }
}

async function saveCourseWeighings() {
    if (!currentEditCourseId) return;

    // Validate total weight
    if (!updateEditTotalWeight()) {
        if (typeof toast !== 'undefined') {
            toast.error('Total weight must equal 100%');
        }
        return;
    }

    // Collect categories
    const categories = [];
    const rows = document.querySelectorAll('.edit-category-row');

    rows.forEach(row => {
        const name = row.querySelector('.edit-category-name')?.value.trim();
        const weight = parseFloat(row.querySelector('.edit-category-weight')?.value);
        if (name && !isNaN(weight)) {
            categories.push({ category: name, weight: weight, count: 1 });
        }
    });

    if (categories.length === 0) {
        if (typeof toast !== 'undefined') {
            toast.error('Please add at least one assessment');
        }
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/courses/${currentEditCourseId}/weighings`, {
            method: 'PUT',
            headers: {
                'Authorization': authToken,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ assessmentCategories: categories })
        });

        const data = await response.json();

        if (response.ok) {
            if (typeof toast !== 'undefined') {
                toast.success('Assessment weighings updated!');
            }
            closeModal('editCourseModal');
            loadDashboard(); // Refresh dashboard to show changes
        } else {
            if (typeof toast !== 'undefined') {
                toast.error(data.error || 'Failed to update weighings');
            }
        }
    } catch (error) {
        console.error('Error saving weighings:', error);
        if (typeof toast !== 'undefined') {
            toast.error('Failed to save assessment weighings');
        }
    }
}