const db = require("../../config/db.config");

const InventoryModel = {
  /**
   * Xác nhận đặt chỗ tồn kho, giảm số lượng và tồn kho tạm giữ.
   * @param {string} product_id - ID sản phẩm.
   * @param {string} warehouse_id - ID kho.
   * @param {number} quantity - Số lượng cần xác nhận.
   * @returns {Promise<Object>} Promise giải quyết với kết quả truy vấn hoặc từ chối nếu không đủ hàng.
   */
  confirmReservation: (product_id, warehouse_id, quantity) => {
    return new Promise((resolve, reject) => {
      const sql = `
        UPDATE inventories
        SET
          quantity = quantity - ?,
          reserved_stock = reserved_stock - ?,
          available_stock = (quantity - ? - (reserved_stock - ?))
        WHERE product_id = ? AND warehouse_id = ? AND reserved_stock >= ? AND quantity >= ?
      `;

      const values = [
        quantity,
        quantity,
        quantity,
        quantity,
        product_id,
        warehouse_id,
        quantity,
        quantity,
      ];

      db.query(sql, values, (err, result) => {
        if (err) {
          console.error(
            "🚀 ~ inventory.model.js: confirmReservation - Error confirming reservation:",
            err
          );
          return reject(err);
        }
        if (result.affectedRows === 0) {
          return reject(new Error("Không đủ hàng trong kho hoặc hàng tạm giữ"));
        }
        resolve(result);
      });
    });
  },

  /**
   * Tìm kiếm tồn kho theo ID sản phẩm và ID kho.
   * @param {string} product_id - ID sản phẩm.
   * @param {string} warehouse_id - ID kho.
   * @returns {Promise<Object|null>} Promise giải quyết với đối tượng tồn kho hoặc null nếu không tìm thấy.
   */
  findByProductAndWarehouse: (product_id, warehouse_id) => {
    return new Promise((resolve, reject) => {
      const sql =
        "SELECT product_id, warehouse_id, SUM(quantity) AS total_quantity FROM inventories WHERE product_id = ? AND warehouse_id = ? GROUP BY product_id, warehouse_id";
      db.query(sql, [product_id, warehouse_id], (err, results) => {
        if (err) {
          console.error(
            "🚀 ~ inventory.model.js: findByProductAndWarehouse - Error:",
            err
          );
          return reject(err);
        }
        resolve(results && results.length ? results[0] : null);
      });
    });
  },

  /**
   * Tạo một bản ghi tồn kho mới.
   * @param {Object} data - Dữ liệu tồn kho (inventory_id, product_id, warehouse_id, quantity).
   * @returns {Promise<Object>} Promise giải quyết với kết quả truy vấn.
   */
  create: ({ inventory_id, product_id, warehouse_id, quantity }) => {
    return new Promise((resolve, reject) => {
      const sql =
        "INSERT INTO inventories (inventory_id, product_id, warehouse_id, quantity, available_stock ) VALUES (?, ?, ?, ?, ?)";
      db.query(
        sql,
        [inventory_id, product_id, warehouse_id, quantity, quantity],
        (err, result) => {
          if (err) {
            console.error(
              "🚀 ~ inventory.model.js: create - Error creating inventory:",
              err
            );
            return reject(err);
          }
          resolve(result);
        }
      );
    });
  },

  /**
   * Cập nhật số lượng tồn kho (thêm vào).
   * @param {string} product_id - ID sản phẩm.
   * @param {string} warehouse_id - ID kho.
   * @param {number} quantity - Số lượng cần thêm.
   * @returns {Promise<Object>} Promise giải quyết với kết quả truy vấn.
   */
  update: (product_id, warehouse_id, quantity) => {
    return new Promise((resolve, reject) => {
      const sql = `UPDATE inventories
        SET 
          quantity = quantity + ?, 
          available_stock = available_stock + ?, 
          updated_at = CURRENT_TIMESTAMP
        WHERE product_id = ? AND warehouse_id = ?`;

      db.query(
        sql,
        [quantity, quantity, product_id, warehouse_id],
        (err, result) => {
          if (err) {
            console.error(
              "🚀 ~ inventory.model.js: update - Error updating inventory:",
              err
            );
            return reject(err);
          }
          resolve(result);
        }
      );
    });
  },

  /**
   * Cập nhật số lượng, tồn kho đặt trước và tồn kho khả dụng.
   * @param {string} product_id - ID sản phẩm.
   * @param {string} warehouse_id - ID kho.
   * @param {Object} deltas - Các thay đổi (quantityDelta, reservedDelta, availableDelta).
   * @returns {Promise<Object>} Promise giải quyết với kết quả truy vấn.
   */
  updateQuantity: (
    product_id,
    warehouse_id,
    { quantityDelta = 0, reservedDelta = 0, availableDelta = 0 }
  ) => {
    return new Promise((resolve, reject) => {
      const sql = `
        UPDATE inventories
        SET
          quantity = quantity + ?,
          reserved_stock = reserved_stock + ?,
          available_stock = available_stock + ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE product_id = ? AND warehouse_id = ?
      `;

      const values = [
        quantityDelta,
        reservedDelta,
        availableDelta,
        product_id,
        warehouse_id,
      ];

      db.query(sql, values, (err, result) => {
        if (err) {
          console.error(
            "🚀 ~ inventory.model.js: updateQuantity - Error updating quantity fields:",
            err
          );
          return reject(err);
        }
        resolve(result);
      });
    });
  },

  /**
   * Lấy tất cả các bản ghi tồn kho với thông tin sản phẩm, kho và danh mục liên quan.
   * @returns {Promise<Array<Object>>} Promise giải quyết với mảng các đối tượng tồn kho đã định dạng.
   */
  findAll: () => {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT
          i.inventory_id,
          i.quantity,
          i.created_at,
          i.updated_at,
          i.reserved_stock,
          i.available_stock,
          p.product_id,
          p.product_name,
          p.category_id,
          c.category_name,
          w.warehouse_id AS warehouse_id,
          w.warehouse_name
        FROM inventories i
        JOIN products p ON i.product_id = p.product_id
        JOIN warehouses w ON i.warehouse_id = w.warehouse_id
        LEFT JOIN categories c ON p.category_id = c.category_id
      `;
      db.query(sql, (err, results) => {
        if (err) {
          console.error("🚀 ~ inventory.model.js: findAll - Error:", err);
          return reject(err);
        }
        const formattedResults = results.map((row) => ({
          inventory_id: row.inventory_id,
          created_at: row.created_at,
          updated_at: row.updated_at,
          product: {
            product_id: row.product_id,
            product_name: row.product_name,
            quantity: row.quantity,
            reserved_stock: row.reserved_stock,
            available_stock: row.available_stock,
            category: row.category_id
              ? {
                  category_id: row.category_id,
                  category_name: row.category_name,
                }
              : null,
          },
          warehouse: {
            warehouse_id: row.warehouse_id,
            warehouse_name: row.warehouse_name,
          },
        }));
        resolve(formattedResults);
      });
    });
  },

  /**
   * Tìm kiếm tồn kho theo ID tồn kho.
   * @param {string} inventory_id - ID tồn kho.
   * @returns {Promise<Object|null>} Promise giải quyết với đối tượng tồn kho hoặc null nếu không tìm thấy.
   */
  findById: (inventory_id) => {
    return new Promise((resolve, reject) => {
      db.query(
        "SELECT * FROM inventories WHERE inventory_id = ?",
        [inventory_id],
        (err, results) => {
          if (err) {
            console.error("🚀 ~ inventory.model.js: findById - Error:", err);
            return reject(err);
          }
          resolve(results && results.length ? results[0] : null);
        }
      );
    });
  },

  /**
   * Xóa một bản ghi tồn kho theo ID.
   * @param {string} inventory_id - ID tồn kho.
   * @returns {Promise<Object>} Promise giải quyết với kết quả truy vấn.
   */
  deleteById: (inventory_id) => {
    return new Promise((resolve, reject) => {
      db.query(
        "DELETE FROM inventories WHERE inventory_id = ?",
        [inventory_id],
        (err, result) => {
          if (err) {
            console.error("🚀 ~ inventory.model.js: deleteById - Error:", err);
            return reject(err);
          }
          resolve(result);
        }
      );
    });
  },

  /**
   * Lấy tồn kho theo ID kho, nhóm theo sản phẩm.
   * @param {string} warehouse_id - ID kho.
   * @returns {Promise<Array<Object>>} Promise giải quyết với mảng các đối tượng tồn kho đã nhóm.
   */
  findByWareHouseId: (warehouse_id) => {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT
          i.product_id,
          p.product_name,
          p.product_retail_price,
          SUM(i.quantity) AS total_quantity,
          SUM(i.available_stock) AS available_quantity,
          SUM(i.reserved_stock) AS reserved_quantity
        FROM inventories i
        JOIN products p ON i.product_id = p.product_id
        WHERE i.warehouse_id = ?
        GROUP BY i.product_id, p.product_name
        ORDER BY p.product_name ASC
      `;
      db.query(sql, [warehouse_id], (err, results) => {
        if (err) {
          console.error(
            "[Inventory.findByWareHouseId] Lỗi khi truy vấn:",
            err.message
          );
          return reject(err);
        }
        resolve({ success: true, data: results });
      });
    });
  },

  /**
   * Cập nhật tồn kho đặt trước và tồn kho khả dụng.
   * @param {string} product_id - ID sản phẩm.
   * @param {string} warehouse_id - ID kho.
   * @param {number} reservedDelta - Thay đổi tồn kho đặt trước.
   * @param {number} availableDelta - Thay đổi tồn kho khả dụng.
   * @returns {Promise<Object>} Promise giải quyết với kết quả truy vấn.
   */
  updateReservedAndAvailable: (
    product_id,
    warehouse_id,
    reservedDelta,
    availableDelta
  ) => {
    return new Promise((resolve, reject) => {
      const query = `
        UPDATE inventories
        SET
          reserved_stock = reserved_stock + ?,
          available_stock = available_stock + ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE product_id = ? AND warehouse_id = ?
      `;
      db.query(
        query,
        [reservedDelta, availableDelta, product_id, warehouse_id],
        (err, result) => {
          if (err) {
            console.error(
              "🚀 ~ inventory.model.js: updateReservedAndAvailable - Error:",
              err
            );
            return reject(err);
          }
          resolve(result);
        }
      );
    });
  },

  /**
   * Cập nhật số lượng tồn kho (chỉ quantity và available_stock).
   * @param {string} product_id - ID sản phẩm.
   * @param {string} warehouse_id - ID kho.
   * @param {number} quantityDelta - Thay đổi số lượng.
   * @returns {Promise<Object>} Promise giải quyết với kết quả truy vấn.
   */
  updateQuantitySimple: (product_id, warehouse_id, quantityDelta) => {
    return new Promise((resolve, reject) => {
      const query = `
        UPDATE inventories
        SET
          quantity = quantity + ?,
          available_stock = available_stock + ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE product_id = ? AND warehouse_id = ?
      `;
      db.query(
        query,
        [quantityDelta, quantityDelta, product_id, warehouse_id],
        (err, result) => {
          if (err) {
            console.error(
              "🚀 ~ inventory.model.js: updateQuantitySimple - Error:",
              err
            );
            return reject(err);
          }
          resolve(result);
        }
      );
    });
  },

  /**
   * Hàm tổng quát để cập nhật các trường tồn kho.
   * (Đây là hàm đã có sẵn trong code gốc của bạn, được đổi tên thành updateInventoryFields để rõ ràng hơn)
   * @param {string} product_id - ID sản phẩm.
   * @param {string} warehouse_id - ID kho.
   * @param {Object} deltas - Các thay đổi (quantityDelta, reservedDelta, availableDelta).
   * @returns {Promise<Object>} Promise giải quyết với kết quả truy vấn.
   */
  updateInventoryFields: (
    product_id,
    warehouse_id,
    { quantityDelta = 0, reservedDelta = 0, availableDelta = 0 }
  ) => {
    return new Promise((resolve, reject) => {
      const sql = `
        UPDATE inventories
        SET
          quantity = quantity + ?,
          reserved_stock = reserved_stock + ?,
          available_stock = available_stock + ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE product_id = ? AND warehouse_id = ?
      `;

      const values = [
        quantityDelta,
        reservedDelta,
        availableDelta,
        product_id,
        warehouse_id,
      ];

      db.query(sql, values, (err, result) => {
        if (err) {
          console.error(
            "🚀 ~ inventory.model.js: updateInventoryFields - Error:",
            err
          );
          return reject(err);
        }
        resolve(result);
      });
    });
  },
};

module.exports = InventoryModel;
