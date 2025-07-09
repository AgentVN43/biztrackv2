const db = require("../../config/db.config");
const { v4: uuidv4 } = require("uuid");
const TransactionModel = require("../transactions/transaction.model")

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
    console.error("Lỗi khi tạo mã đơn hàng:", error.message);
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
      console.error("Lỗi khi lưu đơn hàng:", error.message);
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
      whereClause += ` AND DATE(orders.order_date) BETWEEN DATE(?) AND DATE(?)`;
      queryParams.unshift(filters.endDate);
      queryParams.unshift(filters.startDate);
    } else if (filters.startDate) {
      whereClause += ` AND DATE(orders.order_date) >= DATE(?)`;
      queryParams.unshift(filters.startDate);
    } else if (filters.endDate) {
      whereClause += ` AND DATE(orders.order_date) <= DATE(?)`;
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

      console.log("Final Query:", finalQuery);
      console.log("Query Params:", queryParams);
      const [results] = await db.promise().query(finalQuery, queryParams);
      console.log("Raw Results:", results);
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
      console.error("Lỗi khi đọc tất cả đơn hàng (Model):", error.message);
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
      console.error("Lỗi khi đọc đơn hàng theo ID:", error.message);
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
      console.error("Lỗi khi cập nhật đơn hàng:", error.message);
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
      console.error("Lỗi khi xóa đơn hàng:", error.message);
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
          updateValues.push(orderData[field]);
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

      console.log("Executing updateOrderQuery:", updateOrderQuery);
      console.log("With parameters:", updateValues);

      await connection.query(updateOrderQuery, updateValues);

      const deleteDetailsQuery = `DELETE FROM order_details WHERE order_id = ?`;
      await connection.query(deleteDetailsQuery, [orderId]);

      if (orderDetails.length === 0) {
        await connection.commit();
        return {
          message: "Cập nhật đơn hàng thành công (không có sản phẩm chi tiết)",
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
      return { message: "Cập nhật đơn hàng và chi tiết thành công" };
    } catch (error) {
      console.error("Lỗi trong updateOrderWithDetails transaction:", error);
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
      console.error("Model - getTotalByStatus:", error.message);
      throw error;
    }
  },

};

module.exports = OrderModel;
