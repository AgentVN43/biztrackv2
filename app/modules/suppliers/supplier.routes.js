const express = require('express');
const router = express.Router();
const supplierController = require('./supplier.controller'); 
// const authMiddleware = require('../middlewares/auth.middleware'); // Uncomment if you have an auth middleware
// const { authorize } = require('../middlewares/auth.middleware'); // Uncomment if you use role-based authorization


router.post('/', supplierController.createSupplier);
router.get('/', supplierController.getAllSuppliers);
router.get('/:id', supplierController.getSupplierById);
router.put('/:id', supplierController.updateSupplier);
router.delete('/:id', supplierController.deleteSupplier);


module.exports = router;
