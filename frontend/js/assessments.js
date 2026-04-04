/*
Student Assessments JavaScript
Updated by: Joshua Iyalagha 40306001 on 2026-04-04
Purpose: Display student assessments with grades, grouped by course and category
*/

const API_BASE = 'http://localhost:3000/api';
let authToken = null;
let currentStudentId = null;
let currentCourseFilter = 'all';

document.addEventListener('DOMContentLoaded', async function() {
    authToken = localStorage.getItem('token');
    if (!authToken) {
        window.location.href = '../login.html';
        return;
    }

    try {
        const user = JSON.parse(atob(authToken));
        currentStudentId = user.id;
        const nameEl = document.getElementById('studentName');
        if (nameEl) nameEl.textContent = user.display_name || user.email;
    } catch (error) {
        console.error('Error parsing token:', error);
        window.location.href = '../login.html';
        return;
    }

    await Promise.all([
        loadCourseFilter(),
        loadAssessments()
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
        if (!response.ok) throw new Error(data.error || 'API request failed');
        return data;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

async function loadCourseFilter() {
    try {
        const data = await fetchAPI(`/enrollment/courses/${currentStudentId}`);
        const select = document.getElementById('courseFilter');
        if (!select) return;
        select.innerHTML = '<option value="all">All Courses</option>';
        if (data.courses && Array.isArray(data.courses)) {
            data.courses.forEach(course => {
                const option = document.createElement('option');
                option.value = course.id;
                option.textContent = `${course.code} - ${course.name}`;
                select.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error loading course filter:', error);
    }
}

async function applyAssessmentFilters() {
    currentCourseFilter = document.getElementById('courseFilter').value;
    await loadAssessments();
}

async function loadAssessments() {
    const container = document.getElementById('assessmentDetails');
    if (!container) return;
    container.innerHTML = '<p class="text-muted">Loading your assessments...</p>';

    try {
        const enrolledData = await fetchAPI(`/enrollment/courses/${currentStudentId}`);
        const enrolledCourses = enrolledData.courses || [];
        if (enrolledCourses.length === 0) {
            container.innerHTML = '<p class="text-muted">You are not enrolled in any courses yet.</p>';
            return;
        }

        // Fetch ALL grades for this student (across all courses)
        const gradesData = await fetchAPI(`/students/${currentStudentId}/grades`);
        const allGrades = gradesData.grades || [];

        let html = '';
        const filteredCourses = currentCourseFilter !== 'all'
            ? enrolledCourses.filter(c => c.id == currentCourseFilter)
            : enrolledCourses;

        for (const course of filteredCourses) {
            // Fetch categories (weighings) for this course - this is the source of truth
            const categoriesData = await fetchAPI(`/courses/${course.id}/assessment-categories`)
                .catch(() => ({ categories: [] }));
            const categories = categoriesData.categories || [];

            // Fetch assessments (optional - used for display details like due date)
            const assessmentsData = await fetchAPI(`/courses/${course.id}/assessments`)
                .catch(() => ({ assessments: [] }));
            const assessments = assessmentsData.assessments || [];

            // Filter grades for this course by course_code (most reliable)
            const courseGrades = allGrades.filter(g => g.course_code === course.code);

            // Group grades by category_name (most reliable matching)
            const gradesByCategory = {};
            courseGrades.forEach(grade => {
                const catName = grade.category_name || 'Uncategorized';
                if (!gradesByCategory[catName]) gradesByCategory[catName] = [];
                gradesByCategory[catName].push(grade);
            });

            // Calculate final course grade if all categories have at least one graded entry
            const categoryAverages = {};
            let allCategoriesHaveGrades = categories.length > 0;

            categories.forEach(cat => {
                const catGrades = gradesByCategory[cat.category_name] || [];
                const completed = catGrades.filter(g => g.earned_marks !== null);

                if (completed.length > 0) {
                    const totalEarned = completed.reduce((sum, g) => sum + parseFloat(g.earned_marks), 0);
                    const totalPossible = completed.reduce((sum, g) => sum + parseFloat(g.total_marks || 100), 0);
                    categoryAverages[cat.category_name] = totalPossible > 0 ? (totalEarned / totalPossible * 100) : null;
                } else {
                    categoryAverages[cat.category_name] = null;
                    allCategoriesHaveGrades = false;
                }
            });

            // Calculate weighted final grade
            let finalGrade = null;
            let letterGrade = '-';
            if (allCategoriesHaveGrades && categories.length > 0) {
                let weightedSum = 0;
                let totalWeight = 0;
                categories.forEach(cat => {
                    if (categoryAverages[cat.category_name] !== null) {
                        weightedSum += categoryAverages[cat.category_name] * cat.weight;
                        totalWeight += cat.weight;
                    }
                });
                if (totalWeight > 0) {
                    finalGrade = (weightedSum / totalWeight).toFixed(1);
                    const numeric = parseFloat(finalGrade);
                    if (numeric >= 90) letterGrade = 'A';
                    else if (numeric >= 80) letterGrade = 'B';
                    else if (numeric >= 70) letterGrade = 'C';
                    else if (numeric >= 60) letterGrade = 'D';
                    else letterGrade = 'F';
                }
            }

            // Course header with final grade badge
            html += `
                <details open>
                    <summary class="course-header" style="cursor: pointer; padding: 12px; background: var(--card-bg, #f8f9fa); border-radius: 8px; margin-bottom: 10px; font-weight: 500; display: flex; justify-content: space-between; align-items: center;">
                        <span>
                            ${course.code} - ${course.name} 
                            <span class="text-muted" style="font-weight: normal;">(${course.term})</span>
                        </span>
                        ${allCategoriesHaveGrades && finalGrade ? `
                            <span style="background: linear-gradient(135deg, #007bff, #0056b3); color: white; padding: 4px 12px; border-radius: 20px; font-weight: bold; font-size: 0.95em; display: flex; align-items: center; gap: 6px;">
                                Final: ${finalGrade}% 
                                <span style="background: rgba(255,255,255,0.2); padding: 2px 8px; border-radius: 12px; font-size: 0.9em;">${letterGrade}</span>
                            </span>
                        ` : ''}
                    </summary>
                    <div style="padding: 10px 0;">
            `;

            // Render each category with grades (even if no assessments exist)
            for (const category of categories) {
                const catGrades = gradesByCategory[category.category_name] || [];
                const completedGrades = catGrades.filter(g => g.earned_marks !== null);

                // Calculate category average from grades
                let categoryAverage = '-';
                if (completedGrades.length > 0) {
                    const totalEarned = completedGrades.reduce((sum, g) => sum + parseFloat(g.earned_marks), 0);
                    const totalPossible = completedGrades.reduce((sum, g) => sum + parseFloat(g.total_marks || 100), 0);
                    if (totalPossible > 0) {
                        categoryAverage = ((totalEarned / totalPossible) * 100).toFixed(1) + '%';
                    }
                }

                const hasGrades = completedGrades.length > 0;

                html += `
                    <div class="assessment-group" style="margin-bottom: 15px; padding: 10px; border-left: 3px solid var(--primary, #007bff);">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                            <h4 style="margin: 0;">${category.category_name} <span class="text-muted" style="font-weight: normal; font-size: 0.9em;">(${category.weight}% weight)</span></h4>
                            ${hasGrades ? `<span style="font-weight: 500; color: var(--primary);">${categoryAverage}</span>` : ''}
                        </div>
                `;

                // Show grade entries for this category (even without assessments)
                if (catGrades.length > 0) {
                    // Show unique grade entries (avoid duplicates if multiple assessments in same category)
                    const uniqueGrades = [];
                    const seen = new Set();
                    catGrades.forEach(g => {
                        const key = `${g.assessment_name || 'Grade'}-${g.earned_marks}`;
                        if (!seen.has(key)) {
                            seen.add(key);
                            uniqueGrades.push(g);
                        }
                    });

                    uniqueGrades.forEach(grade => {
                        const hasGrade = grade.earned_marks !== null;
                        const earnedMarks = hasGrade ? grade.earned_marks : '-';
                        const status = hasGrade ? 'completed' : 'pending';
                        const statusColors = { 'completed': '#28a745', 'pending': '#ffc107' };

                        html += `
                            <div class="assessment" style="padding: 8px 12px; margin: 5px 0 5px 15px; background: var(--background, #fff); border-radius: 4px; display: flex; justify-content: space-between; align-items: center; border-left: 2px solid ${statusColors[status]};">
                                <div>
                                    <strong>${grade.assessment_name || 'Category Grade'}</strong>
                                    <div class="text-muted" style="font-size: 0.9em;">
                                        ${grade.type || 'Assessment'} • Due: ${grade.submitted_date ? new Date(grade.submitted_date).toLocaleDateString() : 'TBD'}
                                    </div>
                                </div>
                                <div style="text-align: right;">
                                    <div style="font-weight: 500; font-size: 1.1em; ${hasGrade ? 'color: var(--primary);' : 'color: var(--text-muted, #666);'}">
                                        ${earnedMarks !== '-' ? earnedMarks : 'Not graded'}/${grade.total_marks || 100}
                                    </div>
                                    <span style="padding: 3px 8px; border-radius: 4px; background: ${statusColors[status]}; color: white; font-size: 11px;">
                                        ${hasGrade ? 'Graded' : 'Pending'}
                                    </span>
                                </div>
                            </div>
                        `;
                    });
                } else {
                    // No grades for this category yet
                    html += `<p class="text-muted" style="margin: 5px 0 0 15px; font-size: 0.95em; font-style: italic;">📝 No grades assigned yet for this category.</p>`;
                }

                html += `</div>`; // Close assessment-group
            }

            // Show message if no categories defined
            if (categories.length === 0) {
                html += `<p class="text-muted" style="padding: 10px 0 0 15px;">No assessment categories defined for this course yet.</p>`;
            }

            html += `</div></details>`; // Close course section
        }

        container.innerHTML = html || '<p class="text-muted">No assessments found for selected course.</p>';

    } catch (error) {
        console.error('Error loading assessments:', error);
        container.innerHTML = '<p class="text-muted">Failed to load your assessments.</p>';
    }
}