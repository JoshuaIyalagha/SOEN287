/*
Usage Statistics JavaScript
Written by: Joshua Iyalagha 40306001
Updated by: Joshua Iyalagha 40306001 on 2026-04-05 - Comprehensive analytics integration
Purpose: Display usage statistics with Chart.js visualization using live API data
*/

const API_BASE = 'http://localhost:3000/api';
let authToken = null;
let timelineChart = null;
let completionChart = null;
let gradeDistributionChart = null;
let currentFilters = { course: 'all', category: 'all', dateRange: '30' };

document.addEventListener('DOMContentLoaded', async function() {
    authToken = localStorage.getItem('token');

    if (!authToken) {
        window.location.href = '../login.html';
        return;
    }

    // Load all data in parallel
    await Promise.all([
        loadCourseFilter(),
        loadQuickStats(),
        loadCompletionChart(),
        loadGradeDistributionChart(),
        loadSubmissionTimeline(),
        loadStudentProgress()
    ]);

    generateActionableInsights();

    // Setup theme change listener for charts
    setupThemeChangeListener();
});

async function fetchAPI(endpoint, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const url = `${API_BASE}${endpoint}${queryString ? '?' + queryString : ''}`;

    const response = await fetch(url, {
        headers: { 'Authorization': authToken }
    });

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
}

// Filter & Data Loading Functions

async function loadCourseFilter() {
    try {
        const data = await fetchAPI('/courses');
        const select = document.getElementById('courseFilter');
        if (!select) return;

        const currentValue = select.value;
        select.innerHTML = '<option value="all">All Courses</option>';

        if (data.courses && Array.isArray(data.courses)) {
            data.courses.forEach(course => {
                const option = document.createElement('option');
                option.value = course.id; // Use ID for API calls
                option.textContent = `${course.code} - ${course.name}`;
                option.dataset.code = course.code; // Store code for display
                select.appendChild(option);
            });
        }

        if (currentValue && currentValue !== 'all') {
            select.value = currentValue;
        }

        // Load categories for selected course
        await loadCategoryFilter();
    } catch (error) {
        console.error('Error loading course filter:', error);
    }
}

async function loadCategoryFilter() {
    const courseId = document.getElementById('courseFilter').value;
    const select = document.getElementById('categoryFilter');
    if (!select) return;

    select.innerHTML = '<option value="all">All Categories</option>';

    if (courseId === 'all') {
        // If all courses selected, fetch categories from all courses
        try {
            const coursesData = await fetchAPI('/courses');
            const allCategories = new Set();

            for (const course of coursesData.courses || []) {
                const catsData = await fetchAPI(`/courses/${course.id}/assessment-categories`).catch(() => null);
                if (catsData?.categories) {
                    catsData.categories.forEach(cat => allCategories.add(cat.category_name));
                }
            }

            Array.from(allCategories).sort().forEach(catName => {
                const option = document.createElement('option');
                option.value = catName;
                option.textContent = catName;
                select.appendChild(option);
            });
        } catch (error) {
            console.error('Error loading all categories:', error);
        }
    } else {
        // Load categories for specific course
        try {
            const data = await fetchAPI(`/courses/${courseId}/assessment-categories`);
            if (data.categories && Array.isArray(data.categories)) {
                data.categories.forEach(cat => {
                    const option = document.createElement('option');
                    option.value = cat.category_name;
                    option.textContent = `${cat.category_name} (${cat.weight}%)`;
                    select.appendChild(option);
                });
            }
        } catch (error) {
            console.error('Error loading categories:', error);
        }
    }
}

async function applyFilters() {
    currentFilters.course = document.getElementById('courseFilter').value;
    currentFilters.category = document.getElementById('categoryFilter').value;
    currentFilters.dateRange = document.getElementById('dateRange').value;

    // Reload category filter if course changed
    if (event?.target?.id === 'courseFilter') {
        await loadCategoryFilter();
    }

    await Promise.all([
        loadQuickStats(),
        loadCompletionChart(),
        loadGradeDistributionChart(),
        loadSubmissionTimeline(),
        loadStudentProgress()
    ]);
    generateActionableInsights();
}

// Quick Stats Overview

