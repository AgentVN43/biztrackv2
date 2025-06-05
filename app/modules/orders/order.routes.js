const express = require("express");
const router = express.Router();
const OrderController = require("./order.controller");

router.post("/", OrderController.create);
router.get("/:id", OrderController.readById);
router.get("/", OrderController.read);
router.put("/:id", OrderController.update);
router.delete("/:id", OrderController.delete);
router.post('/with-details', OrderController.createOrderWithDetails);
router.put("/:id/with-details", OrderController.updateOrderWithDetails);

module.exports = router;
