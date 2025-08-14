const db = require("../../config/db.config");
const { v4: uuidv4 } = require("uuid");
const TransactionModel = require("../transactions/transaction.model");
const InvoiceModel = require("../invoice/invoice.model"); // ✅ Import InvoiceModel để đồng bộ

/**
 * Hàm tạo mã đơn hàng tự động.
 * @returns {Promise<string>} Promise giải quyết với mã đơn hàng mới.
 */
const generateOrderCode = async () => {
  const prefix = "ORD";
  const today = new Date();
  const dateStr = `${today.getFullYear()}${String(
    today.getMonth() + 1
  ).padStart(2, "0")}${String(today.getDate()).padStart(2, "0")}`;

  const queryDateCondition = `order_code LIKE '${prefix}-${dateStr}%'`;

  try {
    const [results] = await db.promise().query(
      `SELECT IFNULL(MAX(CAST(SUBSTRING_INDEX(order_code, '-', -1) AS UNSIGNED)), 0) AS last_sequence 
       FROM orders 
       WHERE ${queryDateCondition}`
    );

    let nextSequence = results[0]?.last_sequence
      ? parseInt(results[0].last_sequence) + 1
      : 1;

    const paddedSequence = String(nextSequence).padStart(5, "0");

    const orderCode = `${prefix}-${dateStr}-${paddedSequence}`;
    return orderCode;
  } catch (error) {
    //console.error("Lỗi khi tạo mã đơn hàng:", error.message);
    throw error;
  }
};

