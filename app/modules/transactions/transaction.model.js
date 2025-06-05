const db = require("../../config/db.config");
const { v4: uuidv4 } = require("uuid");

// // const TransactionModel = {
// //   // create: (data, callback) => {
// //   //   const transaction_id = uuidv4();
// //   //   const {
// //   //     transaction_code,
// //   //     transaction_type,
// //   //     amount,
// //   //     description,
// //   //     category,
// //   //     payment_method,
// //   //     source_type,
// //   //     source_id,
// //   //   } = data;

// //   //   db.query(
// //   //     `INSERT INTO transactions (
// //   //       transaction_id, transaction_code, transaction_type, amount,
// //   //       description, category, payment_method, source_type, source_id
// //   //     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
// //   //     [
// //   //       transaction_id,
// //   //       transaction_code,
// //   //       transaction_type,
// //   //       amount,
// //   //       description,
// //   //       category,
// //   //       payment_method,
// //   //       source_type,
// //   //       source_id,
// //   //     ],
// //   //     (error, results) => {
// //   //       if (error) return callback(error);
// //   //       return callback(null, {
// //   //         transaction_id,
// //   //         ...data,
// //   //       });
// //   //     }
// //   //   );
// //   // },

// //   // create: (data, callback) => {
// //   //   const transaction_id = uuidv4();

// //   //   const {
// //   //     transaction_code,
// //   //     type, // receipt / payment / refund...
// //   //     amount,
// //   //     description = null,
// //   //     category = null,
// //   //     payment_method = null,
// //   //     related_type, // order / invoice / refund...
// //   //     related_id, // id của nguồn tạo ra giao dịch
// //   //   } = data;

// //   //   // Validate bắt buộc
// //   //   if (
// //   //     !transaction_code ||
// //   //     !type ||
// //   //     amount == null ||
// //   //     !related_type ||
// //   //     !related_id
// //   //   ) {
// //   //     return callback(new Error("Thiếu thông tin bắt buộc để tạo giao dịch"));
// //   //   }

// //   //   const query = `
// //   //     INSERT INTO transactions (
// //   //       transaction_id, transaction_code, type, amount,
// //   //       description, category, payment_method, related_type, related_id
// //   //     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
// //   //   `;

// //   //   const values = [
// //   //     transaction_id,
// //   //     transaction_code,
// //   //     type,
// //   //     amount,
// //   //     description,
// //   //     category,
// //   //     payment_method,
// //   //     related_type,
// //   //     related_id,
// //   //   ];

// //   //   db.query(query, values, (error, results) => {
// //   //     if (error) {
// //   //       console.error("Lỗi khi tạo giao dịch:", error);
// //   //       return callback(error);
// //   //     }

// //   //     return callback(null, {
// //   //       transaction_id,
// //   //       transaction_code,
// //   //       type,
// //   //       amount,
// //   //       description,
// //   //       category,
// //   //       payment_method,
// //   //       related_type,
// //   //       related_id,
// //   //     });
// //   //   });
// //   // },

// //   create: (data, callback) => {
// //     const transaction_id = uuidv4();

// //     const {
// //       transaction_code,
// //       type, // receipt / payment / refund...
// //       amount,
// //       description = null,
// //       category = null,
// //       payment_method = null,
// //       related_type, // order / invoice / refund...
// //       related_id, // id của nguồn tạo ra giao dịch
// //     } = data;

// //     // --- DEBUGGING: Log incoming data ---
// //     console.log("🚀 ~ transaction.model.js: create - Incoming data:", data);
// //     console.log("� ~ transaction.model.js: create - Extracted amount:", amount);

// //     // Validate bắt buộc
// //     if (
// //       !transaction_code ||
// //       !type ||
// //       amount == null || // Kiểm tra này có thể bỏ lỡ NaN. Cần cân nhắc isNaN(amount)
// //       !related_type ||
// //       !related_id
// //     ) {
// //       const validationError = new Error(
// //         "Thiếu thông tin bắt buộc để tạo giao dịch hoặc dữ liệu không hợp lệ."
// //       );
// //       console.error(
// //         "🚀 ~ transaction.model.js: create - Validation error:",
// //         validationError.message
// //       );
// //       return callback(validationError);
// //     }

// //     const query = `
// //       INSERT INTO transactions (
// //         transaction_id, transaction_code, type, amount,
// //         description, category, payment_method, related_type, related_id
// //       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
// //     `;

// //     const values = [
// //       transaction_id,
// //       transaction_code,
// //       type,
// //       amount,
// //       description,
// //       category,
// //       payment_method,
// //       related_type,
// //       related_id,
// //     ];

// //     // --- DEBUGGING: Log SQL query and values ---
// //     console.log("🚀 ~ transaction.model.js: create - SQL Query:", query);
// //     console.log("🚀 ~ transaction.model.js: create - SQL Values:", values);

// //     db.query(query, values, (error, results) => {
// //       if (error) {
// //         // --- DEBUGGING: Log DB error ---
// //         console.error(
// //           "🚀 ~ transaction.model.js: create - Lỗi khi tạo giao dịch (DB error):",
// //           error
// //         );
// //         return callback(error);
// //       }

