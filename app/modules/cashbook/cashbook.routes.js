const express = require('express');
const router = express.Router();
const cashbookController = require('./cashbook.controller');

router.post('/transaction', cashbookController.createTransaction);
router.get('/ledger', cashbookController.getLedger);

module.exports = router; 