const express = require("express");
const router = express.Router();
const controller = require("./inventory.controller");

router.post("/", controller.create);
router.get("/", controller.getAll);
// router.get('/:id/inventories', controller.checkAll);
router.get("/:id", controller.getById);
router.get("/:id/warehouses", controller.getByWareHouseId);
router.delete("/:id", controller.remove);

// Quản lý tồn kho theo đơn hàng / PO
router.post("/reserve", controller.reserveStock); // Tạm giữ hàng
router.post("/confirm", controller.confirmStock); // Xác nhận tồn kho
router.post("/release", controller.releaseStock); // Giải phóng hàng
router.post("/increase", controller.increaseStock); // Tăng tồn kho từ PO

module.exports = router;
