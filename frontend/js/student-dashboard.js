/*
Student Dashboard JavaScript
Written by: Joshua Iyalagha 40306001
Updated by: Joshua Iyalagha 40306001 on 2026-04-02, 2026-04-03, 2026-04-04, and 2026-04-05
Purpose: Handle student course enrollment and dashboard display
*/

const API_BASE = 'http://localhost:3000/api';
let authToken = null;
let currentStudentId = null;

document.addEventListener('DOMContentLoaded', async function() {
    // Get auth token
    authToken = localStorage.getItem('token');

    if (!authToken) {
        window.location.href = '../login.html';
        return;
    }

    // Parse token to get student info
    try {
        const user = JSON.parse(atob(authToken));
        currentStudentId = user.id;

        // Display student name
        const nameEl = document.getElementById('studentName');
        if (nameEl) {
            nameEl.textContent = user.display_name || user.email;
        }
    } catch (error) {
        console.error('Error parsing token:', error);
        window.location.href = '../login.html';
        return;
    }

    // Load dashboard data
    await Promise.all([
        loadMyGrades(),
        loadEnrolledCourses(),
        loadAvailableCourses(),
        loadUpcomingAssessments()  // Load upcoming assessments
    ]);

    // Setup logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            localStorage.removeItem('token');
            window.location.href = '../login.html';
        });
    }
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

// Upcoming Assessments Function

async function loadUpcomingAssessments() {
    const container = document.getElementById('upcomingAssessments');
    if (!container) return;

    try {
        // Fetch enrolled courses first
        const enrolledData = await fetchAPI(`/enrollment/courses/${currentStudentId}`);
        const enrolledCourses = enrolledData.courses || [];

        if (enrolledCourses.length === 0) {
            container.innerHTML = '<li class="text-muted">You are not enrolled in any courses yet.</li>';
            return;
        }

        let upcomingAssessments = [];
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Normalize to start of day

        // For each enrolled course, fetch assessments
        for (const course of enrolledCourses) {
            try {
                const assessmentsData = await fetchAPI(`/courses/${course.id}/assessments`);
                const assessments = assessmentsData.assessments || [];

                // Filter for upcoming assessments (due date in future, not completed)
                const upcoming = assessments.filter(assessment => {
                    if (!assessment.due_date) return false;

                    const dueDate = new Date(assessment.due_date);
                    dueDate.setHours(0, 0, 0, 0);

                    // Check if due date is today or in future
                    const isUpcoming = dueDate >= today;

                    // Check if student has completed this assessment

                    return isUpcoming;
                });

                // Add course info to each assessment
                upcoming.forEach(assessment => {
                    upcomingAssessments.push({
                        ...assessment,
                        course_code: course.code,
                        course_name: course.name
                    });
                });
            } catch (error) {
                console.error(`Error fetching assessments for course ${course.id}:`, error);
                // Continue with other courses even if one fails
            }
        }

        // Sort by due date (soonest first)
        upcomingAssessments.sort((a, b) => new Date(a.due_date) - new Date(b.due_date));

        // Render the list
        if (upcomingAssessments.length === 0) {
            container.innerHTML = '<li class="text-muted">No upcoming assessments. Great job staying on top of your work! 🎉</li>';
            return;
        }

        let html = '';
        upcomingAssessments.forEach(assessment => {
            const dueDate = new Date(assessment.due_date);
            const formattedDate = dueDate.toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric'
            });

            // Calculate days until due
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const dueDateNormalized = new Date(assessment.due_date);
            dueDateNormalized.setHours(0, 0, 0, 0);
            const daysUntil = Math.ceil((dueDateNormalized - today) / (1000 * 60 * 60 * 24));

            const urgencyClass = daysUntil <= 2 ? 'text-danger' : daysUntil <= 7 ? 'text-warning' : 'text-muted';
            const urgencyText = daysUntil === 0 ? 'Due today!' :
                daysUntil === 1 ? 'Due tomorrow' :
                    `Due in ${daysUntil} days`;

            html += `
                <li style="padding: 12px 0; border-bottom: 1px solid var(--border);">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                        <div>
                            <strong>${assessment.course_code}</strong> – ${assessment.name}
                            <div class="muted" style="font-size: 0.9em;">${assessment.type} • ${assessment.total_marks} marks</div>
                        </div>
                        <div style="text-align: right;">
                            <div class="${urgencyClass}" style="font-weight: 500; font-size: 0.9em;">${urgencyText}</div>
                            <div class="text-muted" style="font-size: 0.85em;">${formattedDate}</div>
                        </div>
                    </div>
                </li>
            `;
        });

        container.innerHTML = html;

    } catch (error) {
        console.error('Error loading upcoming assessments:', error);
        container.innerHTML = '<li class="text-muted">Failed to load upcoming assessments.</li>';
    }
}

