// modules/payments/routes/payments.routes.js
const express = require('express');
const router = express.Router();
const paymentController = require('./payments.controller');

router.post('/', paymentController.createPayment);
router.get('/', paymentController.getAllPayments);
router.get('/:id', paymentController.getPaymentById);
router.put('/:id', paymentController.updatePayment);
router.delete('/:id', paymentController.deletePayment);
router.get('/po/:purchase_order_id', paymentController.getPaymentsByPO);

module.exports = router;