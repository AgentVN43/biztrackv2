const db = require("../../config/db.config"); // Ensure the correct path to your database config
const { v4: uuidv4 } = require('uuid'); // To generate UUIDs for supplier_id

const SupplierModel = {
  /**
   * Creates a new supplier record.
   * @param {Object} supplierData - Data for the new supplier.
   * @returns {Promise<Object>} A promise that resolves with the created supplier.
   */
  create: (supplierData) => {
    return new Promise((resolve, reject) => {
      const supplier_id = uuidv4();
      const { supplier_name, contact_person, phone, email, address } = supplierData;
      const sql = `
        INSERT INTO suppliers (supplier_id, supplier_name, contact_person, phone, email, address)
        VALUES (?, ?, ?, ?, ?, ?)
      `;
      const values = [supplier_id, supplier_name, contact_person, phone, email, address];

      db.query(sql, values, (err, result) => {
        if (err) {
          console.error("🚀 ~ supplier.model.js: create - Error creating supplier:", err);
          return reject(err);
        }
        resolve({ supplier_id, ...supplierData }); // Return the created supplier data
      });
    });
  },

  /**
   * Retrieves all supplier records.
   * @returns {Promise<Array<Object>>} A promise that resolves with an array of suppliers.
   */
  getAll: () => {
    return new Promise((resolve, reject) => {
      const sql = `SELECT * FROM suppliers ORDER BY supplier_name ASC`;
      db.query(sql, (err, results) => {
        if (err) {
          console.error("🚀 ~ supplier.model.js: getAll - Error fetching all suppliers:", err);
          return reject(err);
        }
        resolve(results);
      });
    });
  },

  /**
   * Retrieves a supplier record by its ID.
   * @param {string} supplier_id - The ID of the supplier.
   * @returns {Promise<Object|null>} A promise that resolves with the supplier object or null if not found.
   */
  findById: (supplier_id) => {
    return new Promise((resolve, reject) => {
      const sql = `SELECT * FROM suppliers WHERE supplier_id = ?`;
      db.query(sql, [supplier_id], (err, results) => {
        if (err) {
          console.error("🚀 ~ supplier.model.js: findById - Error fetching supplier by ID:", err);
          return reject(err);
        }
        resolve(results.length ? results[0] : null);
      });
    });
  },

  /**
   * Updates an existing supplier record.
   * @param {string} supplier_id - The ID of the supplier to update.
   * @param {Object} updateData - Data to update the supplier with.
   * @returns {Promise<Object|null>} A promise that resolves with the updated supplier or null if not found.
   */
  update: (supplier_id, updateData) => {
    return new Promise((resolve, reject) => {
      const { supplier_name, contact_person, phone, email, address } = updateData;
      const sql = `
        UPDATE suppliers
        SET supplier_name = ?, contact_person = ?, phone = ?, email = ?, address = ?, updated_at = CURRENT_TIMESTAMP
        WHERE supplier_id = ?
      `;
      const values = [supplier_name, contact_person, phone, email, address, supplier_id];

      db.query(sql, values, (err, result) => {
        if (err) {
          console.error("🚀 ~ supplier.model.js: update - Error updating supplier:", err);
          return reject(err);
        }
        if (result.affectedRows === 0) {
          return resolve(null); // Supplier not found
        }
        resolve({ supplier_id, ...updateData }); // Return the updated supplier data
      });
    });
  },

  /**
   * Deletes a supplier record by its ID.
   * @param {string} supplier_id - The ID of the supplier to delete.
   * @returns {Promise<Object>} A promise that resolves with the deletion result.
   */
  delete: (supplier_id) => {
    return new Promise((resolve, reject) => {
      const sql = `DELETE FROM suppliers WHERE supplier_id = ?`;
      db.query(sql, [supplier_id], (err, result) => {
        if (err) {
          console.error("🚀 ~ supplier.model.js: delete - Error deleting supplier:", err);
          return reject(err);
        }
        if (result.affectedRows === 0) {
          return resolve(null); // Supplier not found
        }
        resolve({ supplier_id, message: 'Supplier deleted successfully' });
      });
    });
  },
};

module.exports = SupplierModel;
