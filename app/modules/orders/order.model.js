// const db = require("../../config/db.config");
// const { v4: uuidv4 } = require("uuid");

// // const generateOrderCode = (callback) => {
// //   const prefix = "ORD-";
// //   const timestamp = Date.now();
// //   let sequenceNumber = 1;

// //   // Lấy số thứ tự đơn hàng cuối cùng từ bảng orders
// //   db.query(
// //     'SELECT IFNULL(MAX(CAST(SUBSTRING_INDEX(order_code, "-", -1) AS UNSIGNED)), 0) AS last_order_sequence FROM orders WHERE order_code LIKE ?',
// //     [`${prefix}%`],
// //     (error, rows) => {
// //       // Thêm callback để xử lý kết quả truy vấn
// //       if (error) {
// //         console.error(
// //           "Lỗi khi lấy số thứ tự đơn hàng cuối cùng từ bảng orders:",
// //           error
// //         );
// //         return callback(error, null); // Gọi callback với lỗi
// //       }
// //       if (rows.length > 0 && rows[0].last_order_sequence) {
// //         sequenceNumber = rows[0].last_order_sequence + 1;
// //       }

// //       // Tạo mã đơn hàng
// //       const orderCode = `${prefix}${timestamp}-${String(
// //         sequenceNumber
// //       ).padStart(4, "0")}`;

// //       // Cập nhật số thứ tự đơn hàng cuối cùng trong bảng orders
// //       db.query(
// //         "UPDATE orders SET order_code = ? WHERE order_id = ?",
// //         [orderCode, uuidv4()], // Bạn cần có một order_id để update
// //         (updateError) => {
// //           if (updateError) {
// //             console.error(
// //               "Lỗi khi cập nhật order_code trong bảng orders:",
// //               updateError
// //             );
// //             return callback(updateError, null);
// //           }
// //           callback(null, orderCode); // Gọi callback với mã đơn hàng
// //         }
// //       );
// //     }
// //   );
// // };

// const generateOrderCode = (callback) => {
//   const prefix = "ORD";
//   const today = new Date();
//   const dateStr = `${today.getFullYear()}${String(
//     today.getMonth() + 1
//   ).padStart(2, "0")}${String(today.getDate()).padStart(2, "0")}`;
//   // → format YYYYMMDD

//   const queryDateCondition = `order_code LIKE '${prefix}-${dateStr}%'`;

//   db.query(
//     `SELECT IFNULL(MAX(CAST(SUBSTRING_INDEX(order_code, '-', -1) AS UNSIGNED)), 0) AS last_sequence
//      FROM orders
//      WHERE ${queryDateCondition}`,
//     (error, results) => {
//       if (error) {
//         return callback(error);
//       }

//       let nextSequence = results[0]?.last_sequence
//         ? parseInt(results[0].last_sequence) + 1
//         : 1;

//       // Đảm bảo số thứ tự là 5 chữ số
//       const paddedSequence = String(nextSequence).padStart(5, "0");

//       const orderCode = `${prefix}-${dateStr}-${paddedSequence}`;

//       callback(null, orderCode);
//     }
//   );
// };

// const Order = {
//   //  create: (data, callback) => {
//   //   const order_id = uuidv4();
//   //   generateOrderCode((error, order_code) => {
//   //     // Gọi hàm tạo mã đơn hàng với callback
//   //     if (error) {
//   //       // Xử lý lỗi nếu không tạo được mã đơn hàng
//   //       return callback(error, null);
//   //     }

//   //     const {
//   //       customer_id,
//   //       order_date,
//   //       total_amount,
//   //       discount_amount,
//   //       final_amount,
//   //       shipping_address,
//   //       shipping_fee,
//   //       payment_method,
//   //       note,
//   //       order_amount,
//   //       warehouse_id,
//   //     } = data;
//   //     db.query(
//   //       "INSERT INTO orders (order_id, customer_id, order_date, order_code, total_amount, discount_amount, final_amount, shipping_address, payment_method, note, order_amount, warehouse_id, shipping_fee) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?,?)",
//   //       [
//   //         order_id,
//   //         customer_id,
//   //         order_date,
//   //         order_code,
//   //         total_amount || 0,
//   //         discount_amount || 0,
//   //         final_amount || 0,
//   //         shipping_address,
//   //         payment_method,
//   //         note,
//   //         order_amount,
//   //         warehouse_id,
//   //         shipping_fee || 0,
//   //       ],
//   //       (error, results) => {
//   //         if (error) {
//   //           return callback(error, null, order_id);
//   //         }
//   //         callback(null, { order_id, order_code, ...data }); // Trả về order_code
//   //       }
//   //     );
//   //   });
//   // },

//   // create: (data, callback) => {
//   //   generateOrderCode((error, order_code) => {
//   //     if (error) {
//   //       return callback(error, null);
//   //     }

//   //     const {
//   //       customer_id,
//   //       order_date,
//   //       total_amount,
//   //       discount_amount,
//   //       final_amount,
//   //       shipping_address,
//   //       payment_method,
//   //       note,
//   //       order_amount,
//   //       warehouse_id,
//   //       shipping_fee,
//   //     } = data;

//   //     // Mặc định các trường bắt buộc nhưng không có trong data
//   //     const order_status = "Mới";
//   //     const is_active = 1;
//   //     const order_id = uuidv4();

