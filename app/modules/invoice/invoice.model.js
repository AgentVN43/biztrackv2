// invoice.model.js
const db = require("../../config/db.config");
const { v4: uuidv4 } = require("uuid");

const Invoice = {
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
          "SELECT final_amount, amount_paid, status FROM invoices WHERE invoice_id = ?",
          [invoice_id]
        );
      if (invoiceRows.length === 0) {
        throw new Error("Invoice not found.");
      }
      const currentInvoice = invoiceRows[0];
      const newAmountPaid =
        parseFloat(currentInvoice.amount_paid || 0) + parseFloat(paymentAmount);

      // 2. Xác định trạng thái mới dựa trên amount_paid và final_amount
      const newStatus = Invoice.calculateStatus(
        newAmountPaid,
        currentInvoice.final_amount
      );

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

      console.log(
        `🚀 ~ InvoiceModel: updateAmountPaidAndStatus - Updated invoice ${invoice_id}: amount_paid=${newAmountPaid}, status=${newStatus}`
      );
      return {
        invoice_id,
        amount_paid: newAmountPaid,
        status: newStatus,
        previous_amount_paid: parseFloat(currentInvoice.amount_paid || 0),
        payment_amount: parseFloat(paymentAmount),
      };
    } catch (error) {
      console.error(
        "🚀 ~ InvoiceModel: updateAmountPaidAndStatus - Lỗi khi cập nhật amount_paid và status:",
        error
      );
      throw error;
    }
  },

  /**
   * Cập nhật chỉ amount_paid mà không thay đổi status
   * @param {string} invoice_id - ID của hóa đơn
   * @param {number} newAmountPaid - Số tiền đã thanh toán mới
   * @returns {Promise<Object>} Kết quả cập nhật
   */
  updateAmountPaid: async (invoice_id, newAmountPaid) => {
    try {
      // 1. Kiểm tra hóa đơn tồn tại
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
      const amountPaid = parseFloat(newAmountPaid || 0);

      // 2. Cập nhật amount_paid
      const sql = `
        UPDATE invoices
        SET amount_paid = ?, updated_at = CURRENT_TIMESTAMP
        WHERE invoice_id = ?
      `;
      const [result] = await db.promise().query(sql, [amountPaid, invoice_id]);

      if (result.affectedRows === 0) {
        return null;
      }

      console.log(
        `🚀 ~ InvoiceModel: updateAmountPaid - Updated invoice ${invoice_id}: amount_paid=${amountPaid}`
      );
      return {
        invoice_id,
        amount_paid: amountPaid,
        previous_amount_paid: parseFloat(currentInvoice.amount_paid || 0),
      };
    } catch (error) {
      console.error(
        "🚀 ~ InvoiceModel: updateAmountPaid - Lỗi khi cập nhật amount_paid:",
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
    if (data.total_amount !== undefined) {
      updates.push("total_amount = ?");
      values.push(data.total_amount);
    }
    if (data.tax_amount !== undefined) {
      updates.push("tax_amount = ?");
      values.push(data.tax_amount);
    }
    if (data.discount_amount !== undefined) {
      updates.push("discount_amount = ?");
      values.push(data.discount_amount);
    }
    if (data.final_amount !== undefined) {
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
    if (data.note !== undefined) {
      updates.push("note = ?");
      values.push(data.note);
    }

    // ✅ Xử lý amount_paid riêng biệt để tránh conflict
    if (data.amount_paid !== undefined) {
      updates.push("amount_paid = ?");
      values.push(parseFloat(data.amount_paid || 0));
    }

    // ✅ Xử lý status riêng biệt
    if (data.status) {
      updates.push("status = ?");
      values.push(data.status);
    }

    // If no fields are provided, throw an error
    if (updates.length === 0) {
      throw new Error("No fields to update");
    }

    // Build the SQL query
    const query = `
    UPDATE invoices SET
      ${updates.join(", ")},
      updated_at = CURRENT_TIMESTAMP
    WHERE invoice_code = ?
  `;

    // Add the invoice_code to the values array
    values.push(invoice_code);

    try {
      const [results] = await db.promise().query(query, values);
      if (results.affectedRows === 0) {
        throw new Error("Invoice not found or no changes made");
      }

      console.log(
        `🚀 ~ InvoiceModel: updateByInvoiceCode - Updated invoice ${invoice_code}:`,
        data
      );
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
    // const query = "SELECT * FROM invoices WHERE status != 'paid' AND invoice_type = 'sale_invoice'";
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
   * Cập nhật trạng thái của hóa đơn và tự động tính toán lại status dựa trên amount_paid.
   * @param {string} invoice_id - ID của hóa đơn.
   * @param {string} status - Trạng thái mới (optional, nếu không cung cấp sẽ tự động tính toán).
   * @param {Object} options - Tùy chọn bổ sung (optional).
   * @param {boolean} options.includeRefund - Có tính đến refund không (default: false).
   * @param {string} options.order_id - ID của order để tính refund (required nếu includeRefund = true).
   * @returns {Promise<Object>} Kết quả cập nhật.
   */
  updateStatus: async (invoice_id, status = null, options = {}) => {
    try {
      // 1. Lấy thông tin hóa đơn hiện tại
      const [invoiceRows] = await db
        .promise()
        .query(
          "SELECT final_amount, amount_paid, status, order_id FROM invoices WHERE invoice_id = ?",
          [invoice_id]
        );
      if (invoiceRows.length === 0) {
        throw new Error("Invoice not found for status update");
      }

      const currentInvoice = invoiceRows[0];
      let newStatus = status;

      // 2. Nếu không cung cấp status, tự động tính toán
      if (!status) {
        if (options.includeRefund && (options.order_id || currentInvoice.order_id)) {
          // Tính toán với refund
          const orderId = options.order_id || currentInvoice.order_id;
          const CustomerReportService = require("../customer_report/customer_report.service");
          const totalRefund = await CustomerReportService.calculateOrderTotalRefund(orderId);
          
          console.log(`🔍 updateStatus with refund for invoice ${invoice_id}:`);
          console.log(`  - Amount paid: ${currentInvoice.amount_paid}`);
          console.log(`  - Final amount: ${currentInvoice.final_amount}`);
          console.log(`  - Total refund: ${totalRefund}`);
          
          newStatus = Invoice.calculateStatusWithRefund(
            currentInvoice.amount_paid,
            currentInvoice.final_amount,
            totalRefund
          );
        } else {
          // Tính toán thông thường
          newStatus = Invoice.calculateStatus(
            currentInvoice.amount_paid,
            currentInvoice.final_amount
          );
        }
      }

      // 3. Cập nhật status
      const sql = `
        UPDATE invoices
        SET status = ?, updated_at = CURRENT_TIMESTAMP
        WHERE invoice_id = ?
      `;
      const [result] = await db.promise().query(sql, [newStatus, invoice_id]);

      if (result.affectedRows === 0) {
        throw new Error("Invoice not found for status update");
      }

      console.log(
        `🚀 ~ InvoiceModel: updateStatus - Updated invoice ${invoice_id}: status=${newStatus}`
      );
      return {
        invoice_id,
        status: newStatus,
        previous_status: currentInvoice.status,
        updated_at: new Date(),
      };
    } catch (error) {
      console.error(
        "🚀 ~ InvoiceModel: updateStatus - Lỗi khi cập nhật trạng thái hóa đơn:",
        error
      );
      throw error;
    }
  },

  /**
   * Helper function để tính toán status dựa trên amount_paid và final_amount
   * @param {number} amount_paid - Số tiền đã thanh toán
   * @param {number} final_amount - Tổng số tiền phải thanh toán
   * @returns {string} Status được tính toán
   */
  calculateStatus: (amount_paid, final_amount) => {
    const paid = parseFloat(amount_paid || 0);
    const total = parseFloat(final_amount || 0);

    if (total <= 0) {
      return "paid"; // Trường hợp hoàn trả hoặc final_amount = 0
    } else if (paid >= total) {
      return "paid"; // Đã thanh toán đủ
    } else if (paid > 0) {
      return "partial_paid"; // Thanh toán một phần
    } else {
      return "pending"; // Chưa thanh toán
    }
  },

  /**
   * Helper function để tính toán status dựa trên amount_paid, final_amount và refund
   * @param {number} amount_paid - Số tiền đã thanh toán
   * @param {number} final_amount - Tổng số tiền phải thanh toán
   * @param {number} total_refund - Tổng số tiền đã hoàn trả
   * @returns {string} Status được tính toán
   */
  calculateStatusWithRefund: (amount_paid, final_amount, total_refund = 0) => {
    const paid = parseFloat(amount_paid || 0);
    const total = parseFloat(final_amount || 0);
    const refund = parseFloat(total_refund || 0);
    
    // Số tiền thực tế phải thanh toán sau khi trừ refund
    const actualAmountToPay = Math.max(0, total - refund);
    
    console.log(`🔍 calculateStatusWithRefund:`);
    console.log(`  - Final amount: ${total}`);
    console.log(`  - Amount paid: ${paid}`);
    console.log(`  - Total refund: ${refund}`);
    console.log(`  - Actual amount to pay: ${actualAmountToPay}`);
    
    if (actualAmountToPay <= 0) {
      return "paid"; // Trường hợp refund >= final_amount (hoàn toàn)
    } else if (paid >= actualAmountToPay) {
      return "paid"; // Đã thanh toán đủ số tiền thực tế phải trả
    } else if (paid > 0) {
      return "partial_paid"; // Thanh toán một phần số tiền thực tế phải trả
    } else {
      return "pending"; // Chưa thanh toán
    }
  },

  /**
   * Đồng bộ amount_paid và status - tự động cập nhật status dựa trên amount_paid
   * @param {string} invoice_id - ID của hóa đơn
   * @param {number} amount_paid - Số tiền đã thanh toán mới
   * @returns {Promise<Object>} Kết quả cập nhật
   */
  syncAmountPaidAndStatus: async (invoice_id, amount_paid) => {
    try {
      // 1. Lấy thông tin hóa đơn hiện tại
      const [invoiceRows] = await db
        .promise()
        .query(
          "SELECT final_amount, amount_paid, status FROM invoices WHERE invoice_id = ?",
          [invoice_id]
        );
      if (invoiceRows.length === 0) {
        throw new Error("Invoice not found.");
      }

      const currentInvoice = invoiceRows[0];
      const newAmountPaid = parseFloat(amount_paid || 0);
      const newStatus = Invoice.calculateStatus(
        newAmountPaid,
        currentInvoice.final_amount
      );

      // 2. Cập nhật cả amount_paid và status
      const sql = `
        UPDATE invoices
        SET amount_paid = ?, status = ?, updated_at = CURRENT_TIMESTAMP
        WHERE invoice_id = ?
      `;
      const [result] = await db
        .promise()
        .query(sql, [newAmountPaid, newStatus, invoice_id]);

      if (result.affectedRows === 0) {
        return null;
      }

      console.log(
        `🚀 ~ InvoiceModel: syncAmountPaidAndStatus - Updated invoice ${invoice_id}: amount_paid=${newAmountPaid}, status=${newStatus}`
      );
      return {
        invoice_id,
        amount_paid: newAmountPaid,
        status: newStatus,
        previous_amount_paid: parseFloat(currentInvoice.amount_paid || 0),
        previous_status: currentInvoice.status,
      };
    } catch (error) {
      console.error(
        "🚀 ~ InvoiceModel: syncAmountPaidAndStatus - Lỗi khi đồng bộ amount_paid và status:",
        error
      );
      throw error;
    }
  },

  /**
   * Kiểm tra và sửa chữa các hóa đơn có status không đồng bộ với amount_paid
   * @returns {Promise<Object>} Kết quả sửa chữa
   */
  fixInconsistentStatuses: async () => {
    try {
      // 1. Lấy tất cả hóa đơn có status không đồng bộ
      const sql = `
        SELECT 
          invoice_id,
          invoice_code,
          amount_paid,
          final_amount,
          status,
          invoice_type
        FROM invoices 
        WHERE (
          (final_amount <= 0 AND status != 'paid') OR
          (amount_paid >= final_amount AND status != 'paid') OR
          (amount_paid > 0 AND amount_paid < final_amount AND status != 'partial_paid') OR
          (amount_paid = 0 AND final_amount > 0 AND status != 'pending')
        )
      `;

      const [inconsistentInvoices] = await db.promise().query(sql);

      if (inconsistentInvoices.length === 0) {
        console.log(
          "🚀 ~ InvoiceModel: fixInconsistentStatuses - Không có hóa đơn nào cần sửa chữa"
        );
        return {
          fixed_count: 0,
          total_checked: 0,
          inconsistent_invoices: [],
        };
      }

      console.log(
        `🚀 ~ InvoiceModel: fixInconsistentStatuses - Tìm thấy ${inconsistentInvoices.length} hóa đơn cần sửa chữa`
      );

      // 2. Sửa chữa từng hóa đơn
      const fixedResults = [];
      for (const invoice of inconsistentInvoices) {
        const correctStatus = Invoice.calculateStatus(
          invoice.amount_paid,
          invoice.final_amount
        );

        if (correctStatus !== invoice.status) {
          const updateSql = `
            UPDATE invoices 
            SET status = ?, updated_at = CURRENT_TIMESTAMP
            WHERE invoice_id = ?
          `;

          await db
            .promise()
            .query(updateSql, [correctStatus, invoice.invoice_id]);

          fixedResults.push({
            invoice_id: invoice.invoice_id,
            invoice_code: invoice.invoice_code,
            invoice_type: invoice.invoice_type,
            old_status: invoice.status,
            new_status: correctStatus,
            amount_paid: parseFloat(invoice.amount_paid || 0),
            final_amount: parseFloat(invoice.final_amount || 0),
          });

          console.log(
            `🚀 ~ InvoiceModel: fixInconsistentStatuses - Fixed invoice ${invoice.invoice_code}: ${invoice.status} -> ${correctStatus}`
          );
        }
      }

      console.log(
        `🚀 ~ InvoiceModel: fixInconsistentStatuses - Đã sửa chữa ${fixedResults.length} hóa đơn`
      );
      return {
        fixed_count: fixedResults.length,
        total_checked: inconsistentInvoices.length,
        inconsistent_invoices: fixedResults,
      };
    } catch (error) {
      console.error(
        "🚀 ~ InvoiceModel: fixInconsistentStatuses - Lỗi khi sửa chữa status không đồng bộ:",
        error
      );
      throw error;
    }
  },

  /**
   * Lấy danh sách các hóa đơn có status không đồng bộ với amount_paid
   * @returns {Promise<Array>} Danh sách hóa đơn không đồng bộ
   */
  getInconsistentInvoices: async () => {
    try {
      const sql = `
        SELECT 
          invoice_id,
          invoice_code,
          amount_paid,
          final_amount,
          status,
          invoice_type,
          issued_date,
          CASE 
            WHEN final_amount <= 0 AND status != 'paid' THEN 'final_amount_zero_but_not_paid'
            WHEN amount_paid >= final_amount AND status != 'paid' THEN 'fully_paid_but_not_paid_status'
            WHEN amount_paid > 0 AND amount_paid < final_amount AND status != 'partial_paid' THEN 'partially_paid_but_wrong_status'
            WHEN amount_paid = 0 AND final_amount > 0 AND status != 'pending' THEN 'not_paid_but_wrong_status'
            ELSE 'unknown_inconsistency'
          END AS inconsistency_type
        FROM invoices 
        WHERE (
          (final_amount <= 0 AND status != 'paid') OR
          (amount_paid >= final_amount AND status != 'paid') OR
          (amount_paid > 0 AND amount_paid < final_amount AND status != 'partial_paid') OR
          (amount_paid = 0 AND final_amount > 0 AND status != 'pending')
        )
        ORDER BY issued_date DESC
      `;

      const [inconsistentInvoices] = await db.promise().query(sql);

      return inconsistentInvoices.map((invoice) => ({
        ...invoice,
        amount_paid: parseFloat(invoice.amount_paid || 0),
        final_amount: parseFloat(invoice.final_amount || 0),
      }));
    } catch (error) {
      console.error(
        "🚀 ~ InvoiceModel: getInconsistentInvoices - Lỗi khi lấy danh sách hóa đơn không đồng bộ:",
        error
      );
      throw error;
    }
  },
};

module.exports = Invoice;
