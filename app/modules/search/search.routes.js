const express = require("express");
const router = express.Router();
const {
  searchOrdersByPhone,
  searchProductsByName,
  searchCustomerByPhone,
} = require("./search.controller");

router.get("/orders-by-phone", searchOrdersByPhone);
router.get("/products-by-name", searchProductsByName);
router.get("/customers-by-phone", searchCustomerByPhone);

module.exports = router;