//   //     db.query(
//   //       `INSERT INTO orders (
//   //       order_id,
//   //       customer_id,
//   //       order_date,
//   //       order_code,
//   //       total_amount,
//   //       discount_amount,
//   //       final_amount,
//   //       order_status,
//   //       is_active,
//   //       shipping_address,
//   //       payment_method,
//   //       note,
//   //       warehouse_id,
//   //       order_amount,
//   //       shipping_fee
//   //     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
//   //       [
//   //         order_id,
//   //         customer_id,
//   //         order_date,
//   //         order_code,
//   //         total_amount || 0,
//   //         discount_amount || 0,
//   //         final_amount || 0,
//   //         order_status,
//   //         is_active,
//   //         shipping_address,
//   //         payment_method,
//   //         note || null,
//   //         warehouse_id || null,
//   //         order_amount || 0,
//   //         shipping_fee || 0,
//   //       ],
//   //       (error, results) => {
//   //         if (error) {
//   //           return callback(error, null);
//   //         }

//   //         callback(null, {
//   //           order_id,
//   //           order_code,
//   //           ...data,
//   //         });
//   //       }
//   //     );
//   //   });
//   // },

//   create: (data, callback) => {
//     const {
//       customer_id,
//       order_date,
//       total_amount,
//       discount_amount,
//       final_amount,
//       shipping_address,
//       payment_method,
//       note,
//       order_amount,
//       warehouse_id,
//       shipping_fee,
//     } = data;

//     // --- VALIDATE INPUTS ---
//     if (!customer_id) {
//       return callback(new Error("customer_id là bắt buộc"), null);
//     }

//     if (!order_date || isNaN(Date.parse(order_date))) {
//       return callback(new Error("order_date không hợp lệ"), null);
//     }

//     // Nếu warehouse_id bắt buộc nhưng bị thiếu
//     if (!warehouse_id) {
//       return callback(new Error("warehouse_id là bắt buộc"), null);
//     }

//     generateOrderCode((error, order_code) => {
//       if (error) {
//         console.error("Lỗi khi tạo mã đơn hàng:", error.message);
//         return callback(error, null);
//       }

//       const order_status = "Mới";
//       const is_active = 1;
//       const order_id = uuidv4();

//       const query = `
//             INSERT INTO orders (
//                 order_id,
//                 customer_id,
//                 order_date,
//                 order_code,
//                 total_amount,
//                 discount_amount,
//                 final_amount,
//                 order_status,
//                 is_active,
//                 shipping_address,
//                 payment_method,
//                 note,
//                 warehouse_id,
//                 order_amount,
//                 shipping_fee
//             ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
//         `;

//       const values = [
//         order_id,
//         customer_id,
//         order_date,
//         order_code,
//         total_amount || 0,
//         discount_amount || 0,
//         final_amount || 0,
//         order_status,
//         is_active,
//         shipping_address || null,
//         payment_method || null,
//         note || null,
//         warehouse_id || null,
//         order_amount || 0,
//         shipping_fee || 0,
//       ];

//       db.query(query, values, (error, results) => {
//         if (error) {
//           console.error("Lỗi khi lưu đơn hàng:", error.message);
//           return callback(error, null);
//         }

//         callback(null, {
//           order_id,
//           order_code,
//           customer_id,
//           order_date,
//           order_status,
//           is_active,
//           ...data,
//         });
//       });
//     });
//   },

//   read: (callback) => {
//     const query = `
//     SELECT
//       orders.*,
//       customers.customer_name
//     FROM orders
//     LEFT JOIN customers ON orders.customer_id = customers.customer_id
//     WHERE is_active = 1
//     ORDER BY
//       COALESCE(orders.updated_at, orders.created_at) DESC
//   `;

//     db.query(query, (error, results) => {
//       if (error) {
//         return callback(error, null);
//       }

//       const formattedResults = results.map((order) => ({
//         order_id: order.order_id,
//         order_code: order.order_code,
//         order_date: order.order_date,
//         order_status: order.order_status,
//         shipping_address: order.shipping_address,
//         shipping_fee: order.shipping_fee,
//         payment_method: order.payment_method,
//         note: order.note,
//         total_amount: order.total_amount,
//         discount_amount: order.discount_amount,
//         final_amount: order.final_amount,
//         created_at: order.created_at,
//         updated_at: order.updated_at,
//         warehouse_id: order.warehouse_id,
//         shipping_fee: order.shipping_fee,
//         // 👇 Gom nhóm customer vào object riêng
//         customer: {
//           customer_id: order.customer_id,
//           customer_name: order.customer_name || "Khách lẻ",
//         },
//       }));

//       callback(null, formattedResults);
//     });
//   },

//   // readById: (order_id, callback) => {
//   //   const query = `
//   //   SELECT
//   //     orders.order_id,
//   //     orders.order_code,
//   //     orders.order_date,
//   //     orders.order_status,
//   //     orders.total_amount,
//   //     orders.final_amount,
//   //     customers.customer_name,
//   //     customers.email,
//   //     customers.phone,
//   //     order_details.product_id,
//   //     products.product_name,
//   //     order_details.quantity,
//   //     order_details.price
//   //   FROM orders
//   //   LEFT JOIN customers ON orders.customer_id = customers.customer_id
//   //   LEFT JOIN order_details ON orders.order_id = order_details.order_id
//   //   LEFT JOIN products ON order_details.product_id = products.product_id
//   //   WHERE orders.order_id = ?
//   // `;

