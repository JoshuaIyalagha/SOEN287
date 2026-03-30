// backend/export-demo-data.js
const db = require('./config/database');

async function exportDemoData() {
    try {
        await db.initializeDatabase();

        console.log('/* Demo Data Export for Smart Course Companion */');
        console.log('/* Run this SQL after creating the database schema */\n');

        // Export demo users
        const users = await db.query('SELECT * FROM users WHERE email IN (?, ?)',
            ['instructor@test.com', 'student@test.com']);

        console.log('-- Demo Users');
        users.forEach(user => {
            console.log(`INSERT INTO users (id, email, password, passwordHash, salt, role, first_name, last_name, display_name, title, department, office, phone, bio, student_id, program, year, theme, email_notifications, submission_reminders, created_at, last_login) VALUES
    (${user.id}, '${user.email}', '${user.password}', '${user.passwordHash || ''}', '${user.salt || ''}', '${user.role}', '${user.first_name || ''}', '${user.last_name || ''}', '${user.display_name || ''}', '${user.title || ''}', '${user.department || ''}', '${user.office || ''}', '${user.phone || ''}', '${user.bio?.replace(/'/g, "''") || ''}', '${user.student_id || ''}', '${user.program || ''}', ${user.year || 'NULL'}, '${user.theme}', ${user.email_notifications}, ${user.submission_reminders}, '${user.created_at}', ${user.last_login ? `'${user.last_login}'` : 'NULL'});`);
        });
        console.log('');

        // Export demo courses
        const courses = await db.query('SELECT * FROM courses WHERE instructor_id = 1 LIMIT 4');
        console.log('-- Demo Courses');
        courses.forEach(course => {
            console.log(`INSERT INTO courses (id, code, name, description, instructor_id, term, enabled, students_count, created_at, updated_at) VALUES
    (${course.id}, '${course.code}', '${course.name}', '${course.description?.replace(/'/g, "''") || ''}', ${course.instructor_id}, '${course.term}', ${course.enabled}, ${course.students_count}, '${course.created_at}', '${course.updated_at}');`);
        });
        console.log('');

        // Export demo templates
        const templates = await db.query('SELECT * FROM templates WHERE instructor_id = 1');
        console.log('-- Demo Templates');
        templates.forEach(template => {
            console.log(`INSERT INTO templates (id, name, description, instructor_id, created_at) VALUES
    (${template.id}, '${template.name}', '${template.description?.replace(/'/g, "''") || ''}', ${template.instructor_id}, '${template.created_at}');`);
        });
        console.log('');

        // Export template categories
        const templateCats = await db.query(`
            SELECT tc.*, t.name as template_name 
            FROM template_categories tc 
            JOIN templates t ON tc.template_id = t.id 
            WHERE t.instructor_id = 1
        `);
        console.log('-- Template Categories');
        templateCats.forEach(cat => {
            console.log(`INSERT INTO template_categories (id, template_id, category_name, weight, assessment_count) VALUES
    (${cat.id}, ${cat.template_id}, '${cat.category_name}', ${cat.weight}, ${cat.assessment_count});`);
        });

        console.log('\n/* End of demo data export */');

    } catch (error) {
        console.error('Export failed:', error);
    } finally {
        process.exit(0);
    }
}

exportDemoData();