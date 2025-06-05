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

module.exports = {
  getAllInvoices,
  createInvoice,
  updateInvoice,
  deleteInvoice,
  getPaidInvoices,
  getUnPaidInvoices,
  getInvoiceByInvoiceCode,
};
