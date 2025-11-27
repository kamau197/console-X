// server.updated.js — Part 1/3
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const express = require('express');
const http = require('http');
const helmet = require('helmet');
const cors = require('cors');
const multer = require('multer');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { createPool } = require('mysql2/promise');

// ===== app + server =====
const app = express();
const server = http.createServer(app);
const io = require('socket.io')(server, {
  cors: { origin: '*' } // adjust allowed origins in production
});

// ===== config / pool =====
const UPLOADS_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const pool = createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'consolex',
  waitForConnections: true,
  connectionLimit: Number(process.env.DB_CONN_LIMIT || 12),
  queueLimit: 0,
  namedPlaceholders: true
});

const JWT_SECRET = process.env.JWT_SECRET || 'change-this-secret';
const TOKEN_EXPIRY = process.env.TOKEN_EXPIRY || '7d';
const MAX_JSON_SIZE = process.env.MAX_JSON_SIZE || '5mb';

// ===== middlewares =====
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: MAX_JSON_SIZE }));
app.use(express.urlencoded({ extended: true }));

// serve uploads as static (optional)
app.use('/uploads', express.static(UPLOADS_DIR));

// multer for file uploads
const upload = multer({ dest: UPLOADS_DIR });

// ===== helpers =====
function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
}

async function query(sql, params = []) {
  const [rows] = await pool.query(sql, params);
  return rows;
}

function wrapAsync(fn) {
  return function(req, res, next) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// Express-friendly async error helper
function respondError(res, code = 500, message = 'server_error', details = null) {
  const payload = { error: message };
  if (details) payload.details = details;
  return res.status(code).json(payload);
}

// Basic input sanitizers
function toInt(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : fallback;
}

// JWT auth middleware
async function authenticateJWT(req, res, next) {
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

// ===== AUTH: register/login =====
app.post('/api/auth/register', wrapAsync(async (req, res) => {
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
    return respondError(res, 500, 'server_error', err && err.message);
  }
}));

app.post('/api/auth/login', wrapAsync(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'email+password required' });
  const rows = await query('SELECT id, email, password_hash, name, role FROM users WHERE email = ? LIMIT 1', [email]);
  const user = rows[0];
  if (!user) return res.status(401).json({ error: 'invalid credentials' });
  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) return res.status(401).json({ error: 'invalid credentials' });
  const token = signToken({ userId: user.id, email: user.email, role: user.role });
  res.json({ success: true, token, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
}));

// ===== USERS =====
app.get('/api/users/:id', authenticateJWT, wrapAsync(async (req, res) => {
  const id = Number(req.params.id);
  const rows = await query('SELECT id, email, name, role, created_at FROM users WHERE id = ? LIMIT 1', [id]);
  const user = rows[0];
  if (!user) return res.status(404).json({ error: 'not found' });
  res.json(user);
}));

// ===== SEARCH =====
app.get('/api/search', authenticateJWT, wrapAsync(async (req, res) => {
  const q = (req.query.q || '').trim();
  if (!q) return res.json({ results: [] });
  const terms = `%${q}%`;
  const [contracts, users, listings] = await Promise.all([
    query('SELECT id, title, partyA_id, partyB_id FROM contracts WHERE title LIKE ? LIMIT 10', [terms]),
    query('SELECT id, name, email FROM users WHERE name LIKE ? OR email LIKE ? LIMIT 10', [terms, terms]),
    query('SELECT id, title, vendor_id FROM listings WHERE title LIKE ? LIMIT 10', [terms])
  ]);
  const results = [
    ...contracts.map(r => ({ type: 'contract', id: r.id, title: r.title })),
    ...listings.map(r => ({ type: 'listing', id: r.id, title: r.title })),
    ...users.map(r => ({ type: 'user', id: r.id, title: r.name || r.email }))
  ];
  res.json({ results });
}));

