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

  async getFinanceManagementByPeriod({ type = 'month', year, month }) {
    const merged = await AnalysisModel.getFinanceManagementByPeriod({ type, year, month });
    const title = [];
    const revenue = [];
    const expense = [];
    Object.keys(merged).sort().forEach(period => {
      let label;
      if (type === 'month') {
        const [year, m] = period.split('-');
        label = `Tháng ${parseInt(m)}`;
      } else if (type === 'week') {
        label = period.replace(/\d{4}-W/, 'Tuần ');
      } else if (type === 'day') {
        const parts = period.split('-');
        if (parts.length === 3) {
          const [y, m, d] = parts;
          label = `${d}/${m}`;
        } else {
          label = period;
        }
      } else {
        label = period;
      }
      title.push(label);
      revenue.push(Number(merged[period].revenue - merged[period].total_order_return + merged[period].cashFlowRevenue) / 1_000_000);
      expense.push(Number(merged[period].expense - merged[period].total_purchase_return + merged[period].cashFlowExpense) / 1_000_000);
    });
    return { title, revenue, expense };
  },

  async getTopCustomers(startDate, endDate, limit = 5) {
    return await AnalysisModel.getTopCustomers(startDate, endDate, limit);
  },

  async getTopSellingProducts({ startDate, endDate, limit = 10 }) {
    try {
      return await AnalysisModel.getTopSellingProducts({ startDate, endDate, limit });
    } catch (error) {
      console.error("Lỗi ở Service khi lấy top sản phẩm bán chạy nhất:", error);
      throw error;
    }
  },

  async getTopPurchasingSuppliers({ startDate, endDate, limit = 10 }) {
    try {
      return await AnalysisModel.getTopPurchasingSuppliers({ startDate, endDate, limit });
    } catch (error) {
      console.error("Lỗi ở Service khi lấy top nhà cung cấp nhập hàng nhiều nhất:", error);
      throw error;
    }
  },

  async getRevenueByCategory({ startDate, endDate }) {
    try {
      return await AnalysisModel.getRevenueByCategory({ startDate, endDate });
    } catch (error) {
      console.error("Lỗi ở Service khi lấy doanh thu theo danh mục:", error);
      throw error;
    }
  },
};

module.exports = AnalysisService;
