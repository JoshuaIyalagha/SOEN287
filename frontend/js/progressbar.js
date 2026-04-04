/*
Student Progress Bar / Statistics JavaScript
Written by: Joshua Iyalagha 40306001 on 2024-04-03
Updated by: Joshua Iyalagha 40306001 on 2026-04-04
Purpose: Display student progress statistics using live API data
*/

const API_BASE = 'http://localhost:3000/api';
let authToken = null;
let currentStudentId = null;
let averageGradeChart = null;
let completionChart = null;
let assignmentStatusChart = null;

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

        // Display student name in navbar
        const nameEl = document.getElementById('studentName');
        if (nameEl) {
            nameEl.textContent = user.display_name || user.email;
        }
    } catch (error) {
        console.error('Error parsing token:', error);
        window.location.href = '../login.html';
        return;
    }

    // Load all statistics data
    await Promise.all([
        loadQuickStats(),
        loadCourseStatsList(),
        loadAverageGradeChart(),
        loadCompletionChart(),
        loadAssignmentStatusChart()
    ]);
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

// === Quick Stats Overview ===

async function loadQuickStats() {
    try {
        // Fetch enrolled courses
        const enrolledData = await fetchAPI(`/enrollment/courses/${currentStudentId}`);
        const enrolledCourses = enrolledData.courses || [];

        document.getElementById('totalEnrolled').textContent = enrolledCourses.length;

        if (enrolledCourses.length === 0) {
            document.getElementById('overallAverage').textContent = '-';
            document.getElementById('completedAssignments').textContent = '0';
            document.getElementById('pendingWork').textContent = '0';
            return;
        }

        // Fetch grades for all enrolled courses
        let totalGrades = 0;
        let totalEarned = 0;
        let completedCount = 0;
        let pendingCount = 0;

        for (const course of enrolledCourses) {
            const gradesData = await fetchAPI(`/students/${currentStudentId}/grades`)
                .catch(() => ({ grades: [] }));

            const courseGrades = gradesData.grades?.filter(g => g.course_code === course.code) || [];

            courseGrades.forEach(grade => {
                if (grade.earned_marks !== null) {
                    totalEarned += parseFloat(grade.earned_marks);
                    totalGrades += parseFloat(grade.total_marks);
                    completedCount++;
                } else {
                    pendingCount++;
                }
            });
        }

        // Calculate overall average
        const overallAverage = totalGrades > 0
            ? ((totalEarned / totalGrades) * 100).toFixed(1)
            : '-';

        document.getElementById('overallAverage').textContent = overallAverage !== '-' ? `${overallAverage}%` : '-';
        document.getElementById('completedAssignments').textContent = completedCount;
        document.getElementById('pendingWork').textContent = pendingCount;

    } catch (error) {
        console.error('Error loading quick stats:', error);
        document.getElementById('overallAverage').textContent = '-';
        document.getElementById('completedAssignments').textContent = '-';
        document.getElementById('pendingWork').textContent = '-';
    }
}

// Course List with Stats

async function loadCourseStatsList() {
    const container = document.getElementById('courseStatsList');
    if (!container) return;

    try {
        const enrolledData = await fetchAPI(`/enrollment/courses/${currentStudentId}`);
        const enrolledCourses = enrolledData.courses || [];

        if (enrolledCourses.length === 0) {
            container.innerHTML = '<p class="text-muted">You are not enrolled in any courses yet.</p>';
            return;
        }

        let html = '';

        for (const course of enrolledCourses) {
            // Fetch grades for this course
            const gradesData = await fetchAPI(`/students/${currentStudentId}/grades`)
                .catch(() => ({ grades: [] }));

            const courseGrades = gradesData.grades?.filter(g => g.course_code === course.code) || [];

            // Calculate course-specific stats
            const completed = courseGrades.filter(g => g.earned_marks !== null).length;
            const total = courseGrades.length;
            const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

            const completedGrades = courseGrades.filter(g => g.earned_marks !== null);
            const courseAverage = completedGrades.length > 0
                ? (completedGrades.reduce((sum, g) => sum + parseFloat(g.earned_marks), 0) /
                    completedGrades.reduce((sum, g) => sum + parseFloat(g.total_marks), 0) * 100).toFixed(1)
                : '-';

            html += `
                <div style="padding: 12px 0; border-bottom: 1px solid var(--border);">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <strong>${course.code}</strong> – ${course.name}
                            <div class="text-muted" style="font-size: 0.9em;">${course.term}</div>
                        </div>
                        <div style="text-align: right;">
                            <div style="font-weight: 500; color: var(--primary);">
                                ${courseAverage !== '-' ? courseAverage + '%' : '-'}
                            </div>
                            <div style="font-size: 0.85em;" class="text-muted">
                                ${completed}/${total} completed
                            </div>
                        </div>
                    </div>
                    <div style="background: var(--border-color, #e9ecef); height: 8px; border-radius: 4px; overflow: hidden; margin-top: 8px;">
                        <div style="background: ${getColorForPercentage(completionRate)}; width: ${completionRate}%; height: 100%; transition: width 0.3s ease;"></div>
                    </div>
                </div>
            `;
        }

        container.innerHTML = html;

    } catch (error) {
        console.error('Error loading course stats:', error);
        container.innerHTML = '<p class="text-muted">Failed to load course statistics.</p>';
    }
}

