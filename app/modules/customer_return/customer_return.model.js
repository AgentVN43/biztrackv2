const db = require("../../config/db.config");
const { v4: uuidv4 } = require("uuid");

const CustomerReturn = {
  // Tạo đơn trả hàng mới
  create: async (data) => {
    try {
      const return_id = uuidv4();
      
      const {
        customer_id,
        order_id,
        po_id,
        supplier_id,
        type = "customer_return",
        status = "pending",
        note
      } = data;

      const query = `
        INSERT INTO return_orders (
          return_id, order_id, po_id, customer_id, supplier_id,
          type, status, note, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
      `;

      const values = [
        return_id, order_id, po_id, customer_id, supplier_id,
        type, status, note
      ];

      return new Promise((resolve, reject) => {
        db.query(query, values, (error, results) => {
          if (error) {
            return reject(error);
          }
          resolve({ return_id, ...data });
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
      cost_price
    } = data;

    const return_item_id = uuidv4();

    const query = `
      INSERT INTO return_order_items (
        return_item_id, return_id, product_id, quantity, refund_amount, cost_price
      ) VALUES (?, ?, ?, ?, ?, ?)
    `;

    const values = [
      return_item_id, return_id, product_id, quantity, refund_amount, cost_price
    ];

    return new Promise((resolve, reject) => {
      db.query(query, values, (error, results) => {
        if (error) {
          return reject(error);
        }
        resolve({ return_item_id, ...data });
      });
    });
  },

  // Lấy tất cả đơn trả hàng
  getAll: async (filters = {}, pagination = {}) => {
    try {
      let query = `
        SELECT 
          ro.*,
          c.customer_name,
          c.phone,
          o.order_code,
          s.supplier_name,
          po.po_id
        FROM return_orders ro
        LEFT JOIN customers c ON ro.customer_id = c.customer_id
        LEFT JOIN orders o ON ro.order_id = o.order_id
        LEFT JOIN suppliers s ON ro.supplier_id = s.supplier_id
        LEFT JOIN purchase_orders po ON ro.po_id = po.po_id
        WHERE ro.type = 'customer_return'
      `;

      const values = [];
      const conditions = [];

      // Thêm filters
      if (filters.customer_id) {
        conditions.push("ro.customer_id = ?");
        values.push(filters.customer_id);
      }

      if (filters.order_id) {
        conditions.push("ro.order_id = ?");
        values.push(filters.order_id);
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

      // Thêm pagination
      if (pagination.limit && pagination.offset !== undefined) {
        query += " LIMIT ? OFFSET ?";
        values.push(parseInt(pagination.limit), parseInt(pagination.offset));
      }

      return new Promise((resolve, reject) => {
        db.query(query, values, (error, results) => {
          if (error) {
            return reject(error);
          }
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
        SELECT 
          ro.*,
          c.customer_name,
          c.phone,
          c.email,
          o.order_code,
          o.order_date,
          s.supplier_name,
          po.po_id
        FROM return_orders ro
        LEFT JOIN customers c ON ro.customer_id = c.customer_id
        LEFT JOIN orders o ON ro.order_id = o.order_id
        LEFT JOIN suppliers s ON ro.supplier_id = s.supplier_id
        LEFT JOIN purchase_orders po ON ro.po_id = po.po_id
        WHERE ro.return_id = ? AND ro.type = 'customer_return'
      `;

      return new Promise((resolve, reject) => {
        db.query(query, [return_id], (error, results) => {
          if (error) {
            return reject(error);
          }
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
        SELECT 
          roi.*,
          p.product_name,
          p.sku,
          p.product_image
        FROM return_order_items roi
        LEFT JOIN products p ON roi.product_id = p.product_id
        WHERE roi.return_id = ?
        ORDER BY roi.return_item_id ASC
      `;

      return new Promise((resolve, reject) => {
        db.query(query, [return_id], (error, results) => {
          if (error) {
            return reject(error);
          }
          resolve(results);
        });
      });
    } catch (error) {
      throw error;
    }
  },

  // Cập nhật đơn trả hàng
  update: async (return_id, data) => {
    try {
      const {
        status,
        note
      } = data;

      const query = `
        UPDATE return_orders 
        SET status = ?, note = ?
        WHERE return_id = ? AND type = 'customer_return'
      `;

      const values = [status, note, return_id];

      return new Promise((resolve, reject) => {
        db.query(query, values, (error, results) => {
          if (error) {
            return reject(error);
          }
          resolve({ return_id, ...data });
        });
      });
    } catch (error) {
      throw error;
    }
  },

  // Cập nhật trạng thái đơn trả hàng
  updateStatus: async (return_id, status) => {
    try {
      const query = `
        UPDATE return_orders 
        SET status = ?
        WHERE return_id = ? AND type = 'customer_return'
      `;

      return new Promise((resolve, reject) => {
        db.query(query, [status, return_id], (error, results) => {
          if (error) {
            return reject(error);
          }
          resolve({ return_id, status });
        });
      });
    } catch (error) {
      throw error;
    }
  },

  // Xóa đơn trả hàng (soft delete)
  delete: async (return_id) => {
    try {
      const query = `
        DELETE FROM return_orders 
        WHERE return_id = ? AND type = 'customer_return'
      `;

      return new Promise((resolve, reject) => {
        db.query(query, [return_id], (error, results) => {
          if (error) {
            return reject(error);
          }
          resolve({ return_id, deleted: true });
        });
      });
    } catch (error) {
      throw error;
    }
  },

  // Đếm tổng số đơn trả hàng
  count: async (filters = {}) => {
    try {
      let query = `
        SELECT COUNT(*) as total
        FROM return_orders ro
        WHERE ro.type = 'customer_return'
      `;

      const values = [];
      const conditions = [];

      // Thêm filters
      if (filters.customer_id) {
        conditions.push("ro.customer_id = ?");
        values.push(filters.customer_id);
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

      return new Promise((resolve, reject) => {
        db.query(query, values, (error, results) => {
          if (error) {
            return reject(error);
          }
          resolve(results[0].total);
        });
      });
    } catch (error) {
      throw error;
    }
  },

  // Lấy thống kê trả hàng
  getStatistics: async (filters = {}) => {
    try {
      let query = `
        SELECT 
          COUNT(*) as total_returns,
          COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_returns,
          COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_returns,
          COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_returns,
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_returns
        FROM return_orders ro
        WHERE ro.type = 'customer_return'
      `;

      const values = [];
      const conditions = [];

      // Thêm filters
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

      return new Promise((resolve, reject) => {
        db.query(query, values, (error, results) => {
          if (error) {
            return reject(error);
          }
          resolve(results[0]);
        });
      });
    } catch (error) {
      throw error;
    }
  },

  // Lấy đơn trả hàng theo khách hàng
  getByCustomer: async (customer_id, pagination = {}) => {
    try {
      let query = `
        SELECT 
          ro.*,
          o.order_code,
          s.supplier_name
        FROM return_orders ro
        LEFT JOIN orders o ON ro.order_id = o.order_id
        LEFT JOIN suppliers s ON ro.supplier_id = s.supplier_id
        WHERE ro.customer_id = ? AND ro.type = 'customer_return'
        ORDER BY ro.created_at DESC
      `;

      const values = [customer_id];

      // Thêm pagination
      if (pagination.limit && pagination.offset !== undefined) {
        query += " LIMIT ? OFFSET ?";
        values.push(parseInt(pagination.limit), parseInt(pagination.offset));
      }

      return new Promise((resolve, reject) => {
        db.query(query, values, (error, results) => {
          if (error) {
            return reject(error);
          }
          resolve(results);
        });
      });
    } catch (error) {
      throw error;
    }
  },

  // Lấy đơn trả hàng theo đơn hàng
  getByOrder: async (order_id) => {
    try {
      const query = `
        SELECT 
          ro.*,
          c.customer_name,
          c.phone,
          s.supplier_name
        FROM return_orders ro
        LEFT JOIN customers c ON ro.customer_id = c.customer_id
        LEFT JOIN suppliers s ON ro.supplier_id = s.supplier_id
        WHERE ro.order_id = ? AND ro.type = 'customer_return'
        ORDER BY ro.created_at DESC
      `;

      return new Promise((resolve, reject) => {
        db.query(query, [order_id], (error, results) => {
          if (error) {
            return reject(error);
          }
          resolve(results);
        });
      });
    } catch (error) {
      throw error;
    }
  }
};

module.exports = CustomerReturn; 