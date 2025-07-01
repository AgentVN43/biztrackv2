// invoice.model.js
const db = require("../../config/db.config");
const { v4: uuidv4 } = require("uuid");

const Invoice = {
  // create: async (data) => {
  //   const invoice_id = uuidv4();
  //   const {
  //     invoice_code,
  //     invoice_type,
  //     order_id,
  //     customer_id,
  //     supplier_id,
  //     total_amount,
  //     tax_amount,
  //     discount_amount,
  //     final_amount,
  //     issued_date,
  //     due_date,
  //     note,
  //     amount_paid = 0.0,
  //   } = data;

  //   // ✅ Logic xác định trạng thái ban đầu của hóa đơn dựa trên amount_paid và final_amount
  //   let status;
  //   if (final_amount <= 0) {
  //     // Trường hợp tổng tiền là 0 hoặc âm (hoàn trả)
  //     status = "paid"; // Coi như đã thanh toán
  //   } else if (amount_paid >= final_amount) {
  //     status = "paid"; // Đã thanh toán đủ
  //   } else if (amount_paid > 0) {
  //     status = "partial_paid"; // Thanh toán một phần
  //   } else {
  //     status = "pending"; // Chưa thanh toán (hoặc 'pending' theo đề xuất của bạn)
  //   }

  //   const query = `
  //           INSERT INTO invoices (
  //               invoice_id, invoice_code, invoice_type, order_id,
  //               customer_id, supplier_id, total_amount, tax_amount,
  //               discount_amount, final_amount, issued_date, due_date,
  //               status, note, amount_paid
  //           ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  //       `;

  //   const values = [
  //     invoice_id,
  //     invoice_code,
  //     invoice_type,
  //     order_id,
  //     customer_id,
  //     supplier_id,
  //     total_amount,
  //     tax_amount,
  //     discount_amount,
  //     final_amount,
  //     issued_date,
  //     due_date,
  //     status,
  //     note,
  //     amount_paid,
  //   ];

  //   try {
  //     console.log("🚀 ~ invoice.model.js: create - SQL Query:", query);
  //     console.log("🚀 ~ invoice.model.js: create - SQL Values:", values);
  //     await db.promise().query(query, values);
  //     const invoiceResult = { invoice_id, ...data, status, amount_paid };
  //     console.log(
  //       "🚀 ~ invoice.model.js: create - Invoice created successfully:",
  //       invoiceResult
  //     );
  //     return invoiceResult;
  //   } catch (error) {
  //     console.error(
  //       "🚀 ~ invoice.model.js: create - Error creating invoice:",
  //       error
  //     );
  //     throw error;
  //   }
  // },

  create: async (invoiceData) => {
    const invoice_id = uuidv4();
    const {
      invoice_code,
      invoice_type,
      total_amount,
      tax_amount,
      discount_amount,
      final_amount,
      issued_date,
      due_date,
      note,
      amount_paid = 0.0, // ✅ Lấy amount_paid từ invoiceData, mặc định là 0.00
    } = invoiceData;

    let invoice_order_id = null;
    let invoice_customer_id = null;
    let invoice_supplier_id = null;

    if (invoice_type === "sale_invoice") {
      invoice_order_id = invoiceData.order_id;
      invoice_customer_id = invoiceData.customer_id;
    } else if (invoice_type === "purchase_invoice") {
      invoice_order_id = invoiceData.po_id_for_invoice_flow;
      invoice_supplier_id = invoiceData.supplier_id;
    }

    let status;
    if (parseFloat(final_amount) <= 0) {
      status = "paid";
    } else if (parseFloat(amount_paid) >= parseFloat(final_amount)) {
      // ✅ Sử dụng amount_paid từ invoiceData
      status = "paid";
    } else if (parseFloat(amount_paid) > 0) {
      // ✅ Sử dụng amount_paid từ invoiceData
      status = "partial_paid";
    } else {
      status = "pending";
    }

    const query = `
      INSERT INTO invoices (
        invoice_id, invoice_code, invoice_type, order_id, customer_id, supplier_id,
        total_amount, tax_amount, discount_amount, final_amount,
        issued_date, due_date, status, note, amount_paid
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const values = [
      invoice_id,
      invoice_code,
      invoice_type,
      invoice_order_id,
      invoice_customer_id,
      invoice_supplier_id,
      total_amount,
      tax_amount,
      discount_amount,
      final_amount,
      issued_date,
      due_date,
      status,
      note,
      amount_paid, // ✅ Sử dụng amount_paid từ invoiceData
    ];

    try {
      console.log("🚀 ~ InvoiceModel: create - SQL Query:", query);
      console.log("🚀 ~ InvoiceModel: create - SQL Values:", values);
      await db.promise().query(query, values);
      // Trả về invoiceData gốc, và các giá trị đã tính toán/khởi tạo
      return { invoice_id, ...invoiceData, status, amount_paid };
    } catch (error) {
      console.error("🚀 ~ InvoiceModel: create - Lỗi khi tạo hóa đơn:", error);
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

  findByOrderId: async (order_id) => {
    const query = "SELECT * FROM invoices WHERE order_id = ?";
    try {
      const [rows] = await db.promise().query(query, [order_id]);
      return rows.length ? rows[0] : null;
    } catch (error) {
      console.error(
        "🚀 ~ InvoiceModel: findByOrderId - Lỗi khi tìm hóa đơn theo Order ID:",
        error
      );
      throw error;
    }
  },

  getDebtSupplier: async (supplier_id) => {
    const sql = `
      SELECT
        i.invoice_id,
        i.order_id,
        i.invoice_code,
        i.final_amount,
        i.amount_paid,
        (i.final_amount - i.amount_paid) AS remaining_payable,
        i.status,
        i.issued_date,
        i.due_date,
        po.po_id,
        po.total_amount AS po_total_amount,
        po.status AS po_status,
        s.supplier_name
      FROM invoices i
      LEFT JOIN purchase_orders po ON i.order_id = po.po_id
      LEFT JOIN suppliers s ON i.supplier_id = s.supplier_id
      WHERE i.supplier_id = ?
        AND i.invoice_type = 'purchase_invoice'
        AND i.status IN ('pending', 'partial_paid', 'overdue')
      ORDER BY i.due_date ASC, i.issued_date DESC;
    `;
    try {
      const [rows] = await db.promise().query(sql, [supplier_id]);
      return rows.map((row) => ({
        ...row,
        final_amount: parseFloat(row.final_amount),
        amount_paid: parseFloat(row.amount_paid),
        remaining_payable: parseFloat(row.remaining_payable),
        po_total_amount: parseFloat(row.po_total_amount),
      }));
    } catch (error) {
      console.error(
        "🚀 ~ InvoiceModel: getUnpaidOrPartiallyPaidPurchaseInvoicesBySupplierId - Error:",
        error
      );
      throw error;
    }
  },

  /**
   * Lấy tổng công nợ phải trả cho một nhà cung cấp.
   * Tính tổng (final_amount - amount_paid) từ các hóa đơn mua hàng chưa thanh toán đủ.
   * @param {string} supplier_id - ID của nhà cung cấp.
   * @returns {Promise<number>} Tổng số tiền công nợ phải trả.
   */
  getTotalPayablesBySupplierId: async (supplier_id) => {
    const sql = `
      SELECT
        COALESCE(SUM(i.final_amount - i.amount_paid), 0) AS total_payables
      FROM invoices i
      WHERE i.supplier_id = ?
        AND i.invoice_type = 'purchase_invoice'
        AND i.status IN ('pending', 'partial_paid', 'overdue');
    `;
    try {
      const [rows] = await db.promise().query(sql, [supplier_id]);
      return parseFloat(rows[0].total_payables || 0);
    } catch (error) {
      console.error(
        "🚀 ~ InvoiceModel: getTotalPayablesBySupplierId - Error:",
        error
      );
      throw error;
    }
  },

  /**
   * Lấy tất cả hóa đơn (sale_invoice, refund_invoice, credit_note, debit_note)
   * của một khách hàng cụ thể.
   * @param {string} customer_id - ID của khách hàng.
   * @returns {Promise<Array<Object>>} Mảng các hóa đơn.
   */
  getAllByCustomerId: async (customer_id) => {
    const query = `
      SELECT * FROM invoices
      WHERE customer_id = ?
      AND invoice_type IN ('sale_invoice', 'refund_invoice', 'credit_note', 'debit_note')
      ORDER BY issued_date DESC;
    `;
    try {
      const [rows] = await db.promise().query(query, [customer_id]);
      return rows;
    } catch (error) {
      console.error(
        "🚀 ~ InvoiceModel: getAllByCustomerId - Lỗi khi lấy hóa đơn theo Customer ID:",
        error
      );
      throw error;
    }
  },

  /**
   * Cập nhật trạng thái của hóa đơn.
   * @param {string} invoice_id - ID của hóa đơn.
   * @param {string} status - Trạng thái mới.
   * @returns {Promise<Object>} Kết quả cập nhật.
   */
  updateStatus: async (invoice_id, status) => {
    const sql = `
      UPDATE invoices
      SET status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE invoice_id = ?
    `;
    try {
      const [result] = await db.promise().query(sql, [status, invoice_id]);
      if (result.affectedRows === 0) {
        throw new Error("Invoice not found for status update");
      }
      return { invoice_id, status, updated_at: new Date() };
    } catch (error) {
      console.error(
        "🚀 ~ InvoiceModel: updateStatus - Lỗi khi cập nhật trạng thái hóa đơn:",
        error
      );
      throw error;
    }
  },
};

module.exports = Invoice;
