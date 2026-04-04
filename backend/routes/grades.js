/*
Grades Routes
Written by: Joshua Iyalagha 40306001
*/

const db = require('../config/database');
const Course = require('../models/Course');

// Helper functions
function sendJSON(res, statusCode, data) {
    res.writeHead(statusCode, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data));
}

function verifyToken(token) {
    try {
        const decoded = Buffer.from(token, 'base64').toString();
        return JSON.parse(decoded);
    } catch (error) {
        return null;
    }
}

// Get all grades for a course GROUPED BY CATEGORY (for instructor view)
async function getGradesForCourse(req, res, token, courseId) {
    const user = verifyToken(token);

    if (!user) {
        sendJSON(res, 401, { error: 'Invalid token' });
        return;
    }

    try {
        // Verify course belongs to instructor
        const course = await Course.findById(courseId);
        if (!course || course.instructor_id !== user.id) {
            sendJSON(res, 403, { error: 'You can only view grades for your own courses' });
            return;
        }

        // Fetch grades grouped by student and category
        const grades = await db.query(`
            SELECT
                g.id,
                g.student_id,
                g.assessment_id,
                g.earned_marks,
                g.status,
                g.feedback,
                u.display_name as student_name,
                u.email as student_email,
                a.name as assessment_name,
                a.total_marks,
                ac.id as category_id,
                ac.category_name,
                ac.weight as category_weight
            FROM grades g
                     JOIN users u ON g.student_id = u.id
                     JOIN assessments a ON g.assessment_id = a.id
                     LEFT JOIN assessment_categories ac ON a.category_id = ac.id
            WHERE a.course_id = ?
            ORDER BY u.last_name, ac.category_name, a.name
        `, [courseId]);

        sendJSON(res, 200, { grades });
    } catch (error) {
        console.error('Error fetching grades for course:', error);
        sendJSON(res, 500, { error: 'Failed to fetch grades' });
    }
}

// Get grades for a specific student (student view - own grades only)
async function getGradesForStudent(req, res, token, studentId) {
    const user = verifyToken(token);

    if (!user) {
        sendJSON(res, 401, { error: 'Invalid token' });
        return;
    }

    // Students can only view their own grades
    if (user.role === 'student' && user.id !== parseInt(studentId)) {
        sendJSON(res, 403, { error: 'You can only view your own grades' });
        return;
    }

    try {
        const grades = await db.query(`
            SELECT
                g.id,
                g.assessment_id,
                g.earned_marks,
                g.status,
                g.feedback,
                a.name as assessment_name,
                a.total_marks,
                a.type,
                c.code as course_code,
                c.name as course_name,
                ac.category_name,
                ac.weight as category_weight
            FROM grades g
                     JOIN assessments a ON g.assessment_id = a.id
                     JOIN courses c ON a.course_id = c.id
                     LEFT JOIN assessment_categories ac ON a.category_id = ac.id
            WHERE g.student_id = ?
            ORDER BY c.code, ac.category_name, a.name
        `, [studentId]);

        sendJSON(res, 200, { grades });
    } catch (error) {
        console.error('Error fetching grades for student:', error);
        sendJSON(res, 500, { error: 'Failed to fetch grades' });
    }
}

