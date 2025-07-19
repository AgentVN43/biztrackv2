const express = require("express");
const router = express.Router();
const SupplierReturnController = require("./supplier_return.controller");

// Tạo đơn trả hàng nhà cung cấp
router.post("/", SupplierReturnController.createReturn);

// Lấy danh sách đơn trả hàng nhà cung cấp
router.get("/", SupplierReturnController.getReturns);

// Lấy chi tiết đơn trả hàng nhà cung cấp
router.get("/:return_id", SupplierReturnController.getReturnById);

// Cập nhật đơn trả hàng nhà cung cấp
router.put("/:return_id", SupplierReturnController.updateReturn);

// Xóa đơn trả hàng nhà cung cấp
router.delete("/:return_id", SupplierReturnController.deleteReturn);

// Duyệt đơn trả hàng nhà cung cấp
router.post("/:return_id/approve", SupplierReturnController.approveReturn);

// Lấy danh sách đơn trả hàng theo nhà cung cấp
router.get("/supplier/:supplier_id", SupplierReturnController.getReturnBySupplierId);

// Lấy danh sách đơn trả hàng theo trạng thái
router.get("/status/:status", SupplierReturnController.getReturnByStatus);

module.exports = router; 