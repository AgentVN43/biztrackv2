const express = require('express');
const router = express.Router();
const OrderDetailController = require('./orderDetail.controller');

router.post('/', OrderDetailController.create);
router.get('/', OrderDetailController.read);
router.get('/:id', OrderDetailController.readById);
router.get('/:id/details', OrderDetailController.getOrderDetailByOrderId);
router.put('/:id', OrderDetailController.update);
router.delete('/:id', OrderDetailController.delete);
router.get('/summary/:order_id', require('../orders/order.controller').getOrderWithReturnSummary);

module.exports = router;