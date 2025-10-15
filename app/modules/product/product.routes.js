const express = require("express");
const router = express.Router();
const productController = require("./product.controller");
const { checkPermission } = require("../../middlewares/auth.middleware");

router.get("/", productController.getAllProducts);
router.get("/:id", productController.getProductById);
router.post("/", checkPermission('product.create'), productController.createProduct);
router.put("/:id", productController.updateProduct);
router.delete("/:id", productController.deleteProduct);

module.exports = router;
