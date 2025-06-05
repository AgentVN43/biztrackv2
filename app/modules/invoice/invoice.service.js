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
};

module.exports = InvoiceService; // Đảm bảo bạn xuất InvoiceService
