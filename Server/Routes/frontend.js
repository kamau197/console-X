// routes/frontend.js
const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/jwtAuth');
const ctrl = require('../controllers/frontend');

router.get('/search', authenticate, ctrl.search);
router.get('/refresh_dashboard', authenticate, ctrl.refreshDashboard);

module.exports = router;
