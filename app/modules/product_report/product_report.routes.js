const express = require("express");
const router = express.Router();
const productReportController = require("./product_report.controller"); // Đảm bảo đường dẫn đúng

// Tuyến đường để lấy lịch sử của một sản phẩm
router.get("/:id/history", productReportController.getProductHistory);

module.exports = router;
