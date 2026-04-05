/*
Written by Joshua Iyalagha 40306001
*/

const User = require('../models/User');
const Course = require('../models/Course');
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

// Getting instructor dashboard data
async function getDashboard(req, res, token) {
    const user = verifyToken(token);

    if (!user || user.role !== 'instructor') {
        sendJSON(res, 401, { error: 'Unauthorized' });
        return;
    }

    try {
        const courses = await Course.findAll(user.id);

        const activeCourses = courses ? courses.filter(c => c.enabled).length : 0;

        let totalStudents = 0;
        if (courses && courses.length > 0) {
            for (const course of courses) {
                const result = await db.query(
                    'SELECT COUNT(*) as count FROM enrollments WHERE course_id = ?',
                    [course.id]
                );
                totalStudents += result[0]?.count || 0;
            }
        }

        let pendingSubmissions = 0;
        try {
            const pendingResult = await db.query(`
                SELECT COUNT(*) as count FROM grades g
                    JOIN assessments a ON g.assessment_id = a.id
                    JOIN courses c ON a.course_id = c.id
                WHERE c.instructor_id = ? AND (g.status = 'pending' OR g.status IS NULL)
            `, [user.id]);

            pendingSubmissions = pendingResult?.[0]?.count || 0;
        } catch (err) {
            console.log('No pending grades found (this is OK)');
            pendingSubmissions = 0;
        }

        let recentSubmissions = [];
        try {
            recentSubmissions = await db.query(`
                SELECT g.*, a.name as assessment_name, c.code as course_code,
                       u.display_name as student_name, u.email as student_email
                FROM grades g
                         JOIN assessments a ON g.assessment_id = a.id
                         JOIN courses c ON a.course_id = c.id
                         JOIN users u ON g.student_id = u.id
                WHERE c.instructor_id = ?
                ORDER BY g.updated_at DESC
                    LIMIT 10
            `, [user.id]);
        } catch (err) {
            console.log('No recent submissions found (this is OK)');
            recentSubmissions = [];
        }

        sendJSON(res, 200, {
            profile: {
                name: user.name,
                email: user.email
            },
            stats: {
                activeCourses,
                totalStudents,
                pendingSubmissions
            },
            courses: courses || [],
            recentSubmissions
        });
    } catch (error) {
        console.error('Error loading dashboard:', error);
        sendJSON(res, 500, { error: 'Failed to load dashboard data' });
    }
}

// Creating a new course
async function createCourse(req, res, token, body) {
    const user = verifyToken(token);

    if (!user || user.role !== 'instructor') {
        sendJSON(res, 401, { error: 'Unauthorized' });
        return;
    }

    const { courseCode, courseName, term, description, assessmentCategories, createTemplate, templateName } = body;

    if (!courseCode || !courseName || !term) {
        sendJSON(res, 400, { error: 'Course code, name, and term are required' });
        return;
    }

    let totalWeight = 0;
    if (assessmentCategories) {
        totalWeight = assessmentCategories.reduce((sum, cat) => sum + cat.weight, 0);
        if (Math.abs(totalWeight - 100) > 0.1) {
            sendJSON(res, 400, { error: 'Total weight must equal 100%' });
            return;
        }
    }

    try {
        const courseId = await Course.create({
            code: courseCode,
            name: courseName,
            description: description || '',
            instructor_id: user.id,
            term: term,
            enabled: true,
            assessmentCategories: assessmentCategories || []
        });

        if (createTemplate && assessmentCategories && assessmentCategories.length > 0) {
            const templateNameValue = templateName || `${courseCode} Template`;

            await db.transaction(async (connection) => {
                const [templateResult] = await connection.execute(
                    'INSERT INTO templates (name, description, instructor_id) VALUES (?, ?, ?)',
                    [templateNameValue, `Template for ${courseName}`, user.id]
                );
                const templateId = templateResult.insertId;

                if (assessmentCategories.length > 0) {
                    for (const cat of assessmentCategories) {
                        await connection.execute(
                            'INSERT INTO template_categories (template_id, category_name, weight, assessment_count) VALUES (?, ?, ?, ?)',
                            [templateId, cat.category, cat.weight, cat.count || 1]
                        );
                    }
                }
            });
        }

        sendJSON(res, 201, {
            success: true,
            message: 'Course created successfully',
            courseId
        });
    } catch (error) {
        console.error('Error creating course:', error);
        sendJSON(res, 500, { error: 'Failed to create course' });
    }
}