// My Grades Functions

async function loadMyGrades() {
    const container = document.getElementById('myGradesList');
    if (!container) return;

    try {
        // Fetch enrolled courses first to know which courses to load grades for
        const enrolledData = await fetchAPI(`/enrollment/courses/${currentStudentId}`);
        const enrolledCourses = enrolledData.courses || [];

        if (enrolledCourses.length === 0) {
            container.innerHTML = '<p class="text-muted">You are not enrolled in any courses yet.</p>';
            return;
        }

        let html = '';

        // For each enrolled course, fetch and display grades
        for (const course of enrolledCourses) {
            // Fetch categories (weighings) for this course
            const categoriesResponse = await fetch(`${API_BASE}/courses/${course.id}/assessment-categories`, {
                headers: { 'Authorization': authToken }
            });

            // Fetch grades for this student in this course
            const gradesResponse = await fetch(`${API_BASE}/students/${currentStudentId}/grades`, {
                headers: { 'Authorization': authToken }
            });

            // Fetch final grade for this course (optional)
            let finalGradeData = null;
            try {
                const finalResponse = await fetch(`${API_BASE}/courses/${course.id}/students/${currentStudentId}/final-grade`, {
                    headers: { 'Authorization': authToken }
                });
                if (finalResponse.ok) {
                    finalGradeData = await finalResponse.json();
                }
            } catch (e) {
                // Optional endpoint - don't fail if not available
                console.log('Final grade endpoint not available for course', course.id);
            }

            if (!categoriesResponse.ok || !gradesResponse.ok) {
                continue; // Skip this course if we can't fetch data
            }

            const categoriesData = await categoriesResponse.json();
            const gradesData = await gradesResponse.json();

            const categories = categoriesData.categories || [];
            const allGrades = gradesData.grades || [];

            // Filter grades for this course and group by category
            const courseGrades = allGrades.filter(g => g.course_code === course.code);
            const gradesByCategory = {};

            courseGrades.forEach(grade => {
                if (grade.category_name) {
                    if (!gradesByCategory[grade.category_name]) {
                        gradesByCategory[grade.category_name] = [];
                    }
                    gradesByCategory[grade.category_name].push(grade);
                }
            });

            // Course header with final grade if available
            html += `
                <div style="margin-bottom: 20px; padding: 15px; border: 1px solid var(--border, #ddd); border-radius: 8px; background: var(--card-bg, var(--background));">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                        <h3 style="margin: 0;">${course.code} - ${course.name}</h3>
                        ${finalGradeData?.final_grade ? `
                            <span style="background: #007bff; color: white; padding: 5px 12px; border-radius: 20px; font-weight: bold; font-size: 1.1em;">
                                Final: ${finalGradeData.final_grade}%
                            </span>
                        ` : ''}
                    </div>
                    <p class="text-muted" style="margin: 0 0 10px 0;">${course.term}</p>
            `;

            if (categories.length === 0) {
                html += '<p class="text-muted">No assessment categories defined for this course.</p>';
            } else {
                html += `
                    <table style="width: 100%; border-collapse: collapse;">
                        <thead>
                            <tr style="border-bottom: 2px solid var(--border, #ddd);">
                                <th style="text-align: left; padding: 8px;">Category</th>
                                <th style="text-align: left; padding: 8px;">Your Grade</th>
                                <th style="text-align: left; padding: 8px;">Weight</th>
                                <th style="text-align: left; padding: 8px;">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                `;

                categories.forEach(category => {
                    const categoryGrades = gradesByCategory[category.category_name] || [];
                    const completedGrades = categoryGrades.filter(g => g.earned_marks !== null);

                    // Calculate average for this category if grades exist
                    let avgGrade = '-';
                    if (completedGrades.length > 0) {
                        const total = completedGrades.reduce((sum, g) => sum + parseFloat(g.earned_marks), 0);
                        const maxTotal = completedGrades.reduce((sum, g) => sum + parseFloat(g.total_marks), 0);
                        avgGrade = maxTotal > 0 ? ((total / maxTotal) * 100).toFixed(1) + '%' : '-';
                    }

                    const status = completedGrades.length === categoryGrades.length && categoryGrades.length > 0
                        ? 'completed'
                        : (categoryGrades.length > 0 ? 'in_progress' : 'not_started');

                    const statusColors = {
                        'completed': '#28a745',
                        'in_progress': '#ffc107',
                        'not_started': '#6c757d'
                    };

                    html += `
                        <tr style="border-bottom: 1px solid var(--border, #ddd);">
                            <td style="padding: 8px;">${category.category_name}</td>
                            <td style="padding: 8px; font-weight: 500;">${avgGrade}</td>
                            <td style="padding: 8px;">${category.weight}%</td>
                            <td style="padding: 8px;">
                                <span style="padding: 3px 8px; border-radius: 4px; background: ${statusColors[status]}; color: white; font-size: 11px;">
                                    ${status.replace('_', ' ')}
                                </span>
                            </td>
                        </tr>
                    `;
                });

                html += '</tbody></table>';
            }

            html += '</div>'; // Close course card
        }

        container.innerHTML = html || '<p class="text-muted">No grade data available yet.</p>';

    } catch (error) {
        console.error('Error loading my grades:', error);
        container.innerHTML = '<p class="text-muted">Failed to load your grades.</p>';
    }
}

