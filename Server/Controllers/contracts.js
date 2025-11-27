// controllers/contracts.js
const { query } = require('../utils/db');

async function getFrontendContracts(req, res) {
  const userId = req.user.userId;
  const rows = await query('SELECT * FROM contracts WHERE partyA_id = ? OR partyB_id = ? ORDER BY created_at DESC', [userId, userId]);
  res.json({ status: 'success', contracts: rows });
}

async function updateMilestone(req, res) {
  const id = Number(req.query.id || req.body.contract_id || req.body.id);
  if (!id) return res.status(400).json({ error: 'contract id required' });
  await query('UPDATE contracts SET milestones_completed = COALESCE(milestones_completed,0) + 1 WHERE id = ?', [id]);
  const [row] = await query('SELECT milestones_completed FROM contracts WHERE id = ? LIMIT 1', [id]);
  res.json({ status: 'success', milestones_completed: row ? row.milestones_completed : 0 });
}

async function submitReview(req, res) {
  const { contract_id, review } = req.body;
  if (!contract_id || !review) return res.status(400).json({ error: 'contract_id and review required' });
  await query('INSERT INTO contract_reviews (contract_id, review, created_at) VALUES (?, ?, NOW())', [contract_id, review]);
  res.json({ status: 'success' });
}

async function terminateContract(req, res) {
  const contract_id = Number(req.body.contract_id || req.body.id);
  const reason = req.body.reason || null;
  const userId = req.user.userId;
  if (!contract_id || !reason) return res.status(400).json({ error: 'contract_id + reason required' });
  const proof = req.file ? req.file.filename : null;
  await query('INSERT INTO termination_requests (contract_id, user_id, reason, proof_file, created_at) VALUES (?, ?, ?, ?, NOW())', [contract_id, userId, reason, proof]);
  await query('UPDATE contracts SET status = ? WHERE id = ?', ['terminated', contract_id]);
  res.json({ status: 'success' });
}

async function markPayment(req, res) {
  const contract_id = Number(req.query.contract_id || req.body.contract_id || req.body.id);
  if (!contract_id) return res.status(400).json({ error: 'contract_id required' });
  await query('UPDATE contracts SET payment_received = 1 WHERE id = ?', [contract_id]);
  res.json({ status: 'success' });
}

module.exports = { getFrontendContracts, updateMilestone, submitReview, terminateContract, markPayment };
