/*M!999999\- enable the sandbox mode */
-- MariaDB dump 10.19-11.8.6-MariaDB, for debian-linux-gnu (x86_64)
--
-- Database: smart_course_companion
-- Schema initially defined by Matthew Golovanov
-- Extensively updated and enhanced by Joshua Iyalagha 40306001 on 2026-04-02, 2026-04-03 and 2026-04-04
-- ------------------------------------------------------

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*M!100616 SET @OLD_NOTE_VERBOSITY=@@NOTE_VERBOSITY, NOTE_VERBOSITY=0 */;

-- =====================================================
-- TABLE DEFINITIONS (Order matters for foreign keys)
-- =====================================================

DROP TABLE IF EXISTS `grades`;
DROP TABLE IF EXISTS `enrollments`;
DROP TABLE IF EXISTS `assessments`;
DROP TABLE IF EXISTS `assessment_categories`;
DROP TABLE IF EXISTS `template_categories`;
DROP TABLE IF EXISTS `templates`;
DROP TABLE IF EXISTS `courses`;
DROP TABLE IF EXISTS `users`;

-- Users table (no foreign keys)
CREATE TABLE `users` (
                         `id` int(11) NOT NULL AUTO_INCREMENT,
                         `email` varchar(255) NOT NULL,
                         `password` varchar(255) NOT NULL,
                         `passwordHash` varchar(255) NOT NULL,
                         `salt` varchar(255) NOT NULL,
                         `role` enum('student','instructor','admin') NOT NULL,
                         `first_name` varchar(255) NOT NULL,
                         `last_name` varchar(255) NOT NULL,
                         `display_name` varchar(255) DEFAULT NULL,
                         `title` varchar(255) DEFAULT NULL,
                         `department` varchar(255) DEFAULT NULL,
                         `office` varchar(255) DEFAULT NULL,
                         `phone` varchar(20) DEFAULT NULL,
                         `bio` text DEFAULT NULL,
                         `student_id` varchar(20) DEFAULT NULL,
                         `program` varchar(255) DEFAULT NULL,
                         `year` int(11) DEFAULT NULL,
                         `theme` varchar(255) DEFAULT NULL,
                         `email_notifications` tinyint(1) DEFAULT 1,
                         `submission_reminders` tinyint(1) DEFAULT 1,
                         `created_at` timestamp NULL DEFAULT current_timestamp(),
                         `last_login` timestamp NULL DEFAULT NULL,
                         PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Courses table (references users)
CREATE TABLE `courses` (
                           `id` int(11) NOT NULL AUTO_INCREMENT,
                           `code` varchar(10) NOT NULL,
                           `name` varchar(255) NOT NULL,
                           `description` text DEFAULT NULL,
                           `instructor_id` int(11) NOT NULL,
                           `term` varchar(100) NOT NULL,
                           `enabled` tinyint(1) DEFAULT 1,
                           `students_count` int(11) DEFAULT 0,
                           `created_at` timestamp NULL DEFAULT current_timestamp(),
                           `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
                           PRIMARY KEY (`id`),
                           CONSTRAINT `courses_ibfk_1` FOREIGN KEY (`instructor_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Assessment categories (references courses)
CREATE TABLE `assessment_categories` (
                                         `id` int(11) NOT NULL AUTO_INCREMENT,
                                         `course_id` int(11) NOT NULL,
                                         `category_name` varchar(255) NOT NULL,
                                         `weight` decimal(5,2) NOT NULL,
                                         `assessment_count` int(11) NOT NULL DEFAULT 0,
                                         PRIMARY KEY (`id`),
                                         CONSTRAINT `assessment_categories_ibfk_1` FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Assessments (references courses and categories)
CREATE TABLE `assessments` (
                               `id` int(11) NOT NULL AUTO_INCREMENT,
                               `course_id` int(11) NOT NULL,
                               `category_id` int(11) DEFAULT NULL,
                               `name` varchar(255) NOT NULL,
                               `type` varchar(100) NOT NULL,
                               `total_marks` int(11) NOT NULL,
                               `due_date` date DEFAULT NULL,
                               `weight` decimal(5,2) DEFAULT NULL,
                               `created_at` timestamp NULL DEFAULT current_timestamp(),
                               PRIMARY KEY (`id`),
                               CONSTRAINT `assessments_ibfk_1` FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`) ON DELETE CASCADE,
                               CONSTRAINT `assessments_ibfk_2` FOREIGN KEY (`category_id`) REFERENCES `assessment_categories` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Enrollments (references users and courses)
CREATE TABLE `enrollments` (
                               `id` int(11) NOT NULL AUTO_INCREMENT,
                               `student_id` int(11) NOT NULL,
                               `course_id` int(11) NOT NULL,
                               `enrolled_at` timestamp NULL DEFAULT current_timestamp(),
                               PRIMARY KEY (`id`),
                               UNIQUE KEY `unique_enrollment` (`student_id`,`course_id`),
                               CONSTRAINT `enrollments_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
                               CONSTRAINT `enrollments_ibfk_2` FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Grades [NEW - WAS MISSING] (references users and assessments)
CREATE TABLE `grades` (
                          `id` int(11) NOT NULL AUTO_INCREMENT,
                          `student_id` int(11) NOT NULL,
                          `assessment_id` int(11) NOT NULL,
                          `earned_marks` decimal(5,2) DEFAULT NULL,
                          `status` enum('pending','completed') DEFAULT 'pending',
                          `feedback` text DEFAULT NULL,
                          `submitted_date` timestamp NULL DEFAULT NULL,
                          `created_at` timestamp NULL DEFAULT current_timestamp(),
                          `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
                          PRIMARY KEY (`id`),
                          UNIQUE KEY `unique_student_assessment` (`student_id`,`assessment_id`),
                          CONSTRAINT `grades_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
                          CONSTRAINT `grades_ibfk_2` FOREIGN KEY (`assessment_id`) REFERENCES `assessments` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Templates (references users)
CREATE TABLE `templates` (
                             `id` int(11) NOT NULL AUTO_INCREMENT,
                             `name` varchar(255) NOT NULL,
                             `description` text DEFAULT NULL,
                             `instructor_id` int(11) NOT NULL,
                             `created_at` timestamp NULL DEFAULT current_timestamp(),
                             PRIMARY KEY (`id`),
                             CONSTRAINT `templates_ibfk_1` FOREIGN KEY (`instructor_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Template categories (references templates)
CREATE TABLE `template_categories` (
                                       `id` int(11) NOT NULL AUTO_INCREMENT,
                                       `template_id` int(11) NOT NULL,
                                       `category_name` varchar(255) NOT NULL,
                                       `weight` decimal(10,2) NOT NULL,
                                       `assessment_count` int(11) DEFAULT 0,
                                       PRIMARY KEY (`id`),
                                       CONSTRAINT `template_categories_ibfk_1` FOREIGN KEY (`template_id`) REFERENCES `templates` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- =====================================================
-- DATABASE CONSTRAINTS (Added by Joshua Iyalagha)
-- =====================================================

ALTER TABLE courses ADD UNIQUE KEY unique_course_code (code, instructor_id);

-- =====================================================
-- DEMO DATA (Added by Joshua Iyalagha)
-- INSERT in order: users → courses → categories → assessments → enrollments → grades → templates
-- =====================================================

-- STEP 1: DEMO USERS (with correct password hashes)
-- Passwords: instructor@test.com uses "instructor-password", students use "password"
-- Hashes generated with: SHA256(salt + password)

-- Demo Instructor 1: Dr. Sarah Johnson (id=1)
-- Password: instructor-password, Salt: demo_salt_instructor
INSERT INTO users (id, email, password, passwordHash, salt, role, first_name, last_name, display_name, title, department, office, phone, bio, created_at) VALUES
    (1, 'instructor@test.com', 'hashed', '472c5eede4ea01c510ef440ae60a84d9bf541a0dd45e0cf4b87a1c695802ca7f', 'demo_salt_instructor', 'instructor', 'Sarah', 'Johnson', 'Dr. Sarah Johnson', 'Professor', 'Computer Science', 'EV 3.309', '514-555-0101', 'Experienced web development instructor.', NOW());

-- Demo Instructor 2: Prof. Michael Chen (id=2)
INSERT INTO users (id, email, password, passwordHash, salt, role, first_name, last_name, display_name, title, department, office, phone, bio, created_at) VALUES
    (2, 'instructor2@test.com', 'hashed', '472c5eede4ea01c510ef440ae60a84d9bf541a0dd45e0cf4b87a1c695802ca7f', 'demo_salt_instructor', 'instructor', 'Michael', 'Chen', 'Prof. Michael Chen', 'Associate Professor', 'Engineering', 'EV 4.215', '514-555-0102', 'Specializes in OOP and design patterns.', NOW());

-- Demo Student 1: John Student (id=3)
-- Password: password, Salt: demo_salt_student
INSERT INTO users (id, email, password, passwordHash, salt, role, first_name, last_name, display_name, student_id, program, year, created_at) VALUES
    (3, 'student@test.com', 'hashed', 'cb09df1eb95042ca055742dadd0df821bb38d33efa30f96911ca58e5cbaf2ead', 'demo_salt_student', 'student', 'John', 'Student', 'John Student', '12345678', 'Computer Science', 3, NOW());

-- Demo Student 2: Emma Wilson (id=4)
INSERT INTO users (id, email, password, passwordHash, salt, role, first_name, last_name, display_name, student_id, program, year, created_at) VALUES
    (4, 'student2@test.com', 'hashed', 'cb09df1eb95042ca055742dadd0df821bb38d33efa30f96911ca58e5cbaf2ead', 'demo_salt_student', 'student', 'Emma', 'Wilson', 'Emma Wilson', '23456789', 'Software Engineering', 2, NOW());

-- Demo Student 3: Liam Brown (id=5)
INSERT INTO users (id, email, password, passwordHash, salt, role, first_name, last_name, display_name, student_id, program, year, created_at) VALUES
    (5, 'student3@test.com', 'hashed', 'cb09df1eb95042ca055742dadd0df821bb38d33efa30f96911ca58e5cbaf2ead', 'demo_salt_student', 'student', 'Liam', 'Brown', 'Liam Brown', '34567890', 'Computer Engineering', 4, NOW());

ALTER TABLE users AUTO_INCREMENT = 6;

-- STEP 2: DEMO COURSES
INSERT INTO courses (id, code, name, description, instructor_id, term, enabled, students_count, created_at) VALUES
                                                                                                                (1, 'SOEN287', 'Web Programming', 'Introduction to web development.', 1, 'Winter 2026', 1, 45, NOW()),
                                                                                                                (2, 'COMP248', 'Object-Oriented Programming', 'Java programming fundamentals.', 1, 'Winter 2026', 1, 62, NOW()),
                                                                                                                (3, 'Nene123', 'Nandayo', 'Japanese language and culture.', 1, 'Fall 2026', 1, 28, NOW()),
                                                                                                                (4, 'CIER3034', 'Ciara Songs', 'Music theory and appreciation.', 1, 'Eternal 2025', 1, 15, NOW()),
                                                                                                                (5, 'ENG231', 'Engineering Fundamentals', 'Core engineering principles.', 2, 'Winter 2026', 1, 38, NOW());

ALTER TABLE courses AUTO_INCREMENT = 6;

-- STEP 3: DEMO ASSESSMENT CATEGORIES
INSERT INTO assessment_categories (id, course_id, category_name, weight, assessment_count) VALUES
                                                                                               (1, 1, 'Assignments', 40.00, 4),
                                                                                               (2, 1, 'Exams', 50.00, 2),
                                                                                               (3, 1, 'Participation', 10.00, 1),
                                                                                               (4, 2, 'Labs', 20.00, 10),
                                                                                               (5, 2, 'Assignments', 30.00, 3),
                                                                                               (6, 2, 'Midterm', 20.00, 1),
                                                                                               (7, 2, 'Final', 30.00, 1),
                                                                                               (8, 3, 'Nan da yo or Nan desu ka', 100.00, 5),
                                                                                               (9, 4, 'ciara 1', 20.00, 1),
                                                                                               (10, 4, 'ciara 2', 20.00, 1),
                                                                                               (11, 4, 'ciara 3', 30.00, 1),
                                                                                               (12, 4, 'ciara 4', 30.00, 1),
                                                                                               (13, 5, 'Quizzes', 25.00, 4),
                                                                                               (14, 5, 'Projects', 45.00, 2),
                                                                                               (15, 5, 'Final Exam', 30.00, 1);

ALTER TABLE assessment_categories AUTO_INCREMENT = 16;

-- STEP 4: DEMO ASSESSMENTS
INSERT INTO assessments (id, course_id, category_id, name, type, total_marks, due_date, weight, created_at) VALUES
                                                                                                                (1, 1, 1, 'Assignment 1: HTML/CSS Portfolio', 'Assignment', 100, '2026-02-15', 10.00, NOW()),
                                                                                                                (2, 1, 1, 'Assignment 2: JavaScript Interactivity', 'Assignment', 100, '2026-03-01', 10.00, NOW()),
                                                                                                                (3, 1, 1, 'Assignment 3: React Components', 'Assignment', 100, '2026-03-15', 10.00, NOW()),
                                                                                                                (4, 1, 1, 'Assignment 4: Full-Stack Project', 'Assignment', 100, '2026-04-01', 10.00, NOW()),
                                                                                                                (5, 1, 2, 'Midterm Exam', 'Exam', 100, '2026-02-28', 25.00, NOW()),
                                                                                                                (6, 1, 2, 'Final Exam', 'Exam', 100, '2026-04-15', 25.00, NOW()),
                                                                                                                (7, 1, 3, 'Class Participation', 'Participation', 100, '2026-04-20', 10.00, NOW()),
                                                                                                                (8, 2, 4, 'Lab 1: Java Basics', 'Lab', 50, '2026-01-20', 2.00, NOW()),
                                                                                                                (9, 2, 4, 'Lab 2: OOP Concepts', 'Lab', 50, '2026-01-27', 2.00, NOW()),
                                                                                                                (10, 2, 5, 'Assignment 1: Bank Account Class', 'Assignment', 100, '2026-02-10', 10.00, NOW()),
                                                                                                                (11, 2, 5, 'Assignment 2: Inheritance Hierarchy', 'Assignment', 100, '2026-02-24', 10.00, NOW()),
                                                                                                                (12, 2, 5, 'Assignment 3: Design Patterns', 'Assignment', 100, '2026-03-10', 10.00, NOW()),
                                                                                                                (13, 2, 6, 'Midterm Exam', 'Exam', 100, '2026-03-01', 20.00, NOW()),
                                                                                                                (14, 2, 7, 'Final Exam', 'Exam', 100, '2026-04-15', 30.00, NOW()),
                                                                                                                (15, 3, 8, 'Lesson 1: Greetings', 'Quiz', 20, '2026-09-10', 20.00, NOW()),
                                                                                                                (16, 3, 8, 'Lesson 2: Introductions', 'Quiz', 20, '2026-09-17', 20.00, NOW()),
                                                                                                                (17, 3, 8, 'Lesson 3: Numbers & Dates', 'Quiz', 20, '2026-09-24', 20.00, NOW()),
                                                                                                                (18, 3, 8, 'Midterm Project: Dialogue', 'Project', 100, '2026-10-15', 20.00, NOW()),
                                                                                                                (19, 3, 8, 'Final Presentation', 'Presentation', 100, '2026-11-30', 20.00, NOW()),
                                                                                                                (20, 4, 9, 'Ciara 1: Goodies Analysis', 'Essay', 100, '2025-12-01', 20.00, NOW()),
                                                                                                                (21, 4, 10, 'Ciara 2: Evolution of Style', 'Essay', 100, '2025-12-15', 20.00, NOW()),
                                                                                                                (22, 4, 11, 'Ciara 3: Impact on R&B', 'Research Paper', 100, '2026-01-15', 30.00, NOW()),
                                                                                                                (23, 4, 12, 'Ciara 4: Final Portfolio', 'Portfolio', 100, '2026-02-28', 30.00, NOW()),
                                                                                                                (24, 5, 13, 'Quiz 1: Engineering Ethics', 'Quiz', 50, '2026-01-25', 6.25, NOW()),
                                                                                                                (25, 5, 13, 'Quiz 2: Problem Solving', 'Quiz', 50, '2026-02-08', 6.25, NOW()),
                                                                                                                (26, 5, 13, 'Quiz 3: Technical Writing', 'Quiz', 50, '2026-02-22', 6.25, NOW()),
                                                                                                                (27, 5, 13, 'Quiz 4: Team Dynamics', 'Quiz', 50, '2026-03-08', 6.25, NOW()),
                                                                                                                (28, 5, 14, 'Project 1: Design Challenge', 'Project', 100, '2026-03-01', 22.50, NOW()),
                                                                                                                (29, 5, 14, 'Project 2: Capstone Proposal', 'Project', 100, '2026-04-01', 22.50, NOW()),
                                                                                                                (30, 5, 15, 'Final Exam', 'Exam', 100, '2026-04-20', 30.00, NOW());

ALTER TABLE assessments AUTO_INCREMENT = 31;

-- STEP 5: DEMO ENROLLMENTS
INSERT INTO enrollments (student_id, course_id, enrolled_at) VALUES
                                                                 (3, 1, NOW()), (3, 2, NOW()), (3, 3, NOW()), (3, 4, NOW()),
                                                                 (4, 2, NOW()), (4, 5, NOW()),
                                                                 (5, 1, NOW()), (5, 5, NOW());

-- STEP 6: DEMO GRADES
INSERT INTO grades (student_id, assessment_id, earned_marks, status, feedback, submitted_date, created_at) VALUES
                                                                                                               (3, 1, 85, 'completed', 'Excellent HTML structure.', '2026-02-14', NOW()),
                                                                                                               (3, 2, 92, 'completed', 'Great use of event listeners.', '2026-02-28', NOW()),
                                                                                                               (3, 3, 78, 'completed', 'Good component design.', '2026-03-14', NOW()),
                                                                                                               (3, 4, NULL, 'pending', NULL, NULL, NOW()),
                                                                                                               (3, 5, 88, 'completed', 'Strong understanding.', '2026-02-27', NOW()),
                                                                                                               (3, 6, NULL, 'pending', NULL, NULL, NOW()),
                                                                                                               (3, 7, 100, 'completed', 'Active participation.', '2026-04-20', NOW()),
                                                                                                               (3, 8, 45, 'completed', 'Good start with Java.', '2026-01-19', NOW()),
                                                                                                               (3, 9, 48, 'completed', 'Excellent OOP implementation.', '2026-01-26', NOW()),
                                                                                                               (3, 10, 88, 'completed', 'Well-structured class.', '2026-02-09', NOW()),
                                                                                                               (3, 11, 91, 'completed', 'Great inheritance usage.', '2026-02-23', NOW()),
                                                                                                               (3, 12, 85, 'completed', 'Solid design patterns.', '2026-03-09', NOW()),
                                                                                                               (3, 13, 82, 'completed', 'Good exam performance.', '2026-03-01', NOW()),
                                                                                                               (3, 14, NULL, 'pending', NULL, NULL, NOW()),
                                                                                                               (3, 15, NULL, 'pending', NULL, NULL, NOW()),
                                                                                                               (3, 16, NULL, 'pending', NULL, NULL, NOW()),
                                                                                                               (3, 17, NULL, 'pending', NULL, NULL, NOW()),
                                                                                                               (3, 18, NULL, 'pending', NULL, NULL, NOW()),
                                                                                                               (3, 19, NULL, 'pending', NULL, NULL, NOW()),
                                                                                                               (3, 20, 95, 'completed', 'Insightful analysis.', '2025-11-30', NOW()),
                                                                                                               (3, 21, 88, 'completed', 'Well-researched paper.', '2025-12-14', NOW()),
                                                                                                               (3, 22, NULL, 'pending', NULL, NULL, NOW()),
                                                                                                               (3, 23, NULL, 'pending', NULL, NULL, NOW()),
                                                                                                               (4, 8, 50, 'completed', 'Perfect lab submission.', '2026-01-19', NOW()),
                                                                                                               (4, 9, 47, 'completed', 'Excellent OOP concepts.', '2026-01-26', NOW()),
                                                                                                               (4, 10, 95, 'completed', 'Outstanding implementation.', '2026-02-09', NOW()),
                                                                                                               (4, 11, 93, 'completed', 'Exceptional hierarchy.', '2026-02-23', NOW()),
                                                                                                               (4, 12, 89, 'completed', 'Great patterns usage.', '2026-03-09', NOW()),
                                                                                                               (4, 13, 90, 'completed', 'Excellent midterm.', '2026-03-01', NOW()),
                                                                                                               (4, 14, NULL, 'pending', NULL, NULL, NOW()),
                                                                                                               (4, 24, 45, 'completed', 'Good ethics understanding.', '2026-01-24', NOW()),
                                                                                                               (4, 25, 48, 'completed', 'Strong problem-solving.', '2026-02-07', NOW()),
                                                                                                               (4, 26, 42, 'completed', 'Good technical writing.', '2026-02-21', NOW()),
                                                                                                               (4, 27, NULL, 'pending', NULL, NULL, NOW()),
                                                                                                               (4, 28, 88, 'completed', 'Excellent design solution.', '2026-02-28', NOW()),
                                                                                                               (4, 29, NULL, 'pending', NULL, NULL, NOW()),
                                                                                                               (4, 30, NULL, 'pending', NULL, NULL, NOW()),
                                                                                                               (5, 1, 78, 'completed', 'Good HTML/CSS fundamentals.', '2026-02-14', NOW()),
                                                                                                               (5, 2, 82, 'completed', 'Nice JavaScript interactivity.', '2026-02-28', NOW()),
                                                                                                               (5, 3, 75, 'completed', 'Solid React components.', '2026-03-14', NOW()),
                                                                                                               (5, 4, NULL, 'pending', NULL, NULL, NOW()),
                                                                                                               (5, 5, 80, 'completed', 'Good midterm preparation.', '2026-02-27', NOW()),
                                                                                                               (5, 6, NULL, 'pending', NULL, NULL, NOW()),
                                                                                                               (5, 7, 95, 'completed', 'Excellent participation.', '2026-04-20', NOW()),
                                                                                                               (5, 24, 40, 'completed', 'Needs more depth.', '2026-01-24', NOW()),
                                                                                                               (5, 25, 44, 'completed', 'Good methodology.', '2026-02-07', NOW()),
                                                                                                               (5, 26, 38, 'completed', 'Writing needs improvement.', '2026-02-21', NOW()),
                                                                                                               (5, 27, NULL, 'pending', NULL, NULL, NOW()),
                                                                                                               (5, 28, 75, 'completed', 'Good design effort.', '2026-02-28', NOW()),
                                                                                                               (5, 29, NULL, 'pending', NULL, NULL, NOW()),
                                                                                                               (5, 30, NULL, 'pending', NULL, NULL, NOW());

ALTER TABLE grades AUTO_INCREMENT = 48;

-- STEP 7: DEMO TEMPLATES
INSERT INTO templates (id, name, description, instructor_id, created_at) VALUES
                                                                             (1, 'Web Programming Template', 'Standard web dev course structure.', 1, NOW()),
                                                                             (2, 'Programming Course Template', 'Template for programming courses.', 1, NOW()),
                                                                             (3, 'Engineering Fundamentals Template', 'Core engineering course structure.', 2, NOW());

INSERT INTO template_categories (template_id, category_name, weight, assessment_count) VALUES
                                                                                           (1, 'Assignments', 40.00, 4), (1, 'Exams', 50.00, 2), (1, 'Participation', 10.00, 1),
                                                                                           (2, 'Labs', 20.00, 10), (2, 'Assignments', 30.00, 3), (2, 'Midterm', 20.00, 1), (2, 'Final', 30.00, 1),
                                                                                           (3, 'Quizzes', 25.00, 4), (3, 'Projects', 45.00, 2), (3, 'Final Exam', 30.00, 1);

-- =====================================================
-- IMPORTANT: Demo Credentials Work Out of the Box!
-- =====================================================
-- After importing this schema, you can login immediately with:
--
-- Instructors:
--   instructor@test.com / instructor-password
--   instructor2@test.com / instructor-password
--
-- Students:
--   student@test.com / password
--   student2@test.com / password
--   student3@test.com / password
--
-- No "Forgot Password" step required - hashes are pre-computed!
-- =====================================================

/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;
/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*M!100616 SET NOTE_VERBOSITY=@OLD_NOTE_VERBOSITY */;

-- Dump completed