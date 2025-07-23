const SupplierReturnService = require("./supplier_return.service");
const { createResponse, errorResponse } = require("../../utils/response");

const SupplierReturnController = {
  // Tạo đơn trả hàng nhà cung cấp
  createReturn: async (req, res) => {
    try {
      const { supplier_id, note, details, warehouse_id } = req.body;
      if (!supplier_id || !details || !Array.isArray(details) || details.length === 0) {
        return errorResponse(res, "Thiếu thông tin bắt buộc", 400);
      }
      // Nếu warehouse_id ngoài cùng tồn tại, gán vào từng item nếu item chưa có warehouse_id
      const detailsWithWarehouse = details.map(item => ({
        ...item,
        warehouse_id: item.warehouse_id || warehouse_id
      }));
      for (const item of detailsWithWarehouse) {
        if (!item.product_id || !item.quantity || !item.warehouse_id) {
          return errorResponse(res, "Chi tiết sản phẩm phải có product_id, quantity, warehouse_id", 400);
        }
      }
      const returnData = { supplier_id, note, status: "pending" };
      const result = await SupplierReturnService.createReturnWithDetails(returnData, detailsWithWarehouse);
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
      // Lấy chi tiết cho từng đơn trả hàng (bao gồm warehouse_id cho từng item)
      const returnsWithDetails = await Promise.all(
        result.returns.map(async (r) => {
          const details = await SupplierReturnService.getReturnWithDetails(r.return_id);
          return { ...r, details: details.details };
        })
      );
      return res.status(200).json({
        success: true,
        data: returnsWithDetails,
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
      // Đảm bảo trả về details có warehouse_id cho từng item
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
  },

  // Cập nhật đơn trả hàng nhà cung cấp
  updateReturn: async (req, res) => {
    try {
      const { return_id } = req.params;
      const { supplier_id, note, details, warehouse_id } = req.body;
      
      if (!return_id) {
        return errorResponse(res, "Thiếu ID đơn trả hàng", 400);
      }
      if (!supplier_id || !details || !Array.isArray(details) || details.length === 0) {
        return errorResponse(res, "Thiếu thông tin bắt buộc", 400);
      }
      
      // Nếu warehouse_id ngoài cùng tồn tại, gán vào từng item nếu item chưa có warehouse_id
      const detailsWithWarehouse = details.map(item => ({
        ...item,
        warehouse_id: item.warehouse_id || warehouse_id
      }));
      for (const item of detailsWithWarehouse) {
        if (!item.product_id || !item.quantity || !item.warehouse_id) {
          return errorResponse(res, "Chi tiết sản phẩm phải có product_id, quantity, warehouse_id", 400);
        }
      }
      
      const result = await SupplierReturnService.updateReturnWithDetails(return_id, supplier_id, note, detailsWithWarehouse);
      return createResponse(res, 200, true, result, "Cập nhật đơn trả hàng nhà cung cấp thành công");
    } catch (error) {
      return errorResponse(res, error.message || "Lỗi cập nhật đơn trả hàng nhà cung cấp", 500);
    }
  },

  // Xóa đơn trả hàng nhà cung cấp
  deleteReturn: async (req, res) => {
    try {
      const { return_id } = req.params;
      if (!return_id) {
        return errorResponse(res, "Thiếu ID đơn trả hàng", 400);
      }
      const result = await SupplierReturnService.deleteReturn(return_id);
      return createResponse(res, 200, true, result, "Xóa đơn trả hàng nhà cung cấp thành công");
    } catch (error) {
      return errorResponse(res, error.message || "Lỗi xóa đơn trả hàng nhà cung cấp", 500);
    }
  },

  // Lấy danh sách đơn trả hàng theo nhà cung cấp
  getReturnBySupplierId: async (req, res) => {
    try {
      const { supplier_id } = req.params;
      const { page = 1, limit = 10 } = req.query;
      if (!supplier_id) {
        return errorResponse(res, "Thiếu ID nhà cung cấp", 400);
      }
      const result = await SupplierReturnService.getReturnBySupplierId(supplier_id, parseInt(page), parseInt(limit));
      // Lấy chi tiết cho từng đơn trả hàng
      const returnsWithDetails = await Promise.all(
        result.returns.map(async (r) => {
          const details = await SupplierReturnService.getReturnWithDetails(r.return_id);
          return { ...r, details: details.details };
        })
      );
      return res.status(200).json({
        success: true,
        data: returnsWithDetails,
        pagination: result.pagination,
        message: "Lấy danh sách đơn trả hàng theo nhà cung cấp thành công"
      });
    } catch (error) {
      return errorResponse(res, error.message || "Lỗi lấy danh sách đơn trả hàng theo nhà cung cấp", 500);
    }
  },

  // Lấy danh sách đơn trả hàng theo trạng thái
  getReturnByStatus: async (req, res) => {
    try {
      const { status } = req.params;
      const { page = 1, limit = 10 } = req.query;
      if (!status) {
        return errorResponse(res, "Thiếu trạng thái", 400);
      }
      const result = await SupplierReturnService.getReturnByStatus(status, parseInt(page), parseInt(limit));
      // Lấy chi tiết cho từng đơn trả hàng
      const returnsWithDetails = await Promise.all(
        result.returns.map(async (r) => {
          const details = await SupplierReturnService.getReturnWithDetails(r.return_id);
          return { ...r, details: details.details };
        })
      );
      return res.status(200).json({
        success: true,
        data: returnsWithDetails,
        pagination: result.pagination,
        message: "Lấy danh sách đơn trả hàng theo trạng thái thành công"
      });
    } catch (error) {
      return errorResponse(res, error.message || "Lỗi lấy danh sách đơn trả hàng theo trạng thái", 500);
    }
  }

  
};

module.exports = SupplierReturnController; 