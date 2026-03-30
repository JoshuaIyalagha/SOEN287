✅ MySQL database connected successfully
/* Demo Data Export for Smart Course Companion */
/* Run this SQL after creating the database schema */

-- Demo Users
INSERT INTO users (id, email, password, passwordHash, salt, role, first_name, last_name, display_name, title, department, office, phone, bio, student_id, program, year, theme, email_notifications, submission_reminders, created_at, last_login) VALUES
    (1, 'instructor@test.com', 'instructor-password', 'e3a136b1fb3ec8bbe91774c45ed281a5871c809664429c20f804d9f4ebad1112be0744a5f93b1d98b5da6743c974667aa14c9e74698fd48047c40f663600d081', 'a3f8b2c1d4e5f6a7b8c9d0e1f2a3b4c5', 'instructor', 'Sarah', 'Johnson', 'Dr. Sarah Johnson', 'Professor', 'Computer Science', 'EV 3.309', '', 'PhD in Computer Science from McGill University. Research interests in Web Technologies and Software Engineering.', '', '', NULL, 'light', 1, 1, 'Sun Mar 29 2026 13:27:08 GMT-0400 (Eastern Daylight Saving Time)', 'Sun Mar 29 2026 22:07:48 GMT-0400 (Eastern Daylight Saving Time)');
INSERT INTO users (id, email, password, passwordHash, salt, role, first_name, last_name, display_name, title, department, office, phone, bio, student_id, program, year, theme, email_notifications, submission_reminders, created_at, last_login) VALUES
    (2, 'student@test.com', 'password', 'bad2cd47f8edab4fd8fb2c98ab1ba27d36b973ca0c8128e86f09086d9bdf9df360da24d13df5d00426734dd417d2ab2d02e19c80f449c3cc883b02b24c119b41', 'b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9', 'student', 'John', 'Student', 'John Student', '', '', '', '', '', '12345678', 'Computer Science', 2, 'light', 1, 1, 'Sun Mar 29 2026 13:27:08 GMT-0400 (Eastern Daylight Saving Time)', NULL);

-- Demo Courses
INSERT INTO courses (id, code, name, description, instructor_id, term, enabled, students_count, created_at, updated_at) VALUES
    (1, 'SOEN287', 'Web Programming', 'Introduction to web development with HTML, CSS, and JavaScript', 1, 'Winter 2026', 1, 45, 'Sun Mar 29 2026 13:27:08 GMT-0400 (Eastern Daylight Saving Time)', 'Sun Mar 29 2026 13:27:08 GMT-0400 (Eastern Daylight Saving Time)');
INSERT INTO courses (id, code, name, description, instructor_id, term, enabled, students_count, created_at, updated_at) VALUES
    (2, 'COMP248', 'Object-Oriented Programming', 'Java programming fundamentals and OOP concepts', 1, 'Winter 2026', 1, 62, 'Sun Mar 29 2026 13:27:08 GMT-0400 (Eastern Daylight Saving Time)', 'Sun Mar 29 2026 13:27:08 GMT-0400 (Eastern Daylight Saving Time)');
INSERT INTO courses (id, code, name, description, instructor_id, term, enabled, students_count, created_at, updated_at) VALUES
    (3, 'Test102', 'Testign 123', 'Hi there', 1, 'Winter 2026', 1, 0, 'Sun Mar 29 2026 13:31:34 GMT-0400 (Eastern Daylight Saving Time)', 'Sun Mar 29 2026 13:31:34 GMT-0400 (Eastern Daylight Saving Time)');
INSERT INTO courses (id, code, name, description, instructor_id, term, enabled, students_count, created_at, updated_at) VALUES
    (4, 'SOEN287', 'Web Programming', 'Introduction to web development with HTML, CSS, and JavaScript', 1, 'Winter 2026', 1, 45, 'Sun Mar 29 2026 15:36:09 GMT-0400 (Eastern Daylight Saving Time)', 'Sun Mar 29 2026 15:36:09 GMT-0400 (Eastern Daylight Saving Time)');

-- Demo Templates
INSERT INTO templates (id, name, description, instructor_id, created_at) VALUES
    (1, 'Web Programming Template', 'Standard structure for web courses', 1, 'Sun Mar 29 2026 13:27:08 GMT-0400 (Eastern Daylight Saving Time)');