// Đối tượng Order chứa các phương thức tương tác với DB
const OrderModel = {
  create: async (data) => {
    const {
      customer_id,
      order_date,
      total_amount,
      discount_amount,
      final_amount,
      amount_paid = 0,
      shipping_address,
      payment_method,
      note,
      order_amount,
      warehouse_id,
      shipping_fee,
    } = data;

    if (!customer_id) {
      throw new Error("customer_id là bắt buộc");
    }
    if (!order_date || isNaN(Date.parse(order_date))) {
      throw new Error("order_date không hợp lệ");
    }
    if (!warehouse_id) {
      throw new Error("warehouse_id là bắt buộc");
    }

    try {
      const order_code = await generateOrderCode();
      const order_status = "Mới";
      const is_active = 1;
      const order_id = uuidv4();

      const query = `
        INSERT INTO orders (
          order_id, customer_id, order_date, order_code, total_amount,
          discount_amount, final_amount, amount_paid, order_status, is_active,
          shipping_address, payment_method, note, warehouse_id, order_amount, shipping_fee
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const values = [
        order_id,
        customer_id,
        order_date,
        order_code,
        total_amount || 0,
        discount_amount || 0,
        final_amount || 0,
        amount_paid,
        order_status,
        is_active,
        shipping_address || null,
        payment_method || null,
        note || null,
        warehouse_id || null,
        order_amount || 0,
        shipping_fee || 0,
      ];

      const [results] = await db.promise().query(query, values);

      return {
        order_id,
        order_code,
        customer_id,
        order_date,
        order_status,
        is_active,
        amount_paid,
        ...data,
      };
    } catch (error) {
      //console.error("Lỗi khi lưu đơn hàng:", error.message);
      throw error;
    }
  },

  read: async (skip, limit, filters = {}) => {
    const baseQuery = `
      SELECT
        orders.*,
        customers.customer_name
      FROM orders
      LEFT JOIN customers ON orders.customer_id = customers.customer_id
      WHERE orders.is_active = 1
    `;

    let whereClause = "";
    const queryParams = [skip, limit];

    if (filters.startDate && filters.endDate) {
      whereClause += ` AND DATE(orders.created_at) BETWEEN DATE(?) AND DATE(?)`;
      queryParams.unshift(filters.endDate);
      queryParams.unshift(filters.startDate);
    } else if (filters.startDate) {
      whereClause += ` AND DATE(orders.created_at) >= DATE(?)`;
      queryParams.unshift(filters.startDate);
    } else if (filters.endDate) {
      whereClause += ` AND DATE(orders.created_at) <= DATE(?)`;
      queryParams.unshift(filters.endDate);
    }

    if (filters.order_status) {
      whereClause += ` AND orders.order_status = ?`;
      queryParams.unshift(filters.order_status);
    }

    const finalQuery = `
      ${baseQuery}
      ${whereClause}
      ORDER BY
        COALESCE(orders.updated_at, orders.created_at) DESC
      LIMIT ?, ?
    `;

    const countQuery = `
      SELECT COUNT(*) AS total
      FROM orders
      WHERE is_active = 1
      ${whereClause}
    `;

    try {
      const [countResults] = await db
        .promise()
        .query(countQuery, queryParams.slice(0, queryParams.length - 2));
      const total = countResults[0].total;

      //console.log("Final Query:", finalQuery);
      //console.log("Query Params:", queryParams);
      const [results] = await db.promise().query(finalQuery, queryParams);
      //console.log("Raw Results:", results);
      const formattedResults = results.map((order) => ({
        order_id: order.order_id,
        order_code: order.order_code,
        order_date: order.order_date,
        order_status: order.order_status,
        shipping_address: order.shipping_address,
        shipping_fee: order.shipping_fee,
        payment_method: order.payment_method,
        note: order.note,
        total_amount: order.total_amount,
        discount_amount: order.discount_amount,
        final_amount: order.final_amount,
        created_at: order.created_at,
        updated_at: order.updated_at,
        warehouse_id: order.warehouse_id,
        customer: {
          customer_id: order.customer_id,
          customer_name: order.customer_name || "Khách lẻ",
        },
      }));
      return { data: formattedResults, total: total };
    } catch (error) {
      //console.error("Lỗi khi đọc tất cả đơn hàng (Model):", error.message);
      throw error;
    }
  },

  readById: async (order_id) => {
    try {
      const [orderResults] = await db.promise().query(
        "SELECT * FROM orders WHERE order_id = ?",
        [order_id]
      );
      if (orderResults.length === 0) return null;

      const order = orderResults[0];

      const [detailResults] = await db.promise().query(
        "SELECT * FROM order_details WHERE order_id = ?",
        [order_id]
      );

      order.order_details = detailResults || [];

      if (order.order_status === "Hoàn tất") {
        const [invoiceResults] = await db
          .promise()
          .query("SELECT * FROM invoices WHERE order_id = ?", [order_id]);
        order.invoices = invoiceResults || [];

        for (const invoice of order.invoices) {
          const [transactionResults] = await db
            .promise()
            .query("SELECT * FROM transactions WHERE related_id = ?", [
              invoice.invoice_id,
            ]);
          invoice.transactions = transactionResults || [];
        }
      }

      return order;
    } catch (error) {
      //console.error("Lỗi khi đọc đơn hàng theo ID:", error.message);
      throw error;
    }
  },

  update: async (order_id, data) => {
    const fields = [];
    const values = [];

    for (const key in data) {
      fields.push(`${key} = ?`);
      values.push(data[key]);
    }

    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    const sql = `UPDATE orders SET ${fields.join(", ")} WHERE order_id = ?`;
    values.push(order_id);

    try {
      const [results] = await db.promise().query(sql, values);
      if (results.affectedRows === 0) {
        return null;
      }
      return { order_id, ...data };
    } catch (error) {
      //console.error("Lỗi khi cập nhật đơn hàng:", error.message);
      throw error;
    }
  },

  delete: async (order_id) => {
    try {
      const [results] = await db.promise().query(
        "DELETE FROM orders WHERE order_id = ?",
        [order_id]
      );
      return results.affectedRows > 0;
    } catch (error) {
      //console.error("Lỗi khi xóa đơn hàng:", error.message);
      throw error;
    }
  },

  /**
   * Cập nhật chỉ amount_paid của order và tự động đồng bộ với invoice
   * @param {string} orderId - ID của đơn hàng
   * @param {number} amountPaid - Số tiền đã thanh toán mới
   * @param {boolean} syncWithInvoice - Có đồng bộ với invoice không (mặc định: true)
   * @returns {Promise<Object>} Kết quả cập nhật
   */
  updateAmountPaid: async (orderId, amountPaid, syncWithInvoice = true) => {
    try {
      // 1. Lấy thông tin order hiện tại
      const [orderResults] = await db.promise().query(
        "SELECT amount_paid, final_amount FROM orders WHERE order_id = ?",
        [orderId]
      );

      if (orderResults.length === 0) {
        throw new Error("Order not found");
      }

      const currentOrder = orderResults[0];
      const newAmountPaid = parseFloat(amountPaid || 0);
      const previousAmountPaid = parseFloat(currentOrder.amount_paid || 0);

      // 2. Cập nhật amount_paid trong order
      const updateOrderSql = `
        UPDATE orders 
        SET amount_paid = ?, updated_at = CURRENT_TIMESTAMP
        WHERE order_id = ?
      `;
      await db.promise().query(updateOrderSql, [newAmountPaid, orderId]);

      //console.log(`🚀 ~ OrderModel: updateAmountPaid - Updated order ${orderId}: amount_paid=${previousAmountPaid} -> ${newAmountPaid}`);

      // 3. Đồng bộ với invoice nếu được yêu cầu
      let syncResult = null;
      if (syncWithInvoice) {
        syncResult = await OrderModel.syncAmountPaidWithInvoice(orderId, newAmountPaid);
      }

      return {
        order_id: orderId,
        amount_paid: newAmountPaid,
        previous_amount_paid: previousAmountPaid,
        final_amount: parseFloat(currentOrder.final_amount || 0),
        sync_with_invoice: syncWithInvoice,
        sync_result: syncResult
      };
    } catch (error) {
      //console.error("🚀 ~ OrderModel: updateAmountPaid - Lỗi khi cập nhật amount_paid:", error);
      throw error;
    }
  },

  /**
   * Đồng bộ amount_paid giữa order và invoice liên quan
   * @param {string} orderId - ID của đơn hàng
   * @param {number} amountPaid - Số tiền đã thanh toán
   * @returns {Promise<Object>} Kết quả đồng bộ
   */
  syncAmountPaidWithInvoice: async (orderId, amountPaid) => {
    try {
      // 1. Cập nhật amount_paid trong order
      const updateOrderSql = `
        UPDATE orders 
        SET amount_paid = ?, updated_at = CURRENT_TIMESTAMP
        WHERE order_id = ?
      `;
      await db.promise().query(updateOrderSql, [parseFloat(amountPaid || 0), orderId]);

      // 2. Tìm và cập nhật invoice liên quan (nếu có)
      const [invoiceResults] = await db.promise().query(
        "SELECT invoice_id, invoice_code FROM invoices WHERE order_id = ? AND invoice_type = 'sale_invoice'",
        [orderId]
      );

      if (invoiceResults.length > 0) {
        const invoice = invoiceResults[0];
        //console.log(`🚀 ~ OrderModel: syncAmountPaidWithInvoice - Found invoice ${invoice.invoice_code} for order ${orderId}`);

        // Sử dụng InvoiceModel để đồng bộ amount_paid và status
        await InvoiceModel.syncAmountPaidAndStatus(invoice.invoice_id, amountPaid);

        return {
          order_updated: true,
          invoice_updated: true,
          invoice_id: invoice.invoice_id,
          invoice_code: invoice.invoice_code,
          amount_paid: parseFloat(amountPaid || 0)
        };
      }

      return {
        order_updated: true,
        invoice_updated: false,
        amount_paid: parseFloat(amountPaid || 0)
      };
    } catch (error) {
      //console.error("🚀 ~ OrderModel: syncAmountPaidWithInvoice - Lỗi khi đồng bộ amount_paid:", error);
      throw error;
    }
  },

  updateOrderWithDetails: async (orderId, orderData, orderDetails) => {
    const connection = await db.promise().getConnection();
    try {
      await connection.beginTransaction();

      const updateFields = [];
      const updateValues = [];

      const allowedOrderFields = [
        "customer_id",
        "order_date",
        "order_code",
        "order_status",
        "total_amount",
        "discount_amount",
        "final_amount",
        "amount_paid", // ✅ Thêm amount_paid vào danh sách cho phép
        "shipping_address",
        "payment_method",
        "note",
        "warehouse_id",
        "order_amount",
        "shipping_fee",
      ];

      allowedOrderFields.forEach((field) => {
        if (orderData[field] !== undefined) {
          updateFields.push(`${field} = ?`);
          // ✅ Xử lý đặc biệt cho amount_paid để đảm bảo kiểu dữ liệu
          if (field === "amount_paid") {
            updateValues.push(parseFloat(orderData[field] || 0));
          } else {
            updateValues.push(orderData[field]);
          }
        }
      });

      updateFields.push(`updated_at = NOW()`);

      if (
        updateFields.length === 1 &&
        updateFields[0] === "updated_at = NOW()"
      ) {
        console.warn(
          "Không có trường đơn hàng nào được cung cấp để cập nhật (ngoại trừ updated_at)."
        );
      }

      const updateOrderQuery = `
        UPDATE orders SET ${updateFields.join(", ")} WHERE order_id = ?
      `;
      updateValues.push(orderId);

      //console.log("🚀 ~ OrderModel: updateOrderWithDetails - Executing updateOrderQuery:", updateOrderQuery);
      //console.log("🚀 ~ OrderModel: updateOrderWithDetails - With parameters:", updateValues);

      await connection.query(updateOrderQuery, updateValues);

      // ✅ Log thông tin về amount_paid nếu có cập nhật
      if (orderData.amount_paid !== undefined) {
        //console.log(`🚀 ~ OrderModel: updateOrderWithDetails - Updated amount_paid for order ${orderId}: ${orderData.amount_paid}`);
      }

      const deleteDetailsQuery = `DELETE FROM order_details WHERE order_id = ?`;
      await connection.query(deleteDetailsQuery, [orderId]);

      if (orderDetails.length === 0) {
        await connection.commit();
        return {
          message: "Cập nhật đơn hàng thành công (không có sản phẩm chi tiết)",
          updated_fields: updateFields.filter(field => field !== "updated_at = NOW()"),
          amount_paid_updated: orderData.amount_paid !== undefined
        };
      }

      const insertDetailQuery = `
        INSERT INTO order_details (
          order_detail_id, order_id, product_id, quantity, price, discount, warehouse_id
        ) VALUES ?
      `;

      const detailValues = orderDetails.map((d) => [
        uuidv4(),
        d.order_id || orderId,
        d.product_id,
        d.quantity,
        d.price,
        d.discount || 0,
        d.warehouse_id || orderData.warehouse_id,
      ]);

      await connection.query(insertDetailQuery, [detailValues]);

      await connection.commit();
      return {
        message: "Cập nhật đơn hàng và chi tiết thành công",
        updated_fields: updateFields.filter(field => field !== "updated_at = NOW()"),
        amount_paid_updated: orderData.amount_paid !== undefined,
        details_count: orderDetails.length
      };
    } catch (error) {
      //console.error("🚀 ~ OrderModel: updateOrderWithDetails - Lỗi trong transaction:", error);
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },

  getTotalByStatus: async (filters = {}) => {
    const ALL_STATUSES = [
      "Mới",
      "Xác nhận",
      "Đang đóng hàng",
      "Đang giao",
      "Hoàn tất",
      "Huỷ đơn",
      "Huỷ điều chỉnh",
    ];

    let whereClause = "WHERE is_active = 1";
    const queryParams = [];

    if (filters.startDate && filters.endDate) {
      whereClause += " AND DATE(order_date) BETWEEN DATE(?) AND DATE(?)";
      queryParams.push(filters.startDate, filters.endDate);
    } else if (filters.startDate) {
      whereClause += " AND DATE(order_date) >= DATE(?)";
      queryParams.push(filters.startDate);
    } else if (filters.endDate) {
      whereClause += " AND DATE(order_date) <= DATE(?)";
      queryParams.push(filters.endDate);
    }

    const query = `
    SELECT order_status, COUNT(*) AS total
    FROM orders
    ${whereClause}
    GROUP BY order_status
  `;

    try {
      const [results] = await db.promise().query(query, queryParams);

      const statusMap = {};
      results.forEach((row) => {
        statusMap[row.order_status] = row.total;
      });

      const completeResults = ALL_STATUSES.map((status) => ({
        order_status: status,
        total: statusMap[status] || 0,
      }));

      return completeResults;
    } catch (error) {
      //console.error("Model - getTotalByStatus:", error.message);
      throw error;
    }
  },

  /**
   * Kiểm tra và sửa chữa các order có amount_paid không đồng bộ với invoice
   * @returns {Promise<Object>} Kết quả sửa chữa
   */
  fixInconsistentAmountPaid: async () => {
    try {
      // 1. Tìm các order có invoice nhưng amount_paid không đồng bộ
      const sql = `
        SELECT 
          o.order_id,
          o.order_code,
          o.amount_paid AS order_amount_paid,
          i.invoice_id,
          i.invoice_code,
          i.amount_paid AS invoice_amount_paid,
          i.final_amount AS invoice_final_amount
        FROM orders o
        INNER JOIN invoices i ON o.order_id = i.order_id
        WHERE i.invoice_type = 'sale_invoice'
          AND ABS(COALESCE(o.amount_paid, 0) - COALESCE(i.amount_paid, 0)) > 0.01
      `;

      const [inconsistentOrders] = await db.promise().query(sql);

      if (inconsistentOrders.length === 0) {
        //console.log("🚀 ~ OrderModel: fixInconsistentAmountPaid - Không có order nào cần sửa chữa");
        return {
          fixed_count: 0,
          total_checked: 0,
          inconsistent_orders: []
        };
      }

      //console.log(`🚀 ~ OrderModel: fixInconsistentAmountPaid - Tìm thấy ${inconsistentOrders.length} order cần sửa chữa`);

      // 2. Sửa chữa từng order
      const fixedResults = [];
      for (const order of inconsistentOrders) {
        const orderAmountPaid = parseFloat(order.order_amount_paid || 0);
        const invoiceAmountPaid = parseFloat(order.invoice_amount_paid || 0);

        // Sử dụng amount_paid từ invoice làm chuẩn
        await OrderModel.updateAmountPaid(order.order_id, invoiceAmountPaid, false);

        fixedResults.push({
          order_id: order.order_id,
          order_code: order.order_code,
          invoice_id: order.invoice_id,
          invoice_code: order.invoice_code,
          old_order_amount_paid: orderAmountPaid,
          new_order_amount_paid: invoiceAmountPaid,
          invoice_amount_paid: invoiceAmountPaid
        });

        //console.log(`🚀 ~ OrderModel: fixInconsistentAmountPaid - Fixed order ${order.order_code}: ${orderAmountPaid} -> ${invoiceAmountPaid}`);
      }

      //console.log(`🚀 ~ OrderModel: fixInconsistentAmountPaid - Đã sửa chữa ${fixedResults.length} order`);
      return {
        fixed_count: fixedResults.length,
        total_checked: inconsistentOrders.length,
        inconsistent_orders: fixedResults
      };
    } catch (error) {
      console.error(
        "🚀 ~ OrderModel: fixInconsistentAmountPaid - Lỗi khi sửa chữa amount_paid không đồng bộ:",
        error
      );
      throw error;
    }
  },

  /**
   * Lấy danh sách các order có amount_paid không đồng bộ với invoice
   * @returns {Promise<Array>} Danh sách order không đồng bộ
   */
  getInconsistentAmountPaidOrders: async () => {
    try {
      const sql = `
        SELECT 
          o.order_id,
          o.order_code,
          o.amount_paid AS order_amount_paid,
          o.final_amount AS order_final_amount,
          o.order_date,
          i.invoice_id,
          i.invoice_code,
          i.amount_paid AS invoice_amount_paid,
          i.final_amount AS invoice_final_amount,
          i.status AS invoice_status,
          ABS(COALESCE(o.amount_paid, 0) - COALESCE(i.amount_paid, 0)) AS difference
        FROM orders o
        INNER JOIN invoices i ON o.order_id = i.order_id
        WHERE i.invoice_type = 'sale_invoice'
          AND ABS(COALESCE(o.amount_paid, 0) - COALESCE(i.amount_paid, 0)) > 0.01
        ORDER BY o.order_date DESC
      `;

      const [inconsistentOrders] = await db.promise().query(sql);

      return inconsistentOrders.map(order => ({
        ...order,
        order_amount_paid: parseFloat(order.order_amount_paid || 0),
        order_final_amount: parseFloat(order.order_final_amount || 0),
        invoice_amount_paid: parseFloat(order.invoice_amount_paid || 0),
        invoice_final_amount: parseFloat(order.invoice_final_amount || 0),
        difference: parseFloat(order.difference || 0)
      }));
    } catch (error) {
      console.error(
        "🚀 ~ OrderModel: getInconsistentAmountPaidOrders - Lỗi khi lấy danh sách order không đồng bộ:",
        error
      );
      throw error;
    }
  },

};

module.exports = OrderModel;