// Updating a course
async function updateCourse(req, res, token, courseId, body) {
    const user = verifyToken(token);

    if (!user || user.role !== 'instructor') {
        sendJSON(res, 401, { error: 'Unauthorized' });
        return;
    }

    try {
        const course = await Course.findById(courseId);

        if (!course) {
            sendJSON(res, 404, { error: 'Course not found' });
            return;
        }

        if (course.instructor_id !== user.id) {
            sendJSON(res, 403, { error: 'You can only update your own courses' });
            return;
        }

        const updated = await Course.update(courseId, body);

        if (updated) {
            sendJSON(res, 200, {
                success: true,
                message: 'Course updated successfully'
            });
        } else {
            sendJSON(res, 404, { error: 'Course not found' });
        }
    } catch (error) {
        console.error('Error updating course:', error);
        sendJSON(res, 500, { error: 'Failed to update course' });
    }
}

// Update assessment weighings for a course
async function updateCourseWeighings(req, res, token, courseId, body) {
    const user = verifyToken(token);

    if (!user || user.role !== 'instructor') {
        sendJSON(res, 401, { error: 'Unauthorized' });
        return;
    }

    const { assessmentCategories } = body;

    if (!assessmentCategories || !Array.isArray(assessmentCategories)) {
        sendJSON(res, 400, { error: 'Assessment categories array is required' });
        return;
    }

    const totalWeight = assessmentCategories.reduce((sum, cat) => sum + (cat.weight || 0), 0);
    if (Math.abs(totalWeight - 100) > 0.1) {
        sendJSON(res, 400, { error: 'Total weight must equal 100%' });
        return;
    }

    try {
        const course = await Course.findById(courseId);
        if (!course || course.instructor_id !== user.id) {
            sendJSON(res, 403, { error: 'You can only update your own courses' });
            return;
        }

        await db.transaction(async (connection) => {
            await connection.execute(
                'DELETE FROM assessment_categories WHERE course_id = ?',
                [courseId]
            );

            if (assessmentCategories.length > 0) {
                for (const cat of assessmentCategories) {
                    await connection.execute(
                        'INSERT INTO assessment_categories (course_id, category_name, weight, assessment_count) VALUES (?, ?, ?, ?)',
                        [courseId, cat.category, cat.weight, cat.count || 1]
                    );
                }
            }
        });

        sendJSON(res, 200, {
            success: true,
            message: 'Assessment weighings updated successfully'
        });
    } catch (error) {
        console.error('Error updating course weighings:', error);
        sendJSON(res, 500, { error: 'Failed to update assessment weighings' });
    }
}

// Delete course
async function deleteCourse(req, res, token, courseId) {
    const user = verifyToken(token);

    if (!user || user.role !== 'instructor') {
        sendJSON(res, 401, { error: 'Unauthorized' });
        return;
    }

    try {
        const course = await Course.findById(courseId);

        if (!course) {
            sendJSON(res, 404, { error: 'Course not found' });
            return;
        }

        if (course.instructor_id !== user.id) {
            sendJSON(res, 403, { error: 'You can only delete your own courses' });
            return;
        }

        const deleted = await Course.delete(courseId, user.id);

        if (deleted) {
            sendJSON(res, 200, {
                success: true,
                message: `Course ${course.code} deleted successfully`
            });
        } else {
            sendJSON(res, 400, { error: 'Cannot delete course with enrolled students' });
        }
    } catch (error) {
        console.error('Error deleting course:', error);
        sendJSON(res, 500, { error: error.message || 'Failed to delete course' });
    }
}

