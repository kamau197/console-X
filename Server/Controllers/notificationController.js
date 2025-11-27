// controllers/notificationController.js
// Create and list notifications (server sends socket emit elsewhere)

const { query } = require('../db');
const io = require('../socket'); // optional helper to get io instance; fallback to null

/**
 * POST /api/notifications/send
 * body: { to_user_id, title, msg, metadata }
 */
async function sendNotification(req, res) {
  const { to_user_id, title, msg, metadata } = req.body || {};
  if (!to_user_id || !title || !msg) return res.status(400).json({ error: 'missing fields' });
  await query('INSERT INTO notifications (user_id, title, message, metadata, created_at, read_flag) VALUES (?, ?, ?, ?, NOW(), 0)', [to_user_id, title, msg, JSON.stringify(metadata || {})]);

  // emit over socket.io if available
  try {
    if (io && io.to) io.to(`user_${to_user_id}`).emit('notification', { title, msg, metadata: metadata || {} });
  } catch (err) {
    console.warn('notificationController.sendNotification: io emit failed', err);
  }

  return res.json({ success: true });
}

/**
 * GET /api/notifications (for user)
 * query: ?limit=50
 */
async function listNotifications(req, res) {
  const userId = req.user.userId;
  const limit = Number(req.query.limit || 50);
  const rows = await query('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT ?', [userId, limit]);
  return res.json(rows);
}

/**
 * POST /api/notifications/mark_read
 * body: { id } || mark all for user
 */
async function markRead(req, res) {
  const { id } = req.body || {};
  if (id) {
    await query('UPDATE notifications SET read_flag = 1 WHERE id = ? LIMIT 1', [id]);
    return res.json({ success: true });
  } else {
    await query('UPDATE notifications SET read_flag = 1 WHERE user_id = ?', [req.user.userId]);
    return res.json({ success: true });
  }
}

module.exports = {
  sendNotification,
  listNotifications,
  markRead
};
