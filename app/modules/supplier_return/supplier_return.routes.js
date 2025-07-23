const express = require("express");
const router = express.Router();
const SupplierReturnController = require("./supplier_return.controller");

router.post("/", SupplierReturnController.createReturn);
router.get("/", SupplierReturnController.getReturns);
router.get("/:return_id", SupplierReturnController.getReturnById);
router.put("/:return_id", SupplierReturnController.updateReturn);
router.delete("/:return_id", SupplierReturnController.deleteReturn);
router.post("/:return_id/approve", SupplierReturnController.approveReturn);

router.get("/supplier/:supplier_id", SupplierReturnController.getReturnBySupplierId);

router.get("/status/:status", SupplierReturnController.getReturnByStatus);
router.get('/payable', SupplierReturnController.getPayableReturns);
router.get('/:supplier_id/payable', SupplierReturnController.getPayableReturnsBySupplier);

module.exports = router; 