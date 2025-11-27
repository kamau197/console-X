const express = require('express');
const router = express.Router();
const Search = require('../controllers/searchController');
const auth = require('../middleware/auth');

router.get('/', auth, Search.search);

module.exports = router;
