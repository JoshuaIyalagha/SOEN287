/*
Instructor Dashboard JavaScript
Written by: Joshua Iyalagha 40306001
Updated by: Joshua Iyalagha 40306001 on 2026-04-02, 2026-04-03, and 2026-04-04
Purpose: Load dashboard data, handle course management, modals
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
                    <span>👥 <span id="student-count-${course.id}">${course.students_count || 0}</span> students</span>
                    <span>📚 ${course.term}</span>
                </div>
                <div class="course-description mb-1">
                    ${course.description || 'No description'}
                </div>
                <div class="course-actions">
                    <button onclick="editCourse(${course.id})" class="btn btn-outline">Edit Course</button>
                    <button onclick="viewEnrolledStudents(${course.id})" class="btn btn-outline">View Students</button>
                    <a href="usage-statistics.html?course=${course.id}" class="btn btn-outline">Stats</a>
                </div>
            </div>
        `;
    });

    coursesList.innerHTML = html;
    courses.forEach(course => {
        updateStudentCount(course.id, `student-count-${course.id}`);
    });
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

        course.enabled = newEnabledStatus;

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
        const response = await fetch(`${API_BASE}/courses/${courseId}`, {
            headers: { 'Authorization': authToken }
        });

        let course;
        if (response.ok) {
            const data = await response.json();
            course = data.course || data;
        } else {
            course = dashboardData?.courses?.find(c => c.id === courseId);
            if (!course) throw new Error('Course not found');
            console.log('Using cached course data from dashboard');
        }

        document.getElementById('editCourseCode').value = course.code;
        document.getElementById('editCourseName').value = course.name;
        document.getElementById('editTerm').value = course.term;
        document.getElementById('editDescription').value = course.description || '';
        document.getElementById('editEnabled').checked = course.enabled;

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

        const categories = course.assessmentCategories || course.categories || [];
        const container = document.getElementById('editAssessmentCategories');
        if (container) container.innerHTML = '';
        editCategoryCount = 0;

        if (categories.length > 0) {
            categories.forEach(cat => {
                addEditCategory({
                    category: cat.category || cat.category_name,
                    weight: cat.weight
                });
            });
        } else {
            addEditCategory();
        }

        updateEditTotalWeight();
        document.getElementById('editCourseForm').dataset.courseId = courseId;
        switchEditTab('details');
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

// Export grades as CSV for current course
async function exportCourseGrades(courseId) {
    if (!courseId) {
        if (typeof toast !== 'undefined') {
            toast.error('No course selected');
        }
        return;
    }

    try {
        // Fetch CSV content with auth header
        const response = await fetch(`${API_BASE}/courses/${courseId}/grades/export`, {
            headers: {
                'Authorization': authToken
            }
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || 'Failed to export grades');
        }

        // Get CSV content as text
        const csvContent = await response.text();

        // Create blob and trigger download
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `grades-${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Clean up blob URL
        URL.revokeObjectURL(url);

        if (typeof toast !== 'undefined') {
            toast.success('Grades exported successfully!');
        }
    } catch (error) {
        console.error('Error exporting grades:', error);
        if (typeof toast !== 'undefined') {
            toast.error(error.message || 'Failed to export grades');
        } else {
            alert('Failed to export grades: ' + error.message);
        }
    }
}

function openModal(modalId) { document.getElementById(modalId).style.display = 'block'; }
function closeModal(modalId) { document.getElementById(modalId).style.display = 'none'; }

window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = 'none';
    }
}

// === Assessment Weighings Tab Functions ===

function switchEditTab(tabName) {
    document.getElementById('editTab-details').style.display = 'none';
    document.getElementById('editTab-weighings').style.display = 'none';
    document.getElementById('editTab-grades').style.display = 'none';

    document.getElementById('tab-details').style.background = '';
    document.getElementById('tab-details').style.color = '';
    document.getElementById('tab-weighings').classList.add('btn-outline');
    document.getElementById('tab-grades').classList.add('btn-outline');

    document.getElementById(`editTab-${tabName}`).style.display = 'block';

    if (tabName === 'details') {
        document.getElementById('tab-details').style.background = 'var(--primary)';
        document.getElementById('tab-details').style.color = 'white';
        document.getElementById('tab-weighings').classList.remove('active');
        document.getElementById('tab-grades').classList.remove('active');
    } else if (tabName === 'weighings') {
        document.getElementById('tab-weighings').classList.remove('btn-outline');
        document.getElementById('tab-weighings').style.background = 'var(--primary)';
        document.getElementById('tab-weighings').style.color = 'white';
        document.getElementById('tab-details').classList.remove('active');
        document.getElementById('tab-grades').classList.remove('active');
        loadEditWeighings();
    } else if (tabName === 'grades') {
        document.getElementById('tab-grades').classList.remove('btn-outline');
        document.getElementById('tab-grades').style.background = 'var(--primary)';
        document.getElementById('tab-grades').style.color = 'white';
        document.getElementById('tab-details').classList.remove('active');
        document.getElementById('tab-weighings').classList.remove('active');
        loadCourseGrades();
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
    const weightInput = div.querySelector('.edit-category-weight');
    if (weightInput) weightInput.addEventListener('input', updateEditTotalWeight);
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
        const response = await fetch(`${API_BASE}/courses/${currentEditCourseId}`, {
            headers: { 'Authorization': authToken }
        });
        if (response.ok) {
            const data = await response.json();
            const course = data.course || data;
            const container = document.getElementById('editAssessmentCategories');
            if (container) container.innerHTML = '';
            editCategoryCount = 0;
            const categories = course.assessmentCategories || course.categories || [];
            if (categories.length > 0) {
                categories.forEach(cat => {
                    addEditCategory({
                        category: cat.category || cat.category_name,
                        weight: cat.weight
                    });
                });
            } else {
                addEditCategory();
            }
            updateEditTotalWeight();
        }
    } catch (error) {
        console.error('Error loading course weighings:', error);
        if (typeof toast !== 'undefined') toast.error('Failed to load assessment weighings');
    }
}

async function saveCourseWeighings() {
    if (!currentEditCourseId) return;
    if (!updateEditTotalWeight()) {
        if (typeof toast !== 'undefined') toast.error('Total weight must equal 100%');
        return;
    }
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
        if (typeof toast !== 'undefined') toast.error('Please add at least one assessment');
        return;
    }
    try {
        const response = await fetch(`${API_BASE}/courses/${currentEditCourseId}/weighings`, {
            method: 'PUT',
            headers: { 'Authorization': authToken, 'Content-Type': 'application/json' },
            body: JSON.stringify({ assessmentCategories: categories })
        });
        const data = await response.json();
        if (response.ok) {
            if (typeof toast !== 'undefined') toast.success('Assessment weighings updated!');
            closeModal('editCourseModal');
            loadDashboard();
        } else {
            if (typeof toast !== 'undefined') toast.error(data.error || 'Failed to update weighings');
        }
    } catch (error) {
        console.error('Error saving weighings:', error);
        if (typeof toast !== 'undefined') toast.error('Failed to save assessment weighings');
    }
}

async function viewEnrolledStudents(courseId) {
    try {
        const response = await fetch(`${API_BASE}/enrollment/students/${courseId}`, {
            headers: { 'Authorization': authToken }
        });
        if (!response.ok) throw new Error('Failed to fetch students');
        const data = await response.json();
        const students = data.students || [];
        const container = document.getElementById('enrolledStudentsList');
        if (students.length === 0) {
            container.innerHTML = '<p class="text-muted">No students enrolled in this course yet.</p>';
        } else {
            let html = `<table style="width: 100%; border-collapse: collapse;"><thead><tr style="border-bottom: 2px solid var(--border);"><th style="text-align: left; padding: 10px;">Name</th><th style="text-align: left; padding: 10px;">Email</th><th style="text-align: left; padding: 10px;">Student ID</th><th style="text-align: left; padding: 10px;">Program</th><th style="text-align: left; padding: 10px;">Enrolled</th></tr></thead><tbody>`;
            students.forEach(student => {
                html += `<tr style="border-bottom: 1px solid var(--border);"><td style="padding: 10px;">${student.display_name || student.first_name + ' ' + student.last_name}</td><td style="padding: 10px;">${student.email}</td><td style="padding: 10px;">${student.student_id || 'N/A'}</td><td style="padding: 10px;">${student.program || 'N/A'}</td><td style="padding: 10px;">${student.enrolled_at || 'N/A'}</td></tr>`;
            });
            html += '</tbody></table>';
            container.innerHTML = html;
        }
        openModal('viewStudentsModal');
    } catch (error) {
        console.error('Error fetching enrolled students:', error);
        if (typeof toast !== 'undefined') toast.error('Failed to load enrolled students');
    }
}

async function updateStudentCount(courseId, elementId) {
    try {
        const response = await fetch(`${API_BASE}/enrollment/students/${courseId}`, {
            headers: { 'Authorization': authToken }
        });
        if (response.ok) {
            const data = await response.json();
            const count = data.students?.length || 0;
            const el = document.getElementById(elementId);
            if (el) el.textContent = count;
        }
    } catch (error) {
        console.error(`Error fetching student count for course ${courseId}:`, error);
    }
}

// === Grades Tab Functions - WEIGHINGS-ONLY WORKFLOW ===

async function loadCourseGrades() {
    if (!currentEditCourseId) return;
    const container = document.getElementById('courseGradesList');
    container.innerHTML = '<p class="text-muted">Loading grades...</p>';

    try {
        const [studentsResponse, categoriesResponse, gradesResponse] = await Promise.all([
            fetch(`${API_BASE}/enrollment/students/${currentEditCourseId}`, { headers: { 'Authorization': authToken } }),
            fetch(`${API_BASE}/courses/${currentEditCourseId}/assessment-categories`, { headers: { 'Authorization': authToken } }),
            fetch(`${API_BASE}/courses/${currentEditCourseId}/grades`, { headers: { 'Authorization': authToken } })
        ]);

        if (!studentsResponse.ok) throw new Error('Failed to fetch enrolled students');
        if (!categoriesResponse.ok) throw new Error('Failed to fetch assessment categories');
        if (!gradesResponse.ok) throw new Error('Failed to fetch grades');

        const studentsData = await studentsResponse.json();
        const categoriesData = await categoriesResponse.json();
        const gradesData = await gradesResponse.json();

        const enrolledStudents = studentsData.students || [];
        const categories = categoriesData.categories || [];
        const existingGrades = gradesData.grades || [];

        if (enrolledStudents.length === 0) {
            container.innerHTML = '<p class="text-muted">No students enrolled in this course.</p>';
            return;
        }
        if (categories.length === 0) {
            container.innerHTML = '<p class="text-muted">No assessment categories defined. Go to "Assessment Weighings" tab to add categories first.</p>';
            return;
        }

        const gradeLookup = {};
        existingGrades.forEach(grade => {
            if (grade.category_id) {
                const key = `${grade.student_id}_${grade.category_id}`;
                gradeLookup[key] = grade;
            }
        });

        // Final grade display - simplified, no CSS variable warnings
        let html = '';
        // Note: Final grade calculation is optional - uncomment when backend endpoint is ready
        /*
        if (finalGradeData?.final_grade) {
            html += `<div style="background: #007bff; padding: 12px 15px; border-radius: 8px; margin-bottom: 15px; text-align: center;"><strong style="color: white;">Final Course Grade:</strong> <span style="font-size: 1.8em; color: white; font-weight: bold; margin: 0 10px;">${finalGradeData.final_grade}%</span><small style="display: block; color: rgba(255,255,255,0.9); margin-top: 4px;">${finalGradeData.completed_categories}/${finalGradeData.total_categories} categories graded</small></div>`;
        }
        */

        html += `<table style="width: 100%; border-collapse: collapse;"><thead><tr style="border-bottom: 2px solid var(--border);"><th style="text-align: left; padding: 10px;">Student</th><th style="text-align: left; padding: 10px;">Category (Weighing)</th><th style="text-align: left; padding: 10px;">Earned / Total</th><th style="text-align: left; padding: 10px;">Weight</th><th style="text-align: left; padding: 10px;">Status</th><th style="text-align: left; padding: 10px;">Actions</th></tr></thead><tbody>`;

        for (const student of enrolledStudents) {
            categories.forEach((category, categoryIndex) => {
                const gradeKey = `${student.id}_${category.id}`;
                const grade = gradeLookup[gradeKey];
                const hasGrade = grade && grade.earned_marks !== null;
                const earnedMarks = hasGrade ? grade.earned_marks : '';
                const status = hasGrade ? 'completed' : 'pending';

                html += `<tr style="border-bottom: 1px solid var(--border);">
                    ${categoryIndex === 0 ? `<td rowspan="${categories.length}" style="padding: 10px; vertical-align: top;"><strong>${student.display_name || student.first_name + ' ' + student.last_name}</strong><br><small class="text-muted">${student.email}</small></td>` : ''}
                    <td style="padding: 10px;">${category.category_name}</td>
                    <td style="padding: 10px;">
                        <input type="number" id="grade-${student.id}-${category.id}" value="${earnedMarks}" min="0" max="100" step="0.1" style="width: 60px; padding: 4px;" oninput="this.value = Math.min(100, Math.max(0, parseFloat(this.value) || 0))" ${hasGrade ? '' : 'placeholder="0-100"'}>
                        / 100
                    </td>
                    <td style="padding: 10px;">${category.weight}%</td>
                    <td style="padding: 10px;"><span style="padding: 4px 8px; border-radius: 4px; background: ${status === 'completed' ? '#28a745' : '#ffc107'}; color: white; font-size: 12px;">${status}</span></td>
                    <td style="padding: 10px;">
                        ${hasGrade
                    ? `<button onclick="editGradeEntry(${student.id}, ${category.id})" class="btn btn-outline" style="padding: 4px 8px; font-size: 12px;">Edit</button>`
                    : `<button onclick="saveGradeEntry(${student.id}, ${category.id}, ${currentEditCourseId})" class="btn" style="padding: 4px 8px; font-size: 12px;">Save</button>`
                }
                    </td>
                </tr>`;
            });
        }
        html += '</tbody></table>';
        container.innerHTML = html;

    } catch (error) {
        console.error('Error loading grades:', error);
        container.innerHTML = `<p class="text-muted">Failed to load grades: ${error.message}</p>`;
    }
}

