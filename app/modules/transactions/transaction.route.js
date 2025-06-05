const express = require("express");
const router = express.Router();
const TransactionController = require("./transaction.controller");

router.post("/", TransactionController.createTransaction);
router.get("/:id", TransactionController.getTransactionById);

module.exports = router;