// ===== DASHBOARD REFRESH =====
app.get('/api/refresh_dashboard', authenticateJWT, wrapAsync(async (req, res) => {
  const [withdrawals, listingPayments, subscriptions, contracts, terminations, financialReports, systemReports] = await Promise.all([
    query('SELECT * FROM withdrawals ORDER BY created_at DESC LIMIT 50'),
    query('SELECT * FROM listing_payments ORDER BY created_at DESC LIMIT 50'),
    query('SELECT * FROM subscriptions ORDER BY expires_at DESC LIMIT 50'),
    query('SELECT * FROM contracts ORDER BY created_at DESC LIMIT 200'),
    query('SELECT * FROM termination_requests ORDER BY created_at DESC LIMIT 50'),
    query('SELECT * FROM reports WHERE category="financial" ORDER BY created_at DESC LIMIT 20'),
    query('SELECT * FROM reports WHERE category="system" ORDER BY created_at DESC LIMIT 20')
  ]);
  res.json({ withdrawals, listingPayments, subscriptions, contracts, terminationRequests: terminations, reports: { financial: financialReports, system: systemReports } });
}));

// ===== CONTRACT ADMIN ACTIONS =====
app.post('/api/action_contract', authenticateJWT, wrapAsync(async (req, res) => {
  const { id, action } = req.body;
  if (!id || !action) return res.status(400).json({ error: 'id+action required' });
  if (!['approve', 'deny'].includes(action)) return res.status(400).json({ error: 'invalid action' });
  const status = action === 'approve' ? 'active' : 'denied';
  await query('UPDATE contracts SET status = ? WHERE id = ?', [status, id]);
  await query('INSERT INTO contract_actions (contract_id, action, actor_id, created_at) VALUES (?, ?, ?, NOW())', [id, action, req.user.userId]);
  return res.json({ success: true });
}));

// ===== GET CONTRACT (detailed) =====
app.get('/api/get_contract', authenticateJWT, wrapAsync(async (req, res) => {
  const id = req.query.id;
  if (!id) return res.status(400).json({ error: 'id required' });
  // check termination_requests
  const t = await query('SELECT * FROM termination_requests WHERE id = ? LIMIT 1', [id]);
  if (t.length) {
    const contract = await query('SELECT * FROM contracts WHERE id = ? LIMIT 1', [t[0].contract_id]);
    return res.json({ type: 'termination', termination: t[0], contract: contract[0] || null });
  }
  const c = await query('SELECT * FROM contracts WHERE id = ? LIMIT 1', [id]);
  if (!c.length) return res.status(404).json({ error: 'not found' });
  return res.json({ type: 'contract', contract: c[0] });
}));

// server.updated.js — Part 2/3 (middle chunk)
'use strict';

// ===== LISTINGS / PAYMENTS / SUBSCRIPTIONS =====
app.get('/api/listings', authenticateJWT, wrapAsync(async (req, res) => {
  const rows = await query('SELECT * FROM listings ORDER BY created_at DESC LIMIT 100');
  res.json(rows);
}));

app.get('/api/listing_payments', authenticateJWT, wrapAsync(async (req, res) => {
  const rows = await query('SELECT * FROM listing_payments ORDER BY created_at DESC LIMIT 100');
  res.json(rows);
}));

// ===== NOTIFICATIONS =====
app.post('/api/notifications/send', authenticateJWT, wrapAsync(async (req, res) => {
  const { to_user_id, title, msg, metadata } = req.body;
  if (!to_user_id || !title || !msg) return res.status(400).json({ error: 'missing fields' });
  await query('INSERT INTO notifications (user_id, title, message, metadata, created_at, read_flag) VALUES (?, ?, ?, ?, NOW(), 0)', [to_user_id, title, msg, JSON.stringify(metadata || {})]);
  io.to(`user_${to_user_id}`).emit('notification', { title, msg, metadata: metadata || {} });
  res.json({ success: true });
}));

// ===== CHAT: create or fetch chat (frontend expected) =====
app.post('/api/chats/create', authenticateJWT, wrapAsync(async (req, res) => {
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
}));

// fetch chat list for frontend (get_chats.php equivalent)
app.get('/api/frontend/chat/list', authenticateJWT, wrapAsync(async (req, res) => {
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
}));

