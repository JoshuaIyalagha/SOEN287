/*
Written by Joshua Iyalagha 40306001
 */
const http = require('http');
const url = require('url');
const fs = require('fs');
const path = require('path');
const db = require('./config/database');
const authHandler = require('./routes/auth');
const profileHandler = require('./routes/profile');
const instructorHandler = require('./routes/Instructor');
const enrollmentHandler = require('./routes/enrollment');
const courseHandler = require('./routes/courses');
const assessmentHandler = require('./routes/assessments');

const FRONTEND_DIR = path.join(__dirname, '..', 'frontend');

// initializing database connection
db.initializeDatabase().then(success => {
    if (!success) {
        console.log('⚠️  Database connection failed. Please check your MySQL configuration.');
    }
});

// Helper function to parse JSON body
function parseBody(req) {
    return new Promise((resolve, reject) => {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', () => {
            try {
                resolve(body ? JSON.parse(body) : {});
            } catch (error) {
                reject(error);
            }
        });
    });
}

function sendJSON(res, statusCode, data) {
    res.writeHead(statusCode, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data));
}

function serveStaticFile(res, filePath, contentType) {
    fs.readFile(filePath, (err, data) => {
        if (err) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('File not found');
            return;
        }
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(data);
    });
}

const server = http.createServer(async (req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;
    const method = req.method;

    // enabling CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    // API Routes
    if (pathname.startsWith('/api/')) {
        try {
            const token = req.headers.authorization;

            // Auth routes
            if (pathname === '/api/login' && method === 'POST') {
                const body = await parseBody(req);
                return authHandler.login(req, res, body);
            }

            // Protected routes
            if (!token) {
                return sendJSON(res, 401, { error: 'Unauthorized' });
            }

            // Instructor dashboard
            if (pathname === '/api/instructor/dashboard' && method === 'GET') {
                return instructorHandler.getDashboard(req, res, token);
            }

            // Course routes - SPECIFIC routes first, then generic
            // Get single course by ID (must be before generic /api/courses GET)
            if (pathname.match(/\/api\/courses\/\d+\/weighings$/) && method === 'PUT') {
                const courseId = parseInt(pathname.split('/')[3]);
                const body = await parseBody(req);
                return instructorHandler.updateCourseWeighings(req, res, token, courseId, body);
            }

            if (pathname.match(/\/api\/courses\/\d+$/) && method === 'GET') {
                const courseId = parseInt(pathname.split('/')[3]);
                return instructorHandler.getCourseById(req, res, token, courseId);
            }

            if (pathname === '/api/courses' && method === 'GET') {
                return instructorHandler.getCourses ?
                    instructorHandler.getCourses(req, res, token) :
                    sendJSON(res, 501, { error: 'Not implemented' });
            }

            if (pathname === '/api/courses' && method === 'POST') {
                const body = await parseBody(req);
                return instructorHandler.createCourse(req, res, token, body);
            }

            if (pathname.match(/\/api\/courses\/\d+$/) && method === 'PUT') {
                const courseId = parseInt(pathname.split('/')[3]);
                const body = await parseBody(req);
                return instructorHandler.updateCourse(req, res, token, courseId, body);
            }

            if (pathname.match(/\/api\/courses\/\d+$/) && method === 'DELETE') {
                const courseId = parseInt(pathname.split('/')[3]);
                return instructorHandler.deleteCourse(req, res, token, courseId);
            }

            // Template routes
            if (pathname === '/api/templates' && method === 'GET') {
                return instructorHandler.getTemplates(req, res, token);
            }

            if (pathname === '/api/templates' && method === 'POST') {
                const body = await parseBody(req);
                return instructorHandler.createTemplate(req, res, token, body);
            }

            if (pathname.match(/\/api\/templates\/\d+$/) && method === 'DELETE') {
                const templateId = parseInt(pathname.split('/')[3]);
                return instructorHandler.deleteTemplate(req, res, token, templateId);
            }

            // Statistics routes - handle sub-endpoints for completion, grades, timeline
            if (pathname.startsWith('/api/stats/') && method === 'GET') {
                const course = parsedUrl.query.course;

                // /api/stats/completion
                if (pathname === '/api/stats/completion') {
                    return instructorHandler.getCompletionRates(req, res, token, course);
                }

                // /api/stats/grades
                if (pathname === '/api/stats/grades') {
                    return instructorHandler.getAverageGrades(req, res, token, course);
                }

                // /api/stats/timeline
                if (pathname === '/api/stats/timeline') {
                    return instructorHandler.getSubmissionsTimeline(req, res, token);
                }

                // Fallback for /api/stats (returns all stats)
                if (pathname === '/api/stats') {
                    return instructorHandler.getStatistics(req, res, token, course);
                }

                sendJSON(res, 404, { error: 'Stats endpoint not found' });
                return;
            }

            // Profile routes
            if (pathname === '/api/profile' && method === 'GET') {
                return profileHandler.getProfile(req, res, token);
            }

            if (pathname === '/api/profile' && method === 'PUT') {
                const body = await parseBody(req);
                return profileHandler.updateProfile(req, res, token, body);
            }

            if (pathname === '/api/profile/password' && method === 'PUT') {
                const body = await parseBody(req);
                return profileHandler.changePassword(req, res, token, body);
            }

            // Enrollment routes
            if (pathname === '/api/enrollment' && method === 'POST') {
                const body = await parseBody(req);
                return enrollmentHandler.enroll(req, res, token, body);
            }

            if (pathname === '/api/enrollment' && method === 'DELETE') {
                const body = await parseBody(req);
                return enrollmentHandler.unenroll(req, res, token, body);
            }
            if (pathname.startsWith('/api/enrollment/students/') && method === 'GET') {
                const courseId = parseInt(pathname.split('/')[4]);
                return enrollmentHandler.getEnrolledStudents(req, res, token, courseId);
            }
            if (pathname.startsWith('/api/enrollment/courses/') && method === 'GET') {
                const studentId = parseInt(pathname.split('/')[4]);
                return enrollmentHandler.getEnrolledCourses(req, res, token, studentId);
            }
            if (pathname === '/api/enrollment/catalog' && method === 'GET') {
                return courseHandler.getCourses(req, res, token); 
            }
            //Assessment routes

            if(pathname.startsWith('/api/assessments/categories') && method === 'GET') {
                const courseId = parseInt(pathname.split('/')[4]);
                return assessmentHandler.getAssessmentCategories(req,res,token, courseId);
            }
            if(pathname.startsWith('/api/assessments/') && method === 'GET') {
                const courseId = parseInt(pathname.split('/')[3]);
                return assessmentHandler.getAssessments(req, res, token, courseId);
            }


            sendJSON(res, 404, { error: 'API endpoint not found' });
        } catch (error) {
            console.error('Error:', error);
            sendJSON(res, 500, { error: 'Internal server error' });
        }
        return;
    }

    // serving static files
    let filePath = pathname === '/' ? '/index.html' : pathname;
    filePath = path.join(FRONTEND_DIR, filePath);

    if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
        filePath = path.join(FRONTEND_DIR, 'index.html');
    }

    const ext = path.extname(filePath);
    const contentType = {
        '.html': 'text/html',
        '.css': 'text/css',
        '.js': 'application/javascript',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.gif': 'image/gif',
        '.json': 'application/json'
    }[ext] || 'text/plain';

    serveStaticFile(res, filePath, contentType);
});

const PORT = 3000;
server.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📚 Smart Course Companion Backend`);
    console.log(`\nTest credentials:`);
    console.log(`   Instructor: instructor@test.com / instructor-password`);
    console.log(`   Student: student@test.com / password`);
});