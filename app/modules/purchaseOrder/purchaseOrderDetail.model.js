// const db = require('../../config/db.config');

// exports.create = ({ po_detail_id, po_id, product_id, quantity, price }, callback) => {
//   const sql = 'INSERT INTO purchase_order_details (po_detail_id, po_id, product_id, quantity, price) VALUES (?, ?, ?, ?, ?)';
//   db.query(sql, [po_detail_id, po_id, product_id, quantity, price], callback);
// };

// exports.findByPOId = (po_id, callback) => {
//   const sql = 'SELECT * FROM purchase_order_details WHERE po_id = ?';
//   db.query(sql, [po_id], (err, results) => {
//     if (err) return callback(err);
//     callback(null, results); // Đã trả về mảng các object
//   });
// };

// exports.update = (po_detail_id, data, callback) => {
//   const { product_id, quantity, price } = data;
//   const sql = `
//     UPDATE purchase_order_details
//     SET product_id = ?, quantity = ?, price = ?
//     WHERE po_detail_id = ?
//   `;
//   db.query(sql, [product_id, quantity, price, po_detail_id], callback);
// };

// exports.delete = (po_detail_id, callback) => {
//   const sql = 'DELETE FROM purchase_order_details WHERE po_detail_id = ?';
//   db.query(sql, [po_detail_id], callback);
// };

const db = require("../../config/db.config");
// uuidv4 không cần thiết ở đây vì nó được tạo ở tầng service hoặc controller
// const { v4: uuidv4 } = require('uuid');

const PurchaseOrderDetailModel = {
  /**
   * Tạo một chi tiết đơn mua hàng mới trong cơ sở dữ liệu.
   * @param {Object} data - Dữ liệu chi tiết đơn mua hàng.
   * @param {string} data.po_detail_id - ID chi tiết đơn mua hàng.
   * @param {string} data.po_id - ID đơn mua hàng chính.
   * @param {string} data.product_id - ID sản phẩm.
   * @param {number} data.quantity - Số lượng sản phẩm.
   * @param {number} data.price - Giá sản phẩm.
   * @returns {Promise<Object>} Promise giải quyết với kết quả tạo chi tiết.
   */
  create: async ({ po_detail_id, po_id, product_id, quantity, price }) => {
    const sql =
      "INSERT INTO purchase_order_details (po_detail_id, po_id, product_id, quantity, price) VALUES (?, ?, ?, ?, ?)";
    const values = [po_detail_id, po_id, product_id, quantity, price];
    try {
      const [results] = await db.promise().query(sql, values);
      return {
        po_detail_id,
        po_id,
        product_id,
        quantity,
        price,
        affectedRows: results.affectedRows,
      };
    } catch (error) {
      console.error(
        "🚀 ~ purchaseOrderDetail.model.js: create - Lỗi khi tạo chi tiết đơn mua hàng:",
        error
      );
      throw error;
    }
  },

  /**
   * Tìm kiếm tất cả chi tiết đơn mua hàng theo ID đơn mua hàng chính.
   * @param {string} po_id - ID đơn mua hàng chính.
   * @returns {Promise<Array<Object>>} Promise giải quyết với mảng các chi tiết đơn mua hàng.
   */
  findByPOId: async (po_id) => {
    const sql = "SELECT * FROM purchase_order_details WHERE po_id = ?";
    try {
      const [results] = await db.promise().query(sql, [po_id]);
      return results;
    } catch (error) {
      console.error(
        "🚀 ~ purchaseOrderDetail.model.js: findByPOId - Lỗi khi tìm chi tiết đơn mua hàng:",
        error
      );
      throw error;
    }
  },

  /**
   * Cập nhật thông tin chi tiết đơn mua hàng.
   * @param {string} po_detail_id - ID chi tiết đơn mua hàng cần cập nhật.
   * @param {Object} data - Dữ liệu cập nhật (product_id, quantity, price).
   * @returns {Promise<Object>} Promise giải quyết với kết quả cập nhật.
   */
  update: async (po_detail_id, data) => {
    const { product_id, quantity, price } = data;
    const sql = `
      UPDATE purchase_order_details
      SET product_id = ?, quantity = ?, price = ?
      WHERE po_detail_id = ?
    `;
    const values = [product_id, quantity, price, po_detail_id];
    try {
      const [results] = await db.promise().query(sql, values);
      return { po_detail_id, ...data, affectedRows: results.affectedRows };
    } catch (error) {
      console.error(
        "🚀 ~ purchaseOrderDetail.model.js: update - Lỗi khi cập nhật chi tiết đơn mua hàng:",
        error
      );
      throw error;
    }
  },

  /**
   * Xóa một chi tiết đơn mua hàng.
   * @param {string} po_detail_id - ID chi tiết đơn mua hàng cần xóa.
   * @returns {Promise<Object>} Promise giải quyết với kết quả xóa.
   */
  delete: async (po_detail_id) => {
    const sql = "DELETE FROM purchase_order_details WHERE po_detail_id = ?";
    try {
      const [results] = await db.promise().query(sql, [po_detail_id]);
      return { po_detail_id, affectedRows: results.affectedRows };
    } catch (error) {
      console.error(
        "🚀 ~ purchaseOrderDetail.model.js: delete - Lỗi khi xóa chi tiết đơn mua hàng:",
        error
      );
      throw error;
    }
  },
};

module.exports = PurchaseOrderDetailModel;
