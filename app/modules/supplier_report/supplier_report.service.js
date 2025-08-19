const db = require("../../config/db.config");
const TransactionService = require("../transactions/transaction.service");
const InvoiceModel = require("../invoice/invoice.model");
const PurchaseOrderModel = require("../purchaseOrder/purchaseOrder.model");
const SupplierReturn = require("../supplier_return/supplier_return.model");
const { generateTransactionCode } = require("../../utils/transactionUtils");

const SupplierReportService = {
  /**
   * Lấy sổ cái giao dịch chi tiết của nhà cung cấp
   * Bao gồm tất cả giao dịch theo thứ tự thời gian với dư nợ
   * @param {string} supplier_id - ID của nhà cung cấp
   * @returns {Array} Mảng các giao dịch với dư nợ
   */
  getSupplierTransactionLedger: async (supplier_id, page = 1, limit = 10) => {
    try {
      // 1. Lấy tất cả đơn hàng mua của nhà cung cấp
      const purchaseOrdersSql = `
        SELECT 
          po.po_id,
          po.created_at,
          po.status,
          po.total_amount,
          po.created_at,
          po.updated_at
        FROM purchase_orders po
        WHERE po.supplier_id = ?
        ORDER BY po.created_at ASC
      `;
      const [purchaseOrders] = await db
        .promise()
        .query(purchaseOrdersSql, [supplier_id]);

      // 2. Lấy tất cả hóa đơn của nhà cung cấp
      const invoicesSql = `
        SELECT 
          invoice_id,
          invoice_code,
          order_id,
          final_amount,
          amount_paid,
          status,
          issued_date,
          created_at,
          updated_at
        FROM invoices 
        WHERE supplier_id = ?
        ORDER BY created_at ASC
      `;
      const [invoices] = await db.promise().query(invoicesSql, [supplier_id]);

      // 3. Lấy tất cả giao dịch thanh toán
      const [directTransactions] = await db
        .promise()
        .query(`SELECT * FROM transactions WHERE supplier_id = ?`, [
          supplier_id,
        ]);

      // Lấy transaction liên quan đến invoice của supplier
      const supplierInvoiceIds = invoices.map((inv) => inv.invoice_id);
      let invoiceTransactions = [];
      if (supplierInvoiceIds.length > 0) {
        const [rows] = await db
          .promise()
          .query(
            `SELECT * FROM transactions WHERE related_type = 'invoice' AND related_id IN (${supplierInvoiceIds
              .map(() => "?")
              .join(",")})`,
            supplierInvoiceIds
          );
        invoiceTransactions = rows;
      }
      const transactions = [...directTransactions, ...invoiceTransactions];

      // console.log(
      //   "🚀 ~ getSupplierTransactionLedger: ~ transactions:",
      //   transactions
      // );

      // 3.5. ✅ Lấy tất cả return_orders đã approved/completed
      const returnOrdersSql = `
          SELECT 
            ro.return_id,
            ro.po_id,
            ro.status,
            ro.created_at,
            SUM(roi.refund_amount) as total_refund
          FROM return_orders ro
          JOIN return_order_items roi ON ro.return_id = roi.return_id
          LEFT JOIN purchase_orders po ON ro.po_id = po.po_id
          WHERE ro.supplier_id = ?
            AND ro.type = 'supplier_return'
            AND ro.status IN ('approved', 'completed')
          GROUP BY ro.return_id, ro.po_id, ro.status, ro.created_at
          ORDER BY ro.created_at ASC
        `;
      const [returnOrders] = await db
        .promise()
        .query(returnOrdersSql, [supplier_id]);

      // 4. Tạo danh sách giao dịch theo thứ tự thời gian
      const allTransactions = [];

      // Xử lý từng đơn hàng mua
      purchaseOrders.forEach((po) => {
        // BỎ QUA ĐƠN HÀNG BỊ HỦY
        if (po.status === "cancelled" || po.status === "Huỷ đơn") return;
        const poDate = new Date(po.created_at);

        // Thêm đơn hàng mua chính (tạo nợ)
        allTransactions.push({
          transaction_code: po.po_id,
          transaction_date: poDate,
          type: "pending",
          amount: parseFloat(po.total_amount),
          description: `Tạo đơn hàng mua ${po.po_id} - ${po.status}`,
          po_id: po.po_id,
          invoice_id: null,
          transaction_id: null,
          purchase_order_code: po.po_id,
          status: po.status,
        });
      });

      // Xử lý return_orders: mỗi lần trả là 1 record riêng biệt
      for (const returnOrder of returnOrders) {
        // Tính số tiền refund đúng cho lần này
        const refundAmount = parseFloat(returnOrder.total_refund) || 0;
        if (refundAmount > 0) {
          allTransactions.push({
            transaction_code: `TH-PO-${returnOrder.return_id}`,
            transaction_date: new Date(returnOrder.created_at),
            type: "return",
            amount: refundAmount,
            description: `Trả hàng cho đơn hàng mua ${returnOrder.po_id} - ${returnOrder.status}`,
            po_id: returnOrder.po_id,
            invoice_id: null,
            transaction_id: null,
            return_id: returnOrder.return_id,
            status: returnOrder.status,
          });
        }
      }

      // Thêm các giao dịch thanh toán riêng lẻ (không liên quan đến đơn hàng cụ thể)
      transactions.forEach((transaction) => {
        // Kiểm tra xem giao dịch này có liên quan đến PO nào không
        let isRelatedToPO = false;
        let isCancelled = false;

        // Kiểm tra trực tiếp với PO
        if (transaction.related_type === "purchase_order") {
          const relatedPO = purchaseOrders.find(
            (po) => po.po_id === transaction.related_id
          );
          isRelatedToPO = true;
          if (
            relatedPO &&
            (relatedPO.status === "cancelled" || relatedPO.status === "Huỷ đơn")
          ) {
            isCancelled = true;
          }
        }

        // Kiểm tra thông qua invoice
        if (transaction.related_type === "invoice") {
          const relatedInvoice = invoices.find(
            (inv) => inv.invoice_id === transaction.related_id
          );
          if (relatedInvoice) {
            if (relatedInvoice.status === "cancelled") {
              isCancelled = true;
            }
            if (
              purchaseOrders.some((po) => po.po_id === relatedInvoice.order_id)
            ) {
              isRelatedToPO = true;
            }
          }
        }

        // BỎ QUA TRANSACTION LIÊN QUAN ĐẾN ĐƠN HÀNG/HÓA ĐƠN BỊ HỦY
        if (isCancelled) return;

        // Thêm tất cả giao dịch thanh toán (bao gồm cả manual payments)
        allTransactions.push({
          transaction_code: transaction.transaction_code,
          transaction_date: new Date(transaction.created_at),
          type: transaction.type,
          amount: parseFloat(transaction.amount),
          description:
            transaction.description ||
            `Thanh toán ${transaction.transaction_code}`,
          po_id:
            transaction.related_type === "purchase_order"
              ? transaction.related_id
              : null,
          invoice_id:
            transaction.related_type === "invoice"
              ? transaction.related_id
              : null,
          transaction_id: transaction.transaction_id,
          status: "completed",
          payment_method: transaction.payment_method,
          is_manual_payment: true, // Đánh dấu đây là thanh toán manual
        });
      });

      // 5. Sắp xếp theo thời gian (từ mới đến cũ)
      allTransactions.sort((a, b) => a.transaction_date - b.transaction_date);

      // Debug: In ra thứ tự giao dịch
      // //console.log("🔍 Debug - Thứ tự giao dịch sau khi sắp xếp (mới đến cũ):");
      allTransactions.forEach((t, index) => {
        console.log(
          `${index + 1}. ${t.transaction_code} | ${t.transaction_date} | ${
            t.type
          } | ${t.amount}`
        );
      });

      // Lọc bỏ transaction có type === 'refund' khỏi allTransactions trước khi mapping
      const allTransactionsNoRefund = allTransactions.filter(
        (txn) => txn.type !== "refund"
      );

      // 6. Tính running balance từ cũ đến mới
      let runningBalance = 0;

      // Chuẩn hóa mapping kiểu giao dịch cho nhà cung cấp (công nợ phải trả)
      // Quy ước: tăng balance = tăng phải trả; giảm balance = giảm phải trả
      const INCREASE_TYPES = new Set([
        "pending", // PO tạo nợ
        "purchase_invoice", // Hóa đơn mua làm tăng phải trả
        "debit_note", // Ghi nợ từ NCC
        "adj_increase", // Điều chỉnh tăng phải trả
      ]);

      const DECREASE_TYPES = new Set([
        "payment", // Trả tiền NCC
        "receipt", // Trường hợp nhận tiền lại (ít gặp) coi như giảm phải trả
        "return", // Trả hàng NCC
        "credit_note", // NCC ghi có cho mình
        "refund", // NCC hoàn lại
        "transfer", // Điều chuyển giảm phải trả
        "partial_paid",
        "refund_invoice",
        "adj_decrease", // Điều chỉnh giảm phải trả
      ]);

      const SIGNED_TYPES = new Set([
        "adjustment",
        "opening_balance",
        "adj_migration", // Điều chỉnh từ hệ thống cũ
      ]);

      allTransactionsNoRefund.forEach((txn) => {
        const amount = Number(txn.amount) || 0;
        const type = txn.type;

        if (INCREASE_TYPES.has(type)) {
          runningBalance += amount;
        } else if (DECREASE_TYPES.has(type)) {
          runningBalance -= amount;
        } else if (SIGNED_TYPES.has(type)) {
          runningBalance += amount; // amount có thể âm/dương
        } else {
          //console.warn("⚠️ Supplier ledger: Transaction type lạ:", type, txn);
          runningBalance += amount; // fallback
        }

        txn.balance = runningBalance;
      });

      // 8. Đảo ngược lại để trả về từ mới đến cũ
      allTransactionsNoRefund.reverse();
      // 7. Tính total + phân trang
      const total = allTransactionsNoRefund.length;
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginated = allTransactionsNoRefund.slice(startIndex, endIndex);
      return { ledger: paginated, total };
    } catch (error) {
      console.error(
        "🚀 ~ SupplierReportService: getSupplierTransactionLedger - Lỗi:",
        error
      );
      throw error;
    }
  },

  /**
   * Lấy lịch sử tất cả các đơn hàng mua của một nhà cung cấp.
   * Trả về cả đơn hàng mua và đơn trả hàng như các sự kiện riêng biệt.
   *
   * @param {string} supplier_id - ID của nhà cung cấp.
   * @returns {Promise<Array<Object>>} Promise giải quyết với mảng các sự kiện đã định dạng.
   * @throws {Error} Nếu có lỗi trong quá trình truy vấn database.
   */
  getSupplierOrderHistoryWithDetails: async (
    supplier_id,
    page = 1,
    limit = 10
  ) => {
    try {
      const result = [];

      // 1. Lấy tất cả đơn hàng mua
      const purchaseOrderSql = `
        SELECT
          po.po_id,
          po.created_at as order_date,
          po.status as order_status,
          po.total_amount,
          po.note,
          po.created_at,
          po.updated_at,
          s.supplier_name
        FROM purchase_orders po
        JOIN suppliers s ON po.supplier_id = s.supplier_id
        WHERE po.supplier_id = ?
        ORDER BY po.created_at DESC;
      `;
      const [purchaseOrders] = await db
        .promise()
        .query(purchaseOrderSql, [supplier_id]);

      // 2. Lấy tất cả đơn trả hàng cho nhà cung cấp với tổng giá trị từ items
      const supplierReturnSql = `
        SELECT
          r.return_id,
          r.po_id as purchase_order_id,
          r.status as return_status,
          r.created_at as return_created_at,
          r.note as return_note,
          r.po_id as related_order_code,
          COALESCE(SUM(roi.refund_amount), 0) as total_value
        FROM return_orders r
        LEFT JOIN purchase_orders po ON r.po_id = po.po_id
        LEFT JOIN return_order_items roi ON r.return_id = roi.return_id
        WHERE r.supplier_id = ?
          AND r.type = 'supplier_return'
          AND r.status IN ('approved', 'completed')
        GROUP BY r.return_id, r.po_id, r.status, r.created_at, r.note
        ORDER BY r.created_at ASC;
      `;
      const [supplierReturns] = await db
        .promise()
        .query(supplierReturnSql, [supplier_id]);

      // 3. Thêm các đơn hàng mua vào kết quả
      purchaseOrders.forEach((order) => {
        result.push({
          order_id: order.po_id,
          order_code: `PO-${order.po_id.substring(0, 8)}`, // Tạo mã từ po_id
          order_date: order.order_date,
          order_status: order.order_status,
          total_amount: order.total_amount,
          final_amount: order.total_amount, // Sử dụng total_amount thay vì final_amount
          note: order.note,
          created_at: order.created_at,
          updated_at: order.updated_at,
          supplier_name: order.supplier_name,
          // Thông tin bổ sung để phân biệt với return
          type: "purchase_order",
          related_order_code: null,
          return_count: 0,
          has_returns: false,
          total_refund: 0,
          final_amount_after_returns: parseFloat(order.total_amount), // Sử dụng total_amount
        });
      });

      // 4. Thêm các đơn trả hàng vào kết quả (mỗi lần trả là 1 record riêng biệt)
      supplierReturns.forEach((ret) => {
        result.push({
          order_id: ret.return_id, // Sử dụng return_id làm order_id để tương thích
          order_code: `TH-${
            ret.related_order_code
              ? ret.related_order_code.substring(0, 8)
              : ret.return_id.substring(0, 8)
          }`, // Tạo mã từ po_id hoặc return_id
          order_date: ret.return_created_at,
          order_status: ret.return_status,
          total_amount: parseFloat(ret.total_value || 0), // Sử dụng total_value từ return_order_items
          final_amount: parseFloat(ret.total_value || 0), // Sử dụng total_value từ return_order_items
          note: ret.return_note,
          created_at: ret.return_created_at,
          updated_at: ret.return_created_at,
          supplier_name: null, // Không cần supplier_name cho return
          // Thông tin bổ sung để phân biệt với order thật
          type: "supplier_return",
          related_order_code: ret.related_order_code,
          return_count: 0,
          has_returns: true,
          total_refund: parseFloat(ret.total_value || 0), // Sử dụng total_value từ return_order_items
          final_amount_after_returns: 0,
        });
      });

      // 5. Sắp xếp theo thời gian tạo (mới nhất trước)
      result.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      // 7. Tính total + phân trang
      const total = result.length;
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginated = result.slice(startIndex, endIndex);

      return { orderHistory: paginated, total };
    } catch (error) {
      console.error(
        "🚀 ~ SupplierReportService: getSupplierOrderHistoryWithDetails - Lỗi:",
        error
      );
      throw error;
    }
  },

  /**
   * Lấy danh sách hóa đơn chưa thanh toán đủ của nhà cung cấp
   * @param {string} supplier_id
   * @returns {Promise<Array>} Danh sách hóa đơn chưa thanh toán đủ
   */
  getUnpaidOrPartiallyPaidInvoices: async (supplier_id) => {
    try {
      // Giả định bảng invoices có các trường: supplier_id, status, final_amount, amount_paid
      // Lấy các hóa đơn chưa thanh toán đủ (status != 'paid' hoặc amount_paid < final_amount)
      const sql = `
        SELECT invoice_id, invoice_code, final_amount, amount_paid,
          (final_amount - IFNULL(amount_paid, 0)) AS amount_due, issued_date, due_date, status
        FROM invoices
        WHERE supplier_id = ?
          AND invoice_type != 'refund_invoice'
          AND (status != 'paid' OR (final_amount - IFNULL(amount_paid, 0)) > 0.0001)
        ORDER BY issued_date ASC
      `;
      const [rows] = await db.promise().query(sql, [supplier_id]);
      // Đảm bảo các trường số là number
      return rows.map((inv) => ({
        ...inv,
        final_amount:
          inv.final_amount !== undefined ? parseFloat(inv.final_amount) : 0,
        amount_paid:
          inv.amount_paid !== undefined ? parseFloat(inv.amount_paid) : 0,
        amount_due:
          inv.amount_due !== undefined ? parseFloat(inv.amount_due) : 0,
      }));
    } catch (error) {
      console.error(
        "🚀 ~ SupplierReportService: getUnpaidOrPartiallyPaidInvoices - Lỗi:",
        error
      );
      throw error;
    }
  },
};

module.exports = SupplierReportService;
