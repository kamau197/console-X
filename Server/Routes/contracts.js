// routes/contracts.js
const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/jwtAuth');
const multer = require('multer');
const upload = multer({ dest: process.env.UPLOADS_DIR || './uploads' });
const ctrl = require('../controllers/contracts');

router.get('/frontend', authenticate, ctrl.getFrontendContracts);
router.post('/milestone', authenticate, ctrl.updateMilestone);
router.post('/review', authenticate, ctrl.submitReview);
router.post('/terminate', authenticate, upload.single('proof'), ctrl.terminateContract);
router.post('/payment', authenticate, ctrl.markPayment);

module.exports = router;