async function loadQuickStats() {
    try {
        const courseId = currentFilters.course;
        const courseParam = courseId !== 'all' ? `?course=${courseId}` : '';

        // Fetch data in parallel
        const [completionData, gradesData, enrollmentData] = await Promise.all([
            fetchAPI(`/stats/completion${courseParam}`),
            fetchAPI(`/stats/grades${courseParam}`),
            courseId !== 'all'
                ? fetchAPI(`/enrollment/students/${courseId}`)
                : fetchAPI('/courses').then(courses =>
                    Promise.all(courses.courses.map(c =>
                        fetchAPI(`/enrollment/students/${c.id}`).catch(() => ({ students: [] }))
                    )).then(results => ({
                        students: results.flatMap(r => r.students || [])
                    }))
                )
        ]);

        // Calculate metrics
        const totalStudents = enrollmentData.students?.length || 0;

        const completionRates = completionData.completionRates || [];
        const avgCompletion = completionRates.length > 0
            ? Math.round(completionRates.reduce((sum, stat) =>
                sum + (stat.total > 0 ? (stat.completed / stat.total) * 100 : 0), 0) / completionRates.length)
            : 0;

        const averageGrades = gradesData.averageGrades || [];
        const avgGrade = averageGrades.length > 0
            ? (averageGrades.reduce((sum, stat) => sum + (stat.average || 0), 0) / averageGrades.length).toFixed(1)
            : '-';

        // Count pending grades (grades with null earned_marks)
        let pendingCount = 0;
        if (courseId !== 'all') {
            const gradesData = await fetchAPI(`/courses/${courseId}/grades`).catch(() => ({ grades: [] }));
            pendingCount = gradesData.grades?.filter(g => g.earned_marks === null).length || 0;
        }

        // Update DOM
        document.getElementById('totalStudents').textContent = totalStudents;
        document.getElementById('avgCompletion').textContent = `${avgCompletion}%`;
        document.getElementById('avgGrade').textContent = avgGrade !== '-' ? `${avgGrade}%` : '-';
        document.getElementById('pendingGrades').textContent = pendingCount;

    } catch (error) {
        console.error('Error loading quick stats:', error);
    }
}

// Chart Rendering Functions