// Getting templates
async function getTemplates(req, res, token) {
    const user = verifyToken(token);

    if (!user) {
        sendJSON(res, 401, { error: 'Unauthorized' });
        return;
    }

    try {
        const templates = await db.query(`
            SELECT t.*,
                   JSON_ARRAYAGG(
                           JSON_OBJECT('category', tc.category_name, 'weight', tc.weight, 'count', tc.assessment_count)
                   ) as categories
            FROM templates t
                     LEFT JOIN template_categories tc ON t.id = tc.template_id
            WHERE t.instructor_id = ?
            GROUP BY t.id
            ORDER BY t.created_at DESC
        `, [user.id]);

        templates.forEach(t => {
            if (t.categories) {
                if (Array.isArray(t.categories)) {
                    // Already an array (MySQL driver parsed it)
                    t.categories = t.categories.filter(c => c.category !== null);
                } else if (typeof t.categories === 'string') {
                    // It's a string, parse it
                    try {
                        t.categories = JSON.parse(t.categories);
                        t.categories = t.categories.filter(c => c.category !== null);
                    } catch (e) {
                        console.error('Error parsing categories:', e);
                        t.categories = [];
                    }
                } else {
                    // Unexpected format
                    t.categories = [];
                }
            } else {
                t.categories = [];
            }
        });

        sendJSON(res, 200, { templates });
    } catch (error) {
        console.error('Error loading templates:', error);
        sendJSON(res, 500, { error: 'Failed to load templates' });
    }
}

// Creating a template
async function createTemplate(req, res, token, body) {
    const user = verifyToken(token);

    if (!user || user.role !== 'instructor') {
        sendJSON(res, 401, { error: 'Unauthorized' });
        return;
    }

    const { name, description, categories } = body;

    if (!name) {
        sendJSON(res, 400, { error: 'Template name is required' });
        return;
    }

    try {
        const templateId = await db.transaction(async (connection) => {
            const [result] = await connection.execute(
                'INSERT INTO templates (name, description, instructor_id) VALUES (?, ?, ?)',
                [name, description || '', user.id]
            );

            const newTemplateId = result.insertId;

            if (categories && Array.isArray(categories) && categories.length > 0) {
                for (const cat of categories) {
                    await connection.execute(
                        'INSERT INTO template_categories (template_id, category_name, weight, assessment_count) VALUES (?, ?, ?, ?)',
                        [newTemplateId, cat.category || cat.name, cat.weight, cat.count || 1]
                    );
                }
            }

            return newTemplateId;
        });

        sendJSON(res, 201, {
            success: true,
            message: 'Template created successfully',
            templateId
        });
    } catch (error) {
        console.error('Error creating template:', error);
        sendJSON(res, 500, { error: 'Failed to create template: ' + error.message });
    }
}

// Deleting a template
async function deleteTemplate(req, res, token, templateId) {
    const user = verifyToken(token);

    if (!user || user.role !== 'instructor') {
        sendJSON(res, 401, { error: 'Unauthorized' });
        return;
    }

    try {
        const result = await db.query(
            'DELETE FROM templates WHERE id = ? AND instructor_id = ?',
            [templateId, user.id]
        );

        if (result.affectedRows > 0) {
            sendJSON(res, 200, {
                success: true,
                message: 'Template deleted successfully'
            });
        } else {
            sendJSON(res, 404, { error: 'Template not found' });
        }
    } catch (error) {
        console.error('Error deleting template:', error);
        sendJSON(res, 500, { error: 'Failed to delete template' });
    }
}