// fetch messages (fetch.php equivalent)
app.get('/api/frontend/chat/messages', authenticateJWT, wrapAsync(async (req, res) => {
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
}));

// send message endpoint (send.php equivalent) - supports optional attachment
app.post('/api/frontend/chat/send', authenticateJWT, upload.single('attachment'), wrapAsync(async (req, res) => {
  const chatId = Number(req.body.chat_id || req.body.chatId);
  const text = req.body.message || req.body.text || null;
  const receiver_id = Number(req.body.receiver_id || req.body.receiverId || 0);
  const sender = req.user.userId;
  let attachment_meta = null;

  if (req.file) {
    attachment_meta = { filename: req.file.filename, originalname: req.file.originalname, size: req.file.size, path: `/uploads/${req.file.filename}` };
    await query('INSERT INTO files (owner_id, filename, original_name, size, created_at) VALUES (?, ?, ?, ?, NOW())', [sender, req.file.filename, req.file.originalname, req.file.size]);
  }

  const r = await query('INSERT INTO messages (chat_id, sender_id, text, attachment, created_at) VALUES (?, ?, ?, ?, NOW())', [chatId, sender, text, attachment_meta ? JSON.stringify(attachment_meta) : null]);

  // emit to participants
  const parts = await query('SELECT user_id FROM chat_participants WHERE chat_id = ?', [chatId]);
  for (const p of parts) {
    io.to(`user_${p.user_id}`).emit('chat.message', { chatId, sender, text, attachment: attachment_meta, id: r.insertId, created_at: new Date().toISOString() });
  }

  res.json({ success: true, id: r.insertId });
}));

// ===== CONTRACTS (frontend endpoints expected by page) =====
// get contracts for user (get_contracts.php equivalent)
app.get('/api/frontend/contracts', authenticateJWT, wrapAsync(async (req, res) => {
  const userId = req.user.userId;
  const rows = await query('SELECT * FROM contracts WHERE partyA_id = ? OR partyB_id = ? ORDER BY created_at DESC', [userId, userId]);
  res.json({ status: 'success', contracts: rows });
}));

// update milestone (update_milestone.php equivalent)
app.post('/api/frontend/contracts/milestone', authenticateJWT, wrapAsync(async (req, res) => {
  const id = toInt(req.query.id || req.body.contract_id || req.body.id, 0);
  if (!id) return res.status(400).json({ error: 'contract id required' });
  await query('UPDATE contracts SET milestones_completed = COALESCE(milestones_completed,0) + 1 WHERE id = ?', [id]);
  const [row] = await query('SELECT milestones_completed FROM contracts WHERE id = ? LIMIT 1', [id]);
  res.json({ status: 'success', milestones_completed: row ? row.milestones_completed : 0 });
}));

// submit review (submit_review.php equivalent)
app.post('/api/frontend/contracts/review', authenticateJWT, wrapAsync(async (req, res) => {
  const { contract_id, review } = req.body;
  if (!contract_id || !review) return res.status(400).json({ error: 'contract_id and review required' });
  await query('INSERT INTO contract_reviews (contract_id, review, created_at) VALUES (?, ?, NOW())', [contract_id, review]);
  res.json({ status: 'success' });
}));

// terminate contract (terminate_contract.php equivalent)
app.post('/api/frontend/contracts/terminate', authenticateJWT, upload.single('proof'), wrapAsync(async (req, res) => {
  const contract_id = Number(req.body.contract_id || req.body.id);
  const reason = req.body.reason || null;
  const userId = req.user.userId;
  if (!contract_id || !reason) return res.status(400).json({ error: 'contract_id + reason required' });
  const proof = req.file ? req.file.filename : null;
  await query('INSERT INTO termination_requests (contract_id, user_id, reason, proof_file, created_at) VALUES (?, ?, ?, ?, NOW())', [contract_id, userId, reason, proof]);
  await query('UPDATE contracts SET status = ? WHERE id = ?', ['terminated', contract_id]);
  res.json({ status: 'success' });
}));

