// controllers/notifications.js
const { query } = require('../utils/db');

async function sendNotification(req, res) {
  const { to_user_id, title, msg, metadata } = req.body;
  if (!to_user_id || !title || !msg) return res.status(400).json({ error: 'missing fields' });
  await query('INSERT INTO notifications (user_id, title, message, metadata, created_at, read_flag) VALUES (?, ?, ?, ?, NOW(), 0)', [to_user_id, title, msg, JSON.stringify(metadata || {})]);
  // socket emit handled in server after route attaches io; here just return success
  res.json({ success: true });
}

module.exports = { sendNotification };
