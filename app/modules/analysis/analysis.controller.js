const { getTotalCount } = require("../../utils/dbUtils");
const createResponse = require("../../utils/response");
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
      res.json(result);
    } catch (error) {
      console.error("Lỗi khi lấy hóa đơn với bộ lọc (Analysis):", error);
      res.status(500).json({ message: "Lỗi khi lấy hóa đơn (Analysis)" });
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
      res.json(revenueData);
    } catch (error) {
      console.error("Lỗi khi lấy thống kê doanh thu:", error);
      res.status(500).json({ message: "Lỗi khi lấy thống kê doanh thu" });
    }
  },

  async getOutstandingDebt(req, res) {
    try {
      const outstandingAmount = await AnalysisService.getOutstandingDebt();
      res.json({ total_money: outstandingAmount });
    } catch (error) {
      console.error("Lỗi khi lấy thống kê công nợ:", error);
      res.status(500).json({ message: "Lỗi khi lấy thống kê công nợ" });
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
      return createResponse(res, 200, true, orders);
    } catch (error) {
      console.error("Lỗi ở Controller...", error);
      return createResponse(res, 500, false, null, error.message);
    }
  },

  async getPayablePurchaseOrders(req, res) {
    try {
      const payablePOs = await AnalysisService.getPayablePurchaseOrders();
      res.json(payablePOs);
    } catch (error) {
      console.error("Lỗi khi lấy danh sách purchase order phải trả:", error);
      res
        .status(500)
        .json({ message: "Lỗi khi lấy danh sách purchase order phải trả" });
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

      return createResponse(res, 200, true, { newCustomersCount });
    } catch (error) {
      console.error(
        "Lỗi khi lấy khách hàng mới trong tháng (Controller):",
        error
      );
      return createResponse(
        res,
        500,
        false,
        null,
        "Lỗi khi lấy khách hàng mới trong tháng."
      );
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

      return createResponse(res, 200, true, { newProductsCount });
    } catch (error) {
      console.error(
        "Lỗi khi lấy sản phẩm mới trong tháng (Controller):",
        error
      );
      return createResponse(
        res,
        500,
        false,
        null,
        "Lỗi khi lấy sản phẩm mới trong tháng."
      );
    }
  },


};

module.exports = AnalysisController;
