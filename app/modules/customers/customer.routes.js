const express = require('express');
const router = express.Router();
const CustomerController = require('./customer.controller');

// Định nghĩa các route cho CRUD
router.post('/', CustomerController.create);
router.get('/', CustomerController.get);
router.get('/:id', CustomerController.getById);
router.put('/:id', CustomerController.update);
router.put('/:id/status', CustomerController.updateStatus);
router.delete('/:id', CustomerController.delete);



module.exports = router;
