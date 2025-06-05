const db = require("../../config/db.config");

const CustomerModel = {
  findByPhone: async (phone, skip, limit) => {
    const query = `
      SELECT
        customer_id,
        customer_name,
        phone
      FROM customers
      WHERE phone LIKE ?
      LIMIT ? OFFSET ?
    `;
    const searchTerm = `${phone}%`;

    try {
      const [results] = await db
        .promise()
        .query(query, [searchTerm, limit, skip]);
      return results.map((row) => ({
        customer_id: row.customer_id,
        customer_name: row.customer_name,
        phone: row.phone,
      }));
    } catch (error) {
      console.error(
        "Lỗi khi tìm khách hàng theo số điện thoại (có pagination):",
        error.message
      );
      throw error;
    }
  },

  countByPhone: async (phone) => {
    const query = `
      SELECT COUNT(*) AS total
      FROM customers
      WHERE phone LIKE ?
    `;
    const searchTerm = `${phone}%`;

    try {
      const [results] = await db.promise().query(query, [searchTerm]);
      return results[0].total;
    } catch (error) {
      console.error(
        "Lỗi khi đếm khách hàng theo số điện thoại:",
        error.message
      );
      throw error;
    }
  },
};

const OrderModel = {
  // findByCustomerId: async (customerId) => {
  //   const sql =
  //     "SELECT * FROM orders WHERE customer_id = ? ORDER BY order_date DESC";
  //   try {
  //     const [rows] = await db.promise().query(sql, [customerId]);
  //     return rows;
  //   } catch (error) {
  //     console.error("Lỗi khi tìm đơn hàng theo customer ID:", error.message);
  //     throw error;
  //   }
  // },
  // Xịn ko phân trang
  findByCustomerId: async (customerId) => {
    const sql = `
      SELECT
        orders.*,
        customers.customer_name
      FROM orders
      LEFT JOIN customers ON orders.customer_id = customers.customer_id
      WHERE orders.customer_id = ?
      ORDER BY orders.order_date DESC
    `;

    try {
      const [results] = await db.promise().query(sql, [customerId]);

      // Định dạng lại kết quả
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
      return { orders: formattedResults, total: formattedResults.length };
    } catch (error) {
      console.error(
        "Lỗi khi tìm đơn hàng theo customer ID (có phân trang):",
        error.message
      );
      throw error;
    }
  },
};

// const ProductModel = {
//   findByName: async (productName) => {
//     const sql = "SELECT * FROM products WHERE product_name LIKE ?";
//     const searchValue = `%${productName}%`;

//     try {
//       const [rows] = await db.promise().query(sql, [searchValue]);
//       return rows;
//     } catch (error) {
//       console.error("Lỗi khi tìm sản phẩm theo tên:", error.message);
//       throw error;
//     }
//   },
// };

const ProductModel = {
  findByName: async (productName, limit, skip) => {
    const sql = `
      SELECT
        product_id, product_name, product_desc, product_image,
        product_retail_price, product_note, product_barcode,
        sku, is_active, category_id
      FROM products
      WHERE product_name LIKE ?
      LIMIT ? OFFSET ?
    `;
    const countSql = `
      SELECT COUNT(*) AS total
      FROM products
      WHERE product_name LIKE ?
    `;
    const searchValue = `%${productName}%`;

    try {
      const [products] = await db
        .promise()
        .query(sql, [searchValue, limit, skip]);
      const [countResult] = await db.promise().query(countSql, [searchValue]);
      const total = countResult[0].total;
      return { products, total };
    } catch (error) {
      console.error(
        "Lỗi khi tìm sản phẩm theo tên (có phân trang):",
        error.message
      );
      throw error;
    }
  },
};

module.exports = {
  CustomerModel,
  OrderModel,
  ProductModel,
};
