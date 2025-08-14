const TransactionService = require("../transactions/transaction.service");
const TransactionModel = require("../transactions/transaction.model");
const { createResponse, errorResponse } = require("../../utils/response");
const SupplierReportService = require("./supplier_report.service");
const db = require("../../config/db.config");

const SupplierReportController = {
  /**
   * Lấy sổ cái giao dịch chi tiết của nhà cung cấp
   * Hiển thị tất cả giao dịch theo thứ tự thời gian với dư nợ
   * GET /api/suppliers/:id/transaction-ledger
   */
  getSupplierTransactionLedger: async (req, res, next) => {
    const supplier_id = req.params.id;
    try {
      const { page = 1, limit = 10 } = req.query;
      const parsedPage = parseInt(page);
      const parsedLimit = parseInt(limit);
      const { ledger, total } = await SupplierReportService.getSupplierTransactionLedger(
        supplier_id,
        parsedPage,
        parsedLimit
      );

      // Trả về mảng rỗng thay vì 404 để tránh loop ở frontend
      createResponse(
        res,
        200,
        true,
        ledger || [],
        ledger && ledger.length > 0
          ? "Sổ cái giao dịch của nhà cung cấp đã được tải thành công."
          : "Không có dữ liệu giao dịch cho nhà cung cấp này.",
        total,
        parsedPage,
        parsedLimit
      );
    } catch (error) {
      console.error(
        "🚀 ~ SupplierReportController: getSupplierTransactionLedger - Lỗi:",
        error
      );
      return errorResponse(res, error.message || "Lỗi server", 500);
    }
  },

  /**
   * Lấy lịch sử tất cả các đơn hàng mua của một nhà cung cấp, bao gồm chi tiết từng đơn hàng.
   * GET /api/suppliers/:id/order-history
   */
  getSupplierOrderHistory: async (req, res, next) => {
    const supplier_id = req.params.id;
    try {
      const { page = 1, limit = 10 } = req.query;
      const parsedPage = parseInt(page);
      const parsedLimit = parseInt(limit);
      const { orderHistory, total } = await SupplierReportService.getSupplierOrderHistoryWithDetails(
        supplier_id,
        parsedPage,
        parsedLimit
      );
      createResponse(
        res,
        200,
        true,
        orderHistory,
        "Supplier order history retrieved successfully.",
        total,
        parsedPage,
        parsedLimit
      );
    } catch (error) {
      console.error(
        "🚀 ~ supplier_report.controller.js: getSupplierOrderHistory - Lỗi:",
        error
      );
      return errorResponse(res, error.message || "Lỗi server", 500);
    }
  },

  /**
   * Tạo giao dịch mới cho nhà cung cấp
   * POST /api/suppliers/:supplierId/transaction
   */
  createSupplierTransaction: async (req, res, next) => {
    try {
      const { supplierId } = req.params;
      const { amount, type, description } = req.body;
      if (!amount || !type) {
        return res.status(400).json({ success: false, message: "amount và type là bắt buộc" });
      }
      // type: 'receipt' (phiếu thu), 'payment' (phiếu chi)
      const transaction = await TransactionService.createTransaction({
        transaction_code: `TXN-${Date.now()}`,
        type,
        amount,
        supplier_id: supplierId,
        description: description || (type === 'receipt' ? 'Phiếu thu' : 'Phiếu chi'),
        status: 'completed',
        created_at: new Date()
      });
      res.status(201).json({ success: true, data: transaction, message: "Tạo phiếu thành công" });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Lấy tổng công nợ phải trả và danh sách hóa đơn chưa thanh toán đủ của nhà cung cấp
   * GET /api/suppliers/:id/payable
   */
  getSupplierPayable: async (req, res, next) => {
    const supplier_id = req.params.id;
    try {
      // 1. Lấy tổng công nợ từ các hóa đơn chưa thanh toán
      const invoiceSql = `
        SELECT COALESCE(SUM(final_amount - amount_paid), 0) AS total_payables
        FROM invoices
        WHERE supplier_id = ?
          AND (status = 'pending' OR status = 'partial_paid' OR status = 'overdue')
          AND status != 'cancelled'
          AND invoice_type = 'purchase_invoice'
      `;
      const [invoiceRows] = await db.promise().query(invoiceSql, [supplier_id]);
      const invoiceDebt = parseFloat(invoiceRows[0].total_payables || 0);

      // 2. Lấy tổng công nợ từ các đơn hàng mua chưa có hóa đơn
      const orderSql = `
        SELECT COALESCE(SUM(po.total_amount), 0) AS total_orders_debt
        FROM purchase_orders po
        WHERE po.supplier_id = ?
          AND po.status IN ('draft')
          AND NOT EXISTS (
            SELECT 1 FROM invoices i 
            WHERE i.order_id = po.po_id 
              AND i.supplier_id = ?
              AND i.invoice_type = 'purchase_invoice'
          )
      `;
      const [orderRows] = await db.promise().query(orderSql, [supplier_id, supplier_id]);
      const orderDebt = parseFloat(orderRows[0].total_orders_debt || 0);

      // 3. Lấy tổng số tiền đã trả hàng từ return_orders
      const returnSql = `
        SELECT DISTINCT ro.po_id
        FROM return_orders ro
        WHERE ro.supplier_id = ?
          AND ro.status IN ('approved', 'completed')
          AND ro.type = 'supplier_return'
      `;
      const [returnRows] = await db.promise().query(returnSql, [supplier_id]);
      let totalRefund = 0;
      for (const row of returnRows) {
        if (row.po_id) {
          // Tính refund cho từng PO
          const refundSql = `
            SELECT SUM(roi.refund_amount) as total_refund
            FROM return_orders ro
            JOIN return_order_items roi ON ro.return_id = roi.return_id
            WHERE ro.po_id = ? AND ro.status IN ('approved', 'completed')
          `;
          const [refundRows] = await db.promise().query(refundSql, [row.po_id]);
          totalRefund += parseFloat(refundRows[0].total_refund || 0);
        }
      }

      // Tổng công nợ chúng ta nợ supplier = Công nợ invoices + Công nợ orders - Tổng tiền đã trả hàng
      const totalDebt = invoiceDebt + orderDebt;
      const total_payable = Math.max(0, totalDebt - totalRefund);

      //console.log(`🔍 getSupplierPayable cho supplier ${supplier_id}:`);
      //console.log(`  - Invoice debt: ${invoiceDebt}`);
      //console.log(`  - Order debt: ${orderDebt}`);
      //console.log(`  - Total debt: ${totalDebt}`);
      //console.log(`  - Total refund: ${totalRefund}`);
      //console.log(`  - Total payable: ${total_payable}`);

      // 4. Lấy danh sách hóa đơn chưa thanh toán đủ
      const unpaidInvoices = await SupplierReportService.getUnpaidOrPartiallyPaidInvoices(supplier_id);

      // 5. Tính remaining_payable và total_refund cho từng invoice
      const invoicesWithRemaining = await Promise.all(unpaidInvoices.map(async (invoice) => {
        // Tính refund cho từng invoice dựa trên supplier_id
        let invoiceRefund = 0;
        const refundSql = `
          SELECT SUM(roi.refund_amount) as total_refund
          FROM return_orders ro
          JOIN return_order_items roi ON ro.return_id = roi.return_id
          WHERE ro.supplier_id = ?
            AND ro.status IN ('approved', 'completed')
            AND ro.type = 'supplier_return'
        `;
        const [refundRows] = await db.promise().query(refundSql, [supplier_id]);
        invoiceRefund = parseFloat(refundRows[0].total_refund || 0);

        const remaining_payable = Math.max(0, parseFloat(invoice.amount_due) - invoiceRefund);
        return {
          ...invoice,
          total_refund: invoiceRefund,
          remaining_payable
        };
      }));

      createResponse(res, 200, true, {
        supplier_id,
        total_payable,
        unpaid_invoices: invoicesWithRemaining
      }, "Supplier payable retrieved successfully.");
    } catch (error) {
      //console.error("🚀 ~ SupplierReportController: getSupplierPayable - Lỗi:", error);
      return errorResponse(res, error.message || "Lỗi server", 500);
    }
  },
};

module.exports = SupplierReportController; 