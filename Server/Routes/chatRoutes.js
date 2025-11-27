const express = require('express');
const router = express.Router();
const Chat = require('../controllers/chatController');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');

router.post('/create', auth, Chat.createChat);
router.get('/list', auth, Chat.listChats);
router.get('/messages', auth, Chat.getMessages);
router.post('/send', auth, upload.single('attachment'), Chat.sendMessage);

module.exports = router;
