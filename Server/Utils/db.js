// db.js
// Global MySQL2 pool used across controllers.

const { createPool } = require('mysql2/promise');

const pool = createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: Number(process.env.DB_CONN_LIMIT || 15),
  queueLimit: 0,
  namedPlaceholders: true
});

async function query(sql, params = []) {
  const [rows] = await pool.query(sql, params);
  return rows;
}

module.exports = {
  query,
  pool
};
