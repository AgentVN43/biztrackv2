const express = require('express');
const router = express.Router();
const warehouseController = require('./warehouse.controller');
const { authMiddleware } = require('../../middlewares/auth.middleware');

router.post('/', warehouseController.createWarehouse);
router.get('/', warehouseController.getAllWarehouses);
router.get('/:id', warehouseController.getWarehouseById);
router.put('/:id', warehouseController.updateWarehouse);
router.delete('/:id', warehouseController.deleteWarehouse);

module.exports = router;
