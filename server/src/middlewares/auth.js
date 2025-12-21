const jwt = require('jsonwebtoken');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const auth = (req, res, next) => {
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

    // 5️⃣ Attach user info to request
    req.user = decoded;

    // 6️⃣ Allow request to continue
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

module.exports = { auth };
