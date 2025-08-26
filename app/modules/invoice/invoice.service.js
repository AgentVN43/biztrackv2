const InvoiceModel = require("./invoice.model"); // Đảm bảo đường dẫn đúng tới invoice.model
const SupplierModel = require("../suppliers/supplier.model");
const { generateTransactionCode } = require('../../utils/transactionUtils');
const TransactionService = require("../transactions/transaction.service");
const CustomerModel = require("../customers/customer.model");

// ✅ Hàm tự động đồng bộ debt cho customer
const autoSyncCustomerDebt = async (customer_id) => {
  try {
    if (!customer_id) return;
    
    //console.log(`🔄 Tự động đồng bộ debt cho customer ${customer_id}...`);
    
    const CustomerModel = require('../customers/customer.model');
    await CustomerModel.updateDebt(customer_id, 0, true);
    
    //console.log(`✅ Đã tự động đồng bộ debt cho customer ${customer_id}`);
  } catch (error) {
    //console.error(`❌ Lỗi khi tự động đồng bộ debt cho customer ${customer_id}:`, error);
    // Không throw error để không ảnh hưởng đến workflow chính
  }
};

// ✅ Hàm tự động đồng bộ payable cho supplier
const autoSyncSupplierPayable = async (supplier_id) => {
  try {
    if (!supplier_id) {
      console.log(`❌ autoSyncSupplierPayable: supplier_id is null or undefined.`);
      return;
    }
    
    console.log(`🔄 autoSyncSupplierPayable: Bắt đầu đồng bộ payable cho supplier ${supplier_id}...`);
    
    const SupplierModel = require('../suppliers/supplier.model');
    await SupplierModel.recalculatePayable(supplier_id);
    
    console.log(`✅ autoSyncSupplierPayable: Đã tự động đồng bộ payable cho supplier ${supplier_id}`);
  } catch (error) {
    console.error(`❌ Lỗi khi tự động đồng bộ payable cho supplier ${supplier_id}:`, error);
    // Không throw error để không ảnh hưởng đến workflow chính
  }
};

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
      
      // Chỉ tạo transaction cho amount_paid nếu có flag fromOrderHoanTat (chỉ khi hoàn tất đơn hàng)
      if (data.fromOrderHoanTat && data.order_id && parseFloat(data.amount_paid || 0) > 0) {
        const OrderModel = require('../orders/order.model');
        const order = await OrderModel.readById(data.order_id);
        if (order && parseFloat(order.amount_paid || 0) > 0) {
          await TransactionService.createTransaction({
            transaction_code: generateTransactionCode(),
            order_id: data.order_id,
            invoice_id: invoice.invoice_id,
            customer_id: data.customer_id,
            type: 'receipt',
            amount: parseFloat(order.amount_paid),
            status: 'completed',
            note: `Thanh toán trước chuyển thành thanh toán hóa đơn ${invoice.invoice_code}`,
            created_by: data.created_by || null,
          });
          //console.log(`🚀 ~ InvoiceService: create - Đã tạo transaction cho amount_paid của order: ${order.amount_paid}`);
        }
      }
      
      // Nếu là hóa đơn liên quan NCC thì cập nhật payable
      if (invoice && invoice.supplier_id) {
        await SupplierModel.recalculatePayable(invoice.supplier_id);
      }
      
      // ✅ Tự động đồng bộ debt cho customer (nếu có)
      if (invoice && invoice.customer_id) {
        await autoSyncCustomerDebt(invoice.customer_id);
      }

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
      //console.error(
      //   "🚀 ~ invoice.service.js: getAll - Error fetching invoices:",
      //   error
      // );
      throw error; // or handle it in another way
    }
  },

  getPaid: async () => {
    try {
      const results = await InvoiceModel.getPaid();
      return results;
    } catch (error) {
      // Handle the error as needed, e.g., log it or rethrow it
      //console.error(
      //   "🚀 ~ invoice.service.js: getAll - Error fetching invoices:",
      //   error
      // );
      throw error; // or handle it in another way
    }
  },

  getUnPaid: async () => {
    try {
      const results = await InvoiceModel.getUnPaid();
      return results;
    } catch (error) {
      // Handle the error as needed, e.g., log it or rethrow it
      //console.error(
      //   "🚀 ~ invoice.service.js: getAll - Error fetching invoices:",
      //   error
      // );
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
        transaction_code: `TT-${Date.now()}-${Math.floor(
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
      const newTransaction = await TransactionService.createTransaction(
        transactionData
      );
      //console.log(
      //   `🚀 ~ InvoiceService: recordPayment - Giao dịch thanh toán mới đã tạo:`,
      //   newTransaction
      // );

      // 3. Cập nhật số tiền đã thanh toán và trạng thái của hóa đơn bằng hàm Model
      const updatedInvoice = await InvoiceModel.updateAmountPaidAndStatus(
        invoice_id,
        paymentAmount
      );

      // Cập nhật payable NCC nếu là hóa đơn mua
      if (invoice.supplier_id) {
        try {
          await autoSyncSupplierPayable(invoice.supplier_id); // ✅ Gọi hàm tự động đồng bộ payable
        } catch (syncError) {
          console.error(`❌ Lỗi khi đồng bộ payable cho supplier ${invoice.supplier_id} trong recordPayment:`, syncError);
          // Có thể quyết định re-throw hoặc chỉ log tùy mức độ nghiêm trọng
        }
      }

      // 4. CẬP NHẬT LẠI DEBT CHO KHÁCH HÀNG
      if (invoice.customer_id) {
        await CustomerModel.updateDebt(invoice.customer_id, 0, true);
        const newDebt = await CustomerModel.calculateDebtFromLedger(invoice.customer_id);
        await CustomerModel.update(invoice.customer_id, { debt: newDebt });
        //console.log(`🚀 ~ InvoiceService: recordPayment - Đã cập nhật debt mới cho khách hàng ${invoice.customer_id} (ledger) là: ${newDebt}`);
      }

      //console.log(
      //   `🚀 ~ InvoiceService: recordPayment - Hóa đơn đã cập nhật:`,
      //   updatedInvoice
      // );

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
      //console.error("🚀 ~ InvoiceService: getSupplierPayables - Error:", error);
      throw error;
    }
  },

  findByOrderId: async (order_id) => {
    return await InvoiceModel.findByOrderId(order_id);
  },

  recordBulkPayment: async (payments, method, initiatedByUserId = null) => {
    // Lấy thông tin hóa đơn từ payment đầu tiên để xác định ngữ cảnh (customer hay supplier)
    const firstInvoice = await InvoiceModel.findById(payments[0].invoice_id);
    if (!firstInvoice) {
      throw new Error(`Hóa đơn với ID ${payments[0].invoice_id} không tồn tại.`);
    }

    const isSupplierFlow = !!firstInvoice.supplier_id;
    const supplierId = firstInvoice.supplier_id || null;
    const customerId = firstInvoice.customer_id || null;

    for (const payment of payments) {
      // 1. Lấy thông tin hóa đơn để kiểm tra
      const invoice = await InvoiceModel.findById(payment.invoice_id);
      if (!invoice) {
        throw new Error(`Hóa đơn với ID ${payment.invoice_id} không tồn tại.`);
      }

      // Đảm bảo tất cả invoices thuộc cùng một đối tượng
      if (isSupplierFlow) {
        if (invoice.supplier_id !== supplierId) {
          throw new Error("Tất cả các hóa đơn phải thuộc về cùng một nhà cung cấp.");
        }
      } else {
        if (invoice.customer_id !== customerId) {
          throw new Error("Tất cả các hóa đơn phải thuộc về cùng một khách hàng.");
        }
      }

      if (invoice.status === 'paid') {
        //console.warn(`Hóa đơn ${invoice.invoice_code} đã được thanh toán đủ. Bỏ qua.`);
        continue;
      }
      if (payment.amount <= 0) {
        //console.warn(`Số tiền thanh toán cho hóa đơn ${invoice.invoice_code} không hợp lệ. Bỏ qua.`);
        continue;
      }

      // 2. Tạo giao dịch với method chung
      const transactionData = {
        transaction_code: `TT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        type: isSupplierFlow ? 'payment' : (invoice.invoice_type === 'purchase_invoice' ? 'payment' : 'receipt'),
        amount: payment.amount,
        description: `Tạo giao dịch cho hóa đơn ${invoice.invoice_code}`,
        category: isSupplierFlow ? 'purchase_payment' : (invoice.invoice_type === 'purchase_invoice' ? 'purchase_payment' : 'sale_payment'),
        payment_method: method,
        customer_id: isSupplierFlow ? null : invoice.customer_id,
        supplier_id: isSupplierFlow ? invoice.supplier_id : null,
        order_id: invoice.order_id,
        related_type: "invoice",
        related_id: invoice.invoice_id,
        initiated_by: initiatedByUserId,
      };
      await TransactionService.createTransaction(transactionData);

      // 3. Cập nhật hóa đơn
      await InvoiceModel.updateAmountPaidAndStatus(invoice.invoice_id, payment.amount);
    }

    // 4. Đồng bộ công nợ sau khi thanh toán
    if (!isSupplierFlow && customerId) {
      // ✅ Khách hàng: sử dụng autoSync debt
      await autoSyncCustomerDebt(customerId);
      const CustomerModel = require('../customers/customer.model');
      const updatedCustomer = await CustomerModel.getById(customerId);
      return { 
        customer_id: customerId, 
        new_debt: updatedCustomer.debt, 
        message: "Thanh toán hàng loạt và cập nhật công nợ khách hàng thành công." 
      };
    }

    if (isSupplierFlow && supplierId) {
      try {
        await autoSyncSupplierPayable(supplierId);
      } catch (syncError) {
        console.error(`❌ Lỗi khi đồng bộ payable cho supplier ${supplierId} trong recordBulkPayment:`, syncError);
      }
      const SupplierModel = require('../suppliers/supplier.model');
      const updatedSupplier = await SupplierModel.findById(supplierId);
      return {
        supplier_id: supplierId,
        new_payable: updatedSupplier?.payable,
        message: "Thanh toán hàng loạt và cập nhật công nợ nhà cung cấp thành công."
      };
    }

    return { message: "Thanh toán hàng loạt thành công." };
  },

  /**
   * Lấy tất cả thanh toán một cách rõ ràng và không trùng lặp
   * @param {string} customer_id - ID khách hàng (optional)
   * @returns {Promise<Array<Object>>} Danh sách thanh toán
   */
  getAllPayments: async (customer_id = null) => {
    try {
      // 1. Lấy tất cả hóa đơn
      const invoices = customer_id
        ? await InvoiceModel.getAllByCustomerId(customer_id)
        : await InvoiceModel.getAll();

      // 2. Lấy tất cả transaction
      const transactions = customer_id
        ? await TransactionService.getTransactionsByCustomerId(customer_id)
        : await TransactionService.getAll();

      // 3. Tạo danh sách thanh toán không trùng lặp
      const payments = [];

      // Xử lý từng hóa đơn
      for (const invoice of invoices) {
        const invoiceTransactions = transactions.filter(trx =>
          trx.related_type === 'invoice' && trx.related_id === invoice.invoice_id
        );

        // Nếu có amount_paid từ hóa đơn và chưa có transaction thực tế
        if (parseFloat(invoice.amount_paid) > 0) {
          const totalTransactionAmount = invoiceTransactions.reduce((sum, trx) =>
            sum + parseFloat(trx.amount), 0
          );

          // Nếu amount_paid > totalTransactionAmount, có nghĩa là có thanh toán ban đầu
          if (parseFloat(invoice.amount_paid) > totalTransactionAmount) {
            const advanceAmount = parseFloat(invoice.amount_paid) - totalTransactionAmount;
            payments.push({
              payment_id: `ADVANCE-${invoice.invoice_id}`,
              invoice_id: invoice.invoice_id,
              invoice_code: invoice.invoice_code,
              order_id: invoice.order_id,
              customer_id: invoice.customer_id,
              amount: advanceAmount,
              payment_method: 'Thanh toán ban đầu',
              payment_date: invoice.issued_date,
              description: `Thanh toán ban đầu cho hóa đơn ${invoice.invoice_code}`,
              type: 'receipt',
              is_manual: false
            });
          }
        }

        // Thêm các transaction thực tế
        invoiceTransactions.forEach(trx => {
          payments.push({
            payment_id: trx.transaction_id,
            invoice_id: invoice.invoice_id,
            invoice_code: invoice.invoice_code,
            order_id: invoice.order_id,
            customer_id: invoice.customer_id,
            amount: parseFloat(trx.amount),
            payment_method: trx.payment_method || 'Không xác định',
            payment_date: trx.created_at,
            description: trx.description,
            type: 'manual_payment',
            is_manual: true
          });
        });
      }

      // Sắp xếp theo thời gian (mới nhất trước)
      payments.sort((a, b) => new Date(b.payment_date) - new Date(a.payment_date));

      return payments;
    } catch (error) {
      //console.error("🚀 ~ InvoiceService: getAllPayments - Lỗi:", error);
      throw error;
    }
  },
};

module.exports = InvoiceService; // Đảm bảo bạn xuất InvoiceService
