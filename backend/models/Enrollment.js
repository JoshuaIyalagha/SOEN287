/*

Matthew Golovanov 40348610
3/30/26

Enrollment model providing methods for enrolling, unenrolling, and retrieving.
*/
const db = require('../config/database');


class Enrollment {

    static async getEnrolledCourses(studentId) {
        const sql = `
        SELECT c.* FROM courses c JOIN enrollments e ON c.id = e.course_id WHERE e.student_id = ? AND c.enabled = 1
        `;
        return await db.query(sql, [studentId]);
    }

    static async getEnrolledStudents(courseId) {
        const sql = `
        SELECT u.* FROM users u JOIN enrollments e ON u.id = e.student_id WHERE e.course_id = ?
        `;
        return await db.query(sql, [courseId]);
    }

    static async enrollStudent(studentId, courseId) {
        return await db.transaction(async (connection) => {
            // inserting course
            await this.updateEnrollment(courseId);
            const [result] = await connection.execute(
                `INSERT INTO enrollments (student_id, course_id) VALUES (?, ?);
                `,
                [studentId, courseId]
            );
        });
    }
    static async unenrollStudent(studentId, courseId) {
        const sql = `
        DELETE FROM enrollments WHERE student_id = ? AND course_id = ?;
        `;
        await this.updateEnrollment(courseId);
        return await db.query(sql, [studentId, courseId]);
    }
    static async updateEnrollment(courseId) {
        const sql =`
        UPDATE courses
        SET students_count = (
        SELECT COUNT(*) FROM enrollments WHERE enrollments.course_id = courses.id
        )
        WHERE id = ?
        `;
        return await db.query(sql, [courseId]);
    }



        




}
module.exports = Enrollment;