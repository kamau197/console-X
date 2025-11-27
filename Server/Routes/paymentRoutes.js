const express = require('express');
const router = express.Router();
const Payment = require('../controllers/paymentController');
const auth = require('../middleware/auth');

router.post('/init', auth, Payment.initPayment);
router.get('/verify', auth, Payment.verifyPayment);

module.exports = router;
