// const db = require("../../config/db.config");
// const { v4: uuidv4 } = require("uuid");

// const OrderDetail = {
//   create: (data, callback) => {
//     const order_detail_id = uuidv4();
//     const { order_id, product_id, quantity, price, discount } = data;
//     db.query(
//       "INSERT INTO order_details (order_detail_id, order_id, product_id, quantity, price, discount) VALUES (?, ?, ?, ?, ?, ?)",
//       [order_detail_id, order_id, product_id, quantity, price, discount || 0],
//       (error, results) => {
//         if (error) {
//           return callback(error, null, order_detail_id);
//         }
//         callback(null, { order_detail_id, ...data });
//       }
//     );
//   },

//   read: (callback) => {
//     db.query("SELECT * FROM order_details", (error, results) => {
//       if (error) {
//         return callback(error, null);
//       }
//       callback(null, results);
//     });
//   },

//   readById: (order_detail_id, callback) => {
//     db.query(
//       "SELECT * FROM order_details WHERE order_detail_id = ?",
//       [order_detail_id],
//       (error, results) => {
//         if (error) {
//           return callback(error, null);
//         }
//         if (results.length === 0) {
//           return callback(null, null);
//         }
//         callback(null, results[0]);
//       }
//     );
//   },

//   getOrderDetailByOrderId: (order_id, callback) => {
//     const query = `
//     SELECT
//       orders.order_id,
//       orders.order_code,
//       orders.order_date,
//       orders.order_status,
//       orders.total_amount,
//       orders.final_amount,
//       orders.order_amount,
//       orders.shipping_fee,
//       orders.warehouse_id,
//       orders.shipping_address,
//       orders.payment_method,
//       orders.note,
//       customers.customer_id,
//       customers.customer_name,
//       customers.email,
//       customers.phone,
//       order_details.product_id,
//       products.product_name,
//       order_details.quantity,
//       order_details.price,
//       order_details.discount
//     FROM orders
//     LEFT JOIN customers ON orders.customer_id = customers.customer_id
//     LEFT JOIN order_details ON orders.order_id = order_details.order_id
//     LEFT JOIN products ON order_details.product_id = products.product_id
//     WHERE orders.order_id = ?
//   `;

//     db.query(query, [order_id], (error, results) => {
//       if (error) {
//         return callback(error, null);
//       }

//       if (results.length === 0) {
//         return callback(null, null);
//       }

//       // Nhóm dữ liệu lại thành một object đơn hàng + mảng sản phẩm
//       const order = {
//         order_id: results[0].order_id,
//         order_code: results[0].order_code,
//         order_date: results[0].order_date,
//         order_status: results[0].order_status,
//         total_amount: results[0].total_amount,
//         final_amount: results[0].final_amount,
//         order_amount: results[0].order_amount,
//         warehouse_id: results[0].warehouse_id,
//         shipping_fee: results[0].shipping_fee,
//         shipping_address: results[0].shipping_address,
//         payment_method: results[0].payment_method,
//         note: results[0].note,

//         customer: {
//           customer_id: results[0].customer_id,
//           customer_name: results[0].customer_name,
//           email: results[0].email,
//           phone: results[0].phone,
//         },

//         products: results
//           .filter((r) => r.product_id) // chỉ lấy những dòng có sản phẩm
//           .map((r) => ({
//             product_id: r.product_id,
//             product_name: r.product_name,
//             quantity: r.quantity,
//             price: parseFloat(r.price),
//             discount: parseFloat(r.discount) || 0,
//           })),
//       };
//       console.log("🚀 ~ db.query ~ order:", order);

//       callback(null, order);
//     });
//   },

//   // update: (order_detail_id, data, callback) => {
//   //   const { order_id, product_id, quantity, price, discount } = data;
//   //   db.query(
//   //     "UPDATE order_details SET order_id = ?, product_id = ?, quantity = ?, price = ?, discount = ?, updated_at = CURRENT_TIMESTAMP WHERE order_detail_id = ?",
//   //     [order_id, product_id, quantity, price, discount, order_detail_id],
//   //     (error, results) => {
//   //       if (error) {
//   //         return callback(error, null);
//   //       }
//   //       if (results.affectedRows === 0) {
//   //         return callback(null, null);
//   //       }
//   //       callback(null, { order_detail_id, ...data });
//   //     }
//   //   );
//   // },

