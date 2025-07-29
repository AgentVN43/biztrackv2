// const TransactionModel = require("./transaction.model");
// const InvoiceService = require("../invoice/invoice.service");

// const TransactionService = {
//   createTransaction: async (data) => {
//     try {
//       const transaction = await TransactionModel.createTransaction(data);

//       // ✅ Logic xử lý cập nhật hóa đơn liên quan
//       // if (
//       //   (transaction.type === "receipt" || transaction.type === "payment") && // Check if it's a payment/receipt
//       //   transaction.related_type === "invoice" && // Check if it's related to an invoice
//       //   transaction.related_id // Check if related_id exists (which should be invoice_id)
//       // ) {
//       //   console.log(
//       //     `🚀 ~ TransactionService: createTransaction - Giao dịch liên quan đến hóa đơn (${transaction.type}). Đang cập nhật hóa đơn.`
//       //   );
//       //   await InvoiceService.updateAmountPaidAndStatus(
//       //     transaction.related_id, // invoice_id
//       //     transaction.amount // Số tiền của giao dịch
//       //   );
//       //   console.log(
//       //     `✅ Đã cập nhật hóa đơn ID ${transaction.related_id} với số tiền ${transaction.amount}`
//       //   );
//       // }

//       return transaction;
//     } catch (error) {
//       console.error(
//         "🚀 ~ transaction.service.js: createTransaction - Lỗi:",
//         error
//       );
//       throw error;
//     }
//   },

//   getTransactionById: async (transactionId) => {
//     try {
//       const transaction = await TransactionModel.getTransactionById(
//         transactionId
//       );
//       return transaction;
//     } catch (error) {
//       console.error(
//         "🚀 ~ transaction.service.js: getTransactionById - Error:",
//         error
//       );
//       throw error;
//     }
//   },

//   markAsCancelled: async (related_id) => {
//     // Thêm logic nghiệp vụ nếu cần trước khi gọi model
//     try {
//       const result = await TransactionModel.markAsCancelled(related_id);
//       return result;
//     } catch (error) {
//       console.error(
//         "🚀 ~ transaction.service.js: markAsCancelled - Error:",
//         error
//       );
//       throw error; // Ném lỗi để được bắt bởi tầng gọi
//     }
//   },

//   /**
//    * Hàm mới để xử lý một thanh toán/thu tiền và cập nhật hóa đơn tương ứng.
//    * Đây là một wrapper tiện ích nếu bạn muốn gọi logic này độc lập.
//    * @param {string} invoiceId - ID của hóa đơn cần xử lý.
//    * @param {number} paymentAmount - Số tiền thanh toán/thu.
//    * @returns {Promise<Object>} Kết quả cập nhật hóa đơn.
//    */
//   processPaymentForInvoice: async (invoiceId, paymentAmount) => {
//     try {
//       const updatedInvoice = await InvoiceService.updateAmountPaidAndStatus(
//         invoiceId,
//         paymentAmount
//       );
//       console.log(
//         `✅ Đã xử lý thanh toán ${paymentAmount} cho hóa đơn ${invoiceId}. Trạng thái mới: ${updatedInvoice.status}`
//       );
//       return updatedInvoice;
//     } catch (error) {
//       console.error(
//         "🚀 ~ TransactionService: processPaymentForInvoice - Lỗi xử lý thanh toán cho hóa đơn:",
//         error
//       );
//       throw error;
//     }
//   },
// };

// module.exports = TransactionService;
const TransactionModel = require("./transaction.model");

