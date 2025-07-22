const { createResponse } = require("../../utils/response");
const InvoiceService = require("./invoice.service");
const CustomerModel = require("../customers/customer.model");
const { paginateResponse } = require("../../utils/pagination");

const getAllInvoices = async (req, res) => {
  try {
    const invoices = await InvoiceService.getAll();
    return res.status(200).json(invoices);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const getPaidInvoices = async (req, res) => {
  try {
    const invoices = await InvoiceService.getPaid();
    return res.status(200).json(invoices);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const getUnPaidInvoices = async (req, res) => {
  try {
    // 1. Lấy params phân trang
    const page = parseInt(req.query.page) > 0 ? parseInt(req.query.page) : 1;
    const limit = parseInt(req.query.limit) > 0 ? parseInt(req.query.limit) : 10;
    const offset = (page - 1) * limit;

    // 2. Lấy tất cả hóa đơn chưa thanh toán
    const allInvoices = await InvoiceService.getUnPaid();
    const sortedInvoices = allInvoices.sort((a, b) => new Date(b.issued_date) - new Date(a.issued_date));
    const total = sortedInvoices.length;
    const paginatedInvoices = sortedInvoices.slice(offset, offset + limit);

    // 3. Lấy thông tin khách hàng cho từng hóa đơn (song song)
    const customerIds = [...new Set(paginatedInvoices.map(inv => inv.customer_id).filter(Boolean))];
    const customerMap = {};
    await Promise.all(customerIds.map(async (cid) => {
      const customer = await CustomerModel.getById(cid);
      if (customer) {
        customerMap[cid] = {
          customer_id: customer.customer_id,
          customer_name: customer.customer_name,
          email: customer.email,
          phone: customer.phone,
          debt: customer.debt
        };
      }
    }));

    // 4. Thay thế customer_id bằng object customer
    const invoicesWithCustomer = paginatedInvoices.map(inv => {
      const { customer_id, ...rest } = inv;
      return {
        ...rest,
        customer: customerMap[customer_id] || null
      };
    });

    // 5. Trả về response phân trang
    return res.json(paginateResponse(invoicesWithCustomer, total, page, limit));
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const getInvoiceByInvoiceCode = async (req, res) => {
  const { invoice_code } = req.params;

  try {
    const invoice = await InvoiceService.getByInvoiceCode(invoice_code);
    if (!invoice)
      return res.status(404).json({ message: "Không tìm thấy hóa đơn" });

    return res.status(200).json(invoice);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const createInvoice = async (req, res) => {
  const data = req.body;

  try {
    const newInvoice = await InvoiceService.create(data);
    return res.status(201).json(newInvoice);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const updateInvoice = async (req, res) => {
  const { invoice_code } = req.params; // Change from id to invoice_code
  const data = req.body;

  try {
    const updated = await InvoiceService.updateByInvoiceCode(
      invoice_code,
      data
    ); // Update service call
    if (!updated)
      return res.status(404).json({ message: "Không tìm thấy hóa đơn" });

    return res.status(200).json(updated);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const deleteInvoice = async (req, res) => {
  const { id } = req.params;

  try {
    const deleted = await InvoiceService.delete(id);
    if (!deleted)
      return res.status(404).json({ message: "Không tìm thấy hóa đơn" });

    return res.status(200).json({ message: "Xóa hóa đơn thành công" });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

/**
 * Xử lý yêu cầu POST để ghi nhận một khoản thanh toán mới cho hóa đơn.
 * Đây là API endpoint cho các lần thanh toán tiếp theo của hóa đơn.
 *
 * POST /api/invoices/:id/payments
 * Body: { "amount": 100000, "method": "Tiền mặt" }
 *
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 * @param {function} next - Express next middleware function.
 */
const recordInvoicePayment = async (req, res, next) => {
  const invoice_id = req.params.id; // Lấy ID hóa đơn từ URL params
  const { amount, method } = req.body; // Lấy số tiền và phương thức thanh toán từ request body
  const initiatedByUserId = req.user ? req.user.user_id : null; // Lấy ID người dùng từ đối tượng req.user (nếu có middleware xác thực)

  console.log(
    `🚀 ~ invoice.controller.js: recordInvoicePayment - Nhận yêu cầu thanh toán cho hóa đơn ${invoice_id}`
  );
  console.log(`🚀 ~ Số tiền: ${amount}, Phương thức: ${method}`);

  // Xác thực dữ liệu đầu vào cơ bản
  if (!amount || typeof amount !== "number" || amount <= 0) {
    return createResponse(
      res,
      400,
      false,
      null,
      "Số tiền thanh toán không hợp lệ. Phải là số dương."
    );
  }
  if (!method || typeof method !== "string" || method.trim() === "") {
    return createResponse(
      res,
      400,
      false,
      null,
      "Phương thức thanh toán là bắt buộc."
    );
  }

  try {
    // Gọi InvoiceService để xử lý logic nghiệp vụ ghi nhận thanh toán
    const updatedInvoice = await InvoiceService.recordPayment(
      invoice_id,
      amount,
      method,
      initiatedByUserId
    );

    // Trả về phản hồi thành công với thông tin hóa đơn đã cập nhật
    createResponse(
      res,
      200,
      true,
      updatedInvoice,
      "Thanh toán đã được ghi nhận và hóa đơn cập nhật thành công."
    );
  } catch (error) {
    console.error(
      "🚀 ~ invoice.controller.js: recordInvoicePayment - Lỗi trong quá trình xử lý thanh toán:",
      error
    );
    // Xử lý lỗi cụ thể để trả về thông báo phù hợp cho client
    if (error.message.includes("Hóa đơn không tồn tại")) {
      return createResponse(res, 404, false, null, error.message);
    } else if (
      error.message.includes("Hóa đơn này đã được thanh toán đầy đủ")
    ) {
      return createResponse(res, 400, false, null, error.message);
    }
    // Chuyển các lỗi không xác định khác xuống middleware xử lý lỗi toàn cục
    next(error);
  }
};

const recordBulkPayment = async (req, res, next) => {
  const { payments, method } = req.body;
  const initiatedByUserId = req.user ? req.user.user_id : null;

  if (!Array.isArray(payments) || payments.length === 0) {
    return createResponse(res, 400, false, null, "Request body phải có mảng 'payments' và không được rỗng.");
  }

  if (!method || typeof method !== "string" || method.trim() === "") {
    return createResponse(res, 400, false, null, "Phương thức thanh toán 'method' là bắt buộc.");
  }

  try {
    const result = await InvoiceService.recordBulkPayment(payments, method, initiatedByUserId);
    createResponse(res, 200, true, result, "Thanh toán hàng loạt thành công.");
  } catch (error) {
    console.error("Lỗi trong quá trình thanh toán hàng loạt:", error);
    if (error.message.includes("không cùng một khách hàng")) {
      return createResponse(res, 400, false, null, error.message);
    }
    next(error);
  }
}

/**
 * API hiển thị đầy đủ tất cả các loại thanh toán, bao gồm cả thanh toán thủ công từ routes invoice payments!
 * GET /api/invoices/payments/all
 * Query params: customer_id (optional)
 */
const getAllPayments = async (req, res, next) => {
  const { customer_id } = req.query;

  try {
    const payments = await InvoiceService.getAllPayments(customer_id);
    createResponse(res, 200, true, payments, "Lấy danh sách thanh toán thành công.");
  } catch (error) {
    console.error("Lỗi khi lấy danh sách thanh toán:", error);
    next(error);
  }
};

module.exports = {
  getAllInvoices,
  createInvoice,
  updateInvoice,
  deleteInvoice,
  getPaidInvoices,
  getUnPaidInvoices,
  getInvoiceByInvoiceCode,
  recordInvoicePayment,
  recordBulkPayment,
  getAllPayments,
};