// //       console.log(
// //         "🚀 ~ transaction.model.js: create - Giao dịch tạo thành công:",
// //         { transaction_id, ...data }
// //       );
// //       return callback(null, {
// //         transaction_id,
// //         transaction_code,
// //         type,
// //         amount,
// //         description,
// //         category,
// //         payment_method,
// //         related_type,
// //         related_id,
// //       });
// //     });
// //   },

// //   findAll: (callback) => {
// //     db.query(
// //       "SELECT * FROM transactions ORDER BY created_at DESC",
// //       (error, rows) => {
// //         if (error) return callback(error);
// //         return callback(null, rows);
// //       }
// //     );
// //   },

// //   findById: (id, callback) => {
// //     db.query(
// //       "SELECT * FROM transactions WHERE transaction_id = ?",
// //       [id],
// //       (error, rows) => {
// //         if (error) return callback(error);
// //         return callback(null, rows[0]);
// //       }
// //     );
// //   },

// //   updateById: (id, data, callback) => {
// //     const {
// //       transaction_code,
// //       transaction_type,
// //       amount,
// //       description,
// //       category,
// //       payment_method,
// //       source_type,
// //       source_id,
// //     } = data;

// //     db.query(
// //       `UPDATE transactions SET
// //         transaction_code = ?, transaction_type = ?, amount = ?,
// //         description = ?, category = ?, payment_method = ?,
// //         source_type = ?, source_id = ?
// //        WHERE transaction_id = ?`,
// //       [
// //         transaction_code,
// //         transaction_type,
// //         amount,
// //         description,
// //         category,
// //         payment_method,
// //         source_type,
// //         source_id,
// //         id,
// //       ],
// //       (error, results) => {
// //         if (error) return callback(error);
// //         return callback(null, { transaction_id: id, ...data });
// //       }
// //     );
// //   },

// //   deleteById: (id, callback) => {
// //     db.query(
// //       "DELETE FROM transactions WHERE transaction_id = ?",
// //       [id],
// //       (error) => {
// //         if (error) return callback(error);
// //         return callback(null, { message: "Xóa thành công" });
// //       }
// //     );
// //   },

// //   // confirmPayment: (order_id, callback) => {
// //   //   const transaction_status = "Hoàn tất"; // hoặc bạn dùng 'Hoàn tất'
// //   //   const updated_at = new Date();

// //   //   const sql = `
// //   //   UPDATE transactions
// //   //   SET transaction_status = ?, updated_at = ?
// //   //   WHERE source_type = 'receipt' AND source_id IN (
// //   //     SELECT receipt_id FROM receipts WHERE order_id = ?
// //   //   )`;

// //   //   db.query(
// //   //     sql,
// //   //     [transaction_status, updated_at, order_id],
// //   //     (error, results) => {
// //   //       if (error) return callback(error);

// //   //       if (results.affectedRows === 0) {
// //   //         return callback(null, null); // Không tìm thấy transaction nào để cập nhật
// //   //       }

// //   //       callback(null, {
// //   //         order_id,
// //   //         transaction_status,
// //   //         updated_at,
// //   //       });
// //   //     }
// //   //   );
// //   // },

// //   markAsCancelled: (order_id, callback) => {
// //     const sql = `
// //     UPDATE transactions
// //     SET transaction_status = 'Huỷ đơn', note = CONCAT(IFNULL(note, ''), ' [Hủy đơn]'), updated_at = CURRENT_TIMESTAMP
// //     WHERE source_type = 'receipt' AND source_id IN (
// //       SELECT receipt_id FROM receipts WHERE order_id = ?
// //     )`;

// //     db.query(sql, [order_id], (err, result) => {
// //       if (err) return callback(err);
// //       callback(null, result);
// //     });
// //   },
// // };

// // module.exports = TransactionModel;

// // transaction.model.js
// const db = require("../../config/db.config");
// const { v4: uuidv4 } = require("uuid");

// const TransactionModel = {
//   createTransaction: (data, callback) => {
//     const transaction_id = uuidv4();
//     const {
//       transaction_code,
//       type,
//       amount,
//       description,
//       category,
//       payment_method,
//       related_type,
//       related_id,
//     } = data;

//     const query = `
//             INSERT INTO transactions (
//                 transaction_id, transaction_code, type, amount,
//                 description, category, payment_method, related_type,
//                 related_id
//             ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
//         `;

//     const values = [
//       transaction_id,
//       transaction_code,
//       type,
//       amount,
//       description,
//       category,
//       payment_method,
//       related_type,
//       related_id,
//     ];

//     db.query(query, values, (err, result) => {
//       if (err) {
//         console.error(
//           "🚀 ~ transaction.model.js: createTransaction - Error creating transaction:",
//           err
//         );
//         return callback(err);
//       }
//       const transaction = { transaction_id, ...data };
//       console.log(
//         "🚀 ~ transaction.model.js: createTransaction - Transaction created successfully:",
//         transaction
//       );
//       callback(null, transaction);
//     });
//   },