// Create or update a grade (instructor only)
async function saveGrade(req, res, token, body) {
    const user = verifyToken(token);

    if (!user || user.role !== 'instructor') {
        sendJSON(res, 403, { error: 'Only instructors can manage grades' });
        return;
    }

    const { grade_id, student_id, assessment_id, earned_marks, status, feedback } = body;

    // Accept grade_id for updates OR student_id+assessment_id for new grades
    if (grade_id && earned_marks !== undefined) {
        // Update existing grade
        try {
            const grades = await db.query(`
                SELECT g.*, a.course_id, c.instructor_id
                FROM grades g
                         JOIN assessments a ON g.assessment_id = a.id
                         JOIN courses c ON a.course_id = c.id
                WHERE g.id = ?
            `, [grade_id]);

            if (!grades || grades.length === 0) {
                sendJSON(res, 404, { error: 'Grade not found' });
                return;
            }

            if (grades[0].instructor_id !== user.id) {
                sendJSON(res, 403, { error: 'You can only manage grades for your own courses' });
                return;
            }

            // Update the grade
            await db.query(`
                UPDATE grades
                SET earned_marks = ?, status = ?, feedback = ?, updated_at = NOW()
                WHERE id = ?
            `, [earned_marks, status || 'completed', feedback || null, grade_id]);

            sendJSON(res, 200, {
                success: true,
                message: 'Grade updated successfully',
                gradeId: grade_id
            });
        } catch (error) {
            console.error('Error updating grade:', error);
            sendJSON(res, 500, { error: 'Failed to update grade' });
        }
    } else if (student_id && assessment_id && earned_marks !== undefined) {
        // Create new grade
        try {
            const assessments = await db.query(`
                SELECT a.*, c.instructor_id
                FROM assessments a
                         JOIN courses c ON a.course_id = c.id
                WHERE a.id = ?
            `, [assessment_id]);

            if (!assessments || assessments.length === 0) {
                sendJSON(res, 404, { error: 'Assessment not found' });
                return;
            }

            if (assessments[0].instructor_id !== user.id) {
                sendJSON(res, 403, { error: 'You can only manage grades for your own courses' });
                return;
            }

            // Check if grade already exists
            const existingGrades = await db.query(`
                SELECT id FROM grades WHERE student_id = ? AND assessment_id = ?
            `, [student_id, assessment_id]);

            if (existingGrades && existingGrades.length > 0) {
                // Update existing grade
                await db.query(`
                    UPDATE grades
                    SET earned_marks = ?, status = ?, feedback = ?, updated_at = NOW()
                    WHERE id = ?
                `, [earned_marks, status || 'completed', feedback || null, existingGrades[0].id]);

                sendJSON(res, 200, {
                    success: true,
                    message: 'Grade updated successfully',
                    gradeId: existingGrades[0].id
                });
            } else {
                // Insert new grade
                const result = await db.query(`
                    INSERT INTO grades (student_id, assessment_id, earned_marks, status, feedback, submitted_date, created_at)
                    VALUES (?, ?, ?, ?, ?, NOW(), NOW())
                `, [student_id, assessment_id, earned_marks, status || 'completed', feedback || null]);

                sendJSON(res, 201, {
                    success: true,
                    message: 'Grade created successfully',
                    gradeId: result.insertId
                });
            }
        } catch (error) {
            console.error('Error saving grade:', error);
            sendJSON(res, 500, { error: 'Failed to save grade' });
        }
    } else {
        sendJSON(res, 400, { error: 'Either grade_id (for updates) OR student_id, assessment_id, and earned_marks (for new grades) are required' });
        return;
    }
}