// Chart: Average Grade by Course

async function loadAverageGradeChart() {
    try {
        const enrolledData = await fetchAPI(`/enrollment/courses/${currentStudentId}`);
        const enrolledCourses = enrolledData.courses || [];

        if (enrolledCourses.length === 0) {
            const ctx = document.getElementById('averageGradeChart');
            if (ctx) ctx.parentElement.innerHTML = '<p class="text-muted">No courses enrolled.</p>';
            return;
        }

        const labels = [];
        const data = [];
        const colors = [];

        for (const course of enrolledCourses) {
            const gradesData = await fetchAPI(`/students/${currentStudentId}/grades`)
                .catch(() => ({ grades: [] }));

            const courseGrades = gradesData.grades?.filter(g => g.course_code === course.code) || [];
            const completedGrades = courseGrades.filter(g => g.earned_marks !== null);

            if (completedGrades.length > 0) {
                const avg = (completedGrades.reduce((sum, g) => sum + parseFloat(g.earned_marks), 0) /
                    completedGrades.reduce((sum, g) => sum + parseFloat(g.total_marks), 0) * 100);

                labels.push(course.code);
                data.push(parseFloat(avg.toFixed(1)));
                colors.push(getColorForPercentage(avg));
            }
        }

        if (labels.length === 0) {
            const ctx = document.getElementById('averageGradeChart');
            if (ctx) ctx.parentElement.innerHTML = '<p class="text-muted">No graded assessments yet.</p>';
            return;
        }

        const ctx = document.getElementById('averageGradeChart');
        if (!ctx) return;

        if (averageGradeChart) averageGradeChart.destroy();

        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        const textColor = isDark ? '#eee' : '#333';
        const gridColor = isDark ? '#444' : '#ddd';

        averageGradeChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Average Grade (%)',
                    data: data,
                    backgroundColor: colors,
                    borderRadius: 4,
                    borderSkipped: false
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `Average: ${context.parsed.y}%`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        ticks: { color: textColor, callback: value => value + '%' },
                        grid: { color: gridColor },
                        title: { display: true, text: 'Grade (%)', color: textColor }
                    },
                    x: {
                        ticks: { color: textColor },
                        grid: { color: gridColor }
                    }
                }
            }
        });

    } catch (error) {
        console.error('Error loading average grade chart:', error);
        const ctx = document.getElementById('averageGradeChart');
        if (ctx) ctx.parentElement.innerHTML = '<p class="text-muted">Error loading grade data</p>';
    }
}

// === Chart: Completion Progress ===

