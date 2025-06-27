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
const CustomerModel = require("../customers/customer.model");

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

      // 4. CẬP NHẬT LẠI DEBT CHO KHÁCH HÀNG
      if (invoice.customer_id) {
        const newDebt = await CustomerModel.calculateDebt(invoice.customer_id);
        await CustomerModel.update(invoice.customer_id, { debt: newDebt });
        console.log(`🚀 ~ InvoiceService: recordPayment - Đã cập nhật debt mới cho khách hàng ${invoice.customer_id} là: ${newDebt}`);
      }

      console.log(
        `🚀 ~ InvoiceService: recordPayment - Hóa đơn đã cập nhật:`,
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

  /**
   * Cập nhật số tiền đã thanh toán (amount_paid) và trạng thái của hóa đơn.
   * @param {string} invoice_id - ID hóa đơn cần cập nhật.
   * @param {number} paymentAmount - Số tiền thanh toán mới nhận được.
   * @returns {Promise<Object>} Kết quả cập nhật.
   */
  updateAmountPaidAndStatus: async (invoice_id, paymentAmount) => {
    try {
      const result = await InvoiceModel.updateAmountPaidAndStatus(
        invoice_id,
        paymentAmount
      );
      return result;
    } catch (error) {
      console.error(
        "🚀 ~ InvoiceService: updateAmountPaidAndStatus - Error:",
        error
      );
      throw error;
    }
  },

  /**
   * Lấy tổng công nợ phải trả và danh sách các hóa đơn mua hàng chưa thanh toán đủ cho một nhà cung cấp.
   * @param {string} supplier_id - ID của nhà cung cấp.
   * @returns {Promise<Object>} Đối tượng chứa tổng công nợ và danh sách hóa đơn.
   */
  getSupplierPayables: async (supplier_id) => {
    try {
      const totalPayables = await InvoiceModel.getTotalPayablesBySupplierId(
        supplier_id
      );
      const unpaidInvoices = await InvoiceModel.getDebtSupplier(supplier_id);

      return {
        supplier_id,
        total_payables: totalPayables,
        unpaid_purchase_invoices: unpaidInvoices,
      };
    } catch (error) {
      console.error("🚀 ~ InvoiceService: getSupplierPayables - Error:", error);
      throw error;
    }
  },

  findByOrderId: async (order_id) => {
    return await InvoiceModel.findByOrderId(order_id);
  },

  recordBulkPayment: async (payments, method, initiatedByUserId = null) => {
    // Lấy thông tin khách hàng từ hóa đơn đầu tiên để kiểm tra
    const firstInvoice = await InvoiceModel.findById(payments[0].invoice_id);
    if (!firstInvoice) {
      throw new Error(`Hóa đơn với ID ${payments[0].invoice_id} không tồn tại.`);
    }
    const customerId = firstInvoice.customer_id;

    for (const payment of payments) {
      // 1. Lấy thông tin hóa đơn để kiểm tra
      const invoice = await InvoiceModel.findById(payment.invoice_id);
      if (!invoice) {
        throw new Error(`Hóa đơn với ID ${payment.invoice_id} không tồn tại.`);
      }
      if (invoice.customer_id !== customerId) {
        throw new Error("Tất cả các hóa đơn phải thuộc về cùng một khách hàng.");
      }
      if (invoice.status === 'paid') {
        console.warn(`Hóa đơn ${invoice.invoice_code} đã được thanh toán đủ. Bỏ qua.`);
        continue;
      }
      if (payment.amount <= 0) {
        console.warn(`Số tiền thanh toán cho hóa đơn ${invoice.invoice_code} không hợp lệ. Bỏ qua.`);
        continue;
      }

      // 2. Tạo giao dịch với method chung
      const transactionData = {
        transaction_code: `TRX-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        type: "receipt",
        amount: payment.amount,
        description: `Thanh toán cho hóa đơn ${invoice.invoice_code}`,
        category: "sale_payment",
        payment_method: method, // Sử dụng method chung
        customer_id: invoice.customer_id,
        related_type: "invoice",
        related_id: invoice.invoice_id,
        initiated_by: initiatedByUserId,
      };
      await TransactionModel.createTransaction(transactionData);

      // 3. Cập nhật hóa đơn
      await InvoiceModel.updateAmountPaidAndStatus(invoice.invoice_id, payment.amount);
    }

    // 4. Cập nhật lại debt một lần duy nhất
    if (customerId) {
      const newDebt = await CustomerModel.calculateDebt(customerId);
      await CustomerModel.update(customerId, { debt: newDebt });
      return { customer_id: customerId, new_debt: newDebt, message: "Thanh toán hàng loạt và cập nhật công nợ thành công." };
    }
    
    return { message: "Thanh toán hàng loạt thành công." };
  },
};

module.exports = InvoiceService; // Đảm bảo bạn xuất InvoiceService
