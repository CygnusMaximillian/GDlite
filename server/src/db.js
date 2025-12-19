const {Pool} = require('pg');

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });


const pool = new Pool({
  connectionString : process.env.DATABASE_URL,
});

pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Error connecting to DB:', err);
  } else {
    console.log('Connected to Postgres at', res.rows[0].now);
  }
});


pool.on('connect', () => {
  console.log("Connected to postgres")
});

pool.on('error', () => {
  console.log("ran into an error");
})
module.exports = pool;