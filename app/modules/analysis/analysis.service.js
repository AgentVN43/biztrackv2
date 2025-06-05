const AnalysisModel = require("./analysis.model");

const AnalysisService = {
  async getInvoicesWithFilters(fields, filter, sort, page, limit) {
    try {
      const invoices = await AnalysisModel.findInvoicesWithFilters(
        fields,
        filter,
        sort,
        page,
        limit
      );
      const total = await AnalysisModel.countInvoicesWithFilters(filter);
      return {
        data: invoices,
        total: total,
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 10,
      };
    } catch (error) {
      console.error(
        "Lỗi ở Service khi lấy hóa đơn với bộ lọc (Analysis):",
        error
      );
      throw error;
    }
  },

  async getRevenueByTimePeriod(period, startDate, endDate) {
    try {
      return await AnalysisModel.getRevenueByTimePeriod(
        period,
        startDate,
        endDate
      );
    } catch (error) {
      console.error("Lỗi ở Service khi lấy thống kê doanh thu:", error);
      throw error;
    }
  },

  async getOutstandingDebt() {
    try {
      return await AnalysisModel.getOutstandingDebt();
    } catch (error) {
      console.error("Lỗi ở Service khi lấy thống kê công nợ:", error);
      throw error;
    }
  },

  async getReceivableOrders() {
    try {
      return await AnalysisModel.getReceivableOrders();
    } catch (error) {
      console.error("Lỗi ở Service khi lấy danh sách order phải thu:", error);
      throw error;
    }
  },

  async getPayablePurchaseOrders() {
    try {
      return await AnalysisModel.getPayablePurchaseOrders();
    } catch (error) {
      console.error(
        "Lỗi ở Service khi lấy danh sách purchase order phải trả:",
        error
      );
      throw error;
    }
  },
};

module.exports = AnalysisService;