async function loadCompletionChart() {
    try {
        const courseId = currentFilters.course;
        const categoryFilter = currentFilters.category;
        const courseParam = courseId !== 'all' ? `?course=${courseId}` : '';

        const data = await fetchAPI(`/stats/completion${courseParam}`);
        const completionRates = data.completionRates || [];

        // Filter by category if specified
        const filteredRates = categoryFilter !== 'all'
            ? completionRates.filter(r => r.category === categoryFilter)
            : completionRates;

        const ctx = document.getElementById('completionChart');
        if (!ctx) return;

        if (completionChart) completionChart.destroy();

        const labels = filteredRates.map(r => `${r.course} - ${r.assessment}`);
        const values = filteredRates.map(r => {
            const total = r.total || 0;
            const completed = r.completed || 0;
            return total > 0 ? Math.round((completed / total) * 100) : 0;
        });

        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        const textColor = isDark ? '#eee' : '#333';
        const gridColor = isDark ? '#444' : '#ddd';

        completionChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Completion %',
                    data: values,
                    backgroundColor: values.map(v => getColorForPercentage(v)),
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
                                return `Completion: ${context.parsed.y}%`;
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
                        title: { display: true, text: 'Completion Rate', color: textColor }
                    },
                    x: {
                        ticks: { color: textColor, maxRotation: 45, minRotation: 45 },
                        grid: { color: gridColor }
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

async function loadGradeDistributionChart() {
    try {
        const courseId = currentFilters.course;
        if (courseId === 'all') {
            // For "all courses", show aggregate distribution
            const allGrades = [];
            const coursesData = await fetchAPI('/courses');

            for (const course of coursesData.courses || []) {
                const gradesData = await fetchAPI(`/courses/${course.id}/grades`).catch(() => ({ grades: [] }));
                allGrades.push(...(gradesData.grades || []));
            }
            renderGradeDistribution(allGrades.filter(g => g.earned_marks !== null));
        } else {
            const gradesData = await fetchAPI(`/courses/${courseId}/grades`);
            renderGradeDistribution(gradesData.grades?.filter(g => g.earned_marks !== null) || []);
        }
    } catch (error) {
        console.error('Error loading grade distribution:', error);
        const ctx = document.getElementById('gradeDistributionChart');
        if (ctx) ctx.parentElement.innerHTML = '<p class="text-muted">Error loading grade data</p>';
    }
}

function renderGradeDistribution(grades) {
    const ctx = document.getElementById('gradeDistributionChart');
    if (!ctx) return;

    if (gradeDistributionChart) gradeDistributionChart.destroy();

    // Create bins: 0-59, 60-69, 70-79, 80-89, 90-100
    const bins = { 'F (0-59)': 0, 'D (60-69)': 0, 'C (70-79)': 0, 'B (80-89)': 0, 'A (90-100)': 0 };

    grades.forEach(grade => {
        const mark = parseFloat(grade.earned_marks);
        if (mark < 60) bins['F (0-59)']++;
        else if (mark < 70) bins['D (60-69)']++;
        else if (mark < 80) bins['C (70-79)']++;
        else if (mark < 90) bins['B (80-89)']++;
        else bins['A (90-100)']++;
    });

    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const textColor = isDark ? '#eee' : '#333';
    const gridColor = isDark ? '#444' : '#ddd';

    gradeDistributionChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: Object.keys(bins),
            datasets: [{
                label: 'Number of Grades',
                data: Object.values(bins),
                backgroundColor: ['#dc3545', '#fd7e14', '#ffc107', '#28a745', '#20c997'],
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
                            return `Grades: ${context.parsed.y}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { color: textColor, precision: 0 },
                    grid: { color: gridColor },
                    title: { display: true, text: 'Number of Grades', color: textColor }
                },
                x: {
                    ticks: { color: textColor },
                    grid: { color: gridColor }
                }
            }
        }
    });
}

async function loadSubmissionTimeline() {
    try {
        const courseId = currentFilters.course;
        const dateRange = currentFilters.dateRange;
        const courseParam = courseId !== 'all' ? `?course=${courseId}` : '';

        const data = await fetchAPI(`/stats/timeline${courseParam}`);
        let timelineData = data.submissionsTimeline || [];

        // Filter by date range
        if (dateRange !== 'all') {
            const days = parseInt(dateRange);
            const cutoff = new Date();
            cutoff.setDate(cutoff.getDate() - days);

            timelineData = timelineData.filter(d => new Date(d.date) >= cutoff);
        }

        const ctx = document.getElementById('timelineChart');
        if (!ctx) return;

        if (timelineChart) timelineChart.destroy();

        const labels = timelineData.map(d => {
            const date = new Date(d.date);
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        });

        const values = timelineData.map(d => d.count);

        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        const textColor = isDark ? '#eee' : '#333';
        const gridColor = isDark ? '#444' : '#ddd';
        const barColor = getComputedStyle(document.documentElement).getPropertyValue('--primary').trim() || '#007bff';

        timelineChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Submissions',
                    data: values,
                    backgroundColor: barColor,
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
                                return 'Submissions: ' + context.parsed.y;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { color: textColor, precision: 0 },
                        grid: { color: gridColor },
                        title: { display: true, text: 'Number of Submissions', color: textColor }
                    },
                    x: {
                        ticks: { color: textColor, maxRotation: 45, minRotation: 45 },
                        grid: { color: gridColor }
                    }
                }
            }
        });

    } catch (error) {
        console.error('Error loading submission timeline:', error);
        const ctx = document.getElementById('timelineChart');
        if (ctx) {
            ctx.parentElement.innerHTML = '<p class="text-muted">Error loading timeline data</p>';
        }
    }
}

// === Student Progress Table ===

async function loadStudentProgress() {
    const container = document.getElementById('studentProgressTable');
    if (!container) return;

    try {
        const courseId = currentFilters.course;
        if (courseId === 'all') {
            container.innerHTML = '<p class="text-muted">Select a specific course to view student progress.</p>';
            return;
        }

        // Fetch enrolled students and their grades
        const [studentsData, gradesData] = await Promise.all([
            fetchAPI(`/enrollment/students/${courseId}`),
            fetchAPI(`/courses/${courseId}/grades`)
        ]);

        const students = studentsData.students || [];
        const grades = gradesData.grades || [];

        if (students.length === 0) {
            container.innerHTML = '<p class="text-muted">No students enrolled in this course.</p>';
            return;
        }

        // Calculate progress per student
        const studentProgress = students.map(student => {
            const studentGrades = grades.filter(g => g.student_id === student.id);
            const completed = studentGrades.filter(g => g.earned_marks !== null).length;
            const total = studentGrades.length;
            const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

            // Calculate average grade for completed assessments
            const completedGrades = studentGrades.filter(g => g.earned_marks !== null);
            const avgGrade = completedGrades.length > 0
                ? (completedGrades.reduce((sum, g) => sum + parseFloat(g.earned_marks), 0) /
                    completedGrades.reduce((sum, g) => sum + parseFloat(g.total_marks), 0) * 100).toFixed(1)
                : '-';

            return {
                name: student.display_name || `${student.first_name} ${student.last_name}`,
                email: student.email,
                completionRate,
                avgGrade,
                pendingCount: total - completed
            };
        });

        // Sort by completion rate (lowest first) to highlight at-risk students
        studentProgress.sort((a, b) => a.completionRate - b.completionRate);

        // Render table
        let html = `
            <table style="width: 100%; border-collapse: collapse;">
                <thead>
                    <tr style="border-bottom: 2px solid var(--border);">
                        <th style="text-align: left; padding: 10px;">Student</th>
                        <th style="text-align: left; padding: 10px;">Completion</th>
                        <th style="text-align: left; padding: 10px;">Avg Grade</th>
                        <th style="text-align: left; padding: 10px;">Pending</th>
                        <th style="text-align: left; padding: 10px;">Status</th>
                    </tr>
                </thead>
                <tbody>
        `;

        studentProgress.forEach(student => {
            const status = student.completionRate < 50 ? 'At Risk' :
                student.completionRate < 80 ? 'Needs Attention' : 'On Track';
            const statusColor = student.completionRate < 50 ? '#dc3545' :
                student.completionRate < 80 ? '#ffc107' : '#28a745';

            html += `
                <tr style="border-bottom: 1px solid var(--border);">
                    <td style="padding: 10px;">
                        <strong>${student.name}</strong><br>
                        <small class="text-muted">${student.email}</small>
                    </td>
                    <td style="padding: 10px;">
                        <div style="background: var(--border-color, #e9ecef); height: 20px; border-radius: 10px; overflow: hidden;">
                            <div style="background: ${getColorForPercentage(student.completionRate)}; width: ${student.completionRate}%; height: 100%;"></div>
                        </div>
                        <small>${student.completionRate}%</small>
                    </td>
                    <td style="padding: 10px; font-weight: 500;">${student.avgGrade !== '-' ? student.avgGrade + '%' : '-'}</td>
                    <td style="padding: 10px;">${student.pendingCount}</td>
                    <td style="padding: 10px;">
                        <span style="padding: 4px 8px; border-radius: 4px; background: ${statusColor}; color: white; font-size: 12px;">
                            ${status}
                        </span>
                    </td>
                </tr>
            `;
        });

        html += '</tbody></table>';
        container.innerHTML = html;

    } catch (error) {
        console.error('Error loading student progress:', error);
        container.innerHTML = '<p class="text-muted">Failed to load student progress data.</p>';
    }
}

// === Actionable Insights Generator ===

function generateActionableInsights() {
    const insightsEl = document.getElementById('keyInsights');
    if (!insightsEl) return;

    const insights = [];
    const courseId = currentFilters.course;

    // Insight 1: Low completion assessments
    if (completionChart?.data?.datasets?.[0]?.data) {
        const lowCompletion = completionChart.data.labels.filter((label, i) =>
            completionChart.data.datasets[0].data[i] < 60
        );
        if (lowCompletion.length > 0) {
            insights.push({
                type: 'warning',
                message: `📊 <strong>${lowCompletion.length} assessment(s)</strong> have <60% completion. Consider sending reminders or extending deadlines.`
            });
        }
    }

    // Insight 2: Low average grades
    if (document.getElementById('avgGrade')?.textContent) {
        const avgGrade = parseFloat(document.getElementById('avgGrade').textContent);
        if (!isNaN(avgGrade) && avgGrade < 70) {
            insights.push({
                type: 'danger',
                message: `📉 Course average is <strong>${avgGrade}%</strong>. Consider reviewing assessment difficulty or providing additional support resources.`
            });
        }
    }

    // Insight 3: Pending grades
    const pendingCount = parseInt(document.getElementById('pendingGrades')?.textContent) || 0;
    if (pendingCount > 10) {
        insights.push({
            type: 'info',
            message: `⏰ <strong>${pendingCount} grades</strong> are still pending. Enter grades to provide timely feedback to students.`
        });
    }

    // Insight 4: At-risk students
    if (courseId !== 'all') {
        const atRiskRows = document.querySelectorAll('#studentProgressTable tr')?.length || 0;
        if (atRiskRows > 0) {
            const atRiskCount = document.querySelectorAll('#studentProgressTable span[style*="#dc3545"]')?.length || 0;
            if (atRiskCount > 0) {
                insights.push({
                    type: 'danger',
                    message: `⚠️ <strong>${atRiskCount} student(s)</strong> are at risk (<50% completion). Consider reaching out with support.`
                });
            }
        }
    }

    // Insight 5: Submission patterns
    if (timelineChart?.data?.datasets?.[0]?.data) {
        const values = timelineChart.data.datasets[0].data;
        const avgSubmissions = values.reduce((a, b) => a + b, 0) / values.length;
        const recentPeak = values.slice(-7).some(v => v > avgSubmissions * 1.5);

        if (recentPeak) {
            insights.push({
                type: 'info',
                message: `📈 Recent submission spike detected. Ensure you have capacity to provide timely feedback.`
            });
        }
    }

    // Render insights
    if (insights.length > 0) {
        insightsEl.innerHTML = insights.map(insight => `
            <div class="insight-card ${insight.type}">
                ${insight.message}
            </div>
        `).join('');
    } else {
        insightsEl.innerHTML = '<p class="text-muted">✅ Your course metrics look healthy! No immediate actions needed.</p>';
    }
}

// === Export Functionality ===

async function exportStatistics() {
    try {
        const courseId = currentFilters.course;
        const courseName = document.getElementById('courseFilter').options[document.getElementById('courseFilter').selectedIndex].text;

        // Fetch all data for export
        const [completionData, gradesData, timelineData] = await Promise.all([
            fetchAPI(`/stats/completion${courseId !== 'all' ? '?course=' + courseId : ''}`),
            fetchAPI(`/stats/grades${courseId !== 'all' ? '?course=' + courseId : ''}`),
            fetchAPI(`/stats/timeline${courseId !== 'all' ? '?course=' + courseId : ''}`)
        ]);

        // Build CSV content
        const headers = ['Metric', 'Value', 'Course', 'Category', 'Date'];
        const rows = [];

        // Add completion rates
        (completionData.completionRates || []).forEach(stat => {
            rows.push([
                'Completion Rate',
                `${stat.completed}/${stat.total} (${Math.round((stat.completed/stat.total)*100)}%)`,
                stat.course,
                stat.category || 'N/A',
                new Date().toISOString().split('T')[0]
            ]);
        });

        // Add average grades
        (gradesData.averageGrades || []).forEach(stat => {
            rows.push([
                'Average Grade',
                `${stat.average}%`,
                stat.course,
                'N/A',
                new Date().toISOString().split('T')[0]
            ]);
        });

        // Add timeline data
        (timelineData.submissionsTimeline || []).forEach(stat => {
            rows.push([
                'Submissions',
                stat.count,
                courseId !== 'all' ? courseName : 'All Courses',
                'N/A',
                stat.date
            ]);
        });

        // Convert to CSV
        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => {
                const str = String(cell);
                if (str.includes(',') || str.includes('"') || str.includes('\n')) {
                    return `"${str.replace(/"/g, '""')}"`;
                }
                return str;
            }).join(','))
        ].join('\n');

        // Trigger download
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `statistics-report-${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        if (typeof toast !== 'undefined') {
            toast.success('Statistics report exported successfully!');
        }

    } catch (error) {
        console.error('Error exporting statistics:', error);
        if (typeof toast !== 'undefined') {
            toast.error('Failed to export report');
        } else {
            alert('Failed to export report: ' + error.message);
        }
    }
}

// === Helper Functions ===

function getColorForPercentage(percentage) {
    if (percentage >= 80) return '#28a745';    // Green
    if (percentage >= 60) return '#ffc107';    // Yellow
    if (percentage >= 40) return '#fd7e14';    // Orange
    return '#dc3545';                          // Red
}

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

    [completionChart, timelineChart, gradeDistributionChart].forEach(chart => {
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
            chart.update();
        }
    });
}

// === Modal Functions (inherited from dashboard) ===
function openModal(modalId) { document.getElementById(modalId).style.display = 'block'; }
function closeModal(modalId) { document.getElementById(modalId).style.display = 'none'; }
window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = 'none';
    }
}