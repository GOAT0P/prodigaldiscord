require('dotenv').config();
const pool = require('../config/db');

async function checkDatabase() {
    try {
        console.log('Attempting to connect to database...');
        console.log('Connection config:', {
            user: process.env.DB_USER,
            host: process.env.DB_HOST,
            database: process.env.DB_NAME,
            port: process.env.DB_PORT,
            ssl: { rejectUnauthorized: false }
        });

        const tableCheck = await pool.query(
            "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'members';"
        );
        
        if (tableCheck.rows.length === 0) {
            console.log('Members table does not exist. Creating table...');
            await pool.query(`
                CREATE TABLE IF NOT EXISTS members (
                    id SERIAL PRIMARY KEY,
                    batch_code VARCHAR(255),
                    first_name VARCHAR(255) NOT NULL,
                    last_name VARCHAR(255) NOT NULL,
                    reference_code VARCHAR(255) NOT NULL UNIQUE,
                    internal_role VARCHAR(255),
                    discord_id VARCHAR(255),
                    discord_role_id VARCHAR(255),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            `);
            console.log('Members table created successfully');
        } else {
            console.log('Members table structure:', tableCheck.rows);
        }
    } catch (error) {
        console.error('Database error:', error);
    } finally {
        await pool.end();
    }
}

checkDatabase();
