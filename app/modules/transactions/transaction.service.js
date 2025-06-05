// const TransactionModel = require("./transaction.model");

// const createTransaction = (data, callback) => {
//   TransactionModel.create(data, (error, result) => {
//     if (error) return callback(error);
//     return callback(null, result);
//   });
// };

// const getAllTransactions = (callback) => {
//   TransactionModel.findAll((error, results) => {
//     if (error) return callback(error);
//     return callback(null, results);
//   });
// };

// const getTransactionById = (id, callback) => {
//   TransactionModel.findById(id, (error, result) => {
//     if (error) return callback(error);
//     if (!result)
//       return callback(new Error(`Không tìm thấy giao dịch ID=${id}`));
//     return callback(null, result);
//   });
// };

// const updateTransactionById = (id, data, callback) => {
//   TransactionModel.updateById(id, data, (error, result) => {
//     if (error) return callback(error);
//     return callback(null, result);
//   });
// };

// const deleteTransactionById = (id, callback) => {
//   TransactionModel.deleteById(id, (error) => {
//     if (error) return callback(error);
//     return callback(null, { success: true });
//   });
// };

// const confirmPayment = (order_id, callback) => {
//   TransactionModel.confirmPayment(order_id, (err, result) => {
//     if (err) return callback(err);
//     callback(null, result);
//   });
// };

// const markAsCancelled = (order_id, callback) => {
//   TransactionModel.markAsCancelled(order_id, (err, result) => {
//     if (err) return callback(err);
//     callback(null, result);
//   });
// };

// // Dùng để hủy các giao dịch liên quan đến một order qua invoice
// const markAsCancelledByOrder = (order_id, callback) => {
//   // Tìm các invoice thuộc order này trước
//   const query = `
//         SELECT i.invoice_id
//         FROM invoices i
//         WHERE i.order_id = ?
//     `;

//   db.query(query, [order_id], (err, invoices) => {
//     if (err) return callback(err);

//     if (!invoices.length) return callback(null); // Không có invoice nào để hủy

//     const invoiceIds = invoices.map((inv) => inv.invoice_id);

//     // Hủy các giao dịch liên quan đến các invoice này
//     const updateQuery = `
//             UPDATE transactions
//             SET status = 'cancelled'
//             WHERE related_type = 'invoice' AND related_id IN (?)
//         `;

//     db.query(updateQuery, [invoiceIds], (err2) => {
//       if (err2) return callback(err2);
//       callback(null);
//     });
//   });
// };

// module.exports = {
//   createTransaction,
//   getAllTransactions,
//   getTransactionById,
//   updateTransactionById,
//   deleteTransactionById,
//   confirmPayment,
//   markAsCancelled,
//   markAsCancelledByOrder,
// };

// transaction.service.js
const TransactionModel = require("./transaction.model");

const TransactionService = {
  createTransaction: async (data) => {
    // Thêm logic nghiệp vụ nếu cần trước khi gọi model
    try {
      const transaction = await TransactionModel.createTransaction(data);
      return transaction;
    } catch (error) {
      console.error(
        "🚀 ~ transaction.service.js: createTransaction - Error:",
        error
      );
      throw error; // Ném lỗi để được bắt bởi tầng gọi
    }
  },

  getTransactionById: async (transactionId) => {
    try {
      const transaction = await TransactionModel.getTransactionById(
        transactionId
      );
      return transaction;
    } catch (error) {
      console.error(
        "🚀 ~ transaction.service.js: getTransactionById - Error:",
        error
      );
      throw error;
    }
  },

  markAsCancelled: async (related_id) => {
    // Thêm logic nghiệp vụ nếu cần trước khi gọi model
    try {
      const result = await TransactionModel.markAsCancelled(related_id);
      return result;
    } catch (error) {
      console.error(
        "🚀 ~ transaction.service.js: markAsCancelled - Error:",
        error
      );
      throw error; // Ném lỗi để được bắt bởi tầng gọi
    }
  },

  // Các hàm service khác có thể được thêm vào
};

module.exports = TransactionService;