//   //   db.query(query, [order_id], (error, results) => {
//   //     if (error) {
//   //       return callback(error, null);
//   //     }

//   //     if (results.length === 0) {
//   //       return callback(null, null);
//   //     }

//   //     // Nhóm dữ liệu lại thành một object đơn hàng + mảng sản phẩm
//   //     const order = {
//   //       order_id: results[0].order_id,
//   //       order_code: results[0].order_code,
//   //       order_date: results[0].order_date,
//   //       order_status: results[0].order_status,
//   //       total_amount: results[0].total_amount,
//   //       final_amount: results[0].final_amount,

//   //       customer: {
//   //         customer_name: results[0].customer_name,
//   //         email: results[0].email,
//   //         phone: results[0].phone,
//   //       },

//   //       products: results
//   //         .filter((r) => r.product_id) // chỉ lấy những dòng có sản phẩm
//   //         .map((r) => ({
//   //           product_id: r.product_id,
//   //           product_name: r.product_name,
//   //           quantity: r.quantity,
//   //           price: r.price,
//   //         })),
//   //     };

//   //     callback(null, order);
//   //   });
//   // },

//   // readById: (order_id, callback) => {
//   //   db.query(
//   //     "SELECT * FROM orders WHERE order_id = ?",
//   //     [order_id],
//   //     (error, results) => {
//   //       if (error) {
//   //         return callback(error, null);
//   //       }
//   //       if (results.length === 0) {
//   //         return callback(null, null);
//   //       }
//   //       callback(null, results[0]);
//   //     }
//   //   );
//   // },

//   // readById: (order_id, callback) => {
//   //   // Lấy thông tin order
//   //   db.query(
//   //     "SELECT * FROM orders WHERE order_id = ?",
//   //     [order_id],
//   //     (error, orderResults) => {
//   //       if (error) return callback(error, null);
//   //       if (orderResults.length === 0) return callback(null, null);

//   //       const order = orderResults[0];

//   //       // Lấy kèm order_details
//   //       db.query(
//   //         "SELECT * FROM order_details WHERE order_id = ?",
//   //         [order_id],
//   //         (detailErr, detailResults) => {
//   //           if (detailErr) return callback(detailErr, null);

//   //           order.order_details = detailResults || [];
//   //           callback(null, order);
//   //         }
//   //       );
//   //     }
//   //   );
//   // },

//   readById: (order_id) => {
//     return new Promise((resolve, reject) => {
//       const sql = `SELECT o.*,
//                            JSON_ARRAYAGG(JSON_OBJECT(
//                                'order_detail_id', od.order_detail_id,
//                                'product_id', od.product_id,
//                                'quantity', od.quantity,
//                                'price', od.price,
//                                'discount', od.discount,
//                                'created_at', od.created_at,
//                                'updated_at', od.updated_at,
//                                'warehouse_id', od.warehouse_id
//                            )) as order_details
//                     FROM orders o
//                     LEFT JOIN order_details od ON o.order_id = od.order_id
//                     WHERE o.order_id = ?
//                     GROUP BY o.order_id`;
//       db.query(sql, [order_id], (error, results) => {
//         if (error) {
//           return reject(error);
//         }
//         resolve(results[0]);
//       });
//     });
//   },

//   // update: (order_id, data, callback) => {
//   //   const {
//   //     customer_id,
//   //     order_date,
//   //     order_code,
//   //     total_amount,
//   //     discount_amount,
//   //     final_amount,
//   //     order_status,
//   //     shipping_address,
//   //     payment_method,
//   //     note,
//   //   } = data;
//   //   db.query(
//   //     "UPDATE orders SET customer_id = ?, order_date = ?, order_code = ?, total_amount = ?, discount_amount = ?, final_amount = ?, order_status = ?, shipping_address = ?, payment_method = ?, note = ?, updated_at = CURRENT_TIMESTAMP WHERE order_id = ?",
//   //     [
//   //       customer_id,
//   //       order_date,
//   //       order_code,
//   //       total_amount,
//   //       discount_amount,
//   //       final_amount,
//   //       order_status,
//   //       shipping_address,
//   //       payment_method,
//   //       note,
//   //       order_id,
//   //     ],
//   //     (error, results) => {
//   //       if (error) {
//   //         return callback(error, null);
//   //       }
//   //       if (results.affectedRows === 0) {
//   //         return callback(null, null);
//   //       }
//   //       callback(null, { order_id, ...data });
//   //     }
//   //   );
//   // },
//   update: (order_id, data) => {
//     return new Promise((resolve, reject) => {
//       const fields = [];
//       const values = [];

//       for (const key in data) {
//         fields.push(`${key} = ?`);
//         values.push(data[key]);
//       }

//       fields.push(`updated_at = CURRENT_TIMESTAMP`);
//       const sql = `UPDATE orders SET ${fields.join(", ")} WHERE order_id = ?`;
//       values.push(order_id);

//       db.query(sql, values, (error, results) => {
//         if (error) {
//           return reject(error);
//         }
//         if (results.affectedRows === 0) {
//           return resolve(null);
//         }
//         resolve({ order_id, ...data });
//       });
//     });
//   },

