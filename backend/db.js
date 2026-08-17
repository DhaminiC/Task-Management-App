require('dotenv').config();
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: { rejectUnauthorized: false },
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

async function initializeDatabase() {
  try {
    const connection = await pool.getConnection();
    console.log('Connected to MySQL database via Aiven successfully.');

    // Ensure users table exists
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Ensure tasks table exists
    await connection.query(`
      CREATE TABLE IF NOT EXISTS tasks (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        due_date VARCHAR(50),
        priority VARCHAR(50) DEFAULT 'Low',
        status VARCHAR(50) DEFAULT 'Pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Add missing columns if tasks table already existed with older schema
    const checkColumns = async (colName, colDefinition) => {
      try {
        const [rows] = await connection.query(`
          SELECT COLUMN_NAME 
          FROM INFORMATION_SCHEMA.COLUMNS 
          WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'tasks' AND COLUMN_NAME = ?
        `, [process.env.DB_NAME, colName]);

        if (rows.length === 0) {
          await connection.query(`ALTER TABLE tasks ADD COLUMN ${colName} ${colDefinition}`);
          console.log(`Added column ${colName} to tasks table.`);
        }
      } catch (err) {
        console.warn(`Column check warning for ${colName}:`, err.message);
      }
    };

    await checkColumns('user_id', 'INT');
    await checkColumns('due_date', 'VARCHAR(50)');
    await checkColumns('priority', "VARCHAR(50) DEFAULT 'Low'");
    await checkColumns('status', "VARCHAR(50) DEFAULT 'Pending'");

    connection.release();
  } catch (err) {
    console.error('Database initialization error:', err);
    throw err;
  }
}

module.exports = { pool, initializeDatabase };