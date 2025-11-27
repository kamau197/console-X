const express = require('express');
const router = express.Router();
const Contract = require('../controllers/contractController');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');

router.get('/', auth, Contract.getUserContracts);
router.get('/details', auth, Contract.getContractDetails);

router.post('/milestone', auth, Contract.updateMilestone);
router.post('/review', auth, Contract.submitReview);

router.post('/terminate', auth, upload.single('proof'), Contract.terminateContract);

router.post('/payment', auth, Contract.markPayment);
router.post('/action', auth, Contract.adminDecision);

module.exports = router;
