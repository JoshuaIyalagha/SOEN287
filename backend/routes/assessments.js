/*
Written by: Matthew Golovanov 40348610
4/3/26
 */
// backend/routes/assessments.js

const Course = require("../models/Course");




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

async function getSubmissionsByStudent(req, res, token, studentId) {

    const user = verifyToken(token);
    
    if(!user) {
        sendJSON(res, 403, { error: 'Invalid token' });
        return;
    }
    
    let submissions;

    try {
        submissions = await Course.getSubmissionsByStudent(studentId);
    }
    catch(err) {
        sendJSON(res, 400, {error: err.message} );
        return;
        
    }
    sendJSON(res, 200, { submissions });

}
async function submitAssessment(req, res, token, body) {
    
    const user = verifyToken(token);

    if(!user) {
        sendJSON(res, 403, { error: 'Invalid token' });
        return;
    }
    const { studentId, assessmentId, submissionData } = body;

    try {
        await Course.submitAssessment(studentId, assessmentId, submissionData);
    }
    catch(err) {
        sendJSON(res, 400, {error: err.message} );
        return;
        
    }
    sendJSON(res, 200, { success: true });
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


module.exports = {getAssessments, getAssessmentCategories, getSubmissionsByStudent, submitAssessment};
