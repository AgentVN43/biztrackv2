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
      //console.error("Lỗi ở Service khi lấy thống kê doanh thu:", error);
      throw error;
    }
  },

  async getOutstandingDebt() {
    try {
      return await AnalysisModel.getOutstandingDebt();
    } catch (error) {
      //console.error("Lỗi ở Service khi lấy thống kê công nợ:", error);
      throw error;
    }
  },

  async getReceivableOrders() {
    try {
      return await AnalysisModel.getReceivableOrders();
    } catch (error) {
      //console.error("Lỗi ở Service khi lấy danh sách order phải thu:", error);
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

  async getFinanceManagementByPeriod(query) {
    const merged = await AnalysisModel.getFinanceManagementByPeriod(query);
    const title = [];
    const revenue = [];
    const expense = [];
    Object.keys(merged).sort().forEach(period => {
      title.push(period); // giữ nguyên, không format theo type
      revenue.push((merged[period].revenue - merged[period].total_order_return + merged[period].cashFlowRevenue) / 1_000_000);
      expense.push((merged[period].expense - merged[period].total_purchase_return + merged[period].cashFlowExpense) / 1_000_000);
    });
    return { title, revenue, expense };
  },

  async getDetailedFinanceManagementByPeriod(query) {
    try {
      const merged = await AnalysisModel.getDetailedFinanceManagementByPeriod(query);
      
      // Format dữ liệu cho response
      const formattedData = {
        time_periods: [],
        metrics: {
          total_revenue: [],
          total_discount: [],
          total_shipping_fee: [],
          total_customer_return: [],
          total_cost_of_goods: [],
          total_supplier_return: [],
          total_other_revenue: [],
          total_other_expense: [],
          net_revenue: [],
          gross_profit: [],
          net_profit: []
        }
      };

      // Sắp xếp theo thời gian và format dữ liệu
      Object.keys(merged).sort().forEach(period => {
        formattedData.time_periods.push(period);
        const row = merged[period];
        
        // Thêm tất cả metrics vào arrays tương ứng
        Object.keys(formattedData.metrics).forEach(metric => {
          formattedData.metrics[metric].push(Number(row[metric]) || 0);
        });
      });

      return formattedData;
    } catch (error) {
      console.error("Lỗi ở Service khi lấy thống kê tài chính chi tiết:", error);
      throw error;
    }
  },

  async getTopCustomers(query) {
    return await AnalysisModel.getTopCustomers(query);
  },

  async getTopSellingProducts(query) {
    try {
      return await AnalysisModel.getTopSellingProducts(query);
    } catch (error) {
      //console.error("Lỗi ở Service khi lấy top sản phẩm bán chạy nhất:", error);
      throw error;
    }
  },

  async getTopPurchasingSuppliers(query) {
    try {
      return await AnalysisModel.getTopPurchasingSuppliers(query);
    } catch (error) {
      //console.error("Lỗi ở Service khi lấy top nhà cung cấp nhập hàng nhiều nhất:", error);
      throw error;
    }
  },

  async getRevenueByCategory(query) {
    try {
      return await AnalysisModel.getRevenueByCategory(query);
    } catch (error) {
      //console.error("Lỗi ở Service khi lấy doanh thu theo danh mục:", error);
      throw error;
    }
  },
};

module.exports = AnalysisService;