// Getting statistics
async function getStatistics(req, res, token, courseFilter) {
    const user = verifyToken(token);

    if (!user || user.role !== 'instructor') {
        sendJSON(res, 401, { error: 'Unauthorized' });
        return;
    }

    try {
        let courseCondition = '';
        let params = [user.id];

        if (courseFilter && courseFilter !== 'all') {
            courseCondition = 'AND c.code = ?';
            params.push(courseFilter);
        }

        const completionRates = await db.query(`
            SELECT c.code as course, a.name as assessment,
                   COUNT(CASE WHEN g.status = 'completed' THEN 1 END) as completed,
                   COUNT(e.student_id) as total
            FROM courses c
                     JOIN assessments a ON c.id = a.course_id
                     LEFT JOIN enrollments e ON c.id = e.course_id
                     LEFT JOIN grades g ON a.id = g.assessment_id AND g.student_id = e.student_id
            WHERE c.instructor_id = ? ${courseCondition}
            GROUP BY c.id, a.id
        `, params);

        const averageGrades = await db.query(`
            SELECT c.code as course,
                   AVG(CASE WHEN g.status = 'completed' THEN (g.earned_marks / a.total_marks) * 100 END) as average
            FROM courses c
                     JOIN assessments a ON c.id = a.course_id
                     LEFT JOIN grades g ON a.id = g.assessment_id
            WHERE c.instructor_id = ? AND g.status = 'completed' ${courseCondition}
            GROUP BY c.id
        `, params);

        const submissionsTimeline = await db.query(`
            SELECT DATE(g.submitted_date) as date, COUNT(*) as count
            FROM grades g
                JOIN assessments a ON g.assessment_id = a.id
                JOIN courses c ON a.course_id = c.id
            WHERE c.instructor_id = ? AND g.submitted_date IS NOT NULL
            GROUP BY DATE(g.submitted_date)
            ORDER BY date DESC
                LIMIT 30
        `, [user.id]);

        sendJSON(res, 200, {
            completionRates,
            averageGrades,
            submissionsTimeline
        });
    } catch (error) {
        console.error('Error loading statistics:', error);
        sendJSON(res, 500, { error: 'Failed to load statistics' });
    }
}

// Get completion rates for a specific course or all courses
async function getCompletionRates(req, res, token, courseFilter) {
    const user = verifyToken(token);

    if (!user || user.role !== 'instructor') {
        sendJSON(res, 401, { error: 'Unauthorized' });
        return;
    }

    try {
        let courseCondition = '';
        let params = [user.id];

        if (courseFilter && courseFilter !== 'all') {
            courseCondition = 'AND c.code = ?';
            params.push(courseFilter);
        }

        const completionRates = await db.query(`
            SELECT
                c.code as course,
                c.name as courseName,
                a.name as assessment,
                COUNT(CASE WHEN g.status = 'completed' THEN 1 END) as completed,
                COUNT(DISTINCT e.student_id) as total
            FROM courses c
                     JOIN assessments a ON c.id = a.course_id
                     LEFT JOIN enrollments e ON c.id = e.course_id
                     LEFT JOIN grades g ON a.id = g.assessment_id AND g.student_id = e.student_id
            WHERE c.instructor_id = ? ${courseCondition}
            GROUP BY c.id, a.id
            ORDER BY c.code, a.name
        `, params);

        sendJSON(res, 200, { completionRates });
    } catch (error) {
        console.error('Error loading completion rates:', error);
        sendJSON(res, 500, { error: 'Failed to load completion rates' });
    }
}

