/*
Assessments Routes
Written by: Matthew Golovanov. Updated by Joshua Iyalagha 40306001
*/

const Course = require("../models/Course");
const db = require('../config/database');

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

// getting all assessments for a course
async function getAssessments(req, res, token, courseId) {
    const user = verifyToken(token);

    if(!user) {
        sendJSON(res, 403, { error: 'Invalid token' });
        return;
    }

    let assessments;

    try {
        assessments = await Course.getAssessments(courseId);
    }
    catch(err) {
        sendJSON(res, 400, {error: err.message} );
        return;
    }
    sendJSON(res, 200, { assessments });
}

// getting assessment categories for a course
async function getAssessmentCategories(req, res, token, courseId) {
    const user = verifyToken(token);

    if(!user) {
        sendJSON(res, 403, { error: 'Invalid token' });
        return;
    }

    let categories;

    try {
        categories = await Course.getAssessmentCategories(courseId);
    }
    catch(err) {
        sendJSON(res, 400, {error: err.message} );
        return;
    }
    sendJSON(res, 200, { categories });
}

// creating a new assessment (available to instructor only)
async function createAssessment(req, res, token, courseId, body) {
    const user = verifyToken(token);

    if (!user || user.role !== 'instructor') {
        sendJSON(res, 403, { error: 'Only instructors can create assessments' });
        return;
    }
    // DEBUG: Log the received body
    console.log('📝 createAssessment called with body:', body);

    const { name, type, total_marks, due_date, weight, category_id } = body;

    if (!name || !type || !total_marks) {
        sendJSON(res, 400, { error: 'Name, type, and total marks are required' });
        return;
    }

    // Require category_id to ensure assessments belong to a defined weighing category
    if (!category_id) {
        sendJSON(res, 400, { error: 'Category is required. Please define assessment weighings first.' });
        return;
    }

    try {
        // verifying a course belongs to instructor
        const course = await Course.findById(courseId);
        if (!course || course.instructor_id !== user.id) {
            sendJSON(res, 403, { error: 'You can only create assessments for your own courses' });
            return;
        }

        // changing db.execute() to db.query() to resolve issue. might undo if it breaks something @REVIEW
        const result = await db.query(`
            INSERT INTO assessments (course_id, category_id, name, type, total_marks, due_date, weight, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
        `, [courseId, category_id, name, type, total_marks, due_date || null, weight || null]);

        sendJSON(res, 201, {
            success: true,
            message: 'Assessment created successfully',
            assessmentId: result.insertId
        });
    } catch (error) {
        console.error('Error creating assessment:', error);
        sendJSON(res, 500, { error: 'Failed to create assessment' });
    }
}

// updating an assessment (for instructor only)
async function updateAssessment(req, res, token, assessmentId, body) {
    const user = verifyToken(token);

    if (!user || user.role !== 'instructor') {
        sendJSON(res, 403, { error: 'Only instructors can update assessments' });
        return;
    }

    const { name, type, total_marks, due_date, weight, category_id } = body;

    try {
        // verifying that an assessment belongs to instructor's course
        const [assessments] = await db.query(`
            SELECT a.*, c.instructor_id
            FROM assessments a
                     JOIN courses c ON a.course_id = c.id
            WHERE a.id = ?
        `, [assessmentId]);

        if (!assessments || assessments.length === 0) {
            sendJSON(res, 404, { error: 'Assessment not found' });
            return;
        }

        if (assessments[0].instructor_id !== user.id) {
            sendJSON(res, 403, { error: 'You can only update assessments for your own courses' });
            return;
        }

        //Changed db.execute() to db.query()
        await db.query(`
            UPDATE assessments
            SET name = ?, type = ?, total_marks = ?, due_date = ?, weight = ?, category_id = ?
            WHERE id = ?
        `, [name, type, total_marks, due_date, weight, category_id, assessmentId]);

        sendJSON(res, 200, {
            success: true,
            message: 'Assessment updated successfully'
        });
    } catch (error) {
        console.error('Error updating assessment:', error);
        sendJSON(res, 500, { error: 'Failed to update assessment' });
    }
}

// deleting an assessment (for instructor only)
async function deleteAssessment(req, res, token, assessmentId) {
    const user = verifyToken(token);

    if (!user || user.role !== 'instructor') {
        sendJSON(res, 403, { error: 'Only instructors can delete assessments' });
        return;
    }

    try {
        // verifying an assessment belongs to instructor's course
        const [assessments] = await db.query(`
            SELECT a.*, c.instructor_id
            FROM assessments a
                     JOIN courses c ON a.course_id = c.id
            WHERE a.id = ?
        `, [assessmentId]);

        if (!assessments || assessments.length === 0) {
            sendJSON(res, 404, { error: 'Assessment not found' });
            return;
        }

        if (assessments[0].instructor_id !== user.id) {
            sendJSON(res, 403, { error: 'You can only delete assessments for your own courses' });
            return;
        }

        // Changed db.execute() to db.query()
        await db.query('DELETE FROM assessments WHERE id = ?', [assessmentId]);

        sendJSON(res, 200, {
            success: true,
            message: 'Assessment deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting assessment:', error);
        sendJSON(res, 500, { error: 'Failed to delete assessment' });
    }
}

module.exports = {
    getAssessments,
    getAssessmentCategories,
    createAssessment,
    updateAssessment,
    deleteAssessment
};