//   delete: (order_id, callback) => {
//     db.query(
//       "DELETE FROM orders WHERE order_id = ?",
//       [order_id],
//       (error, results) => {
//         if (error) {
//           return callback(error, null);
//         }
//         callback(null, results.affectedRows > 0);
//       }
//     );
//   },

//   // updateOrderWithDetails: (orderId, orderData, orderDetails, callback) => {
//   //   db.beginTransaction((err) => {
//   //     if (err) return callback(err);

//   //     const updateOrderQuery = `
//   //     UPDATE orders SET
//   //       order_date = ?, order_code = ?, order_status = ?, total_amount = ?,
//   //       discount_amount = ?, final_amount = ?, shipping_address = ?,
//   //       payment_method = ?, note = ?, updated_at = NOW(), customer_id = ?, warehouse_id = ?, order_amount = ?, shipping_fee = ?
//   //     WHERE order_id = ?
//   //   `;
//   //     const orderParams = [
//   //       orderData.order_date,
//   //       orderData.order_code,
//   //       orderData.order_status,
//   //       orderData.total_amount,
//   //       orderData.discount_amount,
//   //       orderData.final_amount,
//   //       orderData.shipping_address,
//   //       orderData.payment_method,
//   //       orderData.note,
//   //       orderData.customer_id,
//   //       orderData.warehouse_id,
//   //       orderData.order_amount,
//   //       orderData.shipping_fee,
//   //       orderId,
//   //     ];

//   //     db.query(updateOrderQuery, orderParams, (err) => {
//   //       if (err) return db.rollback(() => callback(err));

//   //       const deleteDetailsQuery = `DELETE FROM order_details WHERE order_id = ?`;
//   //       db.query(deleteDetailsQuery, [orderId], (err) => {
//   //         if (err) return db.rollback(() => callback(err));

//   //         if (orderDetails.length === 0) {
//   //           return db.commit((err) => {
//   //             if (err) return db.rollback(() => callback(err));
//   //             callback(null, {
//   //               message: "Order updated without order details",
//   //             });
//   //           });
//   //         }

//   //         const insertDetailQuery = `
//   //         INSERT INTO order_details (
//   //           order_detail_id, order_id, product_id, quantity, price, discount, warehouse_id
//   //         ) VALUES ?
//   //       `;

//   //         const detailValues = orderDetails.map((d) => [
//   //           uuidv4(),
//   //           d.order_id,
//   //           d.product_id,
//   //           d.quantity,
//   //           d.price,
//   //           d.discount,
//   //           d.warehouse_id,
//   //         ]);

//   //         db.query(insertDetailQuery, [detailValues], (err) => {
//   //           if (err) return db.rollback(() => callback(err));

//   //           db.commit((err) => {
//   //             if (err) return db.rollback(() => callback(err));
//   //             callback(null, {
//   //               message: "Order and details updated successfully",
//   //             });
//   //           });
//   //         });
//   //       });
//   //     });
//   //   });
//   // },

//   // updateOrderWithDetails: (orderId, orderData, orderDetails, callback) => {
//   //   db.beginTransaction((err) => {
//   //     if (err) return callback(err);

//   //     // 👇 Chỉ giữ lại các field thật sự có trong DB
//   //     const {
//   //       customer_id,
//   //       order_date,
//   //       order_code,
//   //       order_status,
//   //       total_amount,
//   //       discount_amount,
//   //       final_amount,
//   //       shipping_address,
//   //       payment_method,
//   //       note,
//   //       warehouse_id,
//   //       order_amount,
//   //       shipping_fee,
//   //     } = orderData;

//   //     // Cập nhật đơn hàng
//   //     const updateOrderQuery = `
//   //     UPDATE orders SET
//   //       customer_id = ?,
//   //       order_date = ?,
//   //       order_code = ?,
//   //       order_status = ?,
//   //       total_amount = ?,
//   //       discount_amount = ?,
//   //       final_amount = ?,
//   //       shipping_address = ?,
//   //       payment_method = ?,
//   //       note = ?,
//   //       warehouse_id = ?,
//   //       order_amount = ?,
//   //       shipping_fee = ?,
//   //       updated_at = NOW()
//   //     WHERE order_id = ?
//   //   `;

//   //     const orderParams = [
//   //       customer_id,
//   //       order_date,
//   //       order_code,
//   //       order_status,
//   //       total_amount,
//   //       discount_amount,
//   //       final_amount,
//   //       shipping_address,
//   //       payment_method,
//   //       note,
//   //       warehouse_id,
//   //       order_amount,
//   //       shipping_fee,
//   //       orderId,
//   //     ];

//   //     db.query(updateOrderQuery, orderParams, (err) => {
//   //       if (err) return db.rollback(() => callback(err));

//   //       // Xóa chi tiết cũ
//   //       const deleteDetailsQuery = `DELETE FROM order_details WHERE order_id = ?`;
//   //       db.query(deleteDetailsQuery, [orderId], (err) => {
//   //         if (err) return db.rollback(() => callback(err));

//   //         if (orderDetails.length === 0) {
//   //           return db.commit((err) => {
//   //             if (err) return db.rollback(() => callback(err));
//   //             callback(null, {
//   //               message: "Cập nhật đơn hàng thành công (không có sản phẩm)",
//   //             });
//   //           });
//   //         }

