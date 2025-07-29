const db = require("../../config/db.config");
const TransactionService = require("../transactions/transaction.service");
const InvoiceModel = require("../invoice/invoice.model");
const PurchaseOrderModel = require("../purchaseOrder/purchaseOrder.model");
const SupplierReturn = require("../supplier_return/supplier_return.model");

const SupplierReportService = {
  /**
   * Lấy sổ cái giao dịch chi tiết của nhà cung cấp
   * Bao gồm tất cả giao dịch theo thứ tự thời gian với dư nợ
   * @param {string} supplier_id - ID của nhà cung cấp
   * @returns {Array} Mảng các giao dịch với dư nợ
   */
  getSupplierTransactionLedger: async (supplier_id) => {
    try {
      const [purchaseOrders, invoices, transactions, returns] = await Promise.all([
        // 1. Lấy tất cả PO (bỏ qua PO bị huỷ)
        PurchaseOrderModel.getPurchaseOrdersBySupplierId(supplier_id),
        // 2. Lấy tất cả hóa đơn của supplier
        InvoiceModel.getDebtSupplier(supplier_id),
        // 3. Lấy tất cả giao dịch thanh toán của supplier
        TransactionService.getTransactionsBySupplierId(supplier_id),
        // 4. Lấy tất cả return_orders đã approved/completed
        SupplierReturn.getAll({ supplier_id, status: ["approved", "completed"] }),
      ]);

      const allTransactions = [];

      // Xử lý từng PO (bỏ qua PO bị huỷ)
      purchaseOrders.filter(po => po.status !== 'cancelled' && po.status !== 'Huỷ đơn').forEach(order => {
        allTransactions.push({
          transaction_code: order.po_id,
          transaction_date: order.created_at,
          type: "pending",
          amount: order.total_amount,
          description: `Tạo đơn hàng ${order.po_id} - ${order.status}`,
          reference: order.po_id,
        });
      });

      // Xử lý return_orders: mỗi lần trả là 1 record riêng biệt
      for (const ret of returns) {
        // Lấy tổng refund_amount cho từng lần trả hàng
        const details = await SupplierReturn.getReturnDetails(ret.return_id);
        const refundAmount = details.reduce((sum, d) => sum + (parseFloat(d.refund_amount) || 0), 0);
        allTransactions.push({
          transaction_code: ret.return_id,
          transaction_date: ret.created_at,
          type: "refund",
          amount: -refundAmount,
          description: `Trả hàng NCC #${ret.return_id} - ${ret.status}`,
          reference: ret.return_id,
        });
      }

      // Xử lý các giao dịch thanh toán riêng lẻ
      transactions.forEach(txn => {
        allTransactions.push({
          transaction_code: txn.transaction_code,
          transaction_date: txn.created_at,
          type: txn.type,
          amount: txn.amount,
          description: txn.description,
          reference: txn.related_id,
        });
      });

      // Sắp xếp theo thời gian
      allTransactions.sort((a, b) => new Date(a.transaction_date) - new Date(b.transaction_date));

      // Tính dư nợ (running balance)
      let runningBalance = 0;
      allTransactions.forEach(txn => {
        if (txn.type === 'pending' || txn.type === 'invoice') {
          runningBalance += txn.amount;
        } else if (txn.type === 'refund') {
          runningBalance -= Math.abs(txn.amount);
        } else if (txn.type === 'payment') {
          runningBalance -= txn.amount;
        } else if (txn.type === 'receipt') {
          runningBalance += txn.amount;
        }
        txn.balance = runningBalance;
      });

      return allTransactions;
    } catch (error) {
      console.error("🚀 ~ SupplierReportService: getSupplierTransactionLedger - Lỗi:", error);
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
  getSupplierOrderHistoryWithDetails: async (supplier_id) => {
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
      const [purchaseOrders] = await db.promise().query(purchaseOrderSql, [supplier_id]);

      // 2. Lấy tất cả đơn trả hàng cho nhà cung cấp với tổng giá trị từ items
      const supplierReturnSql = `
        SELECT
          r.return_id,
          r.po_id as purchase_order_id,
          r.status as return_status,
          r.created_at as return_created_at,
          r.note as return_note,
          r.po_id as related_order_code,
          COALESCE(SUM(roi.quantity * roi.refund_amount), 0) as total_value
        FROM return_orders r
        LEFT JOIN purchase_orders po ON r.po_id = po.po_id
        LEFT JOIN return_order_items roi ON r.return_id = roi.return_id
        WHERE r.supplier_id = ?
          AND r.type = 'supplier_return'
          AND r.status IN ('approved', 'completed')
        GROUP BY r.return_id, r.po_id, r.status, r.created_at, r.note
        ORDER BY r.created_at ASC;
      `;
      const [supplierReturns] = await db.promise().query(supplierReturnSql, [supplier_id]);

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
          order_code: `TH-${ret.related_order_code ? ret.related_order_code.substring(0, 8) : ret.return_id.substring(0, 8)}`, // Tạo mã từ po_id hoặc return_id
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

      return result;
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
          AND (status != 'paid' OR (final_amount - IFNULL(amount_paid, 0)) > 0.0001)
        ORDER BY issued_date ASC
      `;
      const [rows] = await db.promise().query(sql, [supplier_id]);
      return rows;
    } catch (error) {
      console.error("🚀 ~ SupplierReportService: getUnpaidOrPartiallyPaidInvoices - Lỗi:", error);
      throw error;
    }
  },
};

module.exports = SupplierReportService; 