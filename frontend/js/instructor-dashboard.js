/*
Instructor Dashboard JavaScript
Written by: Joshua Iyalagha 40306001
Purpose: Handles dynamic content loading for instructor dashboard
*/

// Wait for the page to load
document.addEventListener('DOMContentLoaded', function() {
    console.log('Instructor dashboard loaded');
    loadInstructorData();
    loadCourses();
    loadRecentSubmissions();
});

// Toggle mobile menu - simple function
function toggleMenu() {
    const navMenu = document.getElementById('navMenu');
    navMenu.classList.toggle('active');
}

// Load instructor data from mock-data.js
function loadInstructorData() {
    // In real app this would come from server, but for deliverable 1 we use mock data
    const instructor = instructorMockData.profile;

    // Update stats
    document.getElementById('activeCourses').textContent = instructorMockData.courses.filter(c => c.enabled).length;
    document.getElementById('totalStudents').textContent = instructorMockData.courses.reduce((sum, c) => sum + c.students, 0);
    document.getElementById('totalTemplates').textContent = instructorMockData.templates.length;

    // Calculate pending submissions (simplified)
    const pending = instructorMockData.usageStats.completionRates.reduce((sum, item) => {
        return sum + (item.total - item.completed);
    }, 0);
    document.getElementById('pendingSubmissions').textContent = pending;
}

// Load courses into the dashboard
function loadCourses() {
    const coursesList = document.getElementById('coursesList');
    let html = '';

    instructorMockData.courses.forEach(course => {
        const completionRate = calculateCompletionRate(course.id);

        html += `
            <div class="course-card">
                <div class="course-header">
                    <div>
                        <span class="course-code">${course.code}</span>
                        <span class="course-name"> - ${course.name}</span>
                    </div>
                    <div class="course-status">
                        <div class="toggle-container">
                            <label class="switch">
                                <input type="checkbox" ${course.enabled ? 'checked' : ''} onchange="toggleCourse(${course.id})">
                                <span class="slider"></span>
                            </label>
                            <span>${course.enabled ? 'Enabled' : 'Disabled'}</span>
                        </div>
                    </div>
                </div>
                <div class="course-details">
                    <span>👥 ${course.students} students</span>
                    <span>📚 ${course.term}</span>
                    <span>📊 ${completionRate}% completed</span>
                </div>
                <div class="course-description mb-1">
                    ${course.description}
                </div>
                <div class="course-actions">
                    <button onclick="editCourse(${course.id})" class="btn btn-outline">Edit Course</button>
                    <button onclick="manageWeightings(${course.id})" class="btn btn-outline">Assessment Weightings</button>
                    <a href="usage-statistics.html?course=${course.id}" class="btn btn-outline">View Stats</a>
                </div>
            </div>
        `;
    });

    coursesList.innerHTML = html;
}

// Calculate completion rate for a course
function calculateCompletionRate(courseId) {
    // This is just an estimate for display
    const course = instructorMockData.courses.find(c => c.id === courseId);
    if (!course) return 0;

    // Simplified calculation - in real app would be more complex
    const stats = instructorMockData.usageStats.completionRates.filter(s =>
        s.course === course.code
    );

    if (stats.length === 0) return 0;

    const avg = stats.reduce((sum, s) => sum + (s.completed / s.total * 100), 0) / stats.length;
    return Math.round(avg);
}

// Load recent submissions
function loadRecentSubmissions() {
    const submissionsDiv = document.getElementById('recentSubmissions');
    let html = '<ul style="list-style: none;">';

    // Take last 5 submissions from mock data
    const recent = instructorMockData.usageStats.submissionsTimeline.slice(-5).reverse();

    recent.forEach(item => {
        html += `
            <li style="padding: 10px; border-bottom: 1px solid var(--border);">
                <strong>${item.date}:</strong> ${item.count} submissions
            </li>
        `;
    });

    html += '</ul>';
    submissionsDiv.innerHTML = html;
}

// Toggle course enabled/disabled
function toggleCourse(courseId) {
    const course = instructorMockData.courses.find(c => c.id === courseId);
    if (course) {
        course.enabled = !course.enabled;
        console.log(`Course ${course.code} is now ${course.enabled ? 'enabled' : 'disabled'}`);

        // Show a simple alert - for deliverable 1 this is fine
        alert(`Course ${course.code} has been ${course.enabled ? 'enabled' : 'disabled'}. In the real app, this would update the database.`);

        // Reload courses to reflect change
        loadCourses();
    }
}

// Edit course function (placeholder)
function editCourse(courseId) {
    alert(`Edit course ${courseId} - This would open an edit form. For deliverable 1, we're just showing the concept.`);
    // In deliverable 2, this would redirect to an edit page or open modal
}

// Manage weightings function (placeholder)
function manageWeightings(courseId) {
    alert(`Manage assessment weightings for course ${courseId} - This feature will be fully implemented in deliverable 2.`);
}

// Export course structures
function exportCourseStructures() {
    // Create a simple JSON export
    const data = JSON.stringify(instructorMockData.courses, null, 2);

    // Create download link
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'course-structures.json';
    a.click();

    alert('Courses exported to course-structures.json');
}