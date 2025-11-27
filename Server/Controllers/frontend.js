// controllers/frontend.js
const { query } = require('../utils/db');

async function search(req, res) {
  const q = (req.query.q || '').trim();
  if (!q) return res.json({ results: [] });
  const terms = `%${q}%`;
  const contracts = await query('SELECT id, title, partyA_id, partyB_id FROM contracts WHERE title LIKE ? LIMIT 10', [terms]);
  const users = await query('SELECT id, name, email FROM users WHERE name LIKE ? OR email LIKE ? LIMIT 10', [terms, terms]);
  const listings = await query('SELECT id, title, vendor_id FROM listings WHERE title LIKE ? LIMIT 10', [terms]);
  const results = [
    ...contracts.map(r => ({ type: 'contract', id: r.id, title: r.title })),
    ...listings.map(r => ({ type: 'listing', id: r.id, title: r.title })),
    ...users.map(r => ({ type: 'user', id: r.id, title: r.name || r.email }))
  ];
  res.json({ results });
}

async function refreshDashboard(req, res) {
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
}

module.exports = { search, refreshDashboard };
