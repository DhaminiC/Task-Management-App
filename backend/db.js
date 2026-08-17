const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 14242,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: {
    rejectUnauthorized: false
  },
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

async function initializeDatabase() {
  try {
    const connection = await pool.getConnection();
    console.log('Connected to MySQL database via Aiven successfully.');

    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

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

    // Ensure columns exist if table was created previously with older schema
    const alterQueries = [
      "ALTER TABLE tasks ADD COLUMN IF NOT EXISTS user_id INT",
      "ALTER TABLE tasks ADD COLUMN IF NOT EXISTS due_date VARCHAR(50)",
      "ALTER TABLE tasks ADD COLUMN IF NOT EXISTS priority VARCHAR(50) DEFAULT 'Low'",
      "ALTER TABLE tasks ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'Pending'"
    ];

    for (const query of alterQueries) {
      try {
        await connection.query(query);
      } catch (e) {
        // Ignore duplicate column errors
      }
    }

    connection.release();
  } catch (err) {
    console.error('Database initialization error:', err);
    throw err;
  }
}

module.exports = { pool, initializeDatabase };