//   //         // Thêm mới chi tiết
//   //         const insertDetailQuery = `
//   //         INSERT INTO order_details (
//   //           order_detail_id,
//   //           order_id,
//   //           product_id,
//   //           quantity,
//   //           price,
//   //           discount,
//   //           warehouse_id
//   //         ) VALUES ?
//   //       `;

//   //         const detailValues = orderDetails.map((d) => [
//   //           uuidv4(),
//   //           d.order_id || orderId,
//   //           d.product_id,
//   //           d.quantity,
//   //           d.price,
//   //           d.discount || 0,
//   //           d.warehouse_id || orderData.warehouse_id,
//   //         ]);

//   //         db.query(insertDetailQuery, [detailValues], (err) => {
//   //           if (err) return db.rollback(() => callback(err));

//   //           db.commit((err) => {
//   //             if (err) return db.rollback(() => callback(err));
//   //             callback(null, {
//   //               message: "Cập nhật đơn hàng và chi tiết thành công",
//   //             });
//   //           });
//   //         });
//   //       });
//   //     });
//   //   });
//   // },

//   updateOrderWithDetails: (orderId, orderData, orderDetails, callback) => {
//     db.beginTransaction((err) => {
//       if (err) {
//         console.error("Lỗi khi bắt đầu transaction:", err);
//         return callback(err);
//       }

//       // Xây dựng động mệnh đề SET cho câu lệnh UPDATE orders
//       const updateFields = [];
//       const updateValues = [];

//       // Định nghĩa các trường được phép cập nhật trong bảng orders
//       const allowedOrderFields = [
//         "customer_id",
//         "order_date",
//         "order_code",
//         "order_status",
//         "total_amount",
//         "discount_amount",
//         "final_amount",
//         "shipping_address",
//         "payment_method",
//         "note",
//         "warehouse_id",
//         "order_amount",
//         "shipping_fee",
//       ];

//       // Chỉ thêm các trường có giá trị hợp lệ vào câu lệnh UPDATE
//       allowedOrderFields.forEach((field) => {
//         // Kiểm tra nếu trường tồn tại trong orderData và không phải undefined
//         // (null vẫn được chấp nhận để cập nhật giá trị null vào DB)
//         if (orderData[field] !== undefined) {
//           updateFields.push(`${field} = ?`);
//           updateValues.push(orderData[field]);
//         }
//       });

//       // Luôn cập nhật thời gian sửa đổi
//       updateFields.push(`updated_at = NOW()`);

//       // Kiểm tra nếu không có trường nào để cập nhật (ngoại trừ updated_at)
//       if (
//         updateFields.length === 1 &&
//         updateFields[0] === "updated_at = NOW()"
//       ) {
//         console.warn(
//           "Không có trường đơn hàng nào được cung cấp để cập nhật (ngoại trừ updated_at)."
//         );
//         // Nếu không có gì để cập nhật cho order chính, vẫn tiếp tục xử lý order details
//       }

//       // Xây dựng câu lệnh UPDATE hoàn chỉnh
//       const updateOrderQuery = `
//         UPDATE orders SET
//           ${updateFields.join(", ")}
//         WHERE order_id = ?
//       `;
//       updateValues.push(orderId); // Thêm orderId vào cuối mảng giá trị cho mệnh đề WHERE

//       // Ghi log câu lệnh SQL và tham số để kiểm tra
//       console.log("Executing updateOrderQuery:", updateOrderQuery);
//       console.log("With parameters:", updateValues);

//       // Thực hiện cập nhật đơn hàng
//       db.query(updateOrderQuery, updateValues, (err) => {
//         if (err) {
//           console.error("Lỗi khi cập nhật đơn hàng:", err);
//           return db.rollback(() => callback(err)); // Rollback transaction nếu có lỗi
//         }

//         // Xóa tất cả các chi tiết đơn hàng cũ liên quan đến orderId
//         const deleteDetailsQuery = `DELETE FROM order_details WHERE order_id = ?`;
//         db.query(deleteDetailsQuery, [orderId], (err) => {
//           if (err) {
//             console.error("Lỗi khi xóa chi tiết đơn hàng cũ:", err);
//             return db.rollback(() => callback(err));
//           }

//           // Nếu không có chi tiết đơn hàng mới nào được cung cấp, commit transaction và kết thúc
//           if (orderDetails.length === 0) {
//             return db.commit((err) => {
//               if (err) {
//                 console.error(
//                   "Lỗi khi commit transaction (không có chi tiết đơn hàng):",
//                   err
//                 );
//                 return db.rollback(() => callback(err));
//               }
//               callback(null, {
//                 message:
//                   "Cập nhật đơn hàng thành công (không có sản phẩm chi tiết)",
//               });
//             });
//           }

//           // Nếu có chi tiết đơn hàng mới, thêm chúng vào bảng order_details
//           const insertDetailQuery = `
//             INSERT INTO order_details (
//               order_detail_id,
//               order_id,
//               product_id,
//               quantity,
//               price,
//               discount,
//               warehouse_id
//             ) VALUES ?
//           `;

//           // Chuẩn bị mảng các giá trị để insert hàng loạt
//           const detailValues = orderDetails.map((d) => [
//             uuidv4(), // Tạo UUID cho order_detail_id
//             d.order_id || orderId, // Đảm bảo order_id được gán đúng
//             d.product_id,
//             d.quantity,
//             d.price,
//             d.discount || 0,
//             d.warehouse_id || orderData.warehouse_id, // Sử dụng warehouse_id từ dữ liệu order chính nếu chi tiết không có
//           ]);

