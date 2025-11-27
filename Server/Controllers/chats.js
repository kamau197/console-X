// controllers/chats.js
const { query } = require('../utils/db');

async function createChat(req, res) {
  const { participant_ids } = req.body;
  if (!Array.isArray(participant_ids) || participant_ids.length < 2) return res.status(400).json({ error: 'participant_ids required' });
  const key = participant_ids.slice().map(Number).sort((a,b) => a-b).join('_');
  const existing = await query('SELECT * FROM chats WHERE chat_key = ? LIMIT 1', [key]);
  if (existing.length) return res.json({ chat: existing[0] });
  const ins = await query('INSERT INTO chats (chat_key, created_at) VALUES (?, NOW())', [key]);
  const chatId = ins.insertId;
  for (const uid of participant_ids) {
    await query('INSERT INTO chat_participants (chat_id, user_id, joined_at) VALUES (?, ?, NOW())', [chatId, Number(uid)]);
  }
  const chat = (await query('SELECT * FROM chats WHERE id = ? LIMIT 1', [chatId]))[0];
  res.json({ chat });
}

async function listChats(req, res) {
  const userId = req.user.userId;
  const rows = await query(`
    SELECT c.id AS chat_id,
           (SELECT cp.user_id FROM chat_participants cp WHERE cp.chat_id = c.id AND cp.user_id != ? LIMIT 1) AS other_id,
           (SELECT u.name FROM users u WHERE u.id = (SELECT cp.user_id FROM chat_participants cp WHERE cp.chat_id = c.id AND cp.user_id != ? LIMIT 1)) AS display_name,
           (SELECT m.text FROM messages m WHERE m.chat_id = c.id ORDER BY m.created_at DESC LIMIT 1) AS last_message,
           (SELECT m.created_at FROM messages m WHERE m.chat_id = c.id ORDER BY m.created_at DESC LIMIT 1) AS timestamp
    FROM chats c
    JOIN chat_participants cp ON cp.chat_id = c.id
    WHERE cp.user_id = ?
    ORDER BY timestamp DESC
  `, [userId, userId, userId]);
  res.json({ status: 'success', chats: rows });
}

async function fetchMessages(req, res) {
  const chatId = Number(req.query.chat_id || req.query.chatId);
  if (!chatId) return res.json([]);
  const rows = await query(`
    SELECT m.id, m.chat_id, m.sender_id, m.text as message, m.attachment, m.created_at as timestamp, u.name as sender_name
    FROM messages m
    LEFT JOIN users u ON u.id = m.sender_id
    WHERE m.chat_id = ?
    ORDER BY m.created_at ASC
    LIMIT 1000
  `, [chatId]);
  res.json(rows);
}

module.exports = { createChat, listChats, fetchMessages };
