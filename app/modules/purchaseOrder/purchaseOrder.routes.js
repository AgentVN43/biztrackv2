const express = require("express");
const router = express.Router();
const controller = require("./purchaseOrder.controller");
const { authMiddleware } = require("../../middlewares/auth.middleware");

router.post("/", controller.create);
router.get("/", controller.getAll);
// router.get("/:id", controller.getById);
// router.put('/:id', controller.update);
router.put("/:id/podetails", controller.updatePOWithDetails);
// router.delete("/:id", controller.remove);
router.post("/:id/post", authMiddleware, controller.postOrder);
router.get("/:id/details", controller.getWithDetailsById);

module.exports = router;
