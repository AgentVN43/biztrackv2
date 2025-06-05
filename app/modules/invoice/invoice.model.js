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
      status,
      note,
    } = data;

    const query = `
            INSERT INTO invoices (
                invoice_id, invoice_code, invoice_type, order_id,
                customer_id, supplier_id, total_amount, tax_amount,
                discount_amount, final_amount, issued_date, due_date,
                status, note
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
    ];

    try {
      console.log("🚀 ~ invoice.model.js: create - SQL Query:", query);
      console.log("🚀 ~ invoice.model.js: create - SQL Values:", values);
      const [results] = await db.promise().query(query, values);
      const invoiceResult = { invoice_id, ...data };
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
};

module.exports = Invoice;
