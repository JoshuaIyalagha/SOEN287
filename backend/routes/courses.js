/*
Written by: Joshua Iyalagha 40306001
 */
// backend/routes/courses.js

const fs = require('fs');
const path = require('path');

const COURSES_FILE = path.join(__dirname, '..', 'data', 'courses.json');
const USERS_FILE = path.join(__dirname, '..', 'data', 'users.json');

function readCourses() {
    const data = fs.readFileSync(COURSES_FILE, 'utf8');
    return JSON.parse(data);
}

function writeCourses(data) {
    fs.writeFileSync(COURSES_FILE, JSON.stringify(data, null, 2));
}

function verifyToken(token) {
    try {
        const decoded = Buffer.from(token, 'base64').toString();
        return JSON.parse(decoded);
    } catch (error) {
        return null;
    }
}

function getCourses(req, res, token) {
    const user = verifyToken(token);

    if (!user) {
        sendJSON(res, 401, { error: 'Invalid token' });
        return;
    }

    const coursesData = readCourses();

    // if the user is an instructor, return all courses they teach
    // if the user is a student, return only courses they're enrolled in (simplified - just return all for now)
    let courses = coursesData.courses;

    if (user.role === 'instructor') {
        courses = coursesData.courses.filter(c => c.instructorId === user.id);
    }

    sendJSON(res, 200, { courses });
}

function createCourse(req, res, token, body) {
    const user = verifyToken(token);

    if (!user || user.role !== 'instructor') {
        sendJSON(res, 403, { error: 'Only instructors can create courses' });
        return;
    }

    const { courseCode, courseName, term, description, assessmentCategories, createTemplate, templateName } = body;

    if (!courseCode || !courseName || !term) {
        sendJSON(res, 400, { error: 'Course code, name, and term are required' });
        return;
    }

    // Validate total weight = 100%
    let totalWeight = 0;
    if (assessmentCategories) {
        totalWeight = assessmentCategories.reduce((sum, cat) => sum + cat.weight, 0);
        if (totalWeight !== 100) {
            sendJSON(res, 400, { error: 'Total weight must equal 100%' });
            return;
        }
    }

    const coursesData = readCourses();

    // generating the new course ID
    const newId = coursesData.courses.length > 0
        ? Math.max(...coursesData.courses.map(c => c.id)) + 1
        : 1;

    const newCourse = {
        id: newId,
        code: courseCode,
        name: courseName,
        instructor: user.name,
        instructorId: user.id,
        term: term,
        enabled: true,
        students: 0,
        description: description || '',
        assessmentCategories: assessmentCategories || []
    };

    coursesData.courses.push(newCourse);
    writeCourses(coursesData);

    // saving as template if requested
    if (createTemplate && assessmentCategories) {
        const templatesData = readTemplates();
        const newTemplateId = templatesData.templates.length > 0
            ? Math.max(...templatesData.templates.map(t => t.id)) + 1
            : 101;

        const newTemplate = {
            id: newTemplateId,
            name: templateName || `${courseCode} Template`,
            description: `Template for ${courseName}`,
            categories: assessmentCategories.map(cat => ({
                category: cat.category,
                weight: cat.weight,
                count: cat.count
            }))
        };

        templatesData.templates.push(newTemplate);
        writeTemplates(templatesData);
    }

    sendJSON(res, 201, {
        success: true,
        message: 'Course created successfully',
        course: newCourse
    });
}

function updateCourse(req, res, token, courseId, body) {
    const user = verifyToken(token);

    if (!user || user.role !== 'instructor') {
        sendJSON(res, 403, { error: 'Only instructors can update courses' });
        return;
    }

    const coursesData = readCourses();
    const courseIndex = coursesData.courses.findIndex(c => c.id === courseId);

    if (courseIndex === -1) {
        sendJSON(res, 404, { error: 'Course not found' });
        return;
    }

    const course = coursesData.courses[courseIndex];

    // verfiying if the instructor owns this course
    if (course.instructorId !== user.id) {
        sendJSON(res, 403, { error: 'You can only update your own courses' });
        return;
    }

    // updating the course fields
    Object.assign(course, body);

    writeCourses(coursesData);

    sendJSON(res, 200, {
        success: true,
        message: 'Course updated successfully',
        course
    });
}

function exportCourses(req, res, token) {
    const user = verifyToken(token);

    if (!user || user.role !== 'instructor') {
        sendJSON(res, 403, { error: 'Only instructors can export courses' });
        return;
    }

    const coursesData = readCourses();
    const instructorCourses = coursesData.courses.filter(c => c.instructorId === user.id);

    res.writeHead(200, {
        'Content-Type': 'application/json',
        'Content-Disposition': 'attachment; filename="courses-export.json"'
    });
    res.end(JSON.stringify(instructorCourses, null, 2));
}

function readTemplates() {
    const templatesFile = path.join(__dirname, '..', 'data', 'templates.json');
    const data = fs.readFileSync(templatesFile, 'utf8');
    return JSON.parse(data);
}

function writeTemplates(data) {
    const templatesFile = path.join(__dirname, '..', 'data', 'templates.json');
    fs.writeFileSync(templatesFile, JSON.stringify(data, null, 2));
}

function sendJSON(res, statusCode, data) {
    res.writeHead(statusCode, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data));
}

module.exports = { getCourses, createCourse, updateCourse, exportCourses };