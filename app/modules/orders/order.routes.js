const express = require("express");
const router = express.Router();
const OrderController = require("./order.controller");
const { authMiddleware } = require("../../middlewares/auth.middleware");

router.post("/", OrderController.create);
router.get("/:id", OrderController.readById);
router.get("/", OrderController.read);
router.put("/:id", authMiddleware, OrderController.update);
router.delete("/:id", OrderController.delete);
router.post('/with-details', OrderController.createOrderWithDetails);
router.put("/:id/with-details", OrderController.updateOrderWithDetails);
router.get("/summary/status", OrderController.getTotalByStatus);

module.exports = router;
