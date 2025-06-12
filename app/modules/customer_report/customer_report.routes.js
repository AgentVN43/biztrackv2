const express = require('express');
const router = express.Router();
const customerReportController = require('./customer_report.controller'); // Đảm bảo đường dẫn đúng
// const authMiddleware = require('../middlewares/auth.middleware'); // Uncomment if you have an auth middleware
// const { authorize } = require('../middlewares/auth.middleware'); // Uncomment if you use role-based authorization

// Apply authentication to all routes below if needed
// router.use(authMiddleware.authMiddleware);

router.get('/:id/overview', customerReportController.getCustomerOverview);
router.get('/:id/sales-return-history', customerReportController.getCustomerSalesReturnHistory);
router.get('/:id/order-history', customerReportController.getCustomerOrderHistory);
router.get('/:id/receivables', customerReportController.getCustomerReceivables);

module.exports = router;
