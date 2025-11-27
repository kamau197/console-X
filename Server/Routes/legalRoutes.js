const express = require('express');
const router = express.Router();
const Legal = require('../controllers/legalController');
const auth = require('../middleware/auth');
const role = require('../middleware/role'); // Only legal/admin allowed

router.get('/appeals', auth, role(['admin','legal']), Legal.getAppeals);
router.post('/review', auth, role(['admin','legal']), Legal.recordReview);
router.post('/send-mail', auth, role(['admin','legal']), Legal.sendLegalEmail);

module.exports = router;