//   update: (order_id, data, callback) => {
//     const {
//       customer_id,
//       order_date,
//       total_amount,
//       discount_amount,
//       final_amount,
//       shipping_address,
//       payment_method,
//       note,
//       warehouse_id,
//       order_amount,
//       shipping_fee,
//       order_status,
//     } = data;

//     // Nếu order_status không được truyền vào, giữ nguyên giá trị cũ
//     const statusToUpdate = order_status || "Mới";

//     const sql = `
//     UPDATE orders SET
//       customer_id = ?,
//       order_date = ?,
//       total_amount = ?,
//       discount_amount = ?,
//       final_amount = ?,
//       shipping_address = ?,
//       payment_method = ?,
//       note = ?,
//       warehouse_id = ?,
//       order_amount = ?,
//       shipping_fee = ?,
//       order_status = ?,
//       updated_at = CURRENT_TIMESTAMP
//     WHERE order_id = ?
//   `;

//     db.query(
//       sql,
//       [
//         customer_id,
//         order_date,
//         total_amount || 0,
//         discount_amount || 0,
//         final_amount || 0,
//         shipping_address,
//         payment_method,
//         note || null,
//         warehouse_id || null,
//         order_amount || 0,
//         shipping_fee || 0,
//         statusToUpdate,
//         order_id,
//       ],
//       (error, results) => {
//         if (error) return callback(error, null);
//         if (results.affectedRows === 0) return callback(null, null); // Không tìm thấy hoặc không cập nhật gì

//         callback(null, {
//           order_id,
//           ...data,
//           order_status: statusToUpdate,
//           updated_at: new Date(),
//         });
//       }
//     );
//   },

//   delete: (order_detail_id, callback) => {
//     db.query(
//       "DELETE FROM order_details WHERE order_detail_id = ?",
//       [order_detail_id],
//       (error, results) => {
//         if (error) {
//           return callback(error, null);
//         }
//         callback(null, results.affectedRows > 0);
//       }
//     );
//   },
// };

// module.exports = OrderDetail;
// orderDetail.model.js
const db = require("../../config/db.config");
const { v4: uuidv4 } = require("uuid");

