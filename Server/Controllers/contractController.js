// controllers/contractController.js
// Contract CRUD + milestone + reviews + termination + payment

const { query } = require('../db');

/**
 * Get contracts for current user
 * GET /api/frontend/contracts
 */
async function getContractsForUser(req, res) {
  const userId = req.user.userId;
  const rows = await query('SELECT * FROM contracts WHERE partyA_id = ? OR partyB_id = ? ORDER BY created_at DESC', [userId, userId]);
  return res.json({ status: 'success', contracts: rows });
}

/**
 * Update milestone (increment completed)
 * POST /api/frontend/contracts/milestone
 */
async function updateMilestone(req, res) {
  const id = Number(req.query.id || req.body.contract_id || req.body.id);
  if (!id) return res.status(400).json({ error: 'contract id required' });
  await query('UPDATE contracts SET milestones_completed = COALESCE(milestones_completed,0) + 1 WHERE id = ?', [id]);
  const [row] = await query('SELECT milestones_completed FROM contracts WHERE id = ? LIMIT 1', [id]);
  return res.json({ status: 'success', milestones_completed: row ? row.milestones_completed : 0 });
}

/**
 * Submit review for a contract
 * POST /api/frontend/contracts/review
 */
async function submitReview(req, res) {
  const { contract_id, review } = req.body || {};
  if (!contract_id || !review) return res.status(400).json({ error: 'contract_id and review required' });
  await query('INSERT INTO contract_reviews (contract_id, review, author_id, created_at) VALUES (?, ?, ?, NOW())', [contract_id, review, req.user.userId]);
  return res.json({ status: 'success' });
}

/**
 * Terminate contract (with optional proof file handled via multer)
 * POST /api/frontend/contracts/terminate
 */
async function terminateContract(req, res) {
  const contract_id = Number(req.body.contract_id || req.body.id);
  const reason = req.body.reason || null;
  const userId = req.user.userId;
  if (!contract_id || !reason) return res.status(400).json({ error: 'contract_id + reason required' });
  const proof = req.file ? req.file.filename : null;
  await query('INSERT INTO termination_requests (contract_id, user_id, reason, proof_file, created_at) VALUES (?, ?, ?, ?, NOW())', [contract_id, userId, reason, proof]);
  await query('UPDATE contracts SET status = ? WHERE id = ?', ['terminated', contract_id]);
  return res.json({ status: 'success' });
}

/**
 * Mark payment received on contract
 * POST /api/frontend/contracts/payment
 */
async function markPayment(req, res) {
  const contract_id = Number(req.query.contract_id || req.body.contract_id || req.body.id);
  if (!contract_id) return res.status(400).json({ error: 'contract_id required' });
  await query('UPDATE contracts SET payment_received = 1 WHERE id = ?', [contract_id]);
  return res.json({ status: 'success' });
}

/**
 * GET detailed contract (and check termination requests)
 * GET /api/get_contract?id=...
 */
async function getContract(req, res) {
  const id = req.query.id;
  if (!id) return res.status(400).json({ error: 'id required' });

  const t = await query('SELECT * FROM termination_requests WHERE id = ? LIMIT 1', [id]);
  if (t.length) {
    const contract = await query('SELECT * FROM contracts WHERE id = ? LIMIT 1', [t[0].contract_id]);
    return res.json({ type: 'termination', termination: t[0], contract: contract[0] || null });
  }
  const c = await query('SELECT * FROM contracts WHERE id = ? LIMIT 1', [id]);
  if (!c.length) return res.status(404).json({ error: 'not found' });
  return res.json({ type: 'contract', contract: c[0] });
}

module.exports = {
  getContractsForUser,
  updateMilestone,
  submitReview,
  terminateContract,
  markPayment,
  getContract
};
