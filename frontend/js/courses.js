/*
Student Courses JavaScript
Updated by: Joshua Iyalagha 40306001 on 2026-04-04 - Real grade/enrollment/completion data
Purpose: Display enrolled courses with real metrics from API
*/

const API_BASE = 'http://localhost:3000/api';
let authToken = null;
let currentStudentId = null;

document.addEventListener('DOMContentLoaded', async function() {
    authToken = localStorage.getItem('token');
    if (!authToken) {
        window.location.href = '../login.html';
        return;
    }

    try {
        const decoded = JSON.parse(atob(authToken));
        currentStudentId = decoded.id;
    } catch (error) {
        console.error('Error parsing token:', error);
        window.location.href = '../login.html';
        return;
    }

    // Setup event listeners
    const submitCourse = document.getElementById('addCourseButton');
    if (submitCourse) {
        submitCourse.addEventListener('click', function() {
            addCourse();
        });
    }

    // Load courses with real data
    await loadCourses();
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

// Main Courses Loading Function

async function loadCourses() {
    const coursesList = document.getElementById('coursesList');
    if (!coursesList) return;

    coursesList.innerHTML = '<p class="text-muted">Loading your courses...</p>';

    try {
        // Fetch enrolled courses
        const enrolledData = await fetchAPI(`/enrollment/courses/${currentStudentId}`);
        const enrolledCourses = enrolledData.courses || [];

        if (enrolledCourses.length === 0) {
            coursesList.innerHTML = '<p class="text-muted">You are not enrolled in any courses yet. Browse available courses below to enroll!</p>';
            await loadCourseCatalog();
            return;
        }

        // Fetch all grades for this student (for calculating averages)
        const gradesData = await fetchAPI(`/students/${currentStudentId}/grades`)
            .catch(() => ({ grades: [] }));
        const allGrades = gradesData.grades || [];

        let html = '';

        for (const course of enrolledCourses) {
            // Calculate course-specific metrics
            const courseGrades = allGrades.filter(g => g.course_code === course.code);

            // Calculate average grade
            const completedGrades = courseGrades.filter(g => g.earned_marks !== null);
            let averageGrade = '-';
            if (completedGrades.length > 0) {
                const totalEarned = completedGrades.reduce((sum, g) => sum + parseFloat(g.earned_marks), 0);
                const totalPossible = completedGrades.reduce((sum, g) => sum + parseFloat(g.total_marks || 100), 0);
                if (totalPossible > 0) {
                    averageGrade = ((totalEarned / totalPossible) * 100).toFixed(1);
                }
            }

            // Calculate completion %
            const totalAssessments = courseGrades.length;
            const completedAssessments = completedGrades.length;
            const completionRate = totalAssessments > 0
                ? Math.round((completedAssessments / totalAssessments) * 100)
                : 0;

            // Get enrollment count for this course
            let enrollmentCount = '...';
            try {
                const enrollmentData = await fetchAPI(`/enrollment/students/${course.id}`);
                enrollmentCount = enrollmentData.students?.length || 0;
            } catch (e) {
                enrollmentCount = 'N/A';
            }

            html += `
                <div class="card">
                    <span class="course-header">
                        <span>
                            <span class="course-code">${course.code}</span>
                            <span class="course-name"> - ${course.name}</span>
                        </span>
                        <button class="btn-remove" onclick="removeCourse(${course.id})">Remove Course</button>
                        <div class="course-status">
                            <span> Grade: ${averageGrade !== '-' ? averageGrade + '%' : 'Not graded yet'}</span>
                        </div>
                    </span>
                    <div class="course-details">
                        <span>👥 ${enrollmentCount} students</span>
                        <span>📚 ${course.term}</span>
                    </div>
                    <div class="course-description mb-1">
                        <span> ${completionRate}% Completed (${completedAssessments}/${totalAssessments} assessments) </span>
                    </div>
                    <div class="course-actions">
                        <a href="course-view.html?courseId=${course.id}" class="btn btn-outline">Course View</a>
                        <a href="assessments.html?active=${course.id}" class="btn btn-outline">View Assessments</a>
                        <a href="progressbar.html?courseId=${course.id}" class="btn btn-outline">View Stats</a>
                    </div>
                </div>
            `;
        }

        coursesList.innerHTML = html;

        // Load course catalog for enrollment dropdown
        await loadCourseCatalog();

    } catch (error) {
        console.error('Error loading courses:', error);
        coursesList.innerHTML = '<p class="text-muted">Failed to load your courses. Please try again later.</p>';
    }
}

// Course Catalog for Enrollment

async function loadCourseCatalog() {
    const coursesSelect = document.getElementById('coursesSelect');
    if (!coursesSelect) return;

    try {
        const catalogData = await fetchAPI('/enrollment/catalog');
        const catalog = catalogData.courses || [];

        // Get already enrolled course IDs to filter them out
        const enrolledData = await fetchAPI(`/enrollment/courses/${currentStudentId}`);
        const enrolledIds = new Set((enrolledData.courses || []).map(c => c.id));

        // Filter to show only courses student is NOT enrolled in
        const availableCourses = catalog.filter(c => !enrolledIds.has(c.id));

        let options = '<option value="" selected disabled>Select a Course to Enroll</option>';

        if (availableCourses.length === 0) {
            options = '<option value="" selected disabled>No additional courses available</option>';
        } else {
            availableCourses.forEach(course => {
                options += `<option value="${course.id}">${course.code} - ${course.name} (${course.term})</option>`;
            });
        }

        coursesSelect.innerHTML = options;

    } catch (error) {
        console.error('Error loading course catalog:', error);
        coursesSelect.innerHTML = '<option value="" selected disabled>Error loading courses</option>';
    }
}

// Enrollment Functions

async function addCourse() {
    const courseId = document.getElementById('coursesSelect')?.value;
    if (!courseId) {
        if (typeof toast !== 'undefined') {
            toast.error('Please select a course to enroll');
        } else {
            alert('Please select a course to enroll');
        }
        return;
    }

    // Check for duplicate (extra safety)
    try {
        const enrolledData = await fetchAPI(`/enrollment/courses/${currentStudentId}`);
        const isEnrolled = (enrolledData.courses || []).some(c => c.id == courseId);

        if (isEnrolled) {
            if (typeof toast !== 'undefined') {
                toast.error('You are already enrolled in this course');
            } else {
                alert('You are already enrolled in this course');
            }
            return;
        }
    } catch (error) {
        console.error('Error checking enrollment:', error);
    }

    try {
        const response = await fetch(`${API_BASE}/enrollment`, {
            method: 'POST',
            headers: {
                'Authorization': authToken,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                studentId: currentStudentId,
                courseId: parseInt(courseId)
            })
        });

        const data = await response.json();

        if (response.ok) {
            if (typeof toast !== 'undefined') {
                toast.success('Successfully enrolled in course!');
            } else {
                alert('Successfully enrolled!');
            }
            // Reload courses to show updated list
            await loadCourses();
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

async function removeCourse(courseId) {
    if (confirm("Are you sure you want to remove this course? This will not delete your grade history.")) {
        try {
            const response = await fetch(`${API_BASE}/enrollment`, {
                method: 'DELETE',
                headers: {
                    'Authorization': authToken,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    studentId: currentStudentId,
                    courseId: parseInt(courseId)
                })
            });

            const data = await response.json();

            if (response.ok) {
                if (typeof toast !== 'undefined') {
                    toast.success('Course removed successfully');
                }
                // Reload courses to show updated list
                await loadCourses();
            } else {
                if (typeof toast !== 'undefined') {
                    toast.error(data.error || 'Failed to remove course');
                } else {
                    alert('Failed to remove course: ' + (data.error || 'Unknown error'));
                }
            }
        } catch (error) {
            console.error('Error removing course:', error);
            if (typeof toast !== 'undefined') {
                toast.error('Failed to remove course');
            } else {
                alert('Failed to remove course: ' + error.message);
            }
        }
    }
}

// Helper Functions

function showError(error) {
    // Fallback error display if toast isn't available
    console.error('Error:', error);
    if (typeof toast === 'undefined') {
        alert('An error occurred: ' + error.message);
    }
}