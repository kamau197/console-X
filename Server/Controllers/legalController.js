// controllers/legalController.js
// Endpoints for the legal review desk: appeals listing, recording review, exporting/email compose
// This is lightweight: actual email sending should be implemented via ../utils/mail

const { query } = require('../db');
const { sendMail } = require('../utils/mail'); // optional; provide no-op fallback if not implemented

/**
 * List pending appeals that require legal review
 * GET /api/legal/appeals
 */
async function listAppeals(req, res) {
  const rows = await query('SELECT * FROM legal_appeals WHERE status = ? ORDER BY created_at DESC LIMIT 200', ['pending']);
  return res.json({ status: 'success', appeals: rows });
}

/**
 * Read a single appeal
 * GET /api/legal/appeal/:id
 */
async function getAppeal(req, res) {
  const id = req.params.id;
  if (!id) return res.status(400).json({ error: 'id required' });
  const rows = await query('SELECT * FROM legal_appeals WHERE appeal_id = ? LIMIT 1', [id]);
  if (!rows.length) return res.status(404).json({ error: 'not found' });
  return res.json(rows[0]);
}

/**
 * Record legal review / compose and optionally send an email
 * POST /api/legal/review
 * body: { appeal_id, review_text, send_email, email_to, email_subject }
 */
async function recordReview(req, res) {
  const { appeal_id, review_text, send_email, email_to, email_subject } = req.body || {};
  if (!appeal_id || !review_text) return res.status(400).json({ error: 'appeal_id + review_text required' });

  // store review
  await query('INSERT INTO legal_reviews (appeal_id, reviewer_id, review_text, created_at) VALUES (?, ?, ?, NOW())', [appeal_id, req.user.userId, review_text]);
  // update appeal status
  await query('UPDATE legal_appeals SET status = ?, updated_at = NOW() WHERE appeal_id = ?', ['reviewed', appeal_id]);

  // optionally send email (async)
  if (send_email && email_to) {
    try {
      await sendMail({
        to: email_to,
        subject: email_subject || `Legal Notice — Appeal ${appeal_id}`,
        text: review_text
      });
    } catch (err) {
      console.warn('legal.recordReview: mail send failed', err);
      // don't fail the request; just record and warn
    }
  }

  return res.json({ status: 'success' });
}

module.exports = {
  listAppeals,
  getAppeal,
  recordReview
};
