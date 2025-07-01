const express = require("express");
const router = express.Router();

const InvoiceController = require("./invoice.controller");

// CRUD Routes
router.get("/", InvoiceController.getAllInvoices);                 
router.get("/paid", InvoiceController.getPaidInvoices);
router.get("/unpaid", InvoiceController.getUnPaidInvoices);



router.get("/:invoice_code", InvoiceController.getInvoiceByInvoiceCode);              // Lấy hóa đơn theo ID
router.post("/", InvoiceController.createInvoice);                 // Tạo hóa đơn mới
router.put("/:id", InvoiceController.updateInvoice);               // Cập nhật hóa đơn
router.delete("/:id", InvoiceController.deleteInvoice);            // Xóa hóa đơn
router.post('/:id/payments', InvoiceController.recordInvoicePayment); // Thêm authMiddleware nếu cần
router.post('/bulk-payment', InvoiceController.recordBulkPayment); // API thanh toán hàng loạt
router.get('/payments/all', InvoiceController.getAllPayments);

module.exports = router;