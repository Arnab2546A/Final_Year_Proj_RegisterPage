const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'usb_auth',
  user: 'postgres',
  password: '2004'
});

async function initializeDatabase() {
  try {
    console.log('Creating users table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(50) NOT NULL,
        usb_vid VARCHAR(10) NOT NULL,
        usb_pid VARCHAR(10) NOT NULL,
        public_key_pem TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('✅ Users table created successfully!');
    await pool.end();
  } catch (err) {
    console.error('❌ Error creating table:', err.message);
    process.exit(1);
  }
}

initializeDatabase();