//           db.query(insertDetailQuery, [detailValues], (err) => {
//             if (err) {
//               console.error("Lỗi khi thêm chi tiết đơn hàng mới:", err);
//               return db.rollback(() => callback(err));
//             }

//             // Commit transaction nếu tất cả các bước thành công
//             db.commit((err) => {
//               if (err) {
//                 console.error(
//                   "Lỗi khi commit transaction (có chi tiết đơn hàng):",
//                   err
//                 );
//                 return db.rollback(() => callback(err));
//               }
//               callback(null, {
//                 message: "Cập nhật đơn hàng và chi tiết thành công",
//               });
//             });
//           });
//         });
//       });
//     });
//   },
// };

// module.exports = Order;
// order.model.js
// order.model.js
const db = require("../../config/db.config");
const { v4: uuidv4 } = require("uuid");

/**
 * Hàm tạo mã đơn hàng tự động.
 * @returns {Promise<string>} Promise giải quyết với mã đơn hàng mới.
 */
const generateOrderCode = async () => {
  // ✅ Chuyển sang async
  const prefix = "ORD";
  const today = new Date();
  // Định dạng ngày tháng thành YYYYMMDD
  const dateStr = `${today.getFullYear()}${String(
    today.getMonth() + 1
  ).padStart(2, "0")}${String(today.getDate()).padStart(2, "0")}`;

  // Điều kiện truy vấn để tìm mã đơn hàng trong ngày hiện tại
  const queryDateCondition = `order_code LIKE '${prefix}-${dateStr}%'`;

  try {
    // Truy vấn để lấy số thứ tự lớn nhất trong ngày
    const [results] = await db.promise().query(
      // ✅ Sử dụng db.promise().query
      `SELECT IFNULL(MAX(CAST(SUBSTRING_INDEX(order_code, '-', -1) AS UNSIGNED)), 0) AS last_sequence 
       FROM orders 
       WHERE ${queryDateCondition}`
    );

    // Tính toán số thứ tự tiếp theo
    let nextSequence = results[0]?.last_sequence
      ? parseInt(results[0].last_sequence) + 1
      : 1;

    // Đảm bảo số thứ tự là 5 chữ số (ví dụ: 00001, 00002)
    const paddedSequence = String(nextSequence).padStart(5, "0");

    // Tạo mã đơn hàng hoàn chỉnh
    const orderCode = `${prefix}-${dateStr}-${paddedSequence}`;
    return orderCode;
  } catch (error) {
    console.error("Lỗi khi tạo mã đơn hàng:", error.message);
    throw error; // Ném lỗi để được bắt ở tầng service
  }
};

