const createResponse = require("../../utils/response");
const InvoiceService = require("./invoice.service");

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
    const invoices = await InvoiceService.getUnPaid();
    return res.status(200).json(invoices);
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

module.exports = {
  getAllInvoices,
  createInvoice,
  updateInvoice,
  deleteInvoice,
  getPaidInvoices,
  getUnPaidInvoices,
  getInvoiceByInvoiceCode,
  recordInvoicePayment,
};
