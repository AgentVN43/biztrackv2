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
const InvoiceService = require("../invoice/invoice.service"); 

const TransactionService = {
  // createTransaction: async (data) => {
  //   // Thêm logic nghiệp vụ nếu cần trước khi gọi model
  //   try {
  //     const transaction = await TransactionModel.createTransaction(data);
  //     return transaction;
  //   } catch (error) {
  //     console.error(
  //       "🚀 ~ transaction.service.js: createTransaction - Error:",
  //       error
  //     );
  //     throw error; // Ném lỗi để được bắt bởi tầng gọi
  //   }
  // },

  createTransaction: async (data) => {
    try {
      const transaction = await TransactionModel.createTransaction(data);

      // ✅ Logic xử lý cập nhật hóa đơn liên quan
      // if (
      //   (transaction.type === "receipt" || transaction.type === "payment") && // Check if it's a payment/receipt
      //   transaction.related_type === "invoice" && // Check if it's related to an invoice
      //   transaction.related_id // Check if related_id exists (which should be invoice_id)
      // ) {
      //   console.log(
      //     `🚀 ~ TransactionService: createTransaction - Giao dịch liên quan đến hóa đơn (${transaction.type}). Đang cập nhật hóa đơn.`
      //   );
      //   await InvoiceService.updateAmountPaidAndStatus(
      //     transaction.related_id, // invoice_id
      //     transaction.amount // Số tiền của giao dịch
      //   );
      //   console.log(
      //     `✅ Đã cập nhật hóa đơn ID ${transaction.related_id} với số tiền ${transaction.amount}`
      //   );
      // }

      return transaction;
    } catch (error) {
      console.error(
        "🚀 ~ transaction.service.js: createTransaction - Lỗi:",
        error
      );
      throw error;
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

  /**
   * Hàm mới để xử lý một thanh toán/thu tiền và cập nhật hóa đơn tương ứng.
   * Đây là một wrapper tiện ích nếu bạn muốn gọi logic này độc lập.
   * @param {string} invoiceId - ID của hóa đơn cần xử lý.
   * @param {number} paymentAmount - Số tiền thanh toán/thu.
   * @returns {Promise<Object>} Kết quả cập nhật hóa đơn.
   */
  processPaymentForInvoice: async (invoiceId, paymentAmount) => {
    try {
      const updatedInvoice = await InvoiceService.updateAmountPaidAndStatus(
        invoiceId,
        paymentAmount
      );
      console.log(
        `✅ Đã xử lý thanh toán ${paymentAmount} cho hóa đơn ${invoiceId}. Trạng thái mới: ${updatedInvoice.status}`
      );
      return updatedInvoice;
    } catch (error) {
      console.error(
        "🚀 ~ TransactionService: processPaymentForInvoice - Lỗi xử lý thanh toán cho hóa đơn:",
        error
      );
      throw error;
    }
  },
};

module.exports = TransactionService;