// Get average grades for a specific course or all courses
async function getAverageGrades(req, res, token, courseFilter) {
    const user = verifyToken(token);

    if (!user || user.role !== 'instructor') {
        sendJSON(res, 401, { error: 'Unauthorized' });
        return;
    }

    try {
        let courseCondition = '';
        let params = [user.id];

        if (courseFilter && courseFilter !== 'all') {
            courseCondition = 'AND c.code = ?';
            params.push(courseFilter);
        }

        const averageGrades = await db.query(`
            SELECT
                c.code as course,
                c.name as courseName,
                ROUND(AVG(CASE
                              WHEN g.status = 'completed' AND g.earned_marks IS NOT NULL AND a.total_marks > 0
                                  THEN (g.earned_marks / a.total_marks) * 100
                    END), 2) as average
            FROM courses c
                     JOIN assessments a ON c.id = a.course_id
                     LEFT JOIN grades g ON a.id = g.assessment_id
            WHERE c.instructor_id = ? AND g.status = 'completed' ${courseCondition}
            GROUP BY c.id
            HAVING average IS NOT NULL
            ORDER BY c.code
        `, params);

        sendJSON(res, 200, { averageGrades });
    } catch (error) {
        console.error('Error loading average grades:', error);
        sendJSON(res, 500, { error: 'Failed to load average grades' });
    }
}