// Save a new grade entry for student + category (weighings workflow)
async function saveGradeEntry(studentId, categoryId, courseId) {
    const earnedMarks = document.getElementById(`grade-${studentId}-${categoryId}`).value;

    // Grade validation: must be 0-100
    const gradeValue = parseFloat(earnedMarks);
    if (isNaN(gradeValue) || gradeValue < 0 || gradeValue > 100) {
        if (typeof toast !== 'undefined') {
            toast.error('Grade must be between 0 and 100');
        } else {
            alert('Grade must be between 0 and 100');
        }
        document.getElementById(`grade-${studentId}-${categoryId}`).value = '';
        return;
    }

    if (!earnedMarks) {
        if (typeof toast !== 'undefined') {
            toast.error('Please enter a grade');
        } else {
            alert('Please enter a grade');
        }
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/grades/category`, {
            method: 'POST',
            headers: { 'Authorization': authToken, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                student_id: studentId,
                category_id: categoryId,
                earned_marks: gradeValue,
                course_id: courseId
            })
        });

        const data = await response.json();
        if (response.ok) {
            if (typeof toast !== 'undefined') toast.success('Grade saved successfully');
            loadCourseGrades();
        } else {
            if (typeof toast !== 'undefined') toast.error(data.error || 'Failed to save grade');
        }
    } catch (error) {
        console.error('Error saving grade entry:', error);
        if (typeof toast !== 'undefined') toast.error('Failed to save grade');
    }
}

// Enable editing of an existing grade entry
function editGradeEntry(studentId, categoryId) {
    const input = document.getElementById(`grade-${studentId}-${categoryId}`);
    input.disabled = false;
    input.focus();
    const btn = event.target;
    btn.textContent = 'Save';
    btn.className = 'btn';
    btn.onclick = function() { saveGradeEntry(studentId, categoryId, currentEditCourseId); };
}

// Placeholder for viewing category details
function viewCategoryGrades(courseId, studentName, categoryName) {
    if (typeof toast !== 'undefined') {
        toast.info(`Viewing grades for ${studentName} in ${categoryName}`);
    } else {
        alert(`Viewing grades for ${studentName} in ${categoryName}`);
    }
}