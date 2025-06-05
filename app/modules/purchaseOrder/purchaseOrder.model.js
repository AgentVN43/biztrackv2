// const db = require("../../config/db.config");

// exports.create = (
//   { po_id, supplier_name, warehouse_id, note, status, total_amount },
//   callback
// ) => {
//   const sql =
//     "INSERT INTO purchase_orders (po_id, supplier_name, warehouse_id, note, status, total_amount) VALUES (?, ?, ?, ?, ?, ?)";
//   db.query(
//     sql,
//     [po_id, supplier_name, warehouse_id, note, status, total_amount],
//     callback
//   );
// };

// exports.update = (po_id, data, callback) => {
//   const fields = [];
//   const values = [];

//   if (data.supplier_name !== undefined) {
//     fields.push("supplier_name = ?");
//     values.push(data.supplier_name);
//   }
//   if (data.warehouse_id !== undefined) {
//     fields.push("warehouse_id = ?");
//     values.push(data.warehouse_id);
//   }
//   if (data.note !== undefined) {
//     fields.push("note = ?");
//     values.push(data.note);
//   }
//   if (data.status !== undefined) {
//     fields.push("status = ?");
//     values.push(data.status);
//   }
//   // Thêm điều kiện để cập nhật total_amount
//   if (data.total_amount !== undefined) {
//     fields.push("total_amount = ?");
//     values.push(data.total_amount);
//   }

//   if (fields.length === 0) {
//     return callback(new Error("No valid fields to update."));
//   }

//   values.push(po_id);
//   const sql = `UPDATE purchase_orders SET ${fields.join(", ")} WHERE po_id = ?`;

//   db.query(sql, values, (err, result) => {
//     if (err) return callback(err);
//     if (result.affectedRows === 0) return callback(null, null);
//     callback(null, { po_id, ...data });
//   });
// };

// exports.findById = (po_id, callback) => {
//   console.log("PO models:", po_id);
//   const sql = "SELECT * FROM purchase_orders WHERE po_id = ?";
//   db.query(sql, [po_id], (err, order) => {
//     callback(err, order ? order[0] : null);
//     console.log("FidById:", order);
//   });
// };

// exports.findAll = (callback) => {
//   db.query("SELECT * FROM purchase_orders ORDER BY created_at DESC", callback);
// };

// exports.updateStatus = (po_id, status, posted_at, callback) => {
//   const sql =
//     "UPDATE purchase_orders SET status = ?, posted_at = ? WHERE po_id = ?";
//   db.query(sql, [status, posted_at, po_id], callback);
// };

// exports.remove = (po_id, callback) => {
//   const sql = "DELETE FROM purchase_orders WHERE po_id = ?";
//   db.query(sql, [po_id], callback);
// };

// exports.findWithDetailsById = (po_id, callback) => {
//   const sql = `
//     SELECT
//     po.po_id, po.supplier_name, po.warehouse_id, po.note, po.status,
//     pod.po_detail_id, pod.product_id, pod.quantity, pod.price,
//     p.product_name AS product_name, p.sku
//     FROM purchase_orders po
//     JOIN purchase_order_details pod ON po.po_id = pod.po_id
//     JOIN products p ON pod.product_id = p.product_id
//     WHERE po.po_id = ?;
//   `;
//   db.query(sql, [po_id], callback);
// };
// purchase_order.model.js
const db = require("../../config/db.config");
const { v4: uuidv4 } = require("uuid"); // Đảm bảo uuidv4 được import

