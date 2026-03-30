/*
Written bby Joshua Iyalagha 40306001
 */
const db = require('../config/database');

class Course {
    static async findAll(instructorId = null) {
        let sql = `
            SELECT c.*, u.display_name as instructor_name
            FROM courses c
            JOIN users u ON c.instructor_id = u.id
        `;
        const params = [];

        if (instructorId) {
            sql += ' WHERE c.instructor_id = ?';
            params.push(instructorId);
        }

        sql += ' ORDER BY c.created_at DESC';

        return await db.query(sql, params);
    }

    static async findById(id) {
        const sql = `
            SELECT c.*, u.display_name as instructor_name
            FROM courses c
            JOIN users u ON c.instructor_id = u.id
            WHERE c.id = ?
        `;
        const results = await db.query(sql, [id]);
        return results[0];
    }

    static async create(courseData) {
        return await db.transaction(async (connection) => {
            // inserting course
            const [result] = await connection.execute(
                `INSERT INTO courses (code, name, description, instructor_id, term, enabled)
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [courseData.code, courseData.name, courseData.description,
                    courseData.instructor_id, courseData.term, courseData.enabled !== false]
            );

            const courseId = result.insertId;

            //inserting assessment categories
            if (courseData.assessmentCategories && courseData.assessmentCategories.length > 0) {
                for (const category of courseData.assessmentCategories) {
                    await connection.execute(
                        `INSERT INTO assessment_categories (course_id, category_name, weight, assessment_count)
                         VALUES (?, ?, ?, ?)`,
                        [courseId, category.category, category.weight, category.count || 1]
                    );
                }
            }

            return courseId;
        });
    }

    static async update(id, updates) {
        const fields = [];
        const values = [];

        const allowedFields = ['name', 'description', 'term', 'enabled'];
        for (const field of allowedFields) {
            if (updates[field] !== undefined) {
                fields.push(`${field} = ?`);
                values.push(updates[field]);
            }
        }

        if (fields.length === 0) return false;

        values.push(id);
        const sql = `UPDATE courses SET ${fields.join(', ')} WHERE id = ?`;

        const result = await db.query(sql, values);
        return result.affectedRows > 0;
    }

    static async delete(id, instructorId) {
        return await db.transaction(async (connection) => {
            // checking if a course has enrolled students
            const [enrollmentCheck] = await connection.execute(
                'SELECT COUNT(*) as count FROM enrollments WHERE course_id = ?',
                [id]
            );

            if (enrollmentCheck[0].count > 0) {
                throw new Error('Cannot delete course with enrolled students');
            }

            // deleting course (cascade will handle categories and assessments)
            const [result] = await connection.execute(
                'DELETE FROM courses WHERE id = ? AND instructor_id = ?',
                [id, instructorId]
            );

            return result.affectedRows > 0;
        });
    }

    static async getAssessments(courseId) {
        const sql = `
            SELECT a.*, ac.category_name, ac.weight as category_weight
            FROM assessments a
            LEFT JOIN assessment_categories ac ON a.category_id = ac.id
            WHERE a.course_id = ?
            ORDER BY a.due_date ASC
        `;
        return await db.query(sql, [courseId]);
    }

    static async addAssessment(courseId, assessmentData) {
        const sql = `
            INSERT INTO assessments (course_id, category_id, name, type, total_marks, due_date, weight)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
        const result = await db.query(sql, [
            courseId, assessmentData.category_id, assessmentData.name,
            assessmentData.type, assessmentData.total_marks, assessmentData.due_date,
            assessmentData.weight
        ]);
        return result.insertId;
    }

    static async deleteAssessment(assessmentId, courseId, instructorId) {
        const sql = `
            DELETE a FROM assessments a
            JOIN courses c ON a.course_id = c.id
            WHERE a.id = ? AND a.course_id = ? AND c.instructor_id = ?
        `;
        const result = await db.query(sql, [assessmentId, courseId, instructorId]);
        return result.affectedRows > 0;
    }
}

module.exports = Course;