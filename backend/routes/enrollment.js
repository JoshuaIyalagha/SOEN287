const Enrollment = require('../models/Enrollment');

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

async function enroll(req, res, token, body) {
    const user = verifyToken(token);

    if(!user || user.role !== 'student') {
        sendJSON(res, 403, { error: 'Only students can enroll in courses' });
        return;
    }

    const { studentId, courseId } = body;

    if (!studentId || !courseId) {
        sendJSON(res, 400, { error: 'Student ID and Course ID are required' });
        return;
    }

    try {
        await Enrollment.enrollStudent(studentId, courseId);
        sendJSON(res, 200, { success: true, message: 'Successfully enrolled' });
    } catch(err) {
        console.error('Enrollment error:', err);
        sendJSON(res, 400, { error: err.message || 'Failed to enroll' });
    }
}

async function unenroll(req, res, token, body) {
    const user = verifyToken(token);

    if(!user || user.role !== 'student') {
        sendJSON(res, 403, { error: 'Only students can unenroll from courses' });
        return;
    }

    const { studentId, courseId } = body;

    if (!studentId || !courseId) {
        sendJSON(res, 400, { error: 'Student ID and Course ID are required' });
        return;
    }

    try {
        await Enrollment.unenrollStudent(studentId, courseId);
        sendJSON(res, 200, { success: true, message: 'Successfully unenrolled' });
    } catch(err) {
        console.error('Unenrollment error:', err);
        sendJSON(res, 400, { error: err.message || 'Failed to unenroll' });
    }
}

async function getEnrolledStudents(req, res, token, courseId) {
    const user = verifyToken(token);

    if(!user) {
        sendJSON(res, 403, { error: 'Invalid token' });
        return;
    }

    if (!courseId) {
        sendJSON(res, 400, { error: 'Course ID is required' });
        return;
    }

    try {
        //adding await to fix parsing issue
        const students = await Enrollment.getEnrolledStudents(courseId);
        sendJSON(res, 200, { students });
    } catch(err) {
        console.error('Error fetching enrolled students:', err);
        sendJSON(res, 400, { error: err.message || 'Failed to fetch students' });
    }
}

async function getEnrolledCourses(req, res, token, studentId) {
    const user = verifyToken(token);

    if(!user) {
        sendJSON(res, 403, { error: 'Invalid token' });
        return;
    }

    if (!studentId) {
        sendJSON(res, 400, { error: 'Student ID is required' });
        return;
    }

    try {
        const courses = await Enrollment.getEnrolledCourses(studentId);
        sendJSON(res, 200, { courses });
    } catch(err) {
        console.error('Error fetching enrolled courses:', err);
        sendJSON(res, 400, { error: err.message || 'Failed to fetch courses' });
        return;
    }
}

module.exports = { enroll, unenroll, getEnrolledCourses, getEnrolledStudents };