async function loadEnrolledCourses() {
    const container = document.getElementById('enrolledCoursesList');
    if (!container) return;

    try {
        const data = await fetchAPI(`/enrollment/courses/${currentStudentId}`);
        const courses = data.courses || [];

        if (courses.length === 0) {
            container.innerHTML = '<p class="text-muted">You are not enrolled in any courses yet.</p>';
            return;
        }

        let html = '<ul class="list">';
        courses.forEach(course => {
            html += `
                <li>
                    <strong>${course.code}</strong> – ${course.name}
                    <div class="muted">${course.term}</div>
                </li>
            `;
        });
        html += '</ul>';

        container.innerHTML = html;

    } catch (error) {
        console.error('Error loading enrolled courses:', error);
        container.innerHTML = '<p class="text-muted">Failed to load your courses.</p>';
    }
}

async function loadAvailableCourses() {
    const container = document.getElementById('availableCoursesList');
    if (!container) return;

    try {
        // Fetch all courses from catalog
        const data = await fetchAPI('/enrollment/catalog');
        const allCourses = data.courses || [];

        // Fetch enrolled courses to filter them out
        const enrolledData = await fetchAPI(`/enrollment/courses/${currentStudentId}`);
        const enrolledIds = new Set((enrolledData.courses || []).map(c => c.id));

        // Filter to show only courses student is NOT enrolled in
        const availableCourses = allCourses.filter(c => !enrolledIds.has(c.id));

        if (availableCourses.length === 0) {
            container.innerHTML = '<p class="text-muted">No additional courses available.</p>';
            return;
        }

        let html = '<ul class="list">';
        availableCourses.forEach(course => {
            html += `
                <li style="display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid var(--border);">
                    <div>
                        <strong>${course.code}</strong> – ${course.name}
                        <div class="muted">${course.term} • ${course.description || 'No description'}</div>
                    </div>
                    <button onclick="confirmEnroll(${course.id}, '${course.code}')" class="btn btn-outline" style="padding: 5px 10px; font-size: 12px;">Enroll</button>
                </li>
            `;
        });
        html += '</ul>';

        container.innerHTML = html;

    } catch (error) {
        console.error('Error loading available courses:', error);
        container.innerHTML = '<p class="text-muted">Failed to load available courses.</p>';
    }
}

// Show confirmation modal before enrolling
function confirmEnroll(courseId, courseCode) {
    const modal = document.getElementById('confirmModal');
    const title = document.getElementById('confirmTitle');
    const message = document.getElementById('confirmMessage');
    const confirmBtn = document.getElementById('confirmEnrollBtn');

    if (title) title.textContent = 'Confirm Enrollment';
    if (message) message.textContent = `Are you sure you want to enroll in ${courseCode}?`;

    // Set up confirm button
    if (confirmBtn) {
        confirmBtn.onclick = function() {
            enrollInCourse(courseId);
            closeModal('confirmModal');
        };
    }

    if (modal) {
        modal.style.display = 'block';
    }
}

async function enrollInCourse(courseId) {
    try {
        const response = await fetch(`${API_BASE}/enrollment`, {
            method: 'POST',
            headers: {
                'Authorization': authToken,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                studentId: currentStudentId,
                courseId: courseId
            })
        });

        const data = await response.json();

        if (response.ok) {
            if (typeof toast !== 'undefined') {
                toast.success('Successfully enrolled in course!');
            } else {
                alert('Successfully enrolled!');
            }
            // Reload all dashboard sections
            await Promise.all([
                loadMyGrades(),
                loadEnrolledCourses(),
                loadAvailableCourses(),
                loadUpcomingAssessments()  // Also refresh upcoming assessments
            ]);
        } else {
            if (typeof toast !== 'undefined') {
                toast.error(data.error || 'Failed to enroll');
            } else {
                alert('Failed to enroll: ' + (data.error || 'Unknown error'));
            }
        }
    } catch (error) {
        console.error('Enrollment error:', error);
        if (typeof toast !== 'undefined') {
            toast.error('Failed to enroll in course');
        } else {
            alert('Failed to enroll: ' + error.message);
        }
    }
}

// Modal functions
function openModal(modalId) {
    document.getElementById(modalId).style.display = 'block';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

// Close modal when clicking outside
window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = 'none';
    }
}