// mark payment (mark_payment.php equivalent)
app.post('/api/frontend/contracts/payment', authenticateJWT, wrapAsync(async (req, res) => {
  const contract_id = Number(req.query.contract_id || req.body.contract_id || req.body.id);
  if (!contract_id) return res.status(400).json({ error: 'contract_id required' });
  await query('UPDATE contracts SET payment_received = 1 WHERE id = ?', [contract_id]);
  res.json({ status: 'success' });
}));

// health
app.get('/api/health', (req, res) => res.json({ ok: true, ts: new Date().toISOString() }));

// ===== SOCKET.IO auth & handlers =====
io.use((socket, next) => {
  try {
    const token = (socket.handshake.query && socket.handshake.query.token) || socket.handshake.auth && socket.handshake.auth.token;
    if (!token) return next(new Error('auth error'));
    const payload = jwt.verify(token, JWT_SECRET);
    socket.user = payload;
    return next();
  } catch (err) {
    return next(new Error('auth error'));
  }
}));

io.on('connection', (socket) => {
  const uid = socket.user.userId;
  socket.join(`user_${uid}`);
  console.log('socket connected user:', uid);

  // broadcast presence
  socket.broadcast.emit('presence', { userId: uid, status: 'online' });

  socket.on('chat.send', async (data, cb) => {
    try {
      const chatId = Number(data.chatId);
      const text = data.text || null;
      const r = await query('INSERT INTO messages (chat_id, sender_id, text, created_at) VALUES (?, ?, ?, NOW())', [chatId, uid, text]);
      const msg = { id: r.insertId, chat_id: chatId, sender_id: uid, text, created_at: new Date().toISOString() };
      const participants = await query('SELECT user_id FROM chat_participants WHERE chat_id = ?', [chatId]);
      for (const p of participants) io.to(`user_${p.user_id}`).emit('chat.message', msg);
      if (cb) cb({ ok: true, message: msg });
    } catch (err) {
      console.error('socket chat.send', err);
      if (cb) cb({ ok: false, err: 'server error' });
    }
  });

  socket.on('disconnect', () => {
    socket.broadcast.emit('presence', { userId: uid, status: 'offline' });
  });
});

// ===== LEGAL DESK / APPEALS =====
// Table expectations (simple):
//   appeals: id (auto), appeal_id (varchar), vault_id, user_id, contract_id, other_party, comment, status (open/closed), created_at
//   legal_reviews: id, appeal_id, reviewer_id, note, email_body, created_at

// List appeals (admin/legal)
app.get('/api/legal/appeals', authenticateJWT, wrapAsync(async (req, res) => {
  // only allow role 'legal' or 'admin' to access — fallback: allow admin or role in token
  const role = req.user && req.user.role;
  if (!['admin', 'legal'].includes(role)) return res.status(403).json({ error: 'forbidden' });

  const rows = await query('SELECT * FROM appeals ORDER BY created_at DESC LIMIT 200');
  res.json({ status: 'success', appeals: rows });
}));

// Create an appeal (typically done by other parts of system)
app.post('/api/legal/appeals', authenticateJWT, wrapAsync(async (req, res) => {
  const { appeal_id, vault_id, user_id, contract_id, other_party, comment } = req.body;
  if (!appeal_id || !vault_id || !user_id || !contract_id) return res.status(400).json({ error: 'missing fields' });
  await query('INSERT INTO appeals (appeal_id, vault_id, user_id, contract_id, other_party, comment, status, created_at) VALUES (?, ?, ?, ?, ?, ?, "open", NOW())', [appeal_id, vault_id, user_id, contract_id, other_party || null, comment || null]);
  res.json({ status: 'success' });
}));

// Open single appeal
app.get('/api/legal/appeals/:appealId', authenticateJWT, wrapAsync(async (req, res) => {
  const role = req.user && req.user.role;
  if (!['admin', 'legal'].includes(role)) return res.status(403).json({ error: 'forbidden' });

  const aid = req.params.appealId;
  const rows = await query('SELECT * FROM appeals WHERE appeal_id = ? LIMIT 1', [aid]);
  if (!rows.length) return res.status(404).json({ error: 'not found' });
  res.json({ status: 'success', appeal: rows[0] });
}));

