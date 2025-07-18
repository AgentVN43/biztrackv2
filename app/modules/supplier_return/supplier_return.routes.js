const express = require("express");
const router = express.Router();
const SupplierReturnController = require("./supplier_return.controller");

// Tạo đơn trả hàng nhà cung cấp
router.post("/", SupplierReturnController.createReturn);
// Lấy danh sách đơn trả hàng nhà cung cấp
router.get("/", SupplierReturnController.getReturns);
// Lấy chi tiết đơn trả hàng nhà cung cấp
router.get("/:return_id", SupplierReturnController.getReturnById);
// Duyệt đơn trả hàng nhà cung cấp
router.post("/:return_id/approve", SupplierReturnController.approveReturn);

module.exports = router; 