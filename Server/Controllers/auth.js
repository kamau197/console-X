// controllers/auth.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../utils/db');
require('dotenv').config();
const JWT_SECRET = process.env.JWT_SECRET || 'change-this-secret';
const TOKEN_EXPIRY = process.env.TOKEN_EXPIRY || '7d';

function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
}

async function register(req, res) {
  const { email, password, name, role = 'user' } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'email+password required' });
  const hashed = await bcrypt.hash(password, 10);
  try {
    const ins = await query(
      `INSERT INTO users (email, password_hash, name, role, created_at) VALUES (?, ?, ?, ?, NOW())`,
      [email, hashed, name || null, role]
    );
    const userId = ins.insertId;
    const token = signToken({ userId, email, role });
    return res.json({ success: true, token, userId });
  } catch (err) {
    console.error('register err', err);
    if (err && err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Email already exists' });
    return res.status(500).json({ error: 'server error' });
  }
}

async function login(req, res) {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'email+password required' });
  const rows = await query('SELECT id, email, password_hash, name, role FROM users WHERE email = ? LIMIT 1', [email]);
  const user = rows[0];
  if (!user) return res.status(401).json({ error: 'invalid credentials' });
  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) return res.status(401).json({ error: 'invalid credentials' });
  const token = signToken({ userId: user.id, email: user.email, role: user.role });
  res.json({ success: true, token, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
}

module.exports = { register, login };