const OrderDetailModel = {
  // ✅ Đổi tên thành OrderDetailModel để nhất quán
  /**
   * Tạo một chi tiết đơn hàng mới.
   * @param {Object} data - Dữ liệu chi tiết đơn hàng.
   * @returns {Promise<Object>} Promise giải quyết với chi tiết đơn hàng đã tạo.
   */
  create: async (data) => {
    // ✅ Chuyển sang async
    const order_detail_id = uuidv4();
    const { order_id, product_id, quantity, price, discount } = data;
    try {
      await db.promise().query(
        // ✅ Sử dụng db.promise().query
        "INSERT INTO order_details (order_detail_id, order_id, product_id, quantity, price, discount) VALUES (?, ?, ?, ?, ?, ?)",
        [order_detail_id, order_id, product_id, quantity, price, discount || 0]
      );
      return { order_detail_id, ...data };
    } catch (error) {
      console.error("🚀 ~ orderDetail.model.js: create - Lỗi:", error);
      throw error; // ✅ Ném lỗi
    }
  },

  /**
   * Đọc tất cả các chi tiết đơn hàng.
   * @returns {Promise<Array<Object>>} Promise giải quyết với danh sách chi tiết đơn hàng.
   */
  read: async () => {
    // ✅ Chuyển sang async
    try {
      const [results] = await db.promise().query("SELECT * FROM order_details"); // ✅ Sử dụng db.promise().query
      return results;
    } catch (error) {
      console.error("🚀 ~ orderDetail.model.js: read - Lỗi:", error);
      throw error;
    }
  },

  /**
   * Đọc chi tiết đơn hàng theo ID.
   * @param {string} order_detail_id - ID chi tiết đơn hàng.
   * @returns {Promise<Object|null>} Promise giải quyết với chi tiết đơn hàng hoặc null.
   */
  readById: async (order_detail_id) => {
    // ✅ Chuyển sang async
    try {
      const [results] = await db.promise().query(
        // ✅ Sử dụng db.promise().query
        "SELECT * FROM order_details WHERE order_detail_id = ?",
        [order_detail_id]
      );
      return results.length > 0 ? results[0] : null;
    } catch (error) {
      console.error("🚀 ~ orderDetail.model.js: readById - Lỗi:", error);
      throw error;
    }
  },

  /**
   * Lấy chi tiết đơn hàng theo ID đơn hàng chính.
   * @param {string} order_id - ID đơn hàng chính.
   * @returns {Promise<Object|null>} Promise giải quyết với đối tượng đơn hàng kèm chi tiết hoặc null.
   */
  // getOrderDetailByOrderId: async (order_id) => { // ✅ Chuyển sang async
  //   const query = `
  //     SELECT
  //       orders.order_id,
  //       orders.order_code,
  //       orders.order_date,
  //       orders.order_status,
  //       orders.total_amount,
  //       orders.final_amount,
  //       orders.amount_paid AS order_initial_amount_paid,
  //       orders.order_amount,
  //       orders.shipping_fee,
  //       orders.warehouse_id,
  //       orders.shipping_address,
  //       orders.payment_method,
  //       orders.note,
  //       customers.customer_id,
  //       customers.customer_name,
  //       customers.email,
  //       customers.phone,
  //       order_details.product_id,
  //       products.product_name,
  //       order_details.quantity,
  //       order_details.price,
  //       order_details.discount
  //     FROM orders
  //     LEFT JOIN customers ON orders.customer_id = customers.customer_id
  //     LEFT JOIN order_details ON orders.order_id = order_details.order_id
  //     LEFT JOIN products ON order_details.product_id = products.product_id
  //     WHERE orders.order_id = ?
  //   `;

  //   try {
  //     const [results] = await db.promise().query(query, [order_id]); // ✅ Sử dụng db.promise().query

  //     if (results.length === 0) {
  //       return null;
  //     }

  //     // Nhóm dữ liệu lại thành một object đơn hàng + mảng sản phẩm
  //     const order = {
  //       order_id: results[0].order_id,
  //       order_code: results[0].order_code,
  //       order_date: results[0].order_date,
  //       order_status: results[0].order_status,
  //       total_amount: results[0].total_amount,
  //       final_amount: results[0].final_amount,
  //       order_amount: results[0].order_amount,
  //       warehouse_id: results[0].warehouse_id,
  //       shipping_fee: results[0].shipping_fee,
  //       shipping_address: results[0].shipping_address,
  //       payment_method: results[0].payment_method,
  //       note: results[0].note,

  //       customer: {
  //         customer_id: results[0].customer_id,
  //         customer_name: results[0].customer_name,
  //         email: results[0].email,
  //         phone: results[0].phone,
  //       },

  //       products: results
  //         .filter((r) => r.product_id) // chỉ lấy những dòng có sản phẩm
  //         .map((r) => ({
  //           product_id: r.product_id,
  //           product_name: r.product_name,
  //           quantity: r.quantity,
  //           price: parseFloat(r.price),
  //           discount: parseFloat(r.discount) || 0,
  //         })),
  //     };
  //     console.log("� ~ orderDetail.model.js: getOrderDetailByOrderId - order:", order);

  //     return order;
  //   } catch (error) {
  //     console.error("🚀 ~ orderDetail.model.js: getOrderDetailByOrderId - Lỗi:", error);
  //     throw error;
  //   }
  // },

  getOrderDetailByOrderId: async (order_id) => {
    const query = `
      SELECT
        o.order_id,
        o.order_code,
        o.order_date,
        o.order_status,
        o.total_amount,
        o.final_amount,
        o.amount_paid AS order_initial_amount_paid, -- Lấy amount_paid từ đơn hàng
        o.order_amount,
        o.shipping_fee,
        o.warehouse_id,
        o.shipping_address,
        o.payment_method,
        o.note,
        c.customer_id,
        c.customer_name,
        c.email,
        c.phone,
        od.product_id,
        p.product_name,
        p.sku, -- Thêm SKU của sản phẩm
        od.quantity AS detail_quantity,
        od.price AS detail_price,
        od.discount AS detail_discount,
        inv.invoice_id, -- Lấy invoice_id
        inv.invoice_code, -- Lấy invoice_code
        inv.amount_paid AS invoice_current_amount_paid, -- Lấy amount_paid HIỆN TẠI từ hóa đơn
        inv.status AS invoice_status -- Lấy trạng thái của hóa đơn
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.customer_id
      LEFT JOIN order_details od ON o.order_id = od.order_id
      LEFT JOIN products p ON od.product_id = p.product_id
      LEFT JOIN invoices inv ON o.order_id = inv.order_id
      WHERE o.order_id = ?
    `;

    try {
      // ✅ DÒNG ĐÃ SỬA: Bỏ .promise() vì db đã là promise-based
      // const [results] = await db.query(query, [order_id]);
      const [results] = await db.promise().query(query, [order_id]);
      if (results.length === 0) {
        return null;
      }

      // --- LOGIC NHÓM SẢN PHẨM ---
      const productsMap = new Map();
      results
        .filter((r) => r.product_id) // Chỉ xử lý các hàng có thông tin sản phẩm
        .forEach((r) => {
          const productId = r.product_id;
          if (productsMap.has(productId)) {
            // Nếu sản phẩm đã có trong map, cộng dồn số lượng
            const existingProduct = productsMap.get(productId);
            existingProduct.quantity += r.detail_quantity; // Cộng dồn từ detail_quantity
          } else {
            // Nếu chưa có, thêm sản phẩm vào map
            productsMap.set(productId, {
              product_id: r.product_id,
              product_name: r.product_name,
              sku: r.sku,
              quantity: r.detail_quantity, // Bắt đầu với detail_quantity của hàng này
              price: parseFloat(r.detail_price), // Giá và chiết khấu lấy từ hàng đầu tiên
              discount: parseFloat(r.detail_discount) || 0,
            });
          }
        });
      const groupedProducts = Array.from(productsMap.values());
      // --- KẾT THÚC LOGIC NHÓM SẢN PHẨM ---

      // Nhóm dữ liệu lại thành một object đơn hàng + mảng sản phẩm
      const order = {
        order_id: results[0].order_id,
        order_code: results[0].order_code,
        order_date: results[0].order_date,
        order_status: results[0].order_status,
        total_amount: parseFloat(results[0].total_amount),
        final_amount: parseFloat(results[0].final_amount),
        amount_paid: parseFloat(results[0].order_initial_amount_paid || 0),
        order_amount: parseFloat(results[0].order_amount),
        shipping_fee: parseFloat(results[0].shipping_fee || 0),
        warehouse_id: results[0].warehouse_id,
        shipping_address: results[0].shipping_address,
        payment_method: results[0].payment_method,
        note: results[0].note,

        customer: {
          customer_id: results[0].customer_id,
          customer_name: results[0].customer_name,
          email: results[0].email,
          phone: results[0].phone,
        },

        invoice: results[0].invoice_id
          ? {
              invoice_id: results[0].invoice_id,
              invoice_code: results[0].invoice_code,
              amount_paid: parseFloat(
                results[0].invoice_current_amount_paid || 0
              ),
              status: results[0].invoice_status,
            }
          : null,

        products: groupedProducts, // Sử dụng mảng sản phẩm đã nhóm
      };
      console.log(
        "🚀 ~ orderDetail.model.js: getOrderDetailByOrderId - order:",
        order
      );

      return order;
    } catch (error) {
      console.error(
        "🚀 ~ orderDetail.model.js: getOrderDetailByOrderId - Lỗi:",
        error
      );
      throw error;
    }
  },

  /**
   * Cập nhật thông tin chi tiết đơn hàng.
   * @param {string} order_detail_id - ID chi tiết đơn hàng.
   * @param {Object} data - Dữ liệu cập nhật.
   * @returns {Promise<Object|null>} Promise giải quyết với chi tiết đơn hàng đã cập nhật hoặc null.
   */
  update: async (order_detail_id, data) => {
    // ✅ Chuyển sang async
    const { order_id, product_id, quantity, price, discount } = data;
    try {
      const [results] = await db.promise().query(
        // ✅ Sử dụng db.promise().query
        "UPDATE order_details SET order_id = ?, product_id = ?, quantity = ?, price = ?, discount = ?, updated_at = CURRENT_TIMESTAMP WHERE order_detail_id = ?",
        [order_id, product_id, quantity, price, discount || 0, order_detail_id]
      );
      return results.affectedRows > 0 ? { order_detail_id, ...data } : null;
    } catch (error) {
      console.error("🚀 ~ orderDetail.model.js: update - Lỗi:", error);
      throw error;
    }
  },

  /**
   * Xóa một chi tiết đơn hàng.
   * @param {string} order_detail_id - ID chi tiết đơn hàng.
   * @returns {Promise<boolean>} Promise giải quyết với true nếu xóa thành công, false nếu không.
   */
  delete: async (order_detail_id) => {
    // ✅ Chuyển sang async
    try {
      const [results] = await db.promise().query(
        // ✅ Sử dụng db.promise().query
        "DELETE FROM order_details WHERE order_detail_id = ?",
        [order_detail_id]
      );
      return results.affectedRows > 0;
    } catch (error) {
      console.error("🚀 ~ orderDetail.model.js: delete - Lỗi:", error);
      throw error;
    }
  },
};

module.exports = OrderDetailModel;
