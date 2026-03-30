/*
Written by Joshua Iyalagha 40306001
 */
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// Database connection pool
let pool = null;

async function getConnection() {
    if (!pool) {
        pool = mysql.createPool({
            host: 'localhost',
            user: 'root',
            password: 'password',
            database: 'smart_course_companion',
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0,
            enableKeepAlive: true,
            keepAliveInitialDelay: 0
        });
    }
    return pool;
}

async function initializeDatabase() {
    try {
        const connection = await getConnection();

        // Test connection
        await connection.query('SELECT 1');
        console.log('✅ MySQL database connected successfully');

        return true;
    } catch (error) {
        console.error('❌ MySQL connection failed:', error.message);
        console.log('Please ensure MySQL is running and the database is created');
        console.log('Run: mysql -u root -p < backend/schema.sql');
        return false;
    }
}

async function query(sql, params = []) {
    const pool = await getConnection();
    const [rows] = await pool.execute(sql, params);
    return rows;
}

async function transaction(callback) {
    const pool = await getConnection();
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
        const result = await callback(connection);
        await connection.commit();
        return result;
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
}

module.exports = {
    getConnection,
    initializeDatabase,
    query,
    transaction
};