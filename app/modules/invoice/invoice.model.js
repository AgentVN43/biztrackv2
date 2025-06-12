// invoice.model.js
const db = require("../../config/db.config");
const { v4: uuidv4 } = require("uuid");

const Invoice = {
  create: async (data) => {
    const invoice_id = uuidv4();
    const {
      invoice_code,
      invoice_type,
      order_id,
      customer_id,
      supplier_id,
      total_amount,
      tax_amount,
      discount_amount,
      final_amount,
      issued_date,
      due_date,
      note,
      amount_paid = 0.0,
    } = data;

    // ✅ Logic xác định trạng thái ban đầu của hóa đơn dựa trên amount_paid và final_amount
    let status;
    if (final_amount <= 0) {
      // Trường hợp tổng tiền là 0 hoặc âm (hoàn trả)
      status = "paid"; // Coi như đã thanh toán
    } else if (amount_paid >= final_amount) {
      status = "paid"; // Đã thanh toán đủ
    } else if (amount_paid > 0) {
      status = "partial_paid"; // Thanh toán một phần
    } else {
      status = "pending"; // Chưa thanh toán (hoặc 'pending' theo đề xuất của bạn)
    }

    const query = `
            INSERT INTO invoices (
                invoice_id, invoice_code, invoice_type, order_id,
                customer_id, supplier_id, total_amount, tax_amount,
                discount_amount, final_amount, issued_date, due_date,
                status, note, amount_paid
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

    const values = [
      invoice_id,
      invoice_code,
      invoice_type,
      order_id,
      customer_id,
      supplier_id,
      total_amount,
      tax_amount,
      discount_amount,
      final_amount,
      issued_date,
      due_date,
      status,
      note,
      amount_paid,
    ];

    try {
      console.log("🚀 ~ invoice.model.js: create - SQL Query:", query);
      console.log("🚀 ~ invoice.model.js: create - SQL Values:", values);
      await db.promise().query(query, values);
      const invoiceResult = { invoice_id, ...data, status, amount_paid };
      console.log(
        "🚀 ~ invoice.model.js: create - Invoice created successfully:",
        invoiceResult
      );
      return invoiceResult;
    } catch (error) {
      console.error(
        "🚀 ~ invoice.model.js: create - Error creating invoice:",
        error
      );
      throw error;
    }
  },

  updateAmountPaidAndStatus: async (invoice_id, paymentAmount) => {
    try {
      // 1. Lấy thông tin hóa đơn hiện tại
      const [invoiceRows] = await db
        .promise()
        .query(
          "SELECT final_amount, amount_paid FROM invoices WHERE invoice_id = ?",
          [invoice_id]
        );
      if (invoiceRows.length === 0) {
        throw new Error("Invoice not found.");
      }
      const currentInvoice = invoiceRows[0];
      const newAmountPaid =
        parseFloat(currentInvoice.amount_paid) + parseFloat(paymentAmount);
      let newStatus = currentInvoice.status;

      // 2. Xác định trạng thái mới
      if (newAmountPaid >= currentInvoice.final_amount) {
        newStatus = "paid"; // Đã thanh toán đủ
      } else if (newAmountPaid > 0) {
        newStatus = "partial_paid"; // Thanh toán một phần
      } else {
        newStatus = "pending"; // Chưa thanh toán
      }

      // 3. Cập nhật hóa đơn
      const sql = `
        UPDATE invoices
        SET amount_paid = ?, status = ?, updated_at = CURRENT_TIMESTAMP
        WHERE invoice_id = ?
      `;
      const [result] = await db
        .promise()
        .query(sql, [newAmountPaid, newStatus, invoice_id]);

      if (result.affectedRows === 0) {
        return null; // Invoice not found for update
      }
      return { invoice_id, amount_paid: newAmountPaid, status: newStatus };
    } catch (error) {
      console.error(
        "🚀 ~ InvoiceModel: updateAmountPaidAndStatus - Lỗi khi cập nhật amount_paid và status:",
        error
      );
      throw error;
    }
  },

  updateByInvoiceCode: async (invoice_code, data) => {
    // Initialize an array to hold the fields to update and their values
    const updates = [];
    const values = [];

    // Check which fields are provided in the data object
    if (data.invoice_type) {
      updates.push("invoice_type = ?");
      values.push(data.invoice_type);
    }
    if (data.order_id) {
      updates.push("order_id = ?");
      values.push(data.order_id);
    }
    if (data.customer_id) {
      updates.push("customer_id = ?");
      values.push(data.customer_id);
    }
    if (data.supplier_id) {
      updates.push("supplier_id = ?");
      values.push(data.supplier_id);
    }
    if (data.total_amount) {
      updates.push("total_amount = ?");
      values.push(data.total_amount);
    }
    if (data.tax_amount) {
      updates.push("tax_amount = ?");
      values.push(data.tax_amount);
    }
    if (data.discount_amount) {
      updates.push("discount_amount = ?");
      values.push(data.discount_amount);
    }
    if (data.final_amount) {
      updates.push("final_amount = ?");
      values.push(data.final_amount);
    }
    if (data.issued_date) {
      updates.push("issued_date = ?");
      values.push(data.issued_date);
    }
    if (data.due_date) {
      updates.push("due_date = ?");
      values.push(data.due_date);
    }
    if (data.status) {
      updates.push("status = ?");
      values.push(data.status);
    }
    if (data.note) {
      updates.push("note = ?");
      values.push(data.note);
    }

    // If no fields are provided, throw an error
    if (updates.length === 0) {
      throw new Error("No fields to update");
    }

    // Build the SQL query
    const query = `
    UPDATE invoices SET
      ${updates.join(", ")}
    WHERE invoice_code = ?
  `;

    // Add the invoice_code to the values array
    values.push(invoice_code);

    try {
      const [results] = await db.promise().query(query, values);
      if (results.affectedRows === 0) {
        throw new Error("Invoice not found or no changes made");
      }
      return { invoice_code, ...data }; // Return the updated invoice data
    } catch (error) {
      console.error(
        "🚀 ~ invoice.model.js: updateByInvoiceCode - Error updating invoice:",
        error
      );
      throw error;
    }
  },

  getAll: async () => {
    const query = "SELECT * FROM invoices";
    try {
      const [results] = await db.promise().query(query);
      return results;
    } catch (error) {
      console.error(
        "🚀 ~ invoice.model.js: getAll - Error fetching invoices:",
        error
      );
      throw error;
    }
  },

  getPaid: async () => {
    const query = "SELECT * FROM invoices WHERE status='paid'";
    try {
      const [results] = await db.promise().query(query);
      return results;
    } catch (error) {
      console.error(
        "🚀 ~ invoice.model.js: getAll - Error fetching invoices:",
        error
      );
      throw error;
    }
  },

  getUnPaid: async () => {
    const query = "SELECT * FROM invoices WHERE status != 'paid'";
    try {
      const [results] = await db.promise().query(query);
      return results;
    } catch (error) {
      console.error(
        "🚀 ~ invoice.model.js: getAll - Error fetching invoices:",
        error
      );
      throw error;
    }
  },

  getByInvoiceCode: async (invoice_code) => {
    const query = "SELECT * FROM invoices WHERE invoice_code = ?";

    try {
      const [results] = await db.promise().query(query, [invoice_code]);
      if (results.length === 0) {
        throw new Error("Invoice not found");
      }
      return results[0]; // Return the first matching invoice
    } catch (error) {
      console.error(
        "🚀 ~ invoice.model.js: getByInvoiceCode - Error fetching invoice:",
        error
      );
      throw error;
    }
  },

  findById: async (invoice_id) => {
    const query = "SELECT * FROM invoices WHERE invoice_id = ?";

    try {
      const [results] = await db.promise().query(query, [invoice_id]);
      if (results.length === 0) {
        throw new Error("Invoice not found");
      }
      return results[0]; // Return the first matching invoice
    } catch (error) {
      console.error(
        "🚀 ~ invoice.model.js: getByInvoiceId - Error fetching invoice:",
        error
      );
      throw error;
    }
  },
};

module.exports = Invoice;
