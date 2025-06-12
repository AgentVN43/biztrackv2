const createResponse = require("../../utils/response");
const CustomerReportService = require("./customer_report.service"); // Đảm bảo đường dẫn đúng

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
      next(error);
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
      next(error);
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
      next(error);
    }
  },

  /**
   * Lấy tổng công nợ cần thu từ một khách hàng.
   * GET /api/customers/:id/receivables
   */
  getCustomerReceivables: async (req, res, next) => {
    const customer_id = req.params.id;
    try {
      const receivables = await CustomerReportService.getReceivables(
        customer_id
      );
      createResponse(
        res,
        200,
        true,
        { customer_id, total_receivables: receivables },
        "Customer receivables retrieved successfully."
      );
    } catch (error) {
      console.error(
        "🚀 ~ customer_report.controller.js: getCustomerReceivables - Lỗi:",
        error
      );
      next(error);
    }
  },
};

module.exports = CustomerReportController;