//   markAsCancelled: (related_id, callback) => {
//     const query = `
//             UPDATE transactions
//             SET description = CONCAT(description, ' (Đã hủy)'),
//                 type = 'adjustment'
//             WHERE related_id = ? AND related_type = 'order'
//         `;
//     db.query(query, [related_id], (err, result) => {
//       if (err) {
//         console.error(
//           "🚀 ~ transaction.model.js: markAsCancelled - Error marking transactions as cancelled:",
//           err
//         );
//         return callback(err);
//       }
//       console.log(
//         "🚀 ~ transaction.model.js: markAsCancelled - Transactions related to order ID marked as cancelled:",
//         related_id,
//         result
//       );
//       callback(null, result);
//     });
//   },

//   // Các hàm model khác có thể được thêm vào (ví dụ: readById, update)
// };

// module.exports = TransactionModel;

const TransactionModel = {
  // Đổi tên từ 'Transaction' sang 'TransactionModel' để nhất quán
  /**
   * Tạo một giao dịch mới trong cơ sở dữ liệu.
   * @param {Object} data - Dữ liệu giao dịch.
   * @returns {Promise<Object>} Promise giải quyết với đối tượng giao dịch đã tạo.
   */
  createTransaction: (data) => {
    // Hàm này giờ đây trả về Promise
    return new Promise((resolve, reject) => {
      const transaction_id = uuidv4();
      const {
        transaction_code,
        type, // receipt / payment / refund...
        amount,
        description = null,
        category = null,
        payment_method = null,
        related_type, // order / invoice / refund...
        related_id, // id của nguồn tạo ra giao dịch
      } = data;

      // Validate bắt buộc
      if (
        !transaction_code ||
        !type ||
        amount == null || // Kiểm tra này có thể bỏ lỡ NaN. Cần cân nhắc isNaN(amount)
        !related_type ||
        (related_type !== "other" && related_id == null)
      ) {
        const validationError = new Error(
          "Thiếu thông tin bắt buộc để tạo giao dịch hoặc dữ liệu không hợp lệ."
        );
        console.error(
          "🚀 ~ transaction.model.js: createTransaction - Validation error:",
          validationError.message
        );
        return reject(validationError); // Từ chối Promise nếu lỗi validate
      }

      const query = `
                INSERT INTO transactions (
                    transaction_id, transaction_code, type, amount, 
                    description, category, payment_method, related_type, related_id
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;

      const values = [
        transaction_id,
        transaction_code,
        type,
        amount,
        description,
        category,
        payment_method,
        related_type,
        related_id,
      ];

      console.log(
        "🚀 ~ transaction.model.js: createTransaction - SQL Query:",
        query
      );
      console.log(
        "🚀 ~ transaction.model.js: createTransaction - SQL Values:",
        values
      );

      db.query(query, values, (error, results) => {
        if (error) {
          console.error(
            "🚀 ~ transaction.model.js: createTransaction - Lỗi khi tạo giao dịch (DB error):",
            error
          );
          return reject(error); // Từ chối Promise nếu có lỗi DB
        }

        const transactionResult = {
          transaction_id,
          transaction_code,
          type,
          amount,
          description,
          category,
          payment_method,
          related_type,
          related_id,
        };
        console.log(
          "🚀 ~ transaction.model.js: createTransaction - Giao dịch tạo thành công:",
          transactionResult
        );
        resolve(transactionResult); // Giải quyết Promise khi thành công
      });
    });
  },

  /**
   * Đánh dấu các giao dịch liên quan đến một ID cụ thể là đã hủy trong cơ sở dữ liệu.
   * @param {string} related_id - ID liên quan (ví dụ: order_id).
   * @returns {Promise<Object>} Promise giải quyết với kết quả cập nhật.
   */
  markAsCancelled: (related_id) => {
    // Hàm này giờ đây trả về Promise
    return new Promise((resolve, reject) => {
      const query = `
                UPDATE transactions 
                SET status = 'cancelled',
                    description = CONCAT(description, ' (Đã hủy)'),
                    type = 'adjustment'
                WHERE related_id = ? AND related_type = 'order'
            `;
      db.query(query, [related_id], (err, result) => {
        if (err) {
          console.error(
            "🚀 ~ transaction.model.js: markAsCancelled - Error marking transactions as cancelled:",
            err
          );
          return reject(err); // Từ chối Promise nếu có lỗi
        }
        console.log(
          "🚀 ~ transaction.model.js: markAsCancelled - Transactions related to order ID marked as cancelled:",
          related_id,
          result
        );
        resolve(result); // Giải quyết Promise khi thành công
      });
    });
  },

  getTransactionById: (transactionId) => {
    return new Promise((resolve, reject) => {
      const query = `
                SELECT * FROM transactions WHERE transaction_id = ?
            `;
      db.query(query, [transactionId], (err, results) => {
        if (err) {
          console.error(
            "🚀 ~ transaction.model.js: getTransactionById - Error:",
            err
          );
          return reject(err);
        }
        resolve(results[0]);
      });
    });
  },
};

module.exports = TransactionModel;
