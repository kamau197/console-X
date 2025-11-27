const express = require('express');
const router = express.Router();
const User = require('../controllers/userController');
const auth = require('../middleware/auth');

router.get('/:id', auth, User.getUser);
router.get('/', auth, User.listUsers);

module.exports = router;
