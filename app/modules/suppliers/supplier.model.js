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
          //console.error("🚀 ~ supplier.model.js: create - Error creating supplier:", err);
          return reject(err);
        }
        resolve({ supplier_id, ...supplierData }); // Return the created supplier data
      });
    });
  },

  /**
   * Retrieves all supplier records (with optional pagination).
   * @param {number|null} skip - Number of records to skip (offset).
   * @param {number|null} limit - Number of records to fetch.
   * @returns {Promise<Array<Object>>}
   */
  getAll: (skip = null, limit = null) => {
    return new Promise((resolve, reject) => {
      let sql = `SELECT * FROM suppliers ORDER BY supplier_name ASC`;
      const params = [];
      if (limit !== null && skip !== null) {
        sql += ' LIMIT ? OFFSET ?';
        params.push(limit, skip);
      }
      db.query(sql, params, (err, results) => {
        if (err) {
          //console.error("🚀 ~ supplier.model.js: getAll - Error fetching all suppliers:", err);
          return reject(err);
        }
        const casted = (results || []).map((r) => ({
          ...r,
          payable: r.payable !== undefined && r.payable !== null ? parseFloat(r.payable) : r.payable,
        }));
        resolve(casted);
      });
    });
  },

  /**
   * Đếm tổng số supplier (cho phân trang).
   * @returns {Promise<number>}
   */
  countAll: () => {
    return new Promise((resolve, reject) => {
      const sql = `SELECT COUNT(*) AS total FROM suppliers`;
      db.query(sql, (err, results) => {
        if (err) {
          //console.error("🚀 ~ supplier.model.js: countAll - Error:", err);
          return reject(err);
        }
        resolve(results && results.length ? results[0].total : 0);
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
          //console.error("🚀 ~ supplier.model.js: findById - Error fetching supplier by ID:", err);
          return reject(err);
        }
        const row = results.length ? results[0] : null;
        if (!row) return resolve(null);
        const casted = {
          ...row,
          payable: row.payable !== undefined && row.payable !== null ? parseFloat(row.payable) : row.payable,
        };
        resolve(casted);
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
          //console.error("🚀 ~ supplier.model.js: update - Error updating supplier:", err);
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
          //console.error("🚀 ~ supplier.model.js: delete - Error deleting supplier:", err);
          return reject(err);
        }
        if (result.affectedRows === 0) {
          return resolve(null); // Supplier not found
        }
        resolve({ supplier_id, message: 'Supplier deleted successfully' });
      });
    });
  },

  /**
   * Cập nhật trường payable cho một nhà cung cấp.
   * @param {string} supplier_id
   * @param {number} payable
   */
  updatePayable: async (supplier_id, payable) => {
    try {
      console.log(`🔄 updatePayable: Cập nhật payable cho supplier ${supplier_id} với giá trị ${payable}`);
      const sql = `UPDATE suppliers SET payable = ?, updated_at = CURRENT_TIMESTAMP WHERE supplier_id = ?`;
      const [result] = await db.promise().query(sql, [parseFloat(payable || 0), supplier_id]);
      console.log(`✅ updatePayable: Kết quả update: ${result.affectedRows} hàng bị ảnh hưởng.`);
      return { supplier_id, payable: parseFloat(payable || 0) };
    } catch (error) {
      console.error("🚀 ~ supplier.model.js: updatePayable - Error:", error);
      throw error;
    }
  },

  /**
   * Tính lại payable dựa trên invoices và transactions liên quan đến NCC.
   * Quy ước:
   *  - Tăng phải trả: purchase_invoice, debit_note, adj_increase
   *  - Giảm phải trả: credit_note, refund_invoice, payment, receipt, return, refund, transfer, partial_paid, adj_decrease
   *  - Điều chỉnh migration: adj_migration (dùng dấu trực tiếp)
   */
  recalculatePayable: async (supplier_id) => {
    try {
      console.log(`🔄 recalculatePayable: Bắt đầu tính toán payable cho supplier ${supplier_id}...`);

      // 1) Công nợ còn lại từ hóa đơn mua và debit_note
      const [rowsOutstanding] = await db.promise().query(
        `SELECT COALESCE(SUM(final_amount - IFNULL(amount_paid, 0)), 0) AS outstanding
         FROM invoices
         WHERE supplier_id = ?
           AND invoice_type IN ('purchase_invoice', 'debit_note')
           AND status != 'cancelled'`,
        [supplier_id]
      );
      const outstanding = parseFloat(rowsOutstanding[0]?.outstanding || 0);
      console.log(`  - Outstanding invoices (purchase_invoice, debit_note): ${outstanding}`);

      // 2) Giảm trừ bởi credit_note và refund_invoice (tính toàn bộ giá trị)
      const [rowsNegativeInvoices] = await db.promise().query(
        `SELECT COALESCE(SUM(final_amount - IFNULL(amount_paid, 0)), 0) AS negatives
         FROM invoices
         WHERE supplier_id = ?
           AND invoice_type IN ('credit_note', 'refund_invoice')
           AND status != 'cancelled'`,
        [supplier_id]
      );
      const negatives = parseFloat(rowsNegativeInvoices[0]?.negatives || 0);
      console.log(`  - Negative invoices (credit_note, refund_invoice): ${negatives}`);

      // 3) Các giao dịch trực tiếp không gắn invoice làm giảm phải trả (payment/receipt/...)
      const [rowsDirectDecrease] = await db.promise().query(
        `SELECT COALESCE(SUM(amount), 0) AS total
         FROM transactions
         WHERE supplier_id = ?
           AND LOWER(TRIM(type)) IN ('payment')
           AND COALESCE(LOWER(TRIM(related_type)),'') <> 'invoice'`,
        [supplier_id]
      );
      const directDecrease = parseFloat(rowsDirectDecrease[0]?.total || 0);
      console.log(`  - Direct decrease transactions (payments): ${directDecrease}`);

      // 3.1) Thu tiền độc lập từ NCC (receipt không gắn invoice) để bù trừ credit/refund
      const [rowsReceiptsIndependent] = await db.promise().query(
        `SELECT COALESCE(SUM(amount), 0) AS total
         FROM transactions
         WHERE supplier_id = ?
           AND LOWER(TRIM(type)) = 'receipt'
           AND COALESCE(LOWER(TRIM(related_type)),'') <> 'invoice'`,
        [supplier_id]
      );
      const receiptsIndependent = parseFloat(rowsReceiptsIndependent[0]?.total || 0);
      console.log(`  - Independent receipts (refund cash-in): ${receiptsIndependent}`);

      // 3.2) Giảm trừ phần credit/refund bởi các receipt độc lập
      const negativesEffective = Math.max(0, negatives - receiptsIndependent);
      console.log(`  - Negatives effective after receipts: ${negativesEffective}`);

      // 4) Điều chỉnh: adj_increase, adj_decrease, adj_migration
      const [rowsAdj] = await db.promise().query(
        `SELECT type, COALESCE(SUM(amount), 0) AS sum_amount
         FROM transactions
         WHERE supplier_id = ? AND type IN ('adj_increase','adj_decrease','adj_migration')
         GROUP BY type`,
        [supplier_id]
      );
      let adjIncrease = 0, adjDecrease = 0, adjMigration = 0;
      for (const r of rowsAdj) {
        if (r.type === 'adj_increase') adjIncrease = parseFloat(r.sum_amount || 0);
        if (r.type === 'adj_decrease') adjDecrease = parseFloat(r.sum_amount || 0);
        if (r.type === 'adj_migration') adjMigration = parseFloat(r.sum_amount || 0);
      }
      console.log(`  - Adjustments: increase=${adjIncrease}, decrease=${adjDecrease}, migration=${adjMigration}`);

      const payable = outstanding - negativesEffective - directDecrease + adjIncrease - adjDecrease + adjMigration;
      console.log(`  - Calculated payable: ${payable}`);
      await SupplierModel.updatePayable(supplier_id, payable);
      console.log(`✅ recalculatePayable: Đã cập nhật payable cho supplier ${supplier_id} thành ${payable}`);
      return payable;
    } catch (error) {
      console.error("🚀 ~ supplier.model.js: recalculatePayable - Error:", error);
      throw error;
    }
  },

  /**
   * Tính lại payable cho tất cả NCC.
   */
  recalculateAllPayables: async () => {
    try {
      const [suppliers] = await db.promise().query(`SELECT supplier_id FROM suppliers`);
      for (const s of suppliers) {
        await SupplierModel.recalculatePayable(s.supplier_id);
      }
      return { updated: suppliers.length };
    } catch (error) {
      //console.error("🚀 ~ supplier.model.js: recalculateAllPayables - Error:", error);
      throw error;
    }
  },
};

module.exports = SupplierModel;
