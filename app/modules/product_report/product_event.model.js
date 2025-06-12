const db = require("../../config/db.config"); // Đảm bảo đường dẫn đúng đến file cấu hình database của bạn
const { v4: uuidv4 } = require("uuid"); // Để tạo UUID cho event_id

const ProductEventModel = {
  /**
   * Ghi lại một sự kiện liên quan đến sản phẩm vào bảng product_events.
   * Đây là một bản ghi lịch sử toàn diện về mọi hoạt động của sản phẩm.
   *
   * @param {Object} eventData - Dữ liệu của sự kiện sản phẩm.
   * @param {string} eventData.product_id - ID sản phẩm liên quan.
   * @param {string} [eventData.warehouse_id=null] - ID kho nơi sự kiện xảy ra (tùy chọn).
   * @param {string} eventData.event_type - Loại sự kiện (ví dụ: 'ORDER_SOLD', 'PO_RECEIVED', 'STOCK_ADJUSTMENT_INCREASE').
   * @param {number} eventData.quantity_impact - Số lượng thay đổi (dương cho tăng, âm cho giảm).
   * @param {number} [eventData.transaction_price=null] - Giá trên mỗi đơn vị tại thời điểm giao dịch (tùy chọn).
   * @param {string} [eventData.partner_name=null] - Tên đối tác (khách hàng hoặc nhà cung cấp) (tùy chọn).
   * @param {number} [eventData.current_stock_after=null] - Tổng số lượng tồn kho của sản phẩm sau sự kiện (tùy chọn).
   * @param {string} eventData.reference_id - ID của tài liệu gốc (order_id, po_id, adjustment_id).
   * @param {string} eventData.reference_type - Loại tài liệu gốc ('ORDER', 'PURCHASE_ORDER', 'INVENTORY_ADJUSTMENT').
   * @param {string} [eventData.description=null] - Mô tả chi tiết về sự kiện (tùy chọn).
   * @param {string} [eventData.initiated_by=null] - ID của người dùng hoặc hệ thống đã kích hoạt sự kiện (tùy chọn).
   * @returns {Promise<Object>} Promise giải quyết với kết quả truy vấn.
   */
  recordEvent: ({
    product_id,
    warehouse_id = null,
    event_type,
    quantity_impact,
    transaction_price = null,
    partner_name = null,
    current_stock_after = null,
    reference_id,
    reference_type,
    description = null,
    initiated_by = null,
  }) => {
    return new Promise((resolve, reject) => {
      const event_id = uuidv4(); // Tạo một UUID duy nhất cho bản ghi sự kiện

      const sql = `
        INSERT INTO product_events (
          event_id, product_id, warehouse_id, event_type,
          quantity_impact, transaction_price, partner_name, current_stock_after,
          reference_id, reference_type, description, event_timestamp, initiated_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?)
      `;

      const values = [
        event_id,
        product_id,
        warehouse_id,
        event_type,
        quantity_impact,
        transaction_price,
        partner_name,
        current_stock_after,
        reference_id,
        reference_type,
        description,
        initiated_by,
      ];

      db.query(sql, values, (err, result) => {
        if (err) {
          console.error(
            "🚀 ~ product_event.model.js: recordEvent - Error recording product event:",
            err
          );
          return reject(err);
        }
        resolve(result); // Trả về kết quả từ thao tác INSERT
      });
    });
  },

  /**
   * Lấy tất cả các sự kiện lịch sử cho một sản phẩm cụ thể.
   *
   * @param {string} product_id - ID của sản phẩm cần lấy lịch sử.
   * @returns {Promise<Array<Object>>} Promise giải quyết với một mảng các sự kiện.
   */
  getEventsByProductId: (product_id) => {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT
          event_id,
          product_id,
          warehouse_id,
          event_type,
          quantity_impact,
          transaction_price,
          partner_name,
          current_stock_after,
          reference_id,
          reference_type,
          description,
          event_timestamp,
          initiated_by
        FROM product_events
        WHERE product_id = ?
        ORDER BY event_timestamp ASC; -- Sắp xếp theo thời gian tăng dần
      `;
      db.query(sql, [product_id], (err, results) => {
        if (err) {
          console.error(
            "🚀 ~ product_event.model.js: getEventsByProductId - Error fetching product events:",
            err
          );
          return reject(err);
        }
        resolve(results);
      });
    });
  },

  /**
   * Lấy tất cả các sự kiện lịch sử cho một sản phẩm cụ thể trong một kho cụ thể.
   *
   * @param {string} product_id - ID của sản phẩm.
   * @param {string} warehouse_id - ID của kho.
   * @returns {Promise<Array<Object>>} Promise giải quyết với một mảng các sự kiện.
   */
  getEventsByProductAndWarehouseId: (product_id, warehouse_id) => {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT
          pe.event_id,
          pe.product_id,
          pe.warehouse_id,
          w.warehouse_name, -- Lấy tên kho từ bảng warehouses
          pe.event_type,
          pe.quantity_impact,
          pe.transaction_price,
          pe.partner_name,
          pe.current_stock_after,
          pe.reference_id,
          pe.reference_type,
          pe.description,
          pe.event_timestamp,
          pe.initiated_by
        FROM product_events pe
        JOIN warehouses w ON pe.warehouse_id = w.warehouse_id -- JOIN với bảng warehouses
        WHERE pe.product_id = ? AND pe.warehouse_id = ?
        ORDER BY pe.event_timestamp ASC;
      `;
      db.query(sql, [product_id, warehouse_id], (err, results) => {
        if (err) {
          console.error(
            "🚀 ~ product_event.model.js: getEventsByProductAndWarehouseId - Error fetching product events by product and warehouse:",
            err
          );
          return reject(err);
        }
        resolve(results);
      });
    });
  },
};

module.exports = ProductEventModel;