async function loadCompletionChart() {
    try {
        const enrolledData = await fetchAPI(`/enrollment/courses/${currentStudentId}`);
        const enrolledCourses = enrolledData.courses || [];

        if (enrolledCourses.length === 0) {
            const ctx = document.getElementById('completionChart');
            if (ctx) ctx.parentElement.innerHTML = '<p class="text-muted">No courses enrolled.</p>';
            return;
        }

        const labels = [];
        const data = [];

        for (const course of enrolledCourses) {
            const gradesData = await fetchAPI(`/students/${currentStudentId}/grades`)
                .catch(() => ({ grades: [] }));

            const courseGrades = gradesData.grades?.filter(g => g.course_code === course.code) || [];
            const completed = courseGrades.filter(g => g.earned_marks !== null).length;
            const total = courseGrades.length;
            const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

            labels.push(course.code);
            data.push(rate);
        }

        const ctx = document.getElementById('completionChart');
        if (!ctx) return;

        if (completionChart) completionChart.destroy();

        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        const textColor = isDark ? '#eee' : '#333';
        const gridColor = isDark ? '#444' : '#ddd';

        completionChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data,
                    backgroundColor: data.map(v => getColorForPercentage(v)),
                    borderWidth: 2,
                    borderColor: isDark ? '#1a1a1a' : '#fff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { color: textColor }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `${context.label}: ${context.parsed}% complete`;
                            }
                        }
                    }
                }
            }
        });

    } catch (error) {
        console.error('Error loading completion chart:', error);
        const ctx = document.getElementById('completionChart');
        if (ctx) ctx.parentElement.innerHTML = '<p class="text-muted">Error loading completion data</p>';
    }
}

// === Chart: Assignment Status Overview ===

async function loadAssignmentStatusChart() {
    try {
        const gradesData = await fetchAPI(`/students/${currentStudentId}/grades`);
        const allGrades = gradesData.grades || [];

        // Count by status
        const completed = allGrades.filter(g => g.earned_marks !== null).length;
        const pending = allGrades.filter(g => g.earned_marks === null).length;
        const total = allGrades.length;

        if (total === 0) {
            const ctx = document.getElementById('assignmentStatusChart');
            if (ctx) ctx.parentElement.innerHTML = '<p class="text-muted">No assessments found.</p>';
            return;
        }

        const ctx = document.getElementById('assignmentStatusChart');
        if (!ctx) return;

        if (assignmentStatusChart) assignmentStatusChart.destroy();

        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        const textColor = isDark ? '#eee' : '#333';

        assignmentStatusChart = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: ['Completed', 'Pending'],
                datasets: [{
                    data: [completed, pending],
                    backgroundColor: ['#28a745', '#ffc107'],
                    borderWidth: 2,
                    borderColor: isDark ? '#1a1a1a' : '#fff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { color: textColor }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = Math.round((context.parsed / total) * 100);
                                return `${context.label}: ${context.parsed} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });

    } catch (error) {
        console.error('Error loading assignment status chart:', error);
        const ctx = document.getElementById('assignmentStatusChart');
        if (ctx) ctx.parentElement.innerHTML = '<p class="text-muted">Error loading assignment data</p>';
    }
}

// Helper Functions

function getColorForPercentage(percentage) {
    if (percentage >= 80) return '#28a745';    // Green
    if (percentage >= 60) return '#ffc107';    // Yellow
    if (percentage >= 40) return '#fd7e14';    // Orange
    return '#dc3545';                          // Red
}

// Theme Change Listener

function setupThemeChangeListener() {
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.addEventListener('change', updateAllChartsTheme);
    }

    // Also listen for theme changes via CSS variable updates
    const observer = new MutationObserver(updateAllChartsTheme);
    observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['data-theme']
    });
}

function updateAllChartsTheme() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const textColor = isDark ? '#eee' : '#333';
    const gridColor = isDark ? '#444' : '#ddd';
    const borderColor = isDark ? '#1a1a1a' : '#fff';

    [averageGradeChart, completionChart, assignmentStatusChart].forEach(chart => {
        if (chart?.options?.scales) {
            if (chart.options.scales.x) {
                chart.options.scales.x.ticks.color = textColor;
                chart.options.scales.x.grid.color = gridColor;
            }
            if (chart.options.scales.y) {
                chart.options.scales.y.ticks.color = textColor;
                chart.options.scales.y.grid.color = gridColor;
                if (chart.options.scales.y.title) {
                    chart.options.scales.y.title.color = textColor;
                }
            }
            if (chart.options.plugins?.legend?.labels) {
                chart.options.plugins.legend.labels.color = textColor;
            }
            if (chart.config?.data?.datasets?.[0]) {
                chart.config.data.datasets[0].borderColor = borderColor;
            }
            chart.update();
        }
    });
}

// Initialize theme listener after DOM is ready
document.addEventListener('DOMContentLoaded', setupThemeChangeListener);