const TransactionService = {
  /**
   * Tạo một giao dịch mới.
   * @param {Object} data - Dữ liệu giao dịch, bao gồm customer_id/supplier_id.
   * @returns {Promise<Object>} Giao dịch đã tạo.
   */
  createTransaction: async (data) => {
    try {
      // ✅ Truyền customer_id và supplier_id xuống model
      const transaction = await TransactionModel.createTransaction(data);
      // Sau khi tạo transaction, nếu có customer_id thì cập nhật lại debt
      if (transaction && transaction.customer_id) {
        const CustomerModel = require("../customers/customer.model");
        const newDebt = await CustomerModel.calculateDebt(transaction.customer_id);
        await CustomerModel.update(transaction.customer_id, { debt: newDebt });
        console.log(`✅ Đã cập nhật debt mới cho customer ${transaction.customer_id}: ${newDebt}`);
      }
      return transaction;
    } catch (error) {
      console.error(
        "🚀 ~ transaction.service.js: createTransaction - Lỗi:",
        error
      );
      throw error;
    }
  },

  /**
   * Lấy giao dịch theo ID.
   * @param {string} transactionId - ID giao dịch.
   * @returns {Promise<Object>} Giao dịch.
   */
  getTransactionById: async (transactionId) => {
    try {
      const transaction = await TransactionModel.getTransactionById(
        transactionId
      );
      return transaction;
    } catch (error) {
      console.error(
        "🚀 ~ transaction.service.js: getTransactionById - Lỗi:",
        error
      );
      throw error;
    }
  },

  /**
   * Đánh dấu các giao dịch liên quan đến một ID cụ thể là đã hủy.
   * @param {string} related_id - ID của đối tượng liên quan (ví dụ: order_id).
   * @returns {Promise<Object>} Kết quả cập nhật.
   */
  markAsCancelled: async (related_id) => {
    try {
      const result = await TransactionModel.markAsCancelled(related_id);
      return result;
    } catch (error) {
      console.error(
        "🚀 ~ transaction.service.js: markAsCancelled - Lỗi:",
        error
      );
      throw error;
    }
  },

  /**
   * Lấy tất cả giao dịch liên quan đến một khách hàng cụ thể.
   * @param {string} customer_id - ID của khách hàng.
   * @returns {Promise<Array<Object>>} Mảng các giao dịch đã định dạng.
   */
  getTransactionsByCustomerId: async (customer_id) => {
    try {
      const transactions = await TransactionModel.getTransactionsByCustomerId(
        customer_id
      );
      // Bạn có thể thêm logic định dạng hoặc xử lý dữ liệu ở đây nếu cần
      return transactions.map((t) => ({
        transaction_id: t.transaction_id,
        transaction_code: t.transaction_code,
        type: t.type,
        amount: parseFloat(t.amount), // Đảm bảo amount là số
        description: t.description,
        category: t.category,
        payment_method: t.payment_method,
        customer_id: t.customer_id,
        customer_name: t.customer_name, // Từ JOIN
        related_type: t.related_type,
        related_id: t.related_id,
        invoice_code: t.invoice_code, // Từ JOIN
        created_at: t.created_at,
        updated_at: t.updated_at,
      }));
    } catch (error) {
      console.error(
        "🚀 ~ transaction.service.js: getTransactionsByCustomerId - Lỗi:",
        error
      );
      throw error;
    }
  },

  /**
   * Lấy tất cả giao dịch liên quan đến một nhà cung cấp cụ thể.
   * @param {string} supplier_id - ID của nhà cung cấp.
   * @returns {Promise<Array<Object>>} Mảng các giao dịch đã định dạng.
   */
  getTransactionsBySupplierId: async (supplier_id) => {
    try {
      const transactions = await TransactionModel.getTransactionsBySupplierId(
        supplier_id
      );
      // Bạn có thể thêm logic định dạng hoặc xử lý dữ liệu ở đây nếu cần
      return transactions.map((t) => ({
        transaction_id: t.transaction_id,
        transaction_code: t.transaction_code,
        type: t.type,
        amount: parseFloat(t.amount), // Đảm bảo amount là số
        description: t.description,
        category: t.category,
        payment_method: t.payment_method,
        supplier_id: t.supplier_id,
        supplier_name: t.supplier_name, // Từ JOIN
        related_type: t.related_type,
        related_id: t.related_id,
        purchase_order_code: t.purchase_order_code, // Từ JOIN
        created_at: t.created_at,
        updated_at: t.updated_at,
      }));
    } catch (error) {
      console.error(
        "🚀 ~ transaction.service.js: getTransactionsBySupplierId - Lỗi:",
        error
      );
      throw error;
    }
  },

  /**
   * Lấy tất cả giao dịch liên quan đến một đối tượng cụ thể (order, invoice, etc.).
   * @param {string} related_id - ID của đối tượng liên quan.
   * @param {string} related_type - Loại đối tượng liên quan ('order', 'invoice', etc.).
   * @returns {Promise<Array<Object>>} Mảng các giao dịch.
   */
  getTransactionsByRelatedId: async (related_id, related_type) => {
    try {
      const transactions = await TransactionModel.getTransactionsByRelatedId(
        related_id,
        related_type
      );
      return transactions;
    } catch (error) {
      console.error(
        "🚀 ~ transaction.service.js: getTransactionsByRelatedId - Lỗi:",
        error
      );
      throw error;
    }
  },

  /**
   * Lấy tất cả giao dịch.
   * @returns {Promise<Array<Object>>} Mảng tất cả giao dịch.
   */
  getAll: async () => {
    try {
      const transactions = await TransactionModel.getAll();
      return transactions;
    } catch (error) {
      console.error(
        "🚀 ~ transaction.service.js: getAll - Lỗi:",
        error
      );
      throw error;
    }
  },

  // Các hàm service khác có thể được thêm vào
};

module.exports = TransactionService;
