const db = require("../../config/db.config");
const { v4: uuidv4 } = require("uuid");

const TransactionModel = {
  /**
   * Tạo một giao dịch mới.
   * Đã bổ sung các trường customer_id và supplier_id.
   *
   * @param {Object} data - Dữ liệu giao dịch.
   * @param {string} data.transaction_code - Mã giao dịch duy nhất.
   * @param {string} data.type - Loại giao dịch ('receipt', 'payment', 'refund', v.v.).
   * @param {number} data.amount - Số tiền của giao dịch.
   * @param {string} [data.description] - Mô tả giao dịch.
   * @param {string} [data.category] - Danh mục giao dịch (e.g., 'sale_payment', 'purchase_payment').
   * @param {string} [data.payment_method] - Phương thức thanh toán (e.g., 'Cash', 'Bank Transfer').
   * @param {string} [data.customer_id=null] - ID khách hàng liên quan (cho giao dịch thu tiền).
   * @param {string} [data.supplier_id=null] - ID nhà cung cấp liên quan (cho giao dịch chi tiền).
   * @param {string} [data.related_type] - Loại đối tượng liên quan (e.g., 'order', 'invoice').
   * @param {string} [data.related_id] - ID của đối tượng liên quan.
   * @param {string} [data.initiated_by] - Người dùng/hệ thống đã tạo giao dịch.
   * @returns {Promise<Object>} Promise giải quyết với kết quả tạo giao dịch.
   */
  createTransaction: ({
    transaction_code,
    type,
    amount,
    description = null,
    category = null,
    payment_method = null,
    customer_id = null, // ✅ Thêm customer_id
    supplier_id = null, // ✅ Thêm supplier_id
    related_type = null,
    related_id = null,
    initiated_by = null,
    order_id = null,
  }) => {
    return new Promise((resolve, reject) => {
      const transaction_id = uuidv4();

      const sql = `
        INSERT INTO transactions (
          transaction_id, transaction_code, type, amount, description, category,
          payment_method, customer_id, supplier_id, related_type, related_id,
          order_id, created_at, updated_at, initiated_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, ?)
      `;

      const values = [
        transaction_id,
        transaction_code,
        type,
        amount,
        description,
        category,
        payment_method,
        customer_id, // ✅ Giá trị customer_id
        supplier_id, // ✅ Giá trị supplier_id
        related_type,
        related_id,
        order_id,
        initiated_by,
      ];

      db.query(sql, values, (err, result) => {
        if (err) {
          console.error(
            "🚀 ~ transaction.model.js: createTransaction - Error creating transaction:",
            err
          );
          return reject(err);
        }
        resolve(result);
      });
    });
  },

  /**
   * Lấy một giao dịch theo ID.
   * @param {string} transactionId - ID giao dịch.
   * @returns {Promise<Object|null>} Promise giải quyết với giao dịch hoặc null nếu không tìm thấy.
   */
  getTransactionById: (transactionId) => {
    return new Promise((resolve, reject) => {
      const sql = "SELECT * FROM transactions WHERE transaction_id = ?";
      db.query(sql, [transactionId], (err, results) => {
        if (err) {
          console.error(
            "🚀 ~ transaction.model.js: getTransactionById - Error fetching transaction by ID:",
            err
          );
          return reject(err);
        }
        resolve(results && results.length ? results[0] : null);
      });
    });
  },

  /**
   * Đánh dấu các giao dịch liên quan đến một ID cụ thể là đã hủy.
   * @param {string} related_id - ID của đối tượng liên quan (ví dụ: order_id).
   * @returns {Promise<Object>} Promise giải quyết với kết quả cập nhật.
   */
  markAsCancelled: (related_id) => {
    return new Promise((resolve, reject) => {
      const sql = `
        UPDATE transactions
        SET type = 'cancelled_refund', updated_at = CURRENT_TIMESTAMP
        WHERE related_id = ? AND type IN ('receipt', 'payment', 'refund')
      `; // Chỉ hủy các loại giao dịch có thể bị hủy
      db.query(sql, [related_id], (err, result) => {
        if (err) {
          console.error(
            "🚀 ~ transaction.model.js: markAsCancelled - Error marking transactions as cancelled:",
            err
          );
          return reject(err);
        }
        resolve(result);
      });
    });
  },

  getTransactionsByOrderId: (order_id) => {
    return new Promise((resolve, reject) => {
      const sql = `SELECT * FROM transactions WHERE order_id = ?`;
      db.query(sql, [order_id], (err, results) => {
        if (err) {
          console.error("🚀 ~ Error fetching transactions by order_id:", err);
          return reject(err);
        }
        resolve(results);
      });
    });
  },

  /**
   * Lấy tất cả giao dịch liên quan đến một khách hàng cụ thể.
   * @param {string} customer_id - ID của khách hàng.
   * @returns {Promise<Array<Object>>} Promise giải quyết với mảng các giao dịch.
   */
  getTransactionsByCustomerId: (customer_id) => {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT
          t.*,
          c.customer_name,
          i.invoice_code
        FROM transactions t
        LEFT JOIN customers c ON t.customer_id = c.customer_id
        LEFT JOIN invoices i ON t.related_id = i.invoice_id AND t.related_type = 'invoice'
        WHERE t.customer_id = ?
        ORDER BY t.created_at DESC;
      `;
      db.query(sql, [customer_id], (err, results) => {
        if (err) {
          console.error(
            "🚀 ~ transaction.model.js: getTransactionsByCustomerId - Error fetching transactions by customer ID:",
            err
          );
          return reject(err);
        }
        resolve(results);
      });
    });
  },

  /**
   * Lấy tất cả giao dịch liên quan đến một đối tượng cụ thể (order, invoice, etc.).
   * @param {string} related_id - ID của đối tượng liên quan.
   * @param {string} related_type - Loại đối tượng liên quan ('order', 'invoice', etc.).
   * @returns {Promise<Array<Object>>} Promise giải quyết với mảng các giao dịch.
   */
  getTransactionsByRelatedId: (related_id, related_type) => {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT
          t.*,
          c.customer_name,
          i.invoice_code
        FROM transactions t
        LEFT JOIN customers c ON t.customer_id = c.customer_id
        LEFT JOIN invoices i ON t.related_id = i.invoice_id AND t.related_type = 'invoice'
        WHERE t.related_id = ? AND t.related_type = ?
        ORDER BY t.created_at DESC;
      `;
      db.query(sql, [related_id, related_type], (err, results) => {
        if (err) {
          console.error(
            "🚀 ~ transaction.model.js: getTransactionsByRelatedId - Error fetching transactions by related ID:",
            err
          );
          return reject(err);
        }
        resolve(results);
      });
    });
  },

  /**
   * Lấy tất cả giao dịch.
   * @returns {Promise<Array<Object>>} Promise giải quyết với mảng tất cả giao dịch.
   */
  getAll: () => {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT
          t.*,
          c.customer_name,
          i.invoice_code
        FROM transactions t
        LEFT JOIN customers c ON t.customer_id = c.customer_id
        LEFT JOIN invoices i ON t.related_id = i.invoice_id AND t.related_type = 'invoice'
        ORDER BY t.created_at DESC;
      `;
      db.query(sql, (err, results) => {
        if (err) {
          console.error(
            "🚀 ~ transaction.model.js: getAll - Error fetching all transactions:",
            err
          );
          return reject(err);
        }
        resolve(results);
      });
    });
  },
};

module.exports = TransactionModel;