// Get submissions timeline (last 30 days)
async function getSubmissionsTimeline(req, res, token) {
    const user = verifyToken(token);

    if (!user || user.role !== 'instructor') {
        sendJSON(res, 401, { error: 'Unauthorized' });
        return;
    }

    try {
        const submissionsTimeline = await db.query(`
            SELECT
                DATE(g.submitted_date) as date,
                COUNT(*) as count
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

        sendJSON(res, 200, { submissionsTimeline });
    } catch (error) {
        console.error('Error loading submissions timeline:', error);
        sendJSON(res, 500, { error: 'Failed to load submissions timeline' });
    }
}

// Get a single course by ID (with assessment categories)
async function getCourseById(req, res, token, courseId) {
    const user = verifyToken(token);

    if (!user || user.role !== 'instructor') {
        sendJSON(res, 401, { error: 'Unauthorized' });
        return;
    }

    try {
        const course = await db.query(`
            SELECT
                c.*,
                COUNT(DISTINCT e.student_id) as student_count,
                JSON_ARRAYAGG(
                        JSON_OBJECT('category', ac.category_name, 'weight', ac.weight, 'count', ac.assessment_count)
                ) as assessmentCategories
            FROM courses c
                     LEFT JOIN enrollments e ON c.id = e.course_id
                     LEFT JOIN assessment_categories ac ON c.id = ac.course_id
            WHERE c.id = ? AND c.instructor_id = ?
            GROUP BY c.id
        `, [courseId, user.id]);

        if (!course || course.length === 0) {
            sendJSON(res, 404, { error: 'Course not found' });
            return;
        }

        const result = course[0];

        // Parse assessmentCategories (handle MySQL JSON parsing)
        if (result.assessmentCategories) {
            if (Array.isArray(result.assessmentCategories)) {
                result.assessmentCategories = result.assessmentCategories.filter(cat => cat.category !== null);
            } else if (typeof result.assessmentCategories === 'string') {
                try {
                    result.assessmentCategories = JSON.parse(result.assessmentCategories);
                    result.assessmentCategories = result.assessmentCategories.filter(cat => cat.category !== null);
                } catch (e) {
                    console.error('Error parsing assessment categories:', e);
                    result.assessmentCategories = [];
                }
            } else {
                result.assessmentCategories = [];
            }
        } else {
            result.assessmentCategories = [];
        }

        sendJSON(res, 200, { course: result });
    } catch (error) {
        console.error('Error fetching course:', error);
        sendJSON(res, 500, { error: 'Failed to fetch course' });
    }
}

// getting enrolled students for a specific course for the instructor
async function getEnrolledStudentsForCourse(req, res, token, courseId) {
    const user = verifyToken(token);

    if (!user || user.role !== 'instructor') {
        sendJSON(res, 401, { error: 'Unauthorized' });
        return;
    }

    try {
        // verifying course belongs to instructor
        const course = await Course.findById(courseId);
        if (!course || course.instructor_id !== user.id) {
            sendJSON(res, 403, { error: 'You can only view students in your own courses' });
            return;
        }

        // fetching enrolled students with ONLY safe fields
        const students = await db.query(`
            SELECT
                u.id,
                u.email,
                u.display_name,
                u.first_name,
                u.last_name,
                u.student_id,
                u.program,
                u.year,
                DATE_FORMAT(e.enrolled_at, '%Y-%m-%d') as enrolled_at
            FROM enrollments e
                     JOIN users u ON e.student_id = u.id
            WHERE e.course_id = ? AND u.role = 'student'
            ORDER BY u.last_name, u.first_name
        `, [courseId]);

        sendJSON(res, 200, { students });
    } catch (error) {
        console.error('Error fetching enrolled students:', error);
        sendJSON(res, 500, { error: 'Failed to fetch enrolled students' });
    }
}

// Get all courses for an instructor
async function getCourses(req, res, token) {
    const user = verifyToken(token);

    if (!user || user.role !== 'instructor') {
        sendJSON(res, 401, { error: 'Unauthorized' });
        return;
    }

    try {
        const courses = await db.query(`
            SELECT 
                c.id, c.code, c.name, c.description, c.term, c.enabled,
                c.instructor_id, c.created_at, c.updated_at,
                COUNT(DISTINCT e.student_id) as student_count,
                JSON_ARRAYAGG(
                    JSON_OBJECT('category', ac.category_name, 'weight', ac.weight, 'count', ac.assessment_count)
                ) as assessmentCategories
            FROM courses c
            LEFT JOIN enrollments e ON c.id = e.course_id
            LEFT JOIN assessment_categories ac ON c.id = ac.course_id
            WHERE c.instructor_id = ?
            GROUP BY c.id
            ORDER BY c.created_at DESC
        `, [user.id]);

        // Parse assessmentCategories for each course
        courses.forEach(c => {
            if (c.assessmentCategories) {
                if (Array.isArray(c.assessmentCategories)) {
                    c.assessmentCategories = c.assessmentCategories.filter(cat => cat.category !== null);
                } else if (typeof c.assessmentCategories === 'string') {
                    try {
                        c.assessmentCategories = JSON.parse(c.assessmentCategories);
                        c.assessmentCategories = c.assessmentCategories.filter(cat => cat.category !== null);
                    } catch (e) {
                        console.error('Error parsing assessment categories:', e);
                        c.assessmentCategories = [];
                    }
                } else {
                    c.assessmentCategories = [];
                }
            } else {
                c.assessmentCategories = [];
            }
        });

        sendJSON(res, 200, { courses });
    } catch (error) {
        console.error('Error fetching courses:', error);
        sendJSON(res, 500, { error: 'Failed to fetch courses' });
    }
}

// Get instructor by ID
async function getInstructor(req, res, token, instructorId) {
    try {
        const instructor = await User.findById(instructorId);

        if (!instructor) {
            sendJSON(res, 404, { error: 'Instructor not found' });
            return;
        }

        if (instructor.role !== 'instructor') {
            sendJSON(res, 400, { error: 'User is not an instructor' });
            return;
        }

        // Return only safe public information
        const instructorData = {
            id: instructor.id,
            first_name: instructor.first_name,
            last_name: instructor.last_name,
            display_name: instructor.display_name,
            email: instructor.email,
            title: instructor.title,
            department: instructor.department,
            office: instructor.office,
            phone: instructor.phone,
            bio: instructor.bio,
            profile_image: instructor.profile_image
        };

        sendJSON(res, 200, { instructor: instructorData });
    } catch (error) {
        console.error('Error fetching instructor:', error);
        sendJSON(res, 500, { error: 'Failed to fetch instructor' });
    }
}

module.exports = {
    getDashboard,
    createCourse,
    updateCourse,
    updateCourseWeighings,
    deleteCourse,
    getTemplates,
    createTemplate,
    deleteTemplate,
    getStatistics,
    getCompletionRates,
    getAverageGrades,
    getSubmissionsTimeline,
    getCourses,
    getCourseById,
    getEnrolledStudentsForCourse,
    getInstructor
};