// routes/users.js
const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/jwtAuth');
const ctrl = require('../controllers/users');

router.get('/:id', authenticate, ctrl.getUser);

module.exports = router;
