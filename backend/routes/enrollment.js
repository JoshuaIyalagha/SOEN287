const Enrollment = require('../models/Enrollment');

async function enroll(req, res, token, body) {
    const user = verifyToken(token);

    if(!user || user.role !== 'student') {
        sendJSON(res, 403, { error: 'Only students can enroll in courses' });
        return;
    }

    const { studentId, courseId } = body;

    try {
        await Enrollment.enrollStudent(studentId, courseId);
        sendJSON(res, 200, {success: true});
    } catch(err) {
        sendJSON(res, 400, {error: err.message});
    }

}
async function unenroll(req, res, token, body) {
    const user = verifyToken(token);

    if(!user || user.role !== 'student') {
        sendJSON(res, 403, { error: 'Only students can unenroll from courses' });
        return;
    }

    const { studentId, courseId } = body;

    try {
        await Enrollment.unenrollStudent(studentId, courseId);
        sendJSON(res, 200, {sucess: true});
    } catch(err) {
        sendJSON(res, 400, {error: err.message});
    }

}

async function getEnrolledStudents(req, res, token, courseId) {
    const user = verifyToken(token);
    
    if(!user) {
        sendJSON(res, 403, { error: 'Invalid token' });
        return;
    }

    let students;

    try {
        students = Enrollment.getEnrolledStudents(courseId);
    } catch(err) {
        sendJSON(res, 400, { error: err.message });
        return;
    }

    sendJSON(res, 200, { students});
}
async function getEnrolledCourses(req, res, token, studentId) {
    const user = verifyToken(token);
    
    if(!user) {
        sendJSON(res, 403, { error: 'Invalid token' });
        return;
    }

    let courses;

    try {
        courses = await Enrollment.getEnrolledCourses(studentId);
    } catch(err) {
        sendJSON(res, 400, { error: err.message });
        return
    }

    sendJSON(res, 200, { courses });
}

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

module.exports = {enroll, unenroll, getEnrolledCourses, getEnrolledStudents}