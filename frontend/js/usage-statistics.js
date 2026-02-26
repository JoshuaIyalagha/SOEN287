/*
Usage Statistics JavaScript
Written by: Joshua Iyalagha 40306001
Purpose: Display anonymized usage statistics
*/

document.addEventListener('DOMContentLoaded', function() {
    console.log('Statistics page loaded');
    loadCompletionRates();
    loadAverageGrades();
});

// Filter courses
function filterCourse() {
    const filter = document.getElementById('courseFilter').value;
    console.log('Filtering by:', filter);
    loadCompletionRates(filter);
    loadAverageGrades(filter);
}

// Load completion rates
function loadCompletionRates(filter = 'all') {
    const container = document.getElementById('completionRates');
    let html = '';

    instructorMockData.usageStats.completionRates.forEach(stat => {
        if (filter === 'all' || filter === stat.course) {
            const percentage = Math.round((stat.completed / stat.total) * 100);
            const barWidth = percentage;

            html += `
                <div class="stat-item" style="margin-bottom: 15px;">
                    <div style="display: flex; justify-content: space-between;">
                        <strong>${stat.course} - ${stat.assessment}</strong>
                        <span>${stat.completed}/${stat.total} (${percentage}%)</span>
                    </div>
                    <div style="background: #e9ecef; height: 20px; border-radius: 10px; overflow: hidden; margin-top: 5px;">
                        <div style="background: ${getColorForPercentage(percentage)}; width: ${percentage}%; height: 100%;"></div>
                    </div>
                </div>
            `;
        }
    });

    if (html === '') {
        html = '<p>No data available for selected filter</p>';
    }

    container.innerHTML = html;
}

// Load average grades
function loadAverageGrades(filter = 'all') {
    const container = document.getElementById('averageGrades');
    let html = '';

    instructorMockData.usageStats.averageGrades.forEach(stat => {
        if (filter === 'all' || filter === stat.course) {
            const percentage = stat.average;

            html += `
                <div class="stat-item" style="margin-bottom: 15px;">
                    <div style="display: flex; justify-content: space-between;">
                        <strong>${stat.course}</strong>
                        <span>${percentage}%</span>
                    </div>
                    <div style="background: #e9ecef; height: 20px; border-radius: 10px; overflow: hidden; margin-top: 5px;">
                        <div style="background: ${getColorForPercentage(percentage)}; width: ${percentage}%; height: 100%;"></div>
                    </div>
                </div>
            `;
        }
    });

    if (html === '') {
        html = '<p>No data available for selected filter</p>';
    }

    container.innerHTML = html;
}

// Helper function to get color based on percentage
function getColorForPercentage(percentage) {
    if (percentage >= 80) return '#28a745'; // green
    if (percentage >= 60) return '#ffc107'; // yellow
    if (percentage >= 40) return '#fd7e14'; // orange
    return '#dc3545'; // red
}

// For deliverable 2, we'll replace these mockups with real Chart.js charts
// I'm keeping it simple for now since the requirement says hard-coded data is fine