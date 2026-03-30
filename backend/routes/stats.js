/*
    Written by Joshua Iyalagha 40306001
 */
// backend/routes/stats.js
const db = require('../config/database');

function verifyToken(token) {
    try {
        const decoded = Buffer.from(token, 'base64').toString();
        return JSON.parse(decoded);
    } catch (error) {
        return null;
    }
}

function sendJSON(res, statusCode, data) {
    res.writeHead(statusCode, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data));
}

async function getCompletionRates(req, res, token, courseFilter) {
    const user = verifyToken(token);

    if (!user || user.role !== 'instructor') {
        sendJSON(res, 403, { error: 'Only instructors can view statistics' });
        return;
    }

    try {
        // Get courses for this instructor
        let courseQuery = 'SELECT id, code, name FROM courses WHERE instructor_id = ?';
        let courseParams = [user.id];

        if (courseFilter && courseFilter !== 'all') {
            courseQuery += ' AND id = ?';
            courseParams.push(courseFilter);
        }

        const courses = await db.query(courseQuery, courseParams);

        if (courses.length === 0) {
            sendJSON(res, 200, { completionRates: [] });
            return;
        }

        const courseIds = courses.map(c => c.id);

        // Get assessments for these courses
        const assessments = await db.query(
            'SELECT id, name, course_id FROM assessments WHERE course_id IN (?)',
            [courseIds]
        );

        if (assessments.length === 0) {
            sendJSON(res, 200, { completionRates: [] });
            return;
        }

        const assessmentIds = assessments.map(a => a.id);

        // Get completion stats: count of students who submitted vs total enrolled
        const completionData = await db.query(`
            SELECT 
                a.id as assessment_id,
                a.name as assessment_name,
                c.id as course_id,
                c.code as course_code,
                c.name as course_name,
                COUNT(DISTINCT g.student_id) as completed,
                (SELECT COUNT(DISTINCT e.student_id) FROM enrollments e WHERE e.course_id = c.id) as total
            FROM assessments a
            JOIN courses c ON a.course_id = c.id
            LEFT JOIN grades g ON a.id = g.assessment_id AND g.status = 'completed'
            WHERE a.id IN (?)
            GROUP BY a.id
        `, [assessmentIds]);

        const completionRates = completionData.map(row => ({
            course: row.course_code,
            courseName: row.course_name,
            assessment: row.assessment_name,
            completed: row.completed || 0,
            total: row.total || 0
        }));

        sendJSON(res, 200, { completionRates });
    } catch (error) {
        console.error('Error fetching completion rates:', error);
        sendJSON(res, 500, { error: 'Failed to fetch completion rates' });
    }
}

async function getAverageGrades(req, res, token, courseFilter) {
    const user = verifyToken(token);

    if (!user || user.role !== 'instructor') {
        sendJSON(res, 403, { error: 'Only instructors can view statistics' });
        return;
    }

    try {
        // Get courses for this instructor
        let courseQuery = 'SELECT id, code, name FROM courses WHERE instructor_id = ?';
        let courseParams = [user.id];

        if (courseFilter && courseFilter !== 'all') {
            courseQuery += ' AND id = ?';
            courseParams.push(courseFilter);
        }

        const courses = await db.query(courseQuery, courseParams);

        if (courses.length === 0) {
            sendJSON(res, 200, { averageGrades: [] });
            return;
        }

        const courseIds = courses.map(c => c.id);

        // Calculate average grade per course from completed grades
        const gradeData = await db.query(`
            SELECT 
                c.id as course_id,
                c.code as course_code,
                c.name as course_name,
                ROUND(AVG(g.earned_marks), 2) as average
            FROM courses c
            LEFT JOIN assessments a ON c.id = a.course_id
            LEFT JOIN grades g ON a.id = g.assessment_id AND g.status = 'completed' AND g.earned_marks IS NOT NULL
            WHERE c.id IN (?)
            GROUP BY c.id
        `, [courseIds]);

        const averageGrades = gradeData.map(row => ({
            course: row.course_code,
            courseName: row.course_name,
            average: row.average !== null ? parseFloat(row.average) : 0
        }));

        sendJSON(res, 200, { averageGrades });
    } catch (error) {
        console.error('Error fetching average grades:', error);
        sendJSON(res, 500, { error: 'Failed to fetch average grades' });
    }
}

async function getSubmissionsTimeline(req, res, token) {
    const user = verifyToken(token);

    if (!user || user.role !== 'instructor') {
        sendJSON(res, 403, { error: 'Only instructors can view statistics' });
        return;
    }

    try {
        // Get submission counts by date for instructor's courses
        const timelineData = await db.query(`
            SELECT 
                DATE(g.submitted_date) as date,
                COUNT(*) as submissions
            FROM grades g
            JOIN assessments a ON g.assessment_id = a.id
            JOIN courses c ON a.course_id = c.id
            WHERE c.instructor_id = ? 
                AND g.submitted_date IS NOT NULL
                AND g.status = 'completed'
            GROUP BY DATE(g.submitted_date)
            ORDER BY date DESC
            LIMIT 30
        `, [user.id]);

        const submissionsTimeline = timelineData.map(row => ({
            date: row.date,
            count: row.submissions
        }));

        sendJSON(res, 200, { submissionsTimeline });
    } catch (error) {
        console.error('Error fetching submissions timeline:', error);
        sendJSON(res, 500, { error: 'Failed to fetch submissions timeline' });
    }
}

module.exports = { getCompletionRates, getAverageGrades, getSubmissionsTimeline };