const CustomerReturnService = require("./customer_return.service");
const { createResponse, errorResponse } = require("../../utils/response");

const CustomerReturnController = {
  // Tạo đơn trả hàng mới
  createReturn: async (req, res) => {
    try {
      const {
        customer_id,
        order_id,
        po_id,
        supplier_id,
        type = "customer_return",
        note,
        shipping_fee,
        order_amount,
        return_details
      } = req.body;

      // Validate dữ liệu đầu vào
      if (!customer_id || !return_details || !Array.isArray(return_details)) {
        return errorResponse(res, "Thiếu thông tin bắt buộc", 400);
      }

      // Kiểm tra khả năng trả hàng của đơn hàng nếu có order_id
      if (order_id) {
        const eligibility = await CustomerReturnService.checkOrderReturnEligibility(order_id);
        if (!eligibility.eligible) {
          return errorResponse(res, eligibility.reason, 400);
        }
      }

      const returnData = {
        customer_id,
        order_id,
        po_id,
        supplier_id,
        type,
        status: "pending",
        note,
        shipping_fee,
        order_amount
      };

      const result = await CustomerReturnService.createReturnWithDetails(returnData, return_details);

      return createResponse(res, 201, true, result, "Tạo đơn trả hàng thành công");
    } catch (error) {
      //console.error("Lỗi tạo đơn trả hàng:", error);
      return errorResponse(res, error.message || "Lỗi tạo đơn trả hàng", 500);
    }
  },

  // Lấy danh sách đơn trả hàng
  getReturns: async (req, res) => {
    try {
      const {
        page = 1,
        limit = 10,
        customer_id,
        order_id,
        status,
        created_at_from,
        created_at_to
      } = req.query;

      const filters = {};
      if (customer_id) filters.customer_id = customer_id;
      if (order_id) filters.order_id = order_id;
      if (status) filters.status = status;
      if (created_at_from) filters.created_at_from = created_at_from;
      if (created_at_to) filters.created_at_to = created_at_to;

      const result = await CustomerReturnService.getReturnsWithPagination(
        filters,
        parseInt(page),
        parseInt(limit)
      );

      // Sửa lại response: data là mảng, pagination là object tách riêng
      return res.status(200).json({
        success: true,
        data: result.returns,
        pagination: result.pagination,
        message: "Lấy danh sách đơn trả hàng thành công"
      });
    } catch (error) {
      //console.error("Lỗi lấy danh sách đơn trả hàng:", error);
      return errorResponse(res, error.message || "Lỗi lấy danh sách đơn trả hàng", 500);
    }
  },

  // Lấy chi tiết đơn trả hàng
  getReturnById: async (req, res) => {
    try {
      const { return_id } = req.params;

      if (!return_id) {
        return errorResponse(res, "Thiếu ID đơn trả hàng", 400);
      }

      const result = await CustomerReturnService.getReturnWithDetails(return_id);

      // Nếu có order_id, trả thêm tổng refund và giá trị còn lại của order
      let orderSummary = null;
      if (result && result.order_id) {
        try {
          const Order = require('../orders/order.service');
          orderSummary = await Order.getOrderWithReturnSummary(result.order_id);
        } catch (e) { orderSummary = null; }
      }

      return createResponse(res, 200, true, {
        ...result,
        order_summary: orderSummary
      }, "Lấy chi tiết đơn trả hàng thành công");
    } catch (error) {
      //console.error("Lỗi lấy chi tiết đơn trả hàng:", error);
      return errorResponse(res, error.message || "Lỗi lấy chi tiết đơn trả hàng", 500);
    }
  },

  // Cập nhật đơn trả hàng
  updateReturn: async (req, res) => {
    try {
      const { return_id } = req.params;
      const {
        status,
        note
      } = req.body;

      if (!return_id) {
        return errorResponse(res, "Thiếu ID đơn trả hàng", 400);
      }

      const updateData = {};
      if (status !== undefined) updateData.status = status;
      if (note !== undefined) updateData.note = note;

      const result = await CustomerReturnService.updateReturn(return_id, updateData);

      return createResponse(res, 200, true, result, "Cập nhật đơn trả hàng thành công");
    } catch (error) {
      //console.error("Lỗi cập nhật đơn trả hàng:", error);
      return errorResponse(res, error.message || "Lỗi cập nhật đơn trả hàng", 500);
    }
  },

  // Xử lý đơn trả hàng
  processReturn: async (req, res) => {
    try {
      const { return_id } = req.params;
      const processed_by = req.user?.user_id || "system";

      if (!return_id) {
        return errorResponse(res, "Thiếu ID đơn trả hàng", 400);
      }

      const result = await CustomerReturnService.processReturn(return_id, processed_by);

      return createResponse(res, 200, true, result, "Xử lý đơn trả hàng thành công");
    } catch (error) {
      //console.error("Lỗi xử lý đơn trả hàng:", error);
      return errorResponse(res, error.message || "Lỗi xử lý đơn trả hàng", 500);
    }
  },

  // Phê duyệt đơn trả hàng
  approveReturn: async (req, res) => {
    try {
      const { return_id } = req.params;

      if (!return_id) {
        return errorResponse(res, "Thiếu ID đơn trả hàng", 400);
      }

      const result = await CustomerReturnService.approveReturn(return_id);

      return createResponse(res, 200, true, result, "Phê duyệt đơn trả hàng thành công");
    } catch (error) {
      //console.error("Lỗi phê duyệt đơn trả hàng:", error);
      return errorResponse(res, error.message || "Lỗi phê duyệt đơn trả hàng", 500);
    }
  },

  // Từ chối đơn trả hàng
  rejectReturn: async (req, res) => {
    try {
      const { return_id } = req.params;
      const { rejection_reason } = req.body;

      if (!return_id) {
        return errorResponse(res, "Thiếu ID đơn trả hàng", 400);
      }

      if (!rejection_reason) {
        return errorResponse(res, "Thiếu lý do từ chối", 400);
      }

      const result = await CustomerReturnService.rejectReturn(return_id, rejection_reason);

      return createResponse(res, 200, true, result, "Từ chối đơn trả hàng thành công");
    } catch (error) {
      //console.error("Lỗi từ chối đơn trả hàng:", error);
      return errorResponse(res, error.message || "Lỗi từ chối đơn trả hàng", 500);
    }
  },

  // Xóa đơn trả hàng
  deleteReturn: async (req, res) => {
    try {
      const { return_id } = req.params;

      if (!return_id) {
        return errorResponse(res, "Thiếu ID đơn trả hàng", 400);
      }

      const result = await CustomerReturnService.deleteReturn(return_id);

      return createResponse(res, 200, true, result, "Xóa đơn trả hàng thành công");
    } catch (error) {
      //console.error("Lỗi xóa đơn trả hàng:", error);
      return errorResponse(res, error.message || "Lỗi xóa đơn trả hàng", 500);
    }
  },

  // Lấy thống kê trả hàng
  getReturnStatistics: async (req, res) => {
    try {
      const {
        created_at_from,
        created_at_to
      } = req.query;

      const filters = {};
      if (created_at_from) filters.created_at_from = created_at_from;
      if (created_at_to) filters.created_at_to = created_at_to;

      const result = await CustomerReturnService.getReturnStatistics(filters);

      return createResponse(res, 200, true, result, "Lấy thống kê trả hàng thành công");
    } catch (error) {
      //console.error("Lỗi lấy thống kê trả hàng:", error);
      return errorResponse(res, error.message || "Lỗi lấy thống kê trả hàng", 500);
    }
  },

  // Kiểm tra khả năng trả hàng của đơn hàng
  checkOrderEligibility: async (req, res) => {
    try {
      const { order_id } = req.params;

      if (!order_id) {
        return errorResponse(res, "Thiếu ID đơn hàng", 400);
      }

      const result = await CustomerReturnService.checkOrderReturnEligibility(order_id);

      return createResponse(res, 200, true, result, "Kiểm tra khả năng trả hàng thành công");
    } catch (error) {
      //console.error("Lỗi kiểm tra khả năng trả hàng:", error);
      return errorResponse(res, error.message || "Lỗi kiểm tra khả năng trả hàng", 500);
    }
  },

  // Tính toán số tiền hoàn trả
  calculateRefund: async (req, res) => {
    try {
      const { return_id } = req.params;

      if (!return_id) {
        return errorResponse(res, "Thiếu ID đơn trả hàng", 400);
      }

      const refundAmount = await CustomerReturnService.calculateRefundAmount(return_id);

      return createResponse(res, 200, true, {
        return_id,
        refund_amount: refundAmount
      }, "Tính toán số tiền hoàn trả thành công");
    } catch (error) {
      //console.error("Lỗi tính toán số tiền hoàn trả:", error);
      return errorResponse(res, error.message || "Lỗi tính toán số tiền hoàn trả", 500);
    }
  },

  // Cập nhật số tiền hoàn trả cho item
  updateRefundAmount: async (req, res) => {
    try {
      const { return_item_id } = req.params;
      const { refund_amount } = req.body;

      if (!return_item_id) {
        return errorResponse(res, "Thiếu ID item trả hàng", 400);
      }

      if (refund_amount === undefined || refund_amount < 0) {
        return errorResponse(res, "Số tiền hoàn trả không hợp lệ", 400);
      }

      const result = await CustomerReturnService.updateRefundAmount(return_item_id, refund_amount);

      return createResponse(res, 200, true, result, "Cập nhật số tiền hoàn trả thành công");
    } catch (error) {
      //console.error("Lỗi cập nhật số tiền hoàn trả:", error);
      return errorResponse(res, error.message || "Lỗi cập nhật số tiền hoàn trả", 500);
    }
  },

  // Lấy báo cáo trả hàng
  getReturnReport: async (req, res) => {
    try {
      const {
        date_from,
        date_to
      } = req.query;

      if (!date_from || !date_to) {
        return errorResponse(res, "Thiếu thông tin ngày báo cáo", 400);
      }

      const result = await CustomerReturnService.getReturnReport(date_from, date_to);

      return createResponse(res, 200, true, result, "Lấy báo cáo trả hàng thành công");
    } catch (error) {
      //console.error("Lỗi lấy báo cáo trả hàng:", error);
      return errorResponse(res, error.message || "Lỗi lấy báo cáo trả hàng", 500);
    }
  },

  // Lấy đơn trả hàng theo khách hàng
  getReturnsByCustomer: async (req, res) => {
    try {
      const { customer_id } = req.params;
      const { page = 1, limit = 10 } = req.query;

      if (!customer_id) {
        return errorResponse(res, "Thiếu ID khách hàng", 400);
      }

      const result = await CustomerReturnService.getReturnsByCustomer(
        customer_id,
        { limit: parseInt(limit), offset: (parseInt(page) - 1) * parseInt(limit) }
      );

      return createResponse(res, 200, true, result, "Lấy đơn trả hàng theo khách hàng thành công");
    } catch (error) {
      //console.error("Lỗi lấy đơn trả hàng theo khách hàng:", error);
      return errorResponse(res, error.message || "Lỗi lấy đơn trả hàng theo khách hàng", 500);
    }
  },

  // Lấy đơn trả hàng theo đơn hàng
  getReturnsByOrder: async (req, res) => {
    try {
      const { order_id } = req.params;

      if (!order_id) {
        return errorResponse(res, "Thiếu ID đơn hàng", 400);
      }

      const result = await CustomerReturnService.getReturnsByOrder(order_id);

      return createResponse(res, 200, true, result, "Lấy đơn trả hàng theo đơn hàng thành công");
    } catch (error) {
      //console.error("Lỗi lấy đơn trả hàng theo đơn hàng:", error);
      return errorResponse(res, error.message || "Lỗi lấy đơn trả hàng theo đơn hàng", 500);
    }
  }
};

module.exports = CustomerReturnController; 