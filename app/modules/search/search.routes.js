const express = require("express");
const router = express.Router();
const {
  searchOrdersByPhone,
  searchOrdersByCustomerName,
  searchOrdersAuto,
  searchProductsByName,
  searchCustomerByPhone,
  searchCustomerByName,
  searchCategoryByName,
  searchProductsBySku,
  searchWarehouseByName,
  searchInventory,
  searchCustomerAuto,
  searchProductsAuto,
} = require("./search.controller");

router.get("/orders-by-phone", searchOrdersByPhone);
router.get("/orders-by-customer-name", searchOrdersByCustomerName);
router.get("/orders-search", searchOrdersAuto);

router.get("/products-by-name", searchProductsByName);
router.get("/products-by-sku", searchProductsBySku);
router.get("/products-search", searchProductsAuto);

router.get("/customers-by-phone", searchCustomerByPhone);
router.get("/customers-by-name", searchCustomerByName);
router.get("/customers-search", searchCustomerAuto);

router.get("/categories-by-name", searchCategoryByName);
router.get("/warehouses-by-name", searchWarehouseByName);

router.get("/inventory", searchInventory);

module.exports = router;
