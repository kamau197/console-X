// routes/notifications.js
const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/jwtAuth');
const ctrl = require('../controllers/notifications');

router.post('/send', authenticate, ctrl.sendNotification);

module.exports = router;