// Save grade for a student + category (weighings-only workflow)
async function saveGradeForCategory(req, res, token, body) {
    const user = verifyToken(token);

    if (!user || user.role !== 'instructor') {
        sendJSON(res, 403, { error: 'Only instructors can manage grades' });
        return;
    }

    const { student_id, category_id, earned_marks, course_id } = body;

    if (!student_id || !category_id || earned_marks === undefined || !course_id) {
        sendJSON(res, 400, { error: 'Student ID, category ID, earned marks, and course ID are required' });
        return;
    }

    try {
        // Verify course belongs to instructor
        const course = await Course.findById(course_id);
        if (!course || course.instructor_id !== user.id) {
            sendJSON(res, 403, { error: 'You can only manage grades for your own courses' });
            return;
        }

        // Verify category exists and belongs to this course
        const categories = await db.query(`
            SELECT id FROM assessment_categories WHERE id = ? AND course_id = ?
        `, [category_id, course_id]);

        if (!categories || categories.length === 0) {
            sendJSON(res, 404, { error: 'Assessment category not found for this course' });
            return;
        }

        // Find or create an assessment for this category (if none exists)
        let assessments = await db.query(`
            SELECT id FROM assessments WHERE course_id = ? AND category_id = ? LIMIT 1
        `, [course_id, category_id]);

        let assessment_id;
        if (assessments && assessments.length > 0) {
            assessment_id = assessments[0].id;
        } else {
            // Create a placeholder assessment for this category
            const result = await db.query(`
                INSERT INTO assessments (course_id, category_id, name, type, total_marks, created_at)
                VALUES (?, ?, ?, ?, ?, NOW())
            `, [course_id, category_id, `Category Grade: ${category_id}`, 'category_grade', 100]);
            assessment_id = result.insertId;
        }

        // Check if grade already exists for this student + assessment
        const existingGrades = await db.query(`
            SELECT id FROM grades WHERE student_id = ? AND assessment_id = ?
        `, [student_id, assessment_id]);

        if (existingGrades && existingGrades.length > 0) {
            // Update existing grade
            await db.query(`
                UPDATE grades
                SET earned_marks = ?, status = 'completed', updated_at = NOW()
                WHERE id = ?
            `, [earned_marks, existingGrades[0].id]);

            sendJSON(res, 200, {
                success: true,
                message: 'Category grade updated successfully',
                gradeId: existingGrades[0].id
            });
        } else {
            // Insert new grade
            const result = await db.query(`
                INSERT INTO grades (student_id, assessment_id, earned_marks, status, submitted_date, created_at)
                VALUES (?, ?, ?, 'completed', NOW(), NOW())
            `, [student_id, assessment_id, earned_marks]);

            sendJSON(res, 201, {
                success: true,
                message: 'Category grade created successfully',
                gradeId: result.insertId
            });
        }
    } catch (error) {
        console.error('Error saving category grade:', error);
        sendJSON(res, 500, { error: 'Failed to save category grade: ' + error.message });
    }
}

// Get course final grade for a student (weighted average of categories)
async function getCourseFinalGrade(req, res, token, courseId, studentId) {
    const user = verifyToken(token);

    if (!user) {
        sendJSON(res, 401, { error: 'Invalid token' });
        return;
    }

    try {
        // Verify access (instructor or student viewing own grade)
        if (user.role === 'student' && user.id !== parseInt(studentId)) {
            sendJSON(res, 403, { error: 'You can only view your own grades' });
            return;
        }

        // Calculate weighted average from category grades
        const result = await db.query(`
            SELECT
                SUM(CASE WHEN g.earned_marks IS NOT NULL THEN (g.earned_marks / a.total_marks * 100) * ac.weight ELSE 0 END) /
                NULLIF(SUM(CASE WHEN g.earned_marks IS NOT NULL THEN ac.weight ELSE 0 END), 0) as final_grade,
                COUNT(CASE WHEN g.earned_marks IS NOT NULL THEN 1 END) as completed_categories,
                COUNT(ac.id) as total_categories
            FROM assessment_categories ac
                     LEFT JOIN assessments a ON ac.id = a.category_id AND a.course_id = ?
                     LEFT JOIN grades g ON a.id = g.assessment_id AND g.student_id = ?
            WHERE ac.course_id = ?
        `, [courseId, studentId, courseId]);

        const finalGrade = result[0]?.final_grade ? parseFloat(result[0].final_grade).toFixed(1) : null;
        const completedCategories = result[0]?.completed_categories || 0;
        const totalCategories = result[0]?.total_categories || 0;

        sendJSON(res, 200, {
            final_grade: finalGrade,
            completed_categories: completedCategories,
            total_categories: totalCategories,
            status: completedCategories === totalCategories ? 'complete' : 'in_progress'
        });
    } catch (error) {
        console.error('Error calculating final grade:', error);
        sendJSON(res, 500, { error: 'Failed to calculate final grade' });
    }
}

