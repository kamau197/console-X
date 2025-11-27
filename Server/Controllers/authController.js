// controllers/authController.js
// Handles register / login and basic user utilities.

const bcrypt = require('bcryptjs');
const { query } = require('../db');
const { signToken } = require('../utils/jwt'); // small helper to centralize JWT config

/**
 * POST /api/auth/register
 * body: { email, password, name, role }
 */
async function register(req, res) {
  const { email, password, name, role = 'user' } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'email+password required' });

  const password_hash = await bcrypt.hash(password, 10);
  try {
    const r = await query(
      'INSERT INTO users (email, password_hash, name, role, created_at) VALUES (?, ?, ?, ?, NOW())',
      [email.toLowerCase(), password_hash, name || null, role]
    );
    const userId = r.insertId;
    const token = signToken({ userId, email: email.toLowerCase(), role });
    return res.json({ success: true, token, userId });
  } catch (err) {
    console.error('auth.register error', err);
    if (err && err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Email already exists' });
    return res.status(500).json({ error: 'server_error' });
  }
}

/**
 * POST /api/auth/login
 * body: { email, password }
 */
async function login(req, res) {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'email+password required' });

  const rows = await query('SELECT id, email, password_hash, name, role FROM users WHERE email = ? LIMIT 1', [email.toLowerCase()]);
  const user = rows && rows.length ? rows[0] : null;
  if (!user) return res.status(401).json({ error: 'invalid credentials' });

  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) return res.status(401).json({ error: 'invalid credentials' });

  const token = signToken({ userId: user.id, email: user.email, role: user.role });
  return res.json({
    success: true,
    token,
    user: { id: user.id, email: user.email, name: user.name, role: user.role }
  });
}

/**
 * GET /api/users/:id
 * Requires authenticateJWT middleware (attaches req.user)
 */
async function getUser(req, res) {
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ error: 'invalid id' });
  const rows = await query('SELECT id, email, name, role, created_at FROM users WHERE id = ? LIMIT 1', [id]);
  if (!rows.length) return res.status(404).json({ error: 'not found' });
  return res.json(rows[0]);
}

module.exports = {
  register,
  login,
  getUser
};
