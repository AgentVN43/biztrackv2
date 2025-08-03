const express = require('express');
const router = express.Router();
const cashbookController = require('./cashbook.controller');

router.post('/transaction', cashbookController.createTransaction);
router.get('/ledger', cashbookController.getLedger);

// Routes mới cho tracking giao dịch hệ thống
router.get('/system-ledger', cashbookController.getSystemTransactionLedger);
router.get('/system-summary', cashbookController.getSystemTransactionSummary);

// Route cho hoạt động gần đây tổng hợp
router.get('/recent-activities', cashbookController.getRecentActivitiesCombined);

module.exports = router; 