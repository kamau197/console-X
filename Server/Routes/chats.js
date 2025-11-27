// routes/chats.js
const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/jwtAuth');
const ctrl = require('../controllers/chats');

router.post('/create', authenticate, ctrl.createChat);
router.get('/list', authenticate, ctrl.listChats);
router.get('/messages', authenticate, ctrl.fetchMessages);

module.exports = router;
