const express = require('express');
const router = express.Router();
const cashbookController = require('./cashbook.controller');

// CRUD routes for transactions
router.post('/transaction', cashbookController.createTransaction);
router.get('/transaction/:id', cashbookController.getTransactionById);
router.put('/transaction/:id', cashbookController.updateTransaction);
router.delete('/transaction/:id', cashbookController.deleteTransaction);

// Existing routes
router.get('/ledger', cashbookController.getLedger);

// Routes mới cho tracking giao dịch hệ thống
router.get('/system-ledger', cashbookController.getSystemTransactionLedger);
router.get('/system-summary', cashbookController.getSystemTransactionSummary);

// Route cho hoạt động gần đây tổng hợp
router.get('/recent-activities', cashbookController.getRecentActivitiesCombined);

module.exports = router; 