INSERT INTO templates (id, name, description, instructor_id, created_at) VALUES
    (4, 'Programming Course Template', 'For programming heavy courses', 1, 'Sun Mar 29 2026 15:36:09 GMT-0400 (Eastern Daylight Saving Time)');
INSERT INTO templates (id, name, description, instructor_id, created_at) VALUES
    (5, 'Biggie template', 'hi babe', 1, 'Sun Mar 29 2026 19:40:41 GMT-0400 (Eastern Daylight Saving Time)');
INSERT INTO templates (id, name, description, instructor_id, created_at) VALUES
    (6, 'Goodbye template', 'Template for Saying GoodBye', 1, 'Sun Mar 29 2026 19:55:06 GMT-0400 (Eastern Daylight Saving Time)');
INSERT INTO templates (id, name, description, instructor_id, created_at) VALUES
    (8, 'Biggie template', 'hi babe', 1, 'Sun Mar 29 2026 20:03:25 GMT-0400 (Eastern Daylight Saving Time)');
INSERT INTO templates (id, name, description, instructor_id, created_at) VALUES
    (10, 'WHY203', 'why why why', 1, 'Sun Mar 29 2026 20:25:45 GMT-0400 (Eastern Daylight Saving Time)');
INSERT INTO templates (id, name, description, instructor_id, created_at) VALUES
    (11, 'ciara', 'Template for Ciara Songs', 1, 'Sun Mar 29 2026 20:27:01 GMT-0400 (Eastern Daylight Saving Time)');
INSERT INTO templates (id, name, description, instructor_id, created_at) VALUES
    (12, 'Testing Template', 'Bingo', 1, 'Sun Mar 29 2026 20:29:28 GMT-0400 (Eastern Daylight Saving Time)');

-- Template Categories
INSERT INTO template_categories (id, template_id, category_name, weight, assessment_count) VALUES
    (1, 1, 'Assignments', 40.00, 4);
INSERT INTO template_categories (id, template_id, category_name, weight, assessment_count) VALUES
    (2, 1, 'Exams', 50.00, 2);
INSERT INTO template_categories (id, template_id, category_name, weight, assessment_count) VALUES
    (3, 1, 'Participation', 10.00, 1);
INSERT INTO template_categories (id, template_id, category_name, weight, assessment_count) VALUES
    (8, 1, 'Assignments', 40.00, 4);
INSERT INTO template_categories (id, template_id, category_name, weight, assessment_count) VALUES
    (9, 1, 'Exams', 50.00, 2);
INSERT INTO template_categories (id, template_id, category_name, weight, assessment_count) VALUES
    (10, 1, 'Participation', 10.00, 1);
INSERT INTO template_categories (id, template_id, category_name, weight, assessment_count) VALUES
    (15, 6, 'Final', 100.00, 1);
INSERT INTO template_categories (id, template_id, category_name, weight, assessment_count) VALUES
    (18, 8, 'Final', 60.00, 1);
INSERT INTO template_categories (id, template_id, category_name, weight, assessment_count) VALUES
    (19, 8, 'Test', 30.00, 1);
INSERT INTO template_categories (id, template_id, category_name, weight, assessment_count) VALUES
    (20, 8, 'Assignment', 10.00, 1);
INSERT INTO template_categories (id, template_id, category_name, weight, assessment_count) VALUES
    (27, 10, 'why 1', 30.00, 1);
INSERT INTO template_categories (id, template_id, category_name, weight, assessment_count) VALUES
    (28, 10, 'why 2', 30.00, 1);
INSERT INTO template_categories (id, template_id, category_name, weight, assessment_count) VALUES
    (29, 10, 'why 3', 40.00, 1);
INSERT INTO template_categories (id, template_id, category_name, weight, assessment_count) VALUES
    (30, 11, 'ciara 1', 20.00, 1);
INSERT INTO template_categories (id, template_id, category_name, weight, assessment_count) VALUES
    (31, 11, 'ciara 2', 20.00, 1);
INSERT INTO template_categories (id, template_id, category_name, weight, assessment_count) VALUES
    (32, 11, 'ciara 3', 60.00, 1);
INSERT INTO template_categories (id, template_id, category_name, weight, assessment_count) VALUES
    (33, 12, 'Template 1', 30.00, 1);
INSERT INTO template_categories (id, template_id, category_name, weight, assessment_count) VALUES
    (34, 12, 'Template 2', 70.00, 1);

/* End of demo data export */
