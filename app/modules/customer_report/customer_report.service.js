const db = require("../../config/db.config"); // Import trực tiếp db instance
const OrderModel = require("../orders/order.model"); // Để lấy chi tiết đơn hàng
const ProductEventModel = require("../product_report/product_event.model"); // Để lấy lịch sử bán/trả sản phẩm
const InvoiceModel = require("../invoice/invoice.model"); // Để tính công nợ
const TransactionModel = require("../transactions/transaction.model"); // Để tính công nợ

const CustomerReportService = {
  /**
   * Lấy tổng số đơn hàng và tổng chi tiêu của một khách hàng.
   * Chỉ tính các đơn hàng có trạng thái "Hoàn tất".
   *
   * @param {string} customer_id - ID của khách hàng.
   * @returns {Promise<Object>} Promise giải quyết với đối tượng chứa tổng số đơn hàng và tổng chi tiêu.
   * Ví dụ: { total_orders: 5, total_expenditure: 1250000.00 }
   * @throws {Error} Nếu có lỗi trong quá trình truy vấn database.
   */
  getTotalOrdersAndExpenditure: async (customer_id) => {
    try {
      const sql = `
        SELECT
          COUNT(order_id) AS total_orders,
          COALESCE(SUM(final_amount), 0) AS total_expenditure
        FROM orders
        WHERE customer_id = ? AND order_status = 'Hoàn tất';
      `;
      const [rows] = await db.promise().query(sql, [customer_id]);
      return rows[0];
    } catch (error) {
      console.error(
        "🚀 ~ CustomerReportService: getTotalOrdersAndExpenditure - Lỗi:",
        error
      );
      throw error;
    }
  },

  /**
   * Lấy lịch sử bán hàng và trả hàng của một khách hàng.
   * Lấy dữ liệu từ product_events và lọc theo customer_id thông qua order_id.
   *
   * @param {string} customer_id - ID của khách hàng.
   * @returns {Promise<Array<Object>>} Promise giải quyết với mảng các sự kiện bán/trả.
   * @throws {Error} Nếu có lỗi trong quá trình truy vấn database.
   */
  getSalesReturnHistory: async (customer_id) => {
    try {
      // Chúng ta cần JOIN product_events với orders để lấy customer_id
      const sql = `
        SELECT
          pe.event_id,
          pe.product_id,
          p.product_name, -- Giả định có bảng products để JOIN
          pe.quantity_impact,
          pe.transaction_price,
          pe.event_type,
          pe.event_timestamp,
          pe.reference_id AS order_id,
          pe.description,
          pe.current_stock_after
        FROM product_events pe
        JOIN orders o ON pe.reference_id = o.order_id
        LEFT JOIN products p ON pe.product_id = p.product_id -- Để lấy tên sản phẩm
        WHERE o.customer_id = ?
        AND pe.reference_type = 'ORDER' -- Chỉ lấy sự kiện liên quan đến đơn hàng
        AND (pe.event_type = 'ORDER_SOLD' OR pe.event_type = 'ORDER_CANCELLED' OR pe.event_type = 'RETURN_FROM_CUSTOMER')
        ORDER BY pe.event_timestamp DESC;
      `;
      const [rows] = await db.promise().query(sql, [customer_id]);

      // Format lại event_type cho dễ đọc
      return rows.map((row) => {
        let displayEventType = row.event_type;
        switch (row.event_type) {
          case "ORDER_SOLD":
            displayEventType = "Bán hàng";
            break;
          case "ORDER_CANCELLED":
            displayEventType = "Hủy đơn hàng"; // Hoặc 'Hoàn trả kho' nếu nó thể hiện việc hoàn nhập
            break;
          case "RETURN_FROM_CUSTOMER":
            displayEventType = "Khách hàng trả hàng";
            break;
          // Thêm các case khác nếu có thêm event_type
        }
        return {
          event_id: row.event_id,
          product_id: row.product_id,
          product_name: row.product_name,
          quantity_impact: row.quantity_impact,
          transaction_price: row.transaction_price,
          event_type: displayEventType,
          event_timestamp: row.event_timestamp,
          order_id: row.order_id,
          description: row.description,
          current_stock_after: row.current_stock_after,
        };
      });
    } catch (error) {
      console.error(
        "🚀 ~ CustomerReportService: getSalesReturnHistory - Lỗi:",
        error
      );
      throw error;
    }
  },

  /**
   * Lấy lịch sử tất cả các đơn hàng của một khách hàng, bao gồm chi tiết từng đơn hàng.
   *
   * @param {string} customer_id - ID của khách hàng.
   * @returns {Promise<Array<Object>>} Promise giải quyết với mảng các đối tượng đơn hàng đã định dạng.
   * @throws {Error} Nếu có lỗi trong quá trình truy vấn database.
   */
  getOrderHistoryWithDetails: async (customer_id) => {
    try {
      // Giả định OrderModel có hàm để lấy đơn hàng kèm chi tiết sản phẩm cho một customer_id
      // Nếu không, cần thêm hàm này vào OrderModel hoặc viết truy vấn JOIN phức tạp ở đây.
      // Dựa trên hàm OrderModel.readById, chúng ta có thể gọi từng đơn hàng.
      // Tuy nhiên, để tối ưu, tốt hơn là viết một truy vấn JOIN lớn ở model hoặc service.
      const sql = `
        SELECT
          o.order_id,
          o.order_code,
          o.order_date,
          o.order_status,
          o.total_amount,
          o.final_amount,
          o.discount_amount,
          o.note,
          o.payment_method,
          o.created_at,
          o.updated_at,
          od.order_detail_id,
          od.product_id,
          p.product_name, -- Giả định có bảng products để JOIN
          p.sku, -- Giả định có bảng products để JOIN
          od.quantity,
          od.price
        FROM orders o
        JOIN order_details od ON o.order_id = od.order_id
        LEFT JOIN products p ON od.product_id = p.product_id
        WHERE o.customer_id = ?
        ORDER BY o.created_at DESC, od.created_at ASC;
      `;
      const [rows] = await db.promise().query(sql, [customer_id]);

      // Nhóm kết quả theo từng đơn hàng
      const ordersMap = new Map();
      rows.forEach((row) => {
        if (!ordersMap.has(row.order_id)) {
          ordersMap.set(row.order_id, {
            order_id: row.order_id,
            order_code: row.order_code,
            order_date: row.order_date,
            order_status: row.order_status,
            total_amount: row.total_amount,
            final_amount: row.final_amount,
            discount_amount: row.discount_amount,
            note: row.note,
            payment_method: row.payment_method,
            created_at: row.created_at,
            updated_at: row.updated_at,
            details: [],
          });
        }
        ordersMap.get(row.order_id).details.push({
          order_detail_id: row.order_detail_id,
          product_id: row.product_id,
          product_name: row.product_name,
          sku: row.sku,
          quantity: row.quantity,
          price: row.price,
        });
      });

      return Array.from(ordersMap.values());
    } catch (error) {
      console.error(
        "🚀 ~ CustomerReportService: getOrderHistoryWithDetails - Lỗi:",
        error
      );
      throw error;
    }
  },

  /**
   * Tính toán tổng công nợ cần thu từ một khách hàng.
   * Công nợ được tính bằng tổng các hóa đơn chưa thanh toán.
   *
   * @param {string} customer_id - ID của khách hàng.
   * @returns {Promise<number>} Promise giải quyết với tổng công nợ.
   * @throws {Error} Nếu có lỗi trong quá trình truy vấn database.
   */
  getReceivables: async (customer_id) => {
    try {
      // Giả định bảng `invoices` có `customer_id` và `status` (paid/unpaid)
      // Nếu không, bạn cần JOIN với bảng `orders` hoặc `transactions` để lấy customer_id.
      // Đây là cách đơn giản nhất:
      const sql = `
        SELECT COALESCE(SUM(final_amount), 0) AS total_receivables
        FROM invoices
        WHERE customer_id = ? AND status != 'paid'; -- Hoặc status = 'unpaid', 'partially_paid'
      `;
      // Nếu bạn muốn tính toán từ transactions, logic sẽ phức tạp hơn:
      // Tính tổng amount của các invoices cho customer đó
      // Trừ đi tổng amount của các transactions type 'receipt' liên quan đến customer/invoice đó
      const [rows] = await db.promise().query(sql, [customer_id]);
      return rows[0].total_receivables;
    } catch (error) {
      console.error("🚀 ~ CustomerReportService: getReceivables - Lỗi:", error);
      throw error;
    }
  },
};

module.exports = CustomerReportService;
