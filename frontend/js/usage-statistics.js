/*
Usage Statistics JavaScript
Written by: Joshua Iyalagha 40306001
Purpose: Display usage statistics with Chart.js visualization
*/

const API_BASE = 'http://localhost:3000/api';
let authToken = null;
let timelineChart = null;

document.addEventListener('DOMContentLoaded', async function() {
    authToken = localStorage.getItem('token');

    if (!authToken) {
        window.location.href = '../login.html';
        return;
    }

    await Promise.all([
        loadCourseFilter(),
        loadCompletionRates(),
        loadAverageGrades(),
        loadSubmissionTimeline()
    ]);

    generateKeyInsights();
});

async function fetchAPI(endpoint) {
    const response = await fetch(`${API_BASE}${endpoint}`, {
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
                option.value = course.code;
                option.textContent = `${course.code} - ${course.name}`;
                select.appendChild(option);
            });
        }

        if (currentValue && currentValue !== 'all') {
            const optionExists = Array.from(select.options).some(opt => opt.value === currentValue);
            if (optionExists) select.value = currentValue;
        }
    } catch (error) {
        console.error('Error loading course filter:', error);
    }
}

async function filterCourse() {
    const filter = document.getElementById('courseFilter').value;
    await Promise.all([
        loadCompletionRates(filter),
        loadAverageGrades(filter),
        loadSubmissionTimeline(filter)
    ]);
    generateKeyInsights();
}

