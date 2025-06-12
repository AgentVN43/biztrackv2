// const InvoiceModel = require("./invoice.model");

// const getById = (id) => {
//     return new Promise((resolve, reject) => {
//         InvoiceModel.getById(id, (err, result) => {
//             if (err) return reject(err);
//             resolve(result);
//         });
//     });
// };

// const create = (data) => {
//     return new Promise((resolve, reject) => {
//         InvoiceModel.create(data, (err, result) => {
//             if (err) return reject(err);
//             resolve(result);
//         });
//     });
// };

// const update = (id, data) => {
//     return new Promise((resolve, reject) => {
//         InvoiceModel.update(id, data, (err, result) => {
//             if (err) return reject(err);
//             resolve(result);
//         });
//     });
// };

// const deleteInvoice = (id) => {
//     return new Promise((resolve, reject) => {
//         InvoiceModel.delete(id, (err, result) => {
//             if (err) return reject(err);
//             resolve(result);
//         });
//     });
// };

// module.exports = {
//     getAll,
//     getById,
//     create,
//     update,
//     delete: deleteInvoice
// };
// invoice.service.js
const InvoiceModel = require("./invoice.model"); // Đảm bảo đường dẫn đúng tới invoice.model
const TransactionModel = require("../transactions/transaction.model");

const InvoiceService = {
  // Đổi tên từ 'const create' sang 'const InvoiceService'
  /**
   * Tạo một hóa đơn mới.
   * @param {Object} data - Dữ liệu hóa đơn.
   * @returns {Promise<Object>} Promise giải quyết với đối tượng hóa đơn đã tạo.
   */
  create: async (data) => {
    // Hàm này giờ là async
    try {
      // Gọi InvoiceModel.create và await kết quả của Promise
      const invoice = await InvoiceModel.create(data);
      return invoice;
    } catch (error) {
      console.error(
        "🚀 ~ invoice.service.js: create - Error creating invoice:",
        error
      );
      throw error; // Ném lỗi để được bắt bởi tầng gọi (order.service.js)
    }
  },

  updateByInvoiceCode: async (invoice_code, data) => {
    try {
      const updatedInvoice = await InvoiceModel.updateByInvoiceCode(
        invoice_code,
        data
      );
      return updatedInvoice;
    } catch (error) {
      throw error; // Propagate the error to the controller
    }
  },

  getAll: async () => {
    try {
      const results = await InvoiceModel.getAll();
      return results;
    } catch (error) {
      // Handle the error as needed, e.g., log it or rethrow it
      console.error(
        "🚀 ~ invoice.service.js: getAll - Error fetching invoices:",
        error
      );
      throw error; // or handle it in another way
    }
  },

  getPaid: async () => {
    try {
      const results = await InvoiceModel.getPaid();
      return results;
    } catch (error) {
      // Handle the error as needed, e.g., log it or rethrow it
      console.error(
        "🚀 ~ invoice.service.js: getAll - Error fetching invoices:",
        error
      );
      throw error; // or handle it in another way
    }
  },

  getUnPaid: async () => {
    try {
      const results = await InvoiceModel.getUnPaid();
      return results;
    } catch (error) {
      // Handle the error as needed, e.g., log it or rethrow it
      console.error(
        "🚀 ~ invoice.service.js: getAll - Error fetching invoices:",
        error
      );
      throw error; // or handle it in another way
    }
  },

  getByInvoiceCode: async (invoice_code) => {
    // Hàm này giờ là async
    try {
      // Gọi InvoiceModel.create và await kết quả của Promise
      const invoice = await InvoiceModel.getByInvoiceCode(invoice_code);
      return invoice;
    } catch (error) {
      console.error(
        "🚀 ~ invoice.service.js: create - Error get invoice by id:",
        error
      );
      throw error; // Ném lỗi để được bắt bởi tầng gọi (order.service.js)
    }
  },

  /**
   * Ghi nhận một khoản thanh toán mới cho một hóa đơn.
   * Hàm này sẽ tạo một giao dịch (transaction) và cập nhật hóa đơn.
   *
   * @param {string} invoice_id - ID của hóa đơn được thanh toán.
   * @param {number} paymentAmount - Số tiền khách hàng đã thanh toán.
   * @param {string} paymentMethod - Phương thức thanh toán (e.g., 'Tiền mặt', 'Chuyển khoản').
   * @param {string} [initiatedByUserId=null] - ID của người dùng thực hiện giao dịch.
   * @returns {Promise<Object>} Promise giải quyết với thông tin hóa đơn đã cập nhật.
   * @throws {Error} Nếu hóa đơn không tồn tại, số tiền không hợp lệ, hoặc có lỗi.
   */
  recordPayment: async (
    invoice_id,
    paymentAmount,
    paymentMethod,
    initiatedByUserId = null
  ) => {
    if (paymentAmount <= 0) {
      throw new Error("Số tiền thanh toán phải lớn hơn 0.");
    }

    try {
      // 1. Lấy thông tin hóa đơn để kiểm tra và lấy customer_id
      const invoice = await InvoiceModel.findById(invoice_id);
      if (!invoice) {
        throw new Error(`Hóa đơn với ID ${invoice_id} không tồn tại.`);
      }

      // Kiểm tra nếu hóa đơn đã thanh toán đủ rồi
      if (invoice.status === "paid") {
        // Tùy chọn: bạn có thể cho phép thanh toán thừa và ghi nhận 'overpayment'
        // hoặc đơn giản là ném lỗi nếu không muốn thanh toán thừa.
        throw new Error("Hóa đơn này đã được thanh toán đầy đủ.");
      }

      // 2. Tạo một giao dịch thanh toán (Transaction)
      // Đây là bằng chứng của dòng tiền
      const transactionData = {
        transaction_code: `TRX-${Date.now()}-${Math.floor(
          Math.random() * 1000
        )}`,
        type: "receipt", // Loại giao dịch là thu tiền
        amount: paymentAmount,
        description: `Thanh toán cho hóa đơn ${invoice.invoice_code} (Số tiền: ${paymentAmount})`,
        category: "sale_payment",
        payment_method: paymentMethod,
        customer_id: invoice.customer_id, // Lấy customer_id từ hóa đơn
        related_type: "invoice",
        related_id: invoice.invoice_id,
        initiated_by: initiatedByUserId,
      };
      const newTransaction = await TransactionModel.createTransaction(
        transactionData
      );
      console.log(
        `🚀 ~ InvoiceService: recordPayment - Giao dịch thanh toán mới đã tạo:`,
        newTransaction
      );

      // 3. Cập nhật số tiền đã thanh toán và trạng thái của hóa đơn bằng hàm Model
      const updatedInvoice = await InvoiceModel.updateAmountPaidAndStatus(
        invoice_id,
        paymentAmount
      );
      console.log(
        `🚀 ~ InvoiceService: recordPayment - Hóa đơn đã được cập nhật:`,
        updatedInvoice
      );

      return updatedInvoice;
    } catch (error) {
      console.error(
        "🚀 ~ InvoiceService: recordPayment - Lỗi khi ghi nhận thanh toán:",
        error
      );
      throw error;
    }
  },
};

module.exports = InvoiceService; // Đảm bảo bạn xuất InvoiceService