// Đối tượng Order chứa các phương thức tương tác với DB
const OrderModel = {
  // ✅ Đổi tên thành OrderModel để nhất quán
  /**
   * Phương thức tạo đơn hàng mới.
   * @param {Object} data - Dữ liệu đơn hàng.
   * @returns {Promise<Object>} Promise giải quyết với thông tin đơn hàng đã tạo.
   */
  create: async (data) => {
    // ✅ Chuyển sang async
    const {
      customer_id,
      order_date,
      total_amount,
      discount_amount,
      final_amount,
      shipping_address,
      payment_method,
      note,
      order_amount,
      warehouse_id,
      shipping_fee,
    } = data;

    // --- VALIDATE INPUTS ---
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
      const order_code = await generateOrderCode(); // ✅ Sử dụng await
      const order_status = "Mới"; // Trạng thái mặc định cho đơn hàng mới
      const is_active = 1; // Mặc định là active
      const order_id = uuidv4(); // Tạo UUID cho order_id

      // Câu lệnh SQL để thêm đơn hàng vào bảng 'orders'
      const query = `
        INSERT INTO orders (
          order_id, customer_id, order_date, order_code, total_amount,
          discount_amount, final_amount, order_status, is_active,
          shipping_address, payment_method, note, warehouse_id, order_amount, shipping_fee
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      // Các giá trị tương ứng với các placeholder trong câu lệnh SQL
      const values = [
        order_id,
        customer_id,
        order_date,
        order_code,
        total_amount || 0,
        discount_amount || 0,
        final_amount || 0,
        order_status,
        is_active,
        shipping_address || null,
        payment_method || null,
        note || null,
        warehouse_id || null,
        order_amount || 0,
        shipping_fee || 0,
      ];

      // Thực hiện truy vấn
      const [results] = await db.promise().query(query, values); // ✅ Sử dụng db.promise().query

      // Trả về thông tin đơn hàng đã tạo thành công
      return {
        order_id,
        order_code,
        customer_id,
        order_date,
        order_status,
        is_active,
        ...data, // Bao gồm cả dữ liệu gốc đã gửi
      };
    } catch (error) {
      console.error("Lỗi khi lưu đơn hàng:", error.message);
      throw error;
    }
  },

  /**
   * Phương thức đọc tất cả các đơn hàng đang hoạt động.
   * @returns {Promise<Array<Object>>} Promise giải quyết với danh sách đơn hàng.
   */
  // read: async () => {
  //   // ✅ Chuyển sang async
  //   const query = `
  //   SELECT
  //     orders.*,
  //     customers.customer_name
  //   FROM orders
  //   LEFT JOIN customers ON orders.customer_id = customers.customer_id
  //   WHERE is_active = 1
  //   ORDER BY
  //     COALESCE(orders.updated_at, orders.created_at) DESC
  //   `;

  //   try {
  //     const [results] = await db.promise().query(query); // ✅ Sử dụng db.promise().query

  //     // Định dạng lại kết quả để dễ sử dụng ở frontend
  //     const formattedResults = results.map((order) => ({
  //       order_id: order.order_id,
  //       order_code: order.order_code,
  //       order_date: order.order_date,
  //       order_status: order.order_status,
  //       shipping_address: order.shipping_address,
  //       shipping_fee: order.shipping_fee,
  //       payment_method: order.payment_method,
  //       note: order.note,
  //       total_amount: order.total_amount,
  //       discount_amount: order.discount_amount,
  //       final_amount: order.final_amount,
  //       created_at: order.created_at,
  //       updated_at: order.updated_at,
  //       warehouse_id: order.warehouse_id,
  //       // Gom nhóm thông tin khách hàng vào một object riêng
  //       customer: {
  //         customer_id: order.customer_id,
  //         customer_name: order.customer_name || "Khách lẻ", // Tên mặc định nếu không có
  //       },
  //     }));
  //     return formattedResults;
  //   } catch (error) {
  //     console.error("Lỗi khi đọc tất cả đơn hàng:", error.message);
  //     throw error;
  //   }
  // },

  // read: async (skip, limit) => {
  //   const baseQuery = `
  //     SELECT
  //       orders.*,
  //       customers.customer_name
  //     FROM orders
  //     LEFT JOIN customers ON orders.customer_id = customers.customer_id
  //     WHERE is_active = 1
  //     ORDER BY
  //       COALESCE(orders.updated_at, orders.created_at) DESC
  //   `;

  //   const countQuery = `
  //     SELECT COUNT(*) AS total
  //     FROM orders
  //     WHERE is_active = 1
  //   `;

  //   try {
  //     const [countResults] = await db.promise().query(countQuery);
  //     const total = countResults[0].total;

  //     const paginatedDataQuery = `
  //       ${baseQuery}
  //       LIMIT ?, ?
  //     `;
  //     console.log("Skip:", skip, "Limit:", limit);
  //     const [results] = await db
  //       .promise()
  //       .query(paginatedDataQuery, [skip, limit]);
  //     console.log("Raw Results:", results);
  //     const formattedResults = results.map((order) => ({
  //       order_id: order.order_id,
  //       order_code: order.order_code,
  //       order_date: order.order_date,
  //       order_status: order.order_status,
  //       shipping_address: order.shipping_address,
  //       shipping_fee: order.shipping_fee,
  //       payment_method: order.payment_method,
  //       note: order.note,
  //       total_amount: order.total_amount,
  //       discount_amount: order.discount_amount,
  //       final_amount: order.final_amount,
  //       created_at: order.created_at,
  //       updated_at: order.updated_at,
  //       warehouse_id: order.warehouse_id,
  //       customer: {
  //         customer_id: order.customer_id,
  //         customer_name: order.customer_name || "Khách lẻ",
  //       },
  //     }));
  //     return { data: formattedResults, total: total };
  //   } catch (error) {
  //     console.error("Lỗi khi đọc tất cả đơn hàng (Model):", error.message);
  //     throw error;
  //   }
  // },

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
      whereClause += ` AND DATE(orders.order_date) >= DATE(?)`; // Sử dụng '=' để lọc chính xác ngày
      queryParams.unshift(filters.startDate);
    } else if (filters.endDate) {
      whereClause += ` AND DATE(orders.order_date) <= DATE(?)`;
      queryParams.unshift(filters.endDate);
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
        .query(countQuery, queryParams.slice(0, queryParams.length - 2)); // Loại bỏ skip và limit cho count
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

  /**
   * Phương thức đọc đơn hàng theo ID.
   * @param {string} order_id - ID đơn hàng.
   * @returns {Promise<Object|null>} Promise giải quyết với đối tượng đơn hàng kèm chi tiết hoặc null.
   */
  readById: async (order_id) => {
    // ✅ Chuyển sang async
    try {
      // Lấy thông tin order chính
      const [orderResults] = await db.promise().query(
        // ✅ Sử dụng db.promise().query
        "SELECT * FROM orders WHERE order_id = ?",
        [order_id]
      );
      if (orderResults.length === 0) return null; // Không tìm thấy đơn hàng

      const order = orderResults[0];

      // Lấy kèm chi tiết đơn hàng (order_details)
      const [detailResults] = await db.promise().query(
        // ✅ Sử dụng db.promise().query
        "SELECT * FROM order_details WHERE order_id = ?",
        [order_id]
      );

      order.order_details = detailResults || []; // Gán chi tiết đơn hàng vào thuộc tính order_details

      // Nếu order đã hoàn tất, lấy thêm invoices và transactions
      if (order.order_status === "Hoàn tất") {
        // Lấy danh sách invoices cho order này
        const [invoiceResults] = await db
          .promise()
          .query("SELECT * FROM invoices WHERE order_id = ?", [order_id]);
        order.invoices = invoiceResults || [];

        // Lấy danh sách transactions cho từng invoice
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

  /**
   * Phương thức cập nhật thông tin đơn hàng (chỉ các trường trong bảng 'orders').
   * @param {string} order_id - ID đơn hàng.
   * @param {Object} data - Dữ liệu cập nhật.
   * @returns {Promise<Object|null>} Promise giải quyết với thông tin đã cập nhật hoặc null.
   */
  update: async (order_id, data) => {
    // ✅ Chuyển sang async
    const fields = [];
    const values = [];

    // Xây dựng động các cặp 'field = ?' và giá trị tương ứng
    for (const key in data) {
      fields.push(`${key} = ?`);
      values.push(data[key]);
    }

    fields.push(`updated_at = CURRENT_TIMESTAMP`); // Cập nhật thời gian sửa đổi
    const sql = `UPDATE orders SET ${fields.join(", ")} WHERE order_id = ?`;
    values.push(order_id); // Thêm order_id vào cuối mảng giá trị cho mệnh đề WHERE

    try {
      const [results] = await db.promise().query(sql, values); // ✅ Sử dụng db.promise().query
      if (results.affectedRows === 0) {
        return null; // Không có hàng nào bị ảnh hưởng (không tìm thấy order_id)
      }
      return { order_id, ...data }; // Trả về thông tin đã cập nhật
    } catch (error) {
      console.error("Lỗi khi cập nhật đơn hàng:", error.message);
      throw error;
    }
  },

  /**
   * Phương thức xóa đơn hàng (xóa mềm hoặc xóa cứng tùy thuộc vào thiết kế DB).
   * @param {string} order_id - ID đơn hàng.
   * @returns {Promise<boolean>} Promise giải quyết với true nếu xóa thành công, false nếu không.
   */
  delete: async (order_id) => {
    // ✅ Chuyển sang async
    try {
      const [results] = await db.promise().query(
        // ✅ Sử dụng db.promise().query
        "DELETE FROM orders WHERE order_id = ?",
        [order_id]
      );
      return results.affectedRows > 0; // Trả về true nếu có hàng bị xóa
    } catch (error) {
      console.error("Lỗi khi xóa đơn hàng:", error.message);
      throw error;
    }
  },

  /**
   * Phương thức cập nhật đơn hàng và chi tiết đơn hàng trong một transaction.
   * @param {string} orderId - ID đơn hàng.
   * @param {Object} orderData - Dữ liệu cập nhật cho đơn hàng chính.
   * @param {Array<Object>} orderDetails - Mảng các chi tiết đơn hàng.
   * @returns {Promise<Object>} Promise giải quyết với thông báo thành công.
   */
  updateOrderWithDetails: async (orderId, orderData, orderDetails) => {
    // ✅ Chuyển sang async
    const connection = await db.promise().getConnection(); // ✅ Lấy connection từ pool
    try {
      await connection.beginTransaction(); // ✅ Bắt đầu transaction

      // Xây dựng động mệnh đề SET cho câu lệnh UPDATE orders
      const updateFields = [];
      const updateValues = [];

      // Định nghĩa các trường được phép cập nhật trong bảng orders
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

      // Chỉ thêm các trường có giá trị hợp lệ vào câu lệnh UPDATE
      allowedOrderFields.forEach((field) => {
        if (orderData[field] !== undefined) {
          updateFields.push(`${field} = ?`);
          updateValues.push(orderData[field]);
        }
      });

      // Luôn cập nhật thời gian sửa đổi
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

      // Thực hiện cập nhật đơn hàng
      await connection.query(updateOrderQuery, updateValues); // ✅ Sử dụng connection.query

      // Xóa tất cả các chi tiết đơn hàng cũ liên quan đến orderId
      const deleteDetailsQuery = `DELETE FROM order_details WHERE order_id = ?`;
      await connection.query(deleteDetailsQuery, [orderId]); // ✅ Sử dụng connection.query

      // Nếu không có chi tiết đơn hàng mới nào được cung cấp, commit transaction và kết thúc
      if (orderDetails.length === 0) {
        await connection.commit(); // ✅ Commit transaction
        return {
          message: "Cập nhật đơn hàng thành công (không có sản phẩm chi tiết)",
        };
      }

      // Nếu có chi tiết đơn hàng mới, thêm chúng vào bảng order_details
      const insertDetailQuery = `
        INSERT INTO order_details (
          order_detail_id, order_id, product_id, quantity, price, discount, warehouse_id
        ) VALUES ?
      `;

      // Chuẩn bị mảng các giá trị để insert hàng loạt
      const detailValues = orderDetails.map((d) => [
        uuidv4(), // Tạo UUID cho order_detail_id
        d.order_id || orderId, // Đảm bảo order_id được gán đúng
        d.product_id,
        d.quantity,
        d.price,
        d.discount || 0,
        d.warehouse_id || orderData.warehouse_id, // Sử dụng warehouse_id từ dữ liệu order chính nếu chi tiết không có
      ]);

      await connection.query(insertDetailQuery, [detailValues]); // ✅ Sử dụng connection.query

      await connection.commit(); // ✅ Commit transaction
      return { message: "Cập nhật đơn hàng và chi tiết thành công" };
    } catch (error) {
      console.error("Lỗi trong updateOrderWithDetails transaction:", error);
      await connection.rollback(); // ✅ Rollback transaction nếu có lỗi
      throw error; // Ném lỗi để được bắt ở tầng service/controller
    } finally {
      connection.release(); // ✅ Luôn giải phóng connection
    }
  },
};

module.exports = OrderModel;
