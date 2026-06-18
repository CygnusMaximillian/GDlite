const jwt = require('jsonwebtoken');
const pool = require('../db');

const auth = async (req, res, next) => {
  // 1️⃣ Get the Authorization header
  const authHeader = req.headers.authorization;

  // 2️⃣ Check if header exists
  if (!authHeader) {
    return res.status(401).json({ message: "No token provided" });
  }

  // 3️⃣ Extract token from "Bearer <token>"
  const token = authHeader.split(" ")[1];

  // 4️⃣ Verify token
  try {
    const decoded = jwt.verify(token, process.env.PRIVATE_KEY);
    console.log("The decoded info ;", decoded);
    // 5️⃣ Attach user info to request
    const user = await pool.query(
      'SELECT id, email FROM users WHERE id = $1',
      [decoded.userId]
    );

    req.user = user.rows[0];
    console.log("the user Info " , req.user);

    // 6️⃣ Allow request to continue
    next();
  } catch (err) {
    res.status(401).json({ message: "Invalid or expired token" });
    console.log("this is the error :  " , err);
  }
};

module.exports = { auth };
