// controllers/searchController.js
// Basic search across contracts, listings and users

const { query } = require('../db');

async function search(req, res) {
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
  return res.json({ results });
}

module.exports = { search };
