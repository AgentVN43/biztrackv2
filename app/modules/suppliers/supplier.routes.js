const express = require('express');
const router = express.Router();
const supplierController = require('./supplier.controller'); 
// const authMiddleware = require('../middlewares/auth.middleware'); // Uncomment if you have an auth middleware
// const { authorize } = require('../middlewares/auth.middleware'); // Uncomment if you use role-based authorization

// Import search/filter middleware và service
const { supplierSearchFilter } = require('../../middlewares/searchFilter.middleware');
const { EntityHelpers } = require('../../utils/searchFilterService');

// Existing routes (không thay đổi)
router.post('/', supplierController.createSupplier);
router.get('/', supplierController.getAllSuppliers);
router.get('/:id', supplierController.getSupplierById);
router.put('/:id', supplierController.updateSupplier);
router.delete('/:id', supplierController.deleteSupplier);

// NEW: Recalc payable
router.post('/:id/recalculate-payable', supplierController.recalcPayable);
router.post('/recalculate-all-payables', supplierController.recalcAllPayables);

// NEW: Route với search/filter functionality
router.get('/search/filter', supplierSearchFilter, supplierController.searchSuppliersWithFilter);

module.exports = router;
