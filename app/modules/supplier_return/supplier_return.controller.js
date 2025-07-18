const SupplierReturnService = require("./supplier_return.service");
const { createResponse, errorResponse } = require("../../utils/response");

const SupplierReturnController = {
  // Tạo đơn trả hàng nhà cung cấp
  createReturn: async (req, res) => {
    try {
      const { supplier_id, note, details } = req.body;
      if (!supplier_id || !details || !Array.isArray(details) || details.length === 0) {
        return errorResponse(res, "Thiếu thông tin bắt buộc", 400);
      }
      // Validate mỗi item phải có warehouse_id
      for (const item of details) {
        if (!item.product_id || !item.quantity || !item.warehouse_id) {
          return errorResponse(res, "Chi tiết sản phẩm phải có product_id, quantity, warehouse_id", 400);
        }
      }
      const returnData = { supplier_id, note, status: "pending" };
      const result = await SupplierReturnService.createReturnWithDetails(returnData, details);
      return createResponse(res, 201, true, result, "Tạo đơn trả hàng nhà cung cấp thành công");
    } catch (error) {
      return errorResponse(res, error.message || "Lỗi tạo đơn trả hàng nhà cung cấp", 500);
    }
  },

  // Lấy danh sách đơn trả hàng nhà cung cấp
  getReturns: async (req, res) => {
    try {
      const { page = 1, limit = 10, supplier_id, status, created_at_from, created_at_to } = req.query;
      const filters = {};
      if (supplier_id) filters.supplier_id = supplier_id;
      if (status) filters.status = status;
      if (created_at_from) filters.created_at_from = created_at_from;
      if (created_at_to) filters.created_at_to = created_at_to;
      const result = await SupplierReturnService.getReturnsWithPagination(filters, parseInt(page), parseInt(limit));
      return res.status(200).json({
        success: true,
        data: result.returns,
        pagination: result.pagination,
        message: "Lấy danh sách đơn trả hàng nhà cung cấp thành công"
      });
    } catch (error) {
      return errorResponse(res, error.message || "Lỗi lấy danh sách đơn trả hàng nhà cung cấp", 500);
    }
  },

  // Lấy chi tiết đơn trả hàng nhà cung cấp
  getReturnById: async (req, res) => {
    try {
      const { return_id } = req.params;
      if (!return_id) {
        return errorResponse(res, "Thiếu ID đơn trả hàng", 400);
      }
      const result = await SupplierReturnService.getReturnWithDetails(return_id);
      return createResponse(res, 200, true, result, "Lấy chi tiết đơn trả hàng nhà cung cấp thành công");
    } catch (error) {
      return errorResponse(res, error.message || "Lỗi lấy chi tiết đơn trả hàng nhà cung cấp", 500);
    }
  },

  // Duyệt đơn trả hàng nhà cung cấp
  approveReturn: async (req, res) => {
    try {
      const { return_id } = req.params;
      if (!return_id) {
        return errorResponse(res, "Thiếu ID đơn trả hàng", 400);
      }
      const result = await SupplierReturnService.approveReturn(return_id);
      return createResponse(res, 200, true, result, "Duyệt đơn trả hàng nhà cung cấp thành công");
    } catch (error) {
      return errorResponse(res, error.message || "Lỗi duyệt đơn trả hàng nhà cung cấp", 500);
    }
  }
};

module.exports = SupplierReturnController; 