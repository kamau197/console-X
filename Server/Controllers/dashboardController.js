// controllers/dashboardController.js
// Dashboard refresh endpoint compiles quick lists and reports

const { query } = require('../db');

async function refreshDashboard(req, res) {
  // return a snapshot of multiple tables used in admin dashboard
  const [withdrawals, listingPayments, subscriptions, contracts, terminations, financialReports, systemReports] = await Promise.all([
    query('SELECT * FROM withdrawals ORDER BY created_at DESC LIMIT 50'),
    query('SELECT * FROM listing_payments ORDER BY created_at DESC LIMIT 50'),
    query('SELECT * FROM subscriptions ORDER BY expires_at DESC LIMIT 50'),
    query('SELECT * FROM contracts ORDER BY created_at DESC LIMIT 200'),
    query('SELECT * FROM termination_requests ORDER BY created_at DESC LIMIT 50'),
    query('SELECT * FROM reports WHERE category="financial" ORDER BY created_at DESC LIMIT 20'),
    query('SELECT * FROM reports WHERE category="system" ORDER BY created_at DESC LIMIT 20')
  ]);

  return res.json({
    withdrawals,
    listingPayments,
    subscriptions,
    contracts,
    terminationRequests: terminations,
    reports: { financial: financialReports, system: systemReports }
  });
}

module.exports = { refreshDashboard };
