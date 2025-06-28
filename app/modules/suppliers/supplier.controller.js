const SupplierService = require('./supplier.service'); // Ensure the correct path to your supplier.service.js
const {createResponse} = require('../../utils/response'); // Ensure the correct path to your createResponse utility

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
      createResponse(res, 201, true, newSupplier, "Supplier created successfully.");
    } catch (error) {
      console.error("🚀 ~ supplier.controller.js: createSupplier - Error:", error);
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
      const suppliers = await SupplierService.getAllSuppliers();
      createResponse(res, 200, true, suppliers, "Suppliers retrieved successfully.");
    } catch (error) {
      console.error("🚀 ~ supplier.controller.js: getAllSuppliers - Error:", error);
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
      createResponse(res, 200, true, supplier, "Supplier retrieved successfully.");
    } catch (error) {
      console.error("🚀 ~ supplier.controller.js: getSupplierById - Error:", error);
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
      const updatedSupplier = await SupplierService.updateSupplier(req.params.id, req.body);
      createResponse(res, 200, true, updatedSupplier, "Supplier updated successfully.");
    } catch (error) {
      console.error("🚀 ~ supplier.controller.js: updateSupplier - Error:", error);
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
      console.error("🚀 ~ supplier.controller.js: deleteSupplier - Error:", error);
      next(error);
    }
  },
};

module.exports = SupplierController;
