const SupplierModel = require('./supplier.model'); // Ensure the correct path to your supplier.model.js

const SupplierService = {
  /**
   * Creates a new supplier.
   * @param {Object} supplierData - Data for the new supplier.
   * @returns {Promise<Object>} A promise that resolves with the created supplier.
   * @throws {Error} If supplier data is invalid or creation fails.
   */
  createSupplier: async (supplierData) => {
    if (!supplierData.supplier_name) {
      throw new Error("Supplier name is required.");
    }
    // You can add more validation logic here
    return await SupplierModel.create(supplierData);
  },

  /**
   * Retrieves all suppliers (with optional pagination).
   * @param {number|null} skip
   * @param {number|null} limit
   * @returns {Promise<Array|{suppliers:Array,total:number}>}
   */
  getAllSuppliers: async (skip = null, limit = null) => {
    if (skip !== null && limit !== null) {
      const [suppliers, total] = await Promise.all([
        SupplierModel.getAll(skip, limit),
        SupplierModel.countAll()
      ]);
      return { suppliers, total };
    } else {
      return await SupplierModel.getAll();
    }
  },

  /**
   * Retrieves a supplier by ID.
   * @param {string} supplierId - The ID of the supplier.
   * @returns {Promise<Object|null>} A promise that resolves with the supplier object or null if not found.
   */
  getSupplierById: async (supplierId) => {
    return await SupplierModel.findById(supplierId);
  },

  /**
   * Updates an existing supplier.
   * @param {string} supplierId - The ID of the supplier to update.
   * @param {Object} updateData - Data to update the supplier with.
   * @returns {Promise<Object|null>} A promise that resolves with the updated supplier or null if not found.
   * @throws {Error} If supplier ID is not provided or update fails.
   */
  updateSupplier: async (supplierId, updateData) => {
    if (!supplierId) {
      throw new Error("Supplier ID is required for update.");
    }
    // You can add more validation here
    const updated = await SupplierModel.update(supplierId, updateData);
    if (!updated) {
      throw new Error("Supplier not found or no changes made.");
    }
    return updated;
  },

  /**
   * Deletes a supplier by ID.
   * @param {string} supplierId - The ID of the supplier to delete.
   * @returns {Promise<Object>} A promise that resolves with the deletion result.
   * @throws {Error} If supplier ID is not provided or deletion fails.
   */
  deleteSupplier: async (supplierId) => {
    if (!supplierId) {
      throw new Error("Supplier ID is required for deletion.");
    }
    const deleted = await SupplierModel.delete(supplierId);
    if (!deleted) {
      throw new Error("Supplier not found.");
    }
    return deleted;
  },
};

module.exports = SupplierService;
