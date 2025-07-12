const CustomerReportService = require("./customer_report.service");
const TransactionService = require("../transactions/transaction.service");
const { createResponse, errorResponse } = require("../../utils/response");
const CustomerReportController = {
  /**
   * Lấy tổng quan (tổng đơn hàng, tổng chi tiêu) của một khách hàng.
   * GET /api/customers/:id/overview
   */
  getCustomerOverview: async (req, res, next) => {
    const customer_id = req.params.id;
    try {
      const overview = await CustomerReportService.getTotalOrdersAndExpenditure(
        customer_id
      );
      createResponse(
        res,
        200,
        true,
        overview,
        "Customer overview retrieved successfully."
      );
    } catch (error) {
      console.error(
        "🚀 ~ customer_report.controller.js: getCustomerOverview - Lỗi:",
        error
      );
      return errorResponse(res, error.message || "Lỗi server", 500);
    }
  },

  /**
   * Lấy lịch sử bán hàng và trả hàng chi tiết của một khách hàng.
   * GET /api/customers/:id/sales-return-history
   */
  getCustomerSalesReturnHistory: async (req, res, next) => {
    const customer_id = req.params.id;
    try {
      const history = await CustomerReportService.getSalesReturnHistory(
        customer_id
      );
      createResponse(
        res,
        200,
        true,
        history,
        "Customer sales/return history retrieved successfully."
      );
    } catch (error) {
      console.error(
        "🚀 ~ customer_report.controller.js: getCustomerSalesReturnHistory - Lỗi:",
        error
      );
      return errorResponse(res, error.message || "Lỗi server", 500);
    }
  },

  /**
   * Lấy lịch sử tất cả các đơn hàng của một khách hàng, bao gồm chi tiết từng đơn hàng.
   * GET /api/customers/:id/order-history
   */
  getCustomerOrderHistory: async (req, res, next) => {
    const customer_id = req.params.id;
    try {
      const orderHistory =
        await CustomerReportService.getOrderHistoryWithDetails(customer_id);
      createResponse(
        res,
        200,
        true,
        orderHistory,
        "Customer order history retrieved successfully."
      );
    } catch (error) {
      console.error(
        "🚀 ~ customer_report.controller.js: getCustomerOrderHistory - Lỗi:",
        error
      );
      return errorResponse(res, error.message || "Lỗi server", 500);
    }
  },

  /**
   * Lấy tổng công nợ cần thu từ một khách hàng.
   * GET /api/customers/:id/receivables
   */
  //

  getCustomerReceivables: async (req, res, next) => {
    const customer_id = req.params.id;
    try {
      // Lấy tổng công nợ
      const totalReceivables = await CustomerReportService.getReceivables(
        customer_id
      );

      // Lấy danh sách hóa đơn chưa thanh toán đủ
      const unpaidInvoices =
        await CustomerReportService.getUnpaidOrPartiallyPaidInvoices(
          customer_id
        );

      // Kết hợp cả hai thông tin vào phản hồi
      const responseData = {
        customer_id,
        total_receivables: totalReceivables,
        unpaid_invoices: unpaidInvoices,
      };

      createResponse(
        res,
        200,
        true,
        responseData,
        "Customer receivables retrieved successfully."
      );
    } catch (error) {
      console.error(
        "🚀 ~ customer_report.controller.js: getCustomerReceivables - Lỗi:",
        error
      );
      return errorResponse(res, error.message || "Lỗi server", 500);
    }
  },

  getCustomerTransactions: async (req, res, next) => {
    const { customerId } = req.params; // Lấy customerId từ URL params
    try {
      const transactions = await TransactionService.getTransactionsByCustomerId(
        customerId
      );
      if (!transactions || transactions.length === 0) {
        return createResponse(
          res,
          404,
          false,
          null,
          `Không tìm thấy giao dịch nào cho khách hàng ID: ${customerId}.`
        );
      }
      createResponse(
        res,
        200,
        true,
        transactions,
        "Lịch sử giao dịch của khách hàng đã được tải thành công."
      );
    } catch (error) {
      console.error(
        "🚀 ~ CustomerReportController: getCustomerTransactions - Lỗi:",
        error
      );
      return errorResponse(res, error.message || "Lỗi server", 500);
    }
  },

  getCustomerFinancialLedger: async (req, res, next) => {
    const customer_id = req.params.id;
    try {
      const ledger = await CustomerReportService.getCustomerFinancialLedger(
        customer_id
      );
      if (ledger.length === 0) {
        return createResponse(
          res,
          404,
          false,
          null,
          `Không tìm thấy các mục nhập sổ cái tài chính cho khách hàng ID: ${customer_id}.`
        );
      }
      createResponse(
        res,
        200,
        true,
        ledger,
        "Sổ cái tài chính của khách hàng đã được tải thành công."
      );
    } catch (error) {
      console.error(
        "🚀 ~ CustomerReportController: getCustomerFinancialLedger - Lỗi:",
        error
      );
      return errorResponse(res, error.message || "Lỗi server", 500);
    }
  },

  /**
   * Lấy sổ cái giao dịch chi tiết của khách hàng
   * Hiển thị tất cả giao dịch theo thứ tự thời gian với dư nợ
   * GET /api/customers/:id/transaction-ledger
   */
  getCustomerTransactionLedger: async (req, res, next) => {
    const customer_id = req.params.id;
    try {
      const ledger = await CustomerReportService.getCustomerTransactionLedger(
        customer_id
      );
      
      // Trả về mảng rỗng thay vì 404 để tránh loop ở frontend
      createResponse(
        res,
        200,
        true,
        ledger || [],
        ledger && ledger.length > 0 
          ? "Sổ cái giao dịch của khách hàng đã được tải thành công."
          : "Không có dữ liệu giao dịch cho khách hàng này."
      );
    } catch (error) {
      console.error(
        "🚀 ~ CustomerReportController: getCustomerTransactionLedger - Lỗi:",
        error
      );
      return errorResponse(res, error.message || "Lỗi server", 500);
    }
  },
};

module.exports = CustomerReportController;
