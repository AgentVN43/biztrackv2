const TransactionService = require("../transactions/transaction.service");
const TransactionModel = require("../transactions/transaction.model");
const { createResponse, errorResponse } = require("../../utils/response");
const SupplierReportService = require("./supplier_report.service");

const SupplierReportController = {
  /**
   * Lấy sổ cái giao dịch chi tiết của nhà cung cấp
   * Hiển thị tất cả giao dịch theo thứ tự thời gian với dư nợ
   * GET /api/suppliers/:id/transaction-ledger
   */
  getSupplierTransactionLedger: async (req, res, next) => {
    const supplier_id = req.params.id;
    try {
      const ledger = await SupplierReportService.getSupplierTransactionLedger(
        supplier_id
      );
      
      // Trả về mảng rỗng thay vì 404 để tránh loop ở frontend
      createResponse(
        res,
        200,
        true,
        ledger || [],
        ledger && ledger.length > 0 
          ? "Sổ cái giao dịch của nhà cung cấp đã được tải thành công."
          : "Không có dữ liệu giao dịch cho nhà cung cấp này."
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
      const orderHistory = await SupplierReportService.getSupplierOrderHistoryWithDetails(supplier_id);
      createResponse(
        res,
        200,
        true,
        orderHistory,
        "Supplier order history retrieved successfully."
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
      const transaction = await TransactionModel.createTransaction({
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
};

module.exports = SupplierReportController; 