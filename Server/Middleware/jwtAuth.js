// middleware/jwtAuth.js
const jwt = require('jsonwebtoken');
require('dotenv').config();
const JWT_SECRET = process.env.JWT_SECRET || 'change-this-secret';

function authenticateJWT(req, res, next) {
  const hdr = req.headers.authorization || '';
  if (!hdr || !hdr.startsWith('Bearer ')) return res.status(401).json({ error: 'Missing token' });
  const token = hdr.slice(7);
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    return next();
  } catch (e) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

module.exports = authenticateJWT;
