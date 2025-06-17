const express = require("express");
const router = express.Router();
const productReportController = require("./product_report.controller"); // Đảm bảo đường dẫn đúng

router.get("/:id/history", productReportController.getProductHistory);
router.get('/:productId/:warehouseId/history', productReportController.getProductHistoryByProductAndWarehouse);

module.exports = router;