async function loadCompletionRates(filter = 'all') {
    try {
        const url = filter === 'all' ? '/stats/completion' : `/stats/completion?course=${filter}`;
        const data = await fetchAPI(url);
        const container = document.getElementById('completionRates');

        if (!data.completionRates || data.completionRates.length === 0) {
            container.innerHTML = '<p class="text-muted">No completion data available</p>';
            return;
        }

        let html = '';
        data.completionRates.forEach(stat => {
            const total = stat.total || 0;
            const completed = stat.completed || 0;
            const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

            html += `
                <div class="stat-item" style="margin-bottom: 15px;">
                    <div style="display: flex; justify-content: space-between;">
                        <strong>${stat.course} - ${stat.assessment}</strong>
                        <span>${completed}/${total} (${percentage}%)</span>
                    </div>
                    <div style="background: var(--border-color, #e9ecef); height: 20px; border-radius: 10px; overflow: hidden; margin-top: 5px;">
                        <div style="background: ${getColorForPercentage(percentage)}; width: ${percentage}%; height: 100%; transition: width 0.3s ease;"></div>
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;
    } catch (error) {
        console.error('Error loading completion rates:', error);
        document.getElementById('completionRates').innerHTML = '<p class="text-muted">Error loading data</p>';
    }
}

async function loadAverageGrades(filter = 'all') {
    try {
        const url = filter === 'all' ? '/stats/grades' : `/stats/grades?course=${filter}`;
        const data = await fetchAPI(url);
        const container = document.getElementById('averageGrades');

        if (!data.averageGrades || data.averageGrades.length === 0) {
            container.innerHTML = '<p class="text-muted">No grade data available</p>';
            return;
        }

        let html = '';
        data.averageGrades.forEach(stat => {
            const percentage = stat.average !== null ? parseFloat(stat.average) : 0;

            html += `
                <div class="stat-item" style="margin-bottom: 15px;">
                    <div style="display: flex; justify-content: space-between;">
                        <strong>${stat.course}</strong>
                        <span>${percentage}%</span>
                    </div>
                    <div style="background: var(--border-color, #e9ecef); height: 20px; border-radius: 10px; overflow: hidden; margin-top: 5px;">
                        <div style="background: ${getColorForPercentage(percentage)}; width: ${percentage}%; height: 100%; transition: width 0.3s ease;"></div>
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;
    } catch (error) {
        console.error('Error loading average grades:', error);
        document.getElementById('averageGrades').innerHTML = '<p class="text-muted">Error loading data</p>';
    }
}

async function loadSubmissionTimeline(filter = 'all') {
    try {
        const url = filter === 'all' ? '/stats/timeline' : `/stats/timeline?course=${filter}`;
        const data = await fetchAPI(url);

        const ctx = document.getElementById('timelineChart');
        if (!ctx) return;

        if (timelineChart) {
            timelineChart.destroy();
        }

        const timelineData = data.submissionsTimeline || [];

        const labels = timelineData.map(d => {
            const date = new Date(d.date);
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        }).reverse();

        const values = timelineData.map(d => d.count).reverse();

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
                    legend: {
                        display: false
                    },
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
                        ticks: {
                            color: textColor,
                            precision: 0
                        },
                        grid: {
                            color: gridColor
                        },
                        title: {
                            display: true,
                            text: 'Number of Submissions',
                            color: textColor
                        }
                    },
                    x: {
                        ticks: {
                            color: textColor,
                            maxRotation: 45,
                            minRotation: 45
                        },
                        grid: {
                            color: gridColor
                        }
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

function generateKeyInsights() {
    const insightsEl = document.getElementById('keyInsights');
    if (!insightsEl) return;

    const completionRates = document.getElementById('completionRates');
    const averageGrades = document.getElementById('averageGrades');

    let insights = [];

    if (completionRates) {
        const items = completionRates.querySelectorAll('.stat-item');
        items.forEach(item => {
            const text = item.textContent;
            const match = text.match(/(\d+)%/);
            if (match) {
                const percentage = parseInt(match[1]);
                if (percentage < 60) {
                    const courseAssessment = text.split('\n')[0]?.trim() || 'An assessment';
                    insights.push('📊 <strong>' + courseAssessment + '</strong> has only ' + percentage + '% completion - consider sending reminders');
                }
            }
        });
    }

    if (averageGrades) {
        const items = averageGrades.querySelectorAll('.stat-item');
        let highest = { course: '', grade: -1 };
        let lowest = { course: '', grade: 101 };

        items.forEach(item => {
            const text = item.textContent;
            const courseMatch = text.match(/^([A-Z]+\d+)\s*-/);
            const gradeMatch = text.match(/(\d+\.?\d*)%/);

            if (courseMatch && gradeMatch) {
                const course = courseMatch[1];
                const grade = parseFloat(gradeMatch[1]);

                if (grade > highest.grade) highest = { course, grade };
                if (grade < lowest.grade) lowest = { course, grade };
            }
        });

        if (highest.course) {
            insights.push('📊 <strong>' + highest.course + '</strong> has highest average grade (' + highest.grade + '%)');
        }
        if (lowest.course && lowest.grade < 70) {
            insights.push('📊 <strong>' + lowest.course + '</strong> may need additional support (' + lowest.grade + '% average)');
        }
    }

    if (timelineChart && timelineChart.data.datasets[0].data.length > 0) {
        const values = timelineChart.data.datasets[0].data;
        const maxVal = Math.max(...values);
        const maxIndex = values.indexOf(maxVal);
        if (maxVal > 0 && maxIndex >= 0) {
            const peakDate = timelineChart.data.labels[maxIndex];
            insights.push('📊 Submission peak on <strong>' + peakDate + '</strong> (' + maxVal + ' submissions)');
        }
    }

    if (insights.length > 0) {
        insightsEl.innerHTML = insights.map(i => '<p>' + i + '</p>').join('');
    } else {
        insightsEl.innerHTML = '<p class="text-muted">No insights available yet. Add more course data to see analysis.</p>';
    }
}

function getColorForPercentage(percentage) {
    if (percentage >= 80) return '#28a745';
    if (percentage >= 60) return '#ffc107';
    if (percentage >= 40) return '#fd7e14';
    return '#dc3545';
}

function updateChartTheme() {
    if (!timelineChart) return;

    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const textColor = isDark ? '#eee' : '#333';
    const gridColor = isDark ? '#444' : '#ddd';

    timelineChart.options.scales.x.ticks.color = textColor;
    timelineChart.options.scales.x.grid.color = gridColor;
    timelineChart.options.scales.y.ticks.color = textColor;
    timelineChart.options.scales.y.grid.color = gridColor;
    timelineChart.options.scales.y.title.color = textColor;

    timelineChart.update();
}

document.addEventListener('DOMContentLoaded', function() {
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.addEventListener('change', updateChartTheme);
    }
});