// Delete a grade (instructor only)
async function deleteGrade(req, res, token, gradeId) {
    const user = verifyToken(token);

    if (!user || user.role !== 'instructor') {
        sendJSON(res, 403, { error: 'Only instructors can delete grades' });
        return;
    }

    try {
        const grades = await db.query(`
            SELECT g.*, a.course_id, c.instructor_id
            FROM grades g
                     JOIN assessments a ON g.assessment_id = a.id
                     JOIN courses c ON a.course_id = c.id
            WHERE g.id = ?
        `, [gradeId]);

        if (!grades || grades.length === 0) {
            sendJSON(res, 404, { error: 'Grade not found' });
            return;
        }

        if (grades[0].instructor_id !== user.id) {
            sendJSON(res, 403, { error: 'You can only delete grades for your own courses' });
            return;
        }

        await db.query('DELETE FROM grades WHERE id = ?', [gradeId]);

        sendJSON(res, 200, {
            success: true,
            message: 'Grade deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting grade:', error);
        sendJSON(res, 500, { error: 'Failed to delete grade' });
    }
}
// Export grades as CSV for a course (instructor only)
async function exportGradesAsCSV(req, res, token, courseId) {
    const user = verifyToken(token);

    if (!user || user.role !== 'instructor') {
        sendJSON(res, 403, { error: 'Only instructors can export grades' });
        return;
    }

    try {
        // Verify course belongs to instructor
        const course = await Course.findById(courseId);
        if (!course || course.instructor_id !== user.id) {
            sendJSON(res, 403, { error: 'You can only export grades for your own courses' });
            return;
        }

        // Fetch all grades for this course with full details
        const grades = await db.query(`
            SELECT 
                u.display_name as student_name,
                u.email as student_email,
                u.student_id,
                ac.category_name,
                ac.weight as category_weight,
                a.name as assessment_name,
                g.earned_marks,
                a.total_marks,
                g.status,
                g.feedback,
                g.submitted_date
            FROM grades g
            JOIN users u ON g.student_id = u.id
            JOIN assessments a ON g.assessment_id = a.id
            LEFT JOIN assessment_categories ac ON a.category_id = ac.id
            WHERE a.course_id = ?
            ORDER BY u.last_name, ac.category_name, a.name
        `, [courseId]);

        if (!grades || grades.length === 0) {
            sendJSON(res, 404, { error: 'No grades found for this course' });
            return;
        }

        // Build CSV content
        const headers = ['Student Name', 'Student Email', 'Student ID', 'Category', 'Category Weight (%)', 'Assessment', 'Earned Marks', 'Total Marks', 'Status', 'Feedback', 'Submitted Date'];
        const rows = grades.map(grade => [
            grade.student_name,
            grade.student_email,
            grade.student_id || '',
            grade.category_name || 'Uncategorized',
            grade.category_weight || '',
            grade.assessment_name,
            grade.earned_marks !== null ? grade.earned_marks : '',
            grade.total_marks,
            grade.status,
            grade.feedback || '',
            grade.submitted_date ? new Date(grade.submitted_date).toISOString().split('T')[0] : ''
        ]);

        // Convert to CSV format
        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => {
                // Escape commas and quotes in cell values
                const str = String(cell);
                if (str.includes(',') || str.includes('"') || str.includes('\n')) {
                    return `"${str.replace(/"/g, '""')}"`;
                }
                return str;
            }).join(','))
        ].join('\n');

        // Set headers for CSV download
        res.writeHead(200, {
            'Content-Type': 'text/csv',
            'Content-Disposition': `attachment; filename="grades-${course.code}-${new Date().toISOString().split('T')[0]}.csv"`
        });
        res.end(csvContent);

    } catch (error) {
        console.error('Error exporting grades:', error);
        sendJSON(res, 500, { error: 'Failed to export grades' });
    }
}

module.exports = {
    getGradesForCourse,
    getGradesForStudent,
    saveGrade,
    saveGradeForCategory,  // NEW: For weighings-only workflow
    getCourseFinalGrade,   // NEW: Calculate final course grade
    deleteGrade,
    exportGradesAsCSV
};