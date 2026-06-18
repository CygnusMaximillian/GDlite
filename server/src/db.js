const {Pool} = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

pool.query('SELECT NOW()', async (err, res) => {
  if (err) {
    console.error('Error connecting to DB:', err);
  } else {
    console.log('Connected to Postgres at', res.rows[0].now);
    
    // Automatically setup the document_permissions table for RBAC
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS document_permissions (
          id SERIAL PRIMARY KEY,
          document_id INT REFERENCES documents(id) ON DELETE CASCADE,
          user_id INT REFERENCES users(id) ON DELETE CASCADE,
          role VARCHAR(50) NOT NULL,
          UNIQUE(document_id, user_id)
        );
      `);
      // Grant existing owners
      await pool.query(`
        INSERT INTO document_permissions (document_id, user_id, role)
        SELECT id, owner_id, 'owner' FROM documents
        ON CONFLICT DO NOTHING;
      `);
      console.log('DB Schema verified/updated for RBAC.');
    } catch (dbErr) {
      console.error('Error setting up DB schema:', dbErr);
    }
  }
});


pool.on('connect', () => {
  console.log("Connected to postgres")
});

pool.on('error', () => {
  console.log("ran into an error");
})
module.exports = pool;