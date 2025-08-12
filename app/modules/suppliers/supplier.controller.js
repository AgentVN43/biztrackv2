const SupplierService = require("./supplier.service"); // Ensure the correct path to your supplier.service.js
const { createResponse } = require("../../utils/response"); // Ensure the correct path to your createResponse utility
// Import search/filter service
const {
  EntityHelpers,
  SearchFilterService,
} = require("../../utils/searchFilterService");
const SupplierModel = require('./supplier.model');

const SupplierController = {
  /**
   * Handles POST request to create a new supplier.
   * @param {Object} req - Express request object.
   * @param {Object} res - Express response object.
   * @param {Function} next - Express next middleware function.
   */
  createSupplier: async (req, res, next) => {
    try {
      const newSupplier = await SupplierService.createSupplier(req.body);
      createResponse(
        res,
        201,
        true,
        newSupplier,
        "Supplier created successfully."
      );
    } catch (error) {
      console.error(
        "🚀 ~ supplier.controller.js: createSupplier - Error:",
        error
      );
      next(error); // Pass error to global error handler
    }
  },

  /**
   * Handles GET request to retrieve all suppliers.
   * @param {Object} req - Express request object.
   * @param {Object} res - Express response object.
   * @param {Function} next - Express next middleware function.
   */
  getAllSuppliers: async (req, res, next) => {
    try {
      const { page = 1, limit = 10 } = req.query;
      const parsedPage = parseInt(page);
      const parsedLimit = parseInt(limit);
      const skip = (parsedPage - 1) * parsedLimit;
      const result = await SupplierService.getAllSuppliers(skip, parsedLimit);
      if (result && result.suppliers && typeof result.total === 'number') {
        createResponse(
          res,
          200,
          true,
          result.suppliers,
          "Suppliers retrieved successfully.",
          result.total,
          parsedPage,
          parsedLimit
        );
      } else {
        createResponse(
          res,
          200,
          true,
          result,
          "Suppliers retrieved successfully."
        );
      }
    } catch (error) {
      console.error(
        "🚀 ~ supplier.controller.js: getAllSuppliers - Error:",
        error
      );
      next(error);
    }
  },

  /**
   * Handles GET request to retrieve a single supplier by ID.
   * @param {Object} req - Express request object.
   * @param {Object} res - Express response object.
   * @param {Function} next - Express next middleware function.
   */
  getSupplierById: async (req, res, next) => {
    try {
      const supplier = await SupplierService.getSupplierById(req.params.id);
      if (!supplier) {
        return createResponse(res, 404, false, null, "Supplier not found.");
      }
      createResponse(
        res,
        200,
        true,
        supplier,
        "Supplier retrieved successfully."
      );
    } catch (error) {
      console.error(
        "🚀 ~ supplier.controller.js: getSupplierById - Error:",
        error
      );
      next(error);
    }
  },

  /**
   * Handles PUT request to update an existing supplier.
   * @param {Object} req - Express request object.
   * @param {Object} res - Express response object.
   * @param {Function} next - Express next middleware function.
   */
  updateSupplier: async (req, res, next) => {
    try {
      const updatedSupplier = await SupplierService.updateSupplier(
        req.params.id,
        req.body
      );
      createResponse(
        res,
        200,
        true,
        updatedSupplier,
        "Supplier updated successfully."
      );
    } catch (error) {
      console.error(
        "🚀 ~ supplier.controller.js: updateSupplier - Error:",
        error
      );
      next(error);
    }
  },

  /**
   * Handles DELETE request to delete a supplier.
   * @param {Object} req - Express request object.
   * @param {Object} res - Express response object.
   * @param {Function} next - Express next middleware function.
   */
  deleteSupplier: async (req, res, next) => {
    try {
      const result = await SupplierService.deleteSupplier(req.params.id);
      createResponse(res, 200, true, result, "Supplier deleted successfully.");
    } catch (error) {
      console.error(
        "🚀 ~ supplier.controller.js: deleteSupplier - Error:",
        error
      );
      next(error);
    }
  },

  /**
   * MỚI: Xử lý yêu cầu GET để tìm kiếm và lọc nhà cung cấp với phân trang.
   * @param {Object} req - Đối tượng yêu cầu Express (với searchParams từ phần mềm trung gian).
   * @param {Object} res - Đối tượng phản hồi Express.
   * @param {Function} next - Hàm trung gian Express next.
   */
  searchSuppliersWithFilter: async (req, res, next) => {
    try {
      // searchParams đã được parse và validate bởi middleware
      const searchParams = req.searchParams;

      console.log("🔍 Search params:", searchParams);

      // Thực hiện search và filter
      const result = await EntityHelpers.searchSuppliers(searchParams);

      // Tạo response với pagination
      SearchFilterService.createSearchResponse(
        res,
        result,
        "Nhà cung cấp đã được tìm kiếm thành công bằng chức năng tìm kiếm và lọc."
      );
    } catch (error) {
      console.error(
        "🚀 ~ supplier.controller.js: searchSuppliersWithFilter - Error:",
        error
      );
      next(error);
    }
  },

  /** Recalculate payable for one supplier */
  recalcPayable: async (req, res, next) => {
    try {
      const { id } = req.params;
      const payable = await SupplierModel.recalculatePayable(id);
      createResponse(res, 200, true, { supplier_id: id, payable }, "Recalculated supplier payable successfully.");
    } catch (error) {
      console.error("🚀 ~ supplier.controller.js: recalcPayable - Error:", error);
      return errorResponse(res, error.message || "Lỗi server", 500);
    }
  },

  /** Recalculate payable for all suppliers */
  recalcAllPayables: async (req, res, next) => {
    try {
      const result = await SupplierModel.recalculateAllPayables();
      createResponse(res, 200, true, result, "Recalculated all suppliers' payable successfully.");
    } catch (error) {
      console.error("🚀 ~ supplier.controller.js: recalcAllPayables - Error:", error);
      return errorResponse(res, error.message || "Lỗi server", 500);
    }
  },
};

module.exports = SupplierController;
