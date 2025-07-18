const db = require("../../config/db.config");
const { v4: uuidv4 } = require("uuid");

const SupplierReturn = {
  // Tạo đơn trả hàng nhà cung cấp mới
  create: async (data) => {
    try {
      const return_id = uuidv4();
      const {
        supplier_id,
        po_id = null,
        note,
        status = "pending"
      } = data;
      const type = "supplier_return";
      const query = `
        INSERT INTO return_orders (
          return_id, supplier_id, po_id, type, status, note, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, NOW())
      `;
      const values = [
        return_id, supplier_id, po_id, type, status, note
      ];
      return new Promise((resolve, reject) => {
        db.query(query, values, (error, results) => {
          if (error) return reject(error);
          resolve({ return_id, ...data, type });
        });
      });
    } catch (error) {
      throw error;
    }
  },

  // Tạo chi tiết trả hàng
  createReturnDetail: async (data) => {
    const {
      return_id,
      product_id,
      quantity,
      refund_amount,
      warehouse_id
    } = data;
    const return_item_id = uuidv4();
    const query = `
      INSERT INTO return_order_items (
        return_item_id, return_id, product_id, quantity, refund_amount, warehouse_id
      ) VALUES (?, ?, ?, ?, ?, ?)
    `;
    const values = [
      return_item_id, return_id, product_id, quantity, refund_amount, warehouse_id
    ];
    return new Promise((resolve, reject) => {
      db.query(query, values, (error, results) => {
        if (error) return reject(error);
        resolve({ return_item_id, ...data });
      });
    });
  },

  // Lấy tất cả đơn trả hàng nhà cung cấp
  getAll: async (filters = {}, pagination = {}) => {
    try {
      let query = `
        SELECT ro.*, s.supplier_name
        FROM return_orders ro
        LEFT JOIN suppliers s ON ro.supplier_id = s.supplier_id
        WHERE ro.type = 'supplier_return'
      `;
      const values = [];
      const conditions = [];
      if (filters.supplier_id) {
        conditions.push("ro.supplier_id = ?");
        values.push(filters.supplier_id);
      }
      if (filters.status) {
        conditions.push("ro.status = ?");
        values.push(filters.status);
      }
      if (filters.created_at_from) {
        conditions.push("ro.created_at >= ?");
        values.push(filters.created_at_from);
      }
      if (filters.created_at_to) {
        conditions.push("ro.created_at <= ?");
        values.push(filters.created_at_to);
      }
      if (conditions.length > 0) {
        query += " AND " + conditions.join(" AND ");
      }
      query += " ORDER BY ro.created_at DESC";
      if (pagination.limit && pagination.offset !== undefined) {
        query += " LIMIT ? OFFSET ?";
        values.push(parseInt(pagination.limit), parseInt(pagination.offset));
      }
      return new Promise((resolve, reject) => {
        db.query(query, values, (error, results) => {
          if (error) return reject(error);
          resolve(results);
        });
      });
    } catch (error) {
      throw error;
    }
  },

  // Lấy đơn trả hàng theo ID
  getById: async (return_id) => {
    try {
      const query = `
        SELECT ro.*, s.supplier_name
        FROM return_orders ro
        LEFT JOIN suppliers s ON ro.supplier_id = s.supplier_id
        WHERE ro.return_id = ? AND ro.type = 'supplier_return'
      `;
      return new Promise((resolve, reject) => {
        db.query(query, [return_id], (error, results) => {
          if (error) return reject(error);
          resolve(results[0]);
        });
      });
    } catch (error) {
      throw error;
    }
  },

  // Lấy chi tiết trả hàng
  getReturnDetails: async (return_id) => {
    try {
      const query = `
        SELECT roi.*, p.product_name, p.sku, p.product_image
        FROM return_order_items roi
        LEFT JOIN products p ON roi.product_id = p.product_id
        WHERE roi.return_id = ?
        ORDER BY roi.return_item_id ASC
      `;
      return new Promise((resolve, reject) => {
        db.query(query, [return_id], (error, results) => {
          if (error) return reject(error);
          resolve(results);
        });
      });
    } catch (error) {
      throw error;
    }
  }
};

module.exports = SupplierReturn; 