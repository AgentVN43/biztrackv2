const express = require("express");
const router = express.Router();
const CustomerReturnController = require("./customer_return.controller");
// const authMiddleware = require("../../middlewares/auth.middleware");

// Tất cả routes đều yêu cầu authentication
// router.use(authMiddleware);

// Routes cho đơn trả hàng
router.post("/", CustomerReturnController.createReturn);
router.get("/", CustomerReturnController.getReturns);
router.get("/statistics", CustomerReturnController.getReturnStatistics);
router.get("/report", CustomerReturnController.getReturnReport);

// Routes theo ID
router.get("/:return_id", CustomerReturnController.getReturnById);
router.put("/:return_id", CustomerReturnController.updateReturn);
router.delete("/:return_id", CustomerReturnController.deleteReturn);

// Routes xử lý đơn trả hàng
router.post("/:return_id/process", CustomerReturnController.processReturn);
router.post("/:return_id/approve", CustomerReturnController.approveReturn);
router.post("/:return_id/reject", CustomerReturnController.rejectReturn);
router.get("/:return_id/calculate-refund", CustomerReturnController.calculateRefund);

// Routes kiểm tra khả năng trả hàng
router.get("/order/:order_id/eligibility", CustomerReturnController.checkOrderEligibility);

// Routes theo khách hàng và đơn hàng
router.get("/customer/:customer_id", CustomerReturnController.getReturnsByCustomer);
router.get("/order/:order_id/returns", CustomerReturnController.getReturnsByOrder);

// Route cập nhật số tiền hoàn trả cho item
router.put("/item/:return_item_id/refund-amount", CustomerReturnController.updateRefundAmount);

module.exports = router; 