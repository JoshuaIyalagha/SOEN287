/*

Matthew Golovanov 40348610
3/30/26

Enrollment model providing methods for enrolling, unenrolling, and retrieving.
*/
const db = require('../config/database');


class Enrollment {

    static async getEnrolledCourses(studentId) {
        const sql = 'SELECT c.* FROM courses c JOIN enrollments e ON c.id = e.course_id WHERE e.student_id = ?';
        return await db.query(sql, [studentId]);
    }

    static async getEnrolledStudents(courseId) {
        const sql = 'SELECT u.* FROM users u JOIN enrollments e ON u.id = e.student_id WHERE e.course_id = ?';
        return await db.query(sql, [courseId]);
    }

    static async enrollStudent(studentId, courseId) {
        return await db.transaction(async (connection) => {
            // inserting course
            const [result] = await connection.execute(
                `INSERT INTO enrollments (student_id, course_id) VALUES (?, ?)`,
                [studentId, courseId]
            );
        });
    }
    static async unenrollStudent(studentId, courseId) {
        const sql = 'DELETE FROM enrollments WHERE student_id = ? AND course_id = ?';
        await db.query(sql, [studentId, courseId]);
    }



        




}
module.exports = Enrollment;