const PurchaseOrderModel = {
  /**
   * Tạo một đơn mua hàng mới trong cơ sở dữ liệu.
   * @param {Object} data - Dữ liệu đơn mua hàng.
   * @param {string} data.po_id - ID đơn mua hàng (nếu đã có, nếu không sẽ tự sinh).
   * @param {string} data.supplier_name - Tên nhà cung cấp.
   * @param {string} data.warehouse_id - ID kho.
   * @param {string} [data.note] - Ghi chú.
   * @param {string} data.status - Trạng thái đơn mua hàng.
   * @param {number} [data.total_amount] - Tổng số tiền.
   * @returns {Promise<Object>} Promise giải quyết với đối tượng đơn mua hàng đã tạo.
   */
  create: async (data) => {
    const po_id = data.po_id || uuidv4(); // Sử dụng po_id nếu có, nếu không tự sinh
    const { supplier_name, warehouse_id, note, status, total_amount } = data; // ✅ Chỉ lấy các trường có trong DB

    // Validate bắt buộc theo schema
    if (!supplier_name || !warehouse_id || !status) {
      // total_amount có thể NULL, nên không validate ở đây
      throw new Error(
        "Thiếu thông tin bắt buộc để tạo đơn mua hàng (supplier_name, warehouse_id, status)."
      );
    }

    const query = `
            INSERT INTO purchase_orders (
                po_id, supplier_name, warehouse_id, note, status, total_amount
            ) VALUES (?, ?, ?, ?, ?, ?)
        `; // ✅ Cập nhật câu SQL INSERT

    const values = [
      po_id,
      supplier_name,
      warehouse_id,
      note || null, // note có thể NULL
      status,
      total_amount || 0, // total_amount có default 0, nhưng nếu truyền null sẽ lỗi nếu cột là NOT NULL
    ]; // ✅ Cập nhật các giá trị

    try {
      console.log("🚀 ~ purchase_order.model.js: create - SQL Query:", query);
      console.log("🚀 ~ purchase_order.model.js: create - SQL Values:", values);
      const [results] = await db.promise().query(query, values);
      const purchaseOrderResult = { po_id, ...data }; // Trả về dữ liệu gốc kèm po_id
      console.log(
        "🚀 ~ purchase_order.model.js: create - Purchase Order created successfully:",
        purchaseOrderResult
      );
      return purchaseOrderResult;
    } catch (error) {
      console.error(
        "🚀 ~ purchase_order.model.js: create - Lỗi khi tạo đơn mua hàng (DB error):",
        error
      );
      throw error;
    }
  },

  /**
   * Cập nhật thông tin đơn mua hàng.
   * @param {string} po_id - ID đơn mua hàng cần cập nhật.
   * @param {Object} data - Dữ liệu cập nhật.
   * @returns {Promise<Object|null>} Promise giải quyết với đối tượng đơn mua hàng đã cập nhật hoặc null nếu không tìm thấy.
   */
  update: async (po_id, data) => {
    const fields = [];
    const values = [];

    // Xây dựng động các cặp 'field = ?' và giá trị tương ứng
    // ✅ Chỉ thêm các trường có trong schema
    if (data.supplier_name !== undefined) {
      fields.push("supplier_name = ?");
      values.push(data.supplier_name);
    }
    if (data.warehouse_id !== undefined) {
      fields.push("warehouse_id = ?");
      values.push(data.warehouse_id);
    }
    if (data.note !== undefined) {
      fields.push("note = ?");
      values.push(data.note);
    }
    if (data.status !== undefined) {
      fields.push("status = ?");
      values.push(data.status);
    }
    if (data.total_amount !== undefined) {
      fields.push("total_amount = ?");
      values.push(data.total_amount);
    }
    // posted_at chỉ nên cập nhật khi trạng thái chuyển sang 'posted'
    // if (data.posted_at !== undefined) {
    //     fields.push("posted_at = ?");
    //     values.push(data.posted_at);
    // }

    if (fields.length === 0) {
      throw new Error("No valid fields to update.");
    }

    fields.push(`updated_at = CURRENT_TIMESTAMP`); // Luôn cập nhật thời gian sửa đổi
    values.push(po_id);
    const sql = `UPDATE purchase_orders SET ${fields.join(
      ", "
    )} WHERE po_id = ?`;

    try {
      const [results] = await db.promise().query(sql, values);
      if (results.affectedRows === 0) {
        return null; // Không có hàng nào bị ảnh hưởng (không tìm thấy po_id)
      }
      return { po_id, ...data }; // Trả về thông tin đã cập nhật
    } catch (error) {
      console.error(
        "🚀 ~ purchase_order.model.js: update - Lỗi khi cập nhật đơn mua hàng:",
        error
      );
      throw error;
    }
  },

  /**
   * Tìm đơn mua hàng theo ID.
   * @param {string} po_id - ID đơn mua hàng.
   * @returns {Promise<Object|null>} Promise giải quyết với đối tượng đơn mua hàng hoặc null nếu không tìm thấy.
   */
  findById: async (po_id) => {
    console.log("🚀 ~ purchase_order.model.js: findById - PO ID:", po_id);
    const sql = "SELECT * FROM purchase_orders WHERE po_id = ?";
    try {
      const [rows] = await db.promise().query(sql, [po_id]);
      const order = rows.length ? rows[0] : null;
      console.log("🚀 ~ purchase_order.model.js: findById - Result:", order);
      return order;
    } catch (error) {
      console.error(
        "🚀 ~ purchase_order.model.js: findById - Lỗi khi tìm đơn mua hàng:",
        error
      );
      throw error;
    }
  },

  /**
   * Lấy tất cả các đơn mua hàng.
   * @returns {Promise<Array<Object>>} Promise giải quyết với danh sách đơn mua hàng.
   */
  findAll: async () => {
    const sql = "SELECT * FROM purchase_orders ORDER BY created_at DESC";
    try {
      const [rows] = await db.promise().query(sql);
      return rows;
    } catch (error) {
      console.error(
        "🚀 ~ purchase_order.model.js: findAll - Lỗi khi lấy tất cả đơn mua hàng:",
        error
      );
      throw error;
    }
  },

  /**
   * Cập nhật trạng thái và thời gian đăng của đơn mua hàng.
   * @param {string} po_id - ID đơn mua hàng.
   * @param {string} status - Trạng thái mới.
   * @param {Date} posted_at - Thời gian đăng.
   * @returns {Promise<Object>} Promise giải quyết với kết quả cập nhật.
   */
  updateStatus: async (po_id, status, posted_at) => {
    // ✅ posted_at là datetime, cần đảm bảo định dạng đúng hoặc để DB tự xử lý nếu NULL
    const sql =
      "UPDATE purchase_orders SET status = ?, posted_at = ?, updated_at = CURRENT_TIMESTAMP WHERE po_id = ?";
    try {
      const [results] = await db
        .promise()
        .query(sql, [status, posted_at, po_id]);
      return results;
    } catch (error) {
      console.error(
        "🚀 ~ purchase_order.model.js: updateStatus - Lỗi khi cập nhật trạng thái đơn mua hàng:",
        error
      );
      throw error;
    }
  },

  /**
   * Xóa đơn mua hàng.
   * @param {string} po_id - ID đơn mua hàng.
   * @returns {Promise<Object>} Promise giải quyết với kết quả xóa.
   */
  remove: async (po_id) => {
    const sql = "DELETE FROM purchase_orders WHERE po_id = ?";
    try {
      const [results] = await db.promise().query(sql, [po_id]);
      return results;
    } catch (error) {
      console.error(
        "🚀 ~ purchase_order.model.js: remove - Lỗi khi xóa đơn mua hàng:",
        error
      );
      throw error;
    }
  },

  /**
   * Tìm đơn mua hàng kèm chi tiết.
   * @param {string} po_id - ID đơn mua hàng.
   * @returns {Promise<Array<Object>>} Promise giải quyết với mảng các bản ghi đơn mua hàng kèm chi tiết.
   */
  findWithDetailsById: async (po_id) => {
    const sql = `
            SELECT 
                po.po_id, po.supplier_name, po.warehouse_id, po.note, po.status, po.total_amount,
                pod.po_detail_id, pod.product_id, pod.quantity, pod.price,
                p.product_name AS product_name, p.sku
            FROM purchase_orders po
            JOIN purchase_order_details pod ON po.po_id = pod.po_id
            JOIN products p ON pod.product_id = p.product_id
            WHERE po.po_id = ?;
        `; // ✅ Thêm total_amount vào SELECT
    try {
      const [rows] = await db.promise().query(sql, [po_id]);
      return rows;
    } catch (error) {
      console.error(
        "🚀 ~ purchase_order.model.js: findWithDetailsById - Lỗi khi tìm đơn mua hàng kèm chi tiết:",
        error
      );
      throw error;
    }
  },
};

module.exports = PurchaseOrderModel;
