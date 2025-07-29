const express = require('express');
const router = express.Router();
const supplierReportController = require('./supplier_report.controller');
// const authMiddleware = require('../middlewares/auth.middleware'); // Uncomment if you have an auth middleware
// const { authorize } = require('../middlewares/auth.middleware'); // Uncomment if you use role-based authorization

// Apply authentication to all routes below if needed
// router.use(authMiddleware.authMiddleware);

router.get('/:id/transaction-ledger', supplierReportController.getSupplierTransactionLedger);
router.get('/:id/po-history', supplierReportController.getSupplierOrderHistory);
router.get('/:id/payable', supplierReportController.getSupplierPayable);
router.post('/:supplierId/transaction', supplierReportController.createSupplierTransaction);

module.exports = router; 