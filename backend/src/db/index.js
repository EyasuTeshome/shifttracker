const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 10,
});

const db = {
  query: async (sql, params) => {
    const { rows } = await pool.query(sql, params);
    return rows;
  },
  one: async (sql, params) => {
    const { rows } = await pool.query(sql, params);
    return rows[0] || null;
  },
  pool,
};

module.exports = db;
