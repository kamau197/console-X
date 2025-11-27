// controllers/users.js
const { query } = require('../utils/db');

async function getUser(req, res) {
  const id = Number(req.params.id);
  const rows = await query('SELECT id, email, name, role, created_at FROM users WHERE id = ? LIMIT 1', [id]);
  const user = rows[0];
  if (!user) return res.status(404).json({ error: 'not found' });
  res.json(user);
}

module.exports = { getUser };
