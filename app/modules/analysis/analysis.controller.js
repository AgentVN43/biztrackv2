const { getTotalCount } = require("../../utils/dbUtils");
const { createResponse } = require("../../utils/response");
const AnalysisService = require("./analysis.service");

const AnalysisController = {
  async getInvoicesWithFilters(req, res) {
    try {
      const { fields, filter, sort, page, limit } = req.query;
      const result = await AnalysisService.getInvoicesWithFilters(
        fields,
        filter,
        sort,
        page,
        limit
      );
      return createResponse(res, 200, true, result, "Lấy hóa đơn thành công");
    } catch (error) {
      console.error("Lỗi khi lấy hóa đơn với bộ lọc (Analysis):", error);
      return errorResponse(res, "Lỗi khi lấy hóa đơn (Analysis)", 500);
    }
  },

  async getRevenueByTimePeriod(req, res) {
    try {
      const { period, startDate, endDate } = req.query;
      const revenueData = await AnalysisService.getRevenueByTimePeriod(
        period,
        startDate,
        endDate
      );
      return createResponse(res, 200, true, revenueData, "Lấy thống kê doanh thu thành công");
    } catch (error) {
      console.error("Lỗi khi lấy thống kê doanh thu:", error);
      return errorResponse(res, "Lỗi khi lấy thống kê doanh thu", 500);
    }
  },

  async getOutstandingDebt(req, res) {
    try {
      const outstandingAmount = await AnalysisService.getOutstandingDebt();
      return createResponse(res, 200, true, { total_money: outstandingAmount }, "Lấy thống kê công nợ thành công");
    } catch (error) {
      console.error("Lỗi khi lấy thống kê công nợ:", error);
      return errorResponse(res, "Lỗi khi lấy thống kê công nợ", 500);
    }
  },

  // async getReceivableOrders(req, res) {
  //   try {
  //     const receivableOrders = await AnalysisService.getReceivableOrders();
  //     res.status(200).json({ success: true, data: receivableOrders || [] });
  //   } catch (error) {
  //     console.error("Lỗi khi lấy danh sách order phải thu:", error);
  //     res.status(500).json({ success: false, error: error.message });
  //   }
  // },

  async getReceivableOrders(req, res, next) {
    try {
      const orders = await AnalysisService.getReceivableOrders();
      return createResponse(res, 200, true, orders, "Lấy danh sách đơn hàng phải thu thành công");
    } catch (error) {
      console.error("Lỗi ở Controller...", error);
      return errorResponse(res, error.message || "Lỗi khi lấy danh sách đơn hàng phải thu", 500);
    }
  },

  async getPayablePurchaseOrders(req, res) {
    try {
      const payablePOs = await AnalysisService.getPayablePurchaseOrders();
      return createResponse(res, 200, true, payablePOs, "Lấy danh sách purchase order phải trả thành công");
    } catch (error) {
      console.error("Lỗi khi lấy danh sách purchase order phải trả:", error);
      return errorResponse(res, "Lỗi khi lấy danh sách purchase order phải trả", 500);
    }
  },

  async getTotalCustomers(req, res) {
    try {
      const total = await getTotalCount("customers");
      return createResponse(res, 200, true, { total });
    } catch (error) {
      console.error("Lỗi khi lấy tổng số khách hàng (Controller):", error);
      return createResponse(
        res,
        500,
        false,
        null,
        "Lỗi khi lấy tổng số khách hàng."
      );
    }
  },

    async getTotalProducts(req, res) {
    try {
      const total = await getTotalCount("products");
      return createResponse(res, 200, true, { total }, "Lấy tổng số sản phẩm thành công");
    } catch (error) {
      console.error("Lỗi khi lấy tổng số sản phẩm (Controller):", error);
      return errorResponse(res, "Lỗi khi lấy tổng số sản phẩm", 500);
    }
  },

  async getNewCustomersInCurrentMonth(req, res) {
    try {
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth() + 1; // Tháng trong JS là 0-11

      const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
      const endDate = `${year}-${String(month).padStart(2, "0")}-${new Date(
        year,
        month,
        0
      ).getDate()}`;

      const whereClause = `WHERE DATE(created_at) BETWEEN '${startDate}' AND '${endDate}'`;
      const newCustomersCount = await getTotalCount("customers", whereClause);

      return createResponse(res, 200, true, { newCustomersCount }, "Lấy số khách hàng mới trong tháng thành công");
    } catch (error) {
      console.error(
        "Lỗi khi lấy khách hàng mới trong tháng (Controller):",
        error
      );
      return errorResponse(res, "Lỗi khi lấy khách hàng mới trong tháng", 500);
    }
  },

  async getNewProductsInCurrentMonth(req, res) {
    try {
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth() + 1;

      const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
      const endDate = `${year}-${String(month).padStart(2, "0")}-${new Date(
        year,
        month,
        0
      ).getDate()}`;

      const whereClause = `WHERE DATE(created_at) BETWEEN '${startDate}' AND '${endDate}'`;
      const newProductsCount = await getTotalCount("products", whereClause);

      return createResponse(res, 200, true, { newProductsCount }, "Lấy số sản phẩm mới trong tháng thành công");
    } catch (error) {
      console.error(
        "Lỗi khi lấy sản phẩm mới trong tháng (Controller):",
        error
      );
      return errorResponse(res, "Lỗi khi lấy sản phẩm mới trong tháng", 500);
    }
  },


};

module.exports = AnalysisController;