// Record review / compose email (legal sends/records official email body)
app.post('/api/legal/appeals/:appealId/review', authenticateJWT, wrapAsync(async (req, res) => {
  const role = req.user && req.user.role;
  if (!['admin', 'legal'].includes(role)) return res.status(403).json({ error: 'forbidden' });

  const aid = req.params.appealId;
  const { note, emailBody, action } = req.body; // action is optional (e.g., 'escalate', 'close', 'request_more')
  if (!emailBody && !note) return res.status(400).json({ error: 'note or emailBody required' });

  const appealsRow = await query('SELECT * FROM appeals WHERE appeal_id = ? LIMIT 1', [aid]);
  if (!appealsRow.length) return res.status(404).json({ error: 'appeal not found' });

  await query('INSERT INTO legal_reviews (appeal_id, reviewer_id, note, email_body, action_taken, created_at) VALUES (?, ?, ?, ?, ?, NOW())', [aid, req.user.userId, note || null, emailBody || null, action || null]);

  // optionally update appeal status if action instructs closure
  if (action === 'close') {
    await query('UPDATE appeals SET status = "closed", closed_at = NOW() WHERE appeal_id = ?', [aid]);
  }

  // placeholder: emit an event so UI can update
  io.emit('legal.review', { appealId: aid, reviewer: req.user.userId, action });

  res.json({ status: 'success' });
}));

// Close appeal explicitly
app.post('/api/legal/appeals/:appealId/close', authenticateJWT, wrapAsync(async (req, res) => {
  const role = req.user && req.user.role;
  if (!['admin', 'legal'].includes(role)) return res.status(403).json({ error: 'forbidden' });

  const aid = req.params.appealId;
  const reason = req.body.reason || null;
  const rows = await query('SELECT * FROM appeals WHERE appeal_id = ? LIMIT 1', [aid]);
  if (!rows.length) return res.status(404).json({ error: 'appeal not found' });

  await query('UPDATE appeals SET status = "closed", closed_at = NOW(), closed_reason = ? WHERE appeal_id = ?', [reason, aid]);
  await query('INSERT INTO legal_reviews (appeal_id, reviewer_id, note, email_body, action_taken, created_at) VALUES (?, ?, ?, ?, ?, NOW())', [aid, req.user.userId, `Closed: ${reason || ''}`, null, 'closed']);

  io.emit('legal.closed', { appealId: aid, by: req.user.userId });
  res.json({ status: 'success' });
}));

// Provide a small route to fetch review history for an appeal
app.get('/api/legal/appeals/:appealId/reviews', authenticateJWT, wrapAsync(async (req, res) => {
  const role = req.user && req.user.role;
  if (!['admin', 'legal'].includes(role)) return res.status(403).json({ error: 'forbidden' });

  const aid = req.params.appealId;
  const rows = await query('SELECT * FROM legal_reviews WHERE appeal_id = ? ORDER BY created_at DESC', [aid]);
  res.json({ status: 'success', reviews: rows });
}));

// ===== OPTIONAL: serve legal UI (if you keep provided HTML) =====
// If you place the legal desk HTML under public/legal/index.html, serve it:
const PUBLIC_DIR = path.join(__dirname, 'public');
if (fs.existsSync(PUBLIC_DIR)) {
  app.use(express.static(PUBLIC_DIR));
  // route example: GET /legal -> serves public/legal/index.html automatically if present
}

// ===== generic error handler =====
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err && err.stack ? err.stack : err);
  // don't leak stack in production
  const payload = { error: 'internal_server_error' };
  if (process.env.NODE_ENV !== 'production') payload.message = err && err.message ? err.message : String(err);
  res.status(500).json(payload);
});

// ===== start server =====
const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;
server.listen(PORT, () => console.log(`Server listening on ${PORT}`));
