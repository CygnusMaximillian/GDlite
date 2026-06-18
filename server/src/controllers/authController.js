const pool = require('../db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const register = async (req, res) => {
  try {
    const { email, password } = req.body;

    const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email',
      [email, hashedPassword]
    );

    const user = result.rows[0];

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.PRIVATE_KEY,
      { expiresIn: '10h' }
    );

    res.status(201).json({ token, user });
  } catch (err) {
    console.error(err.message);
    return res.status(500).json({ message: 'Server error' });
  }
};


const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const existingUser = await pool.query(
      'SELECT id, email, password_hash FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length === 0) {
      return res.status(400).json({ message: 'User Not Found' });
    }

    const user = existingUser.rows[0];

    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid Credentials' });
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.PRIVATE_KEY,
      { expiresIn: '10h' }
    );

    return res.status(200).json({
      token,
      user: { id: user.id, email: user.email }
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'There is some unknown error' });
  }
};


module.exports = { register, login };
