const db = require("../../config/db.config"); // Import trực tiếp db instance
const OrderModel = require("../orders/order.model"); // Để lấy chi tiết đơn hàng
const ProductEventModel = require("../product_report/product_event.model"); // Để lấy lịch sử bán/trả sản phẩm
const InvoiceModel = require("../invoice/invoice.model"); // Để tính công nợ
const TransactionModel = require("../transactions/transaction.model"); // Để tính công nợ

const CustomerReportService = {
  /**
   * Lấy tổng số đơn hàng và tổng chi tiêu của một khách hàng.
   * Chỉ tính các đơn hàng có trạng thái "Hoàn tất".
   *
   * @param {string} customer_id - ID của khách hàng.
   * @returns {Promise<Object>} Promise giải quyết với đối tượng chứa tổng số đơn hàng và tổng chi tiêu.
   * Ví dụ: { total_orders: 5, total_expenditure: 1250000.00 }
   * @throws {Error} Nếu có lỗi trong quá trình truy vấn database.
   */
  getTotalOrdersAndExpenditure: async (customer_id) => {
    try {
      const sql = `
        SELECT
          COUNT(order_id) AS total_orders,
          COALESCE(SUM(final_amount), 0) AS total_expenditure
        FROM orders
        WHERE customer_id = ? AND order_status = 'Hoàn tất';
      `;
      const [rows] = await db.promise().query(sql, [customer_id]);
      return rows[0];
    } catch (error) {
      console.error(
        "🚀 ~ CustomerReportService: getTotalOrdersAndExpenditure - Lỗi:",
        error
      );
      throw error;
    }
  },

  /**
   * Lấy lịch sử bán hàng và trả hàng của một khách hàng.
   * Lấy dữ liệu từ product_events và lọc theo customer_id thông qua order_id.
   *
   * @param {string} customer_id - ID của khách hàng.
   * @returns {Promise<Array<Object>>} Promise giải quyết với mảng các sự kiện bán/trả.
   * @throws {Error} Nếu có lỗi trong quá trình truy vấn database.
   */
  getSalesReturnHistory: async (customer_id) => {
    try {
      // Chúng ta cần JOIN product_events với orders để lấy customer_id
      const sql = `
        SELECT
          pe.event_id,
          pe.product_id,
          p.product_name, -- Giả định có bảng products để JOIN
          pe.quantity_impact,
          pe.transaction_price,
          pe.event_type,
          pe.event_timestamp,
          pe.reference_id AS order_id,
          pe.description,
          pe.current_stock_after
        FROM product_events pe
        JOIN orders o ON pe.reference_id = o.order_id
        LEFT JOIN products p ON pe.product_id = p.product_id -- Để lấy tên sản phẩm
        WHERE o.customer_id = ?
        AND pe.reference_type = 'ORDER' -- Chỉ lấy sự kiện liên quan đến đơn hàng
        AND (pe.event_type = 'ORDER_SOLD' OR pe.event_type = 'ORDER_CANCELLED' OR pe.event_type = 'RETURN_FROM_CUSTOMER')
        ORDER BY pe.event_timestamp DESC;
      `;
      const [rows] = await db.promise().query(sql, [customer_id]);

      // Format lại event_type cho dễ đọc
      return rows.map((row) => {
        let displayEventType = row.event_type;
        switch (row.event_type) {
          case "ORDER_SOLD":
            displayEventType = "Bán hàng";
            break;
          case "ORDER_CANCELLED":
            displayEventType = "Hủy đơn hàng"; // Hoặc 'Hoàn trả kho' nếu nó thể hiện việc hoàn nhập
            break;
          case "RETURN_FROM_CUSTOMER":
            displayEventType = "Khách hàng trả hàng";
            break;
          // Thêm các case khác nếu có thêm event_type
        }
        return {
          event_id: row.event_id,
          product_id: row.product_id,
          product_name: row.product_name,
          quantity_impact: row.quantity_impact,
          transaction_price: row.transaction_price,
          event_type: displayEventType,
          event_timestamp: row.event_timestamp,
          order_id: row.order_id,
          description: row.description,
          current_stock_after: row.current_stock_after,
        };
      });
    } catch (error) {
      console.error(
        "🚀 ~ CustomerReportService: getSalesReturnHistory - Lỗi:",
        error
      );
      throw error;
    }
  },

  /**
   * Lấy lịch sử tất cả các đơn hàng và trả hàng của một khách hàng.
   * Trả về cả đơn hàng và đơn trả hàng như các sự kiện riêng biệt.
   *
   * @param {string} customer_id - ID của khách hàng.
   * @returns {Promise<Array<Object>>} Promise giải quyết với mảng các sự kiện đã định dạng.
   * @throws {Error} Nếu có lỗi trong quá trình truy vấn database.
   */
  getOrderHistoryWithDetails: async (customer_id) => {
    try {
      const result = [];

      // 1. Lấy tất cả đơn hàng
      const orderSql = `
        SELECT
          o.order_id,
          o.order_code,
          o.order_date,
          o.order_status,
          o.total_amount,
          o.final_amount,
          o.discount_amount,
          o.note,
          o.payment_method,
          o.created_at,
          o.updated_at
        FROM orders o
        WHERE o.customer_id = ?
        ORDER BY o.created_at DESC;
      `;
      const [orders] = await db.promise().query(orderSql, [customer_id]);

      // 2. Lấy tất cả đơn trả hàng
      const returnSql = `
        SELECT
          ro.return_id,
          ro.order_id,
          ro.status as return_status,
          ro.created_at as return_created_at,
          ro.note as return_note,
          SUM(roi.refund_amount) as total_refund_amount,
          COUNT(roi.return_item_id) as return_item_count,
          o.order_code as related_order_code
        FROM return_orders ro
        JOIN return_order_items roi ON ro.return_id = roi.return_id
        LEFT JOIN orders o ON ro.order_id = o.order_id
        WHERE ro.customer_id = ?
          AND ro.status IN ('approved', 'completed')
        GROUP BY ro.return_id, ro.order_id, ro.status, ro.created_at, ro.note, o.order_code
        ORDER BY ro.created_at DESC;
      `;
      const [returns] = await db.promise().query(returnSql, [customer_id]);

      // 3. Thêm các đơn hàng vào kết quả
      orders.forEach(order => {
        result.push({
          order_id: order.order_id,
          order_code: order.order_code,
          order_date: order.order_date,
          order_status: order.order_status,
          total_amount: order.total_amount,
          final_amount: order.final_amount,
          discount_amount: order.discount_amount,
          note: order.note,
          payment_method: order.payment_method,
          created_at: order.created_at,
          updated_at: order.updated_at,
          // Thông tin bổ sung để phân biệt với return
          type: 'order',
          related_order_code: null,
          return_count: 0,
          has_returns: false,
          total_refund: 0,
          final_amount_after_returns: parseFloat(order.final_amount)
        });
      });

      // 4. Thêm các đơn trả hàng vào kết quả
      returns.forEach(ret => {
        result.push({
          order_id: ret.return_id, // Sử dụng return_id làm order_id để tương thích
          order_code: `TH${ret.related_order_code}`, // Sử dụng return_id làm order_code
          order_date: ret.return_created_at, // Sử dụng return_created_at làm order_date
          order_status: ret.return_status, // Sử dụng return_status làm order_status
          total_amount: ret.total_refund_amount, // Sử dụng total_refund_amount làm total_amount
          final_amount: ret.total_refund_amount, // Sử dụng total_refund_amount làm final_amount
          discount_amount: "0.00", // Giảm giá luôn là 0 cho return
          note: ret.return_note,
          payment_method: "refund",
          created_at: ret.return_created_at,
          updated_at: ret.return_created_at,
          // Thông tin bổ sung để phân biệt với order thật
          type: 'return',
          related_order_code: ret.related_order_code,
          return_count: parseInt(ret.return_item_count),
          has_returns: true,
          total_refund: parseFloat(ret.total_refund_amount),
          final_amount_after_returns: 0
        });
      });

      // 5. Sắp xếp theo thời gian tạo (mới nhất trước)
      result.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      return result;
    } catch (error) {
      console.error(
        "🚀 ~ CustomerReportService: getOrderHistoryWithDetails - Lỗi:",
        error
      );
      throw error;
    }
  },

  /**
   * Tính toán tổng công nợ cần thu từ một khách hàng.
   * Công nợ được tính bằng tổng các hóa đơn chưa thanh toán.
   *
   * @param {string} customer_id - ID của khách hàng.
   * @returns {Promise<number>} Promise giải quyết với tổng công nợ.
   * @throws {Error} Nếu có lỗi trong quá trình truy vấn database.
   */
  getReceivables: async (customer_id) => {
    try {
      // 1. Lấy tổng công nợ từ các hóa đơn chưa thanh toán
      const invoiceSql = `
        SELECT COALESCE(SUM(final_amount - amount_paid), 0) AS total_receivables
        FROM invoices
        WHERE customer_id = ?
          AND (status = 'pending' OR status = 'partial_paid' OR status = 'overdue')
          AND status != 'cancelled'
      `;
      const [invoiceRows] = await db.promise().query(invoiceSql, [customer_id]);
      const invoiceDebt = parseFloat(invoiceRows[0].total_receivables || 0);

      // 2. Lấy tổng công nợ từ các đơn hàng chưa có hóa đơn
      const orderSql = `
        SELECT COALESCE(SUM(o.final_amount - o.amount_paid), 0) AS total_orders_debt
        FROM orders o
        LEFT JOIN invoices i ON o.order_id = i.order_id
        WHERE o.customer_id = ?
          AND o.order_status IN ('Mới', 'Xác nhận', 'Hoàn tất')
          AND o.order_status != 'Huỷ đơn'
          AND i.order_id IS NULL
      `;
      const [orderRows] = await db.promise().query(orderSql, [customer_id]);
      const orderDebt = parseFloat(orderRows[0].total_orders_debt || 0);

      // 3. Lấy tổng số tiền đã trả hàng từ return_orders
      const returnSql = `
        SELECT COALESCE(SUM(roi.refund_amount), 0) AS total_refund
        FROM return_orders ro
        JOIN return_order_items roi ON ro.return_id = roi.return_id
        WHERE ro.customer_id = ?
          AND ro.status IN ('approved', 'completed')
      `;
      const [returnRows] = await db.promise().query(returnSql, [customer_id]);
      const totalRefund = parseFloat(returnRows[0].total_refund || 0);

      // Tổng công nợ = Công nợ invoices + Công nợ orders - Tổng tiền đã trả hàng
      const totalReceivables = invoiceDebt + orderDebt - totalRefund;

      console.log(`🔍 getReceivables cho customer ${customer_id}:`);
      console.log(`  - Invoice debt: ${invoiceDebt}`);
      console.log(`  - Order debt: ${orderDebt}`);
      console.log(`  - Total refund: ${totalRefund}`);
      console.log(`  - Total receivables: ${totalReceivables}`);

      return Math.max(0, totalReceivables);
    } catch (error) {
      console.error("🚀 ~ CustomerReportService: getReceivables - Lỗi:", error);
      throw error;
    }
  },

  getUnpaidOrPartiallyPaidInvoices: async (customer_id) => {
    try {
      const sql = `
        SELECT
          invoice_id,
          invoice_code,
          invoice_type,
          order_id,
          final_amount,
          amount_paid,
          (final_amount - amount_paid) AS remaining_receivable,
          status,
          issued_date,
          due_date,
          note
        FROM invoices
        WHERE customer_id = ?
          AND (status = 'pending' OR status = 'partial_paid' OR status = 'overdue')
        ORDER BY issued_date ASC;
      `;
      const [rows] = await db.promise().query(sql, [customer_id]);
      return rows;
    } catch (error) {
      console.error(
        "🚀 ~ CustomerReportService: getUnpaidOrPartiallyPaidInvoices - Lỗi:",
        error
      );
      throw error;
    }
  },

  getCustomerFinancialLedger: async (customer_id) => {
    try {
      // 1. Lấy tất cả hóa đơn bán hàng của khách hàng
      const invoices = await InvoiceModel.getAllByCustomerId(customer_id); // Giả định InvoiceModel có hàm getAllByCustomerId
      const mappedInvoices = invoices.map((inv) => ({
        reference_code: inv.invoice_code,
        timestamp: inv.issued_date,
        entry_type: "Sale Invoice", // Hoặc 'Credit Note' nếu có loại đó
        debit_amount: parseFloat(inv.final_amount),
        credit_amount: 0,
        description: `Hóa đơn bán hàng: ${inv.invoice_code}`,
        invoice_id: inv.invoice_id,
        related_id: inv.order_id, // Nếu muốn liên kết với order
      }));

      // 2. Lấy tất cả giao dịch thu tiền/hoàn tiền của khách hàng
      // Thêm category 'sale_refund' nếu có
      const transactions = await TransactionModel.getTransactionsByCustomerId(
        customer_id
      ); // Hàm này đã có trong TransactionModel
      const mappedTransactions = transactions.map((trx) => {
        let entryType;
        let debit = 0;
        let credit = 0;
        let description = trx.description;

        switch (trx.type) {
          case "receipt":
            entryType = "Payment Received";
            credit = parseFloat(trx.amount);
            description = `Phiếu thu: ${trx.transaction_code}`;
            if (trx.related_type === "invoice" && trx.invoice_code) {
              description += ` (HĐ: ${trx.invoice_code})`;
            }
            break;
          case "refund": // Giả định refund là khoản chi trả cho khách hàng
            entryType = "Refund Issued";
            debit = parseFloat(trx.amount); // Refund có thể coi là giảm công nợ cho mình -> tăng nợ khách hàng (nếu tiền ra khỏi mình)
            description = `Hoàn tiền: ${trx.transaction_code}`;
            break;
          // Có thể thêm các loại giao dịch khác như adjustment (điều chỉnh)
          default:
            entryType = "Other Transaction";
            break;
        }

        return {
          reference_code: trx.transaction_code,
          timestamp: trx.created_at,
          entry_type: entryType,
          debit_amount: debit,
          credit_amount: credit,
          description: description,
          transaction_id: trx.transaction_id,
          related_id: trx.related_id, // ID của hóa đơn hoặc order liên quan
        };
      });

      // 3. Kết hợp và sắp xếp theo thời gian
      const combinedEntries = [...mappedInvoices, ...mappedTransactions];
      combinedEntries.sort(
        (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
      );

      // 4. Tính toán running balance
      let currentRunningBalance = 0;
      const ledger = combinedEntries.map((entry) => {
        // Hóa đơn bán hàng làm tăng công nợ khách hàng (Debits Receivable)
        // Thanh toán / Hoàn tiền làm giảm công nợ khách hàng (Credits Receivable)
        currentRunningBalance += entry.debit_amount - entry.credit_amount;
        return {
          ...entry,
          running_balance: parseFloat(currentRunningBalance.toFixed(2)), // Định dạng số thập phân
        };
      });

      return ledger;
    } catch (error) {
      console.error(
        "🚀 ~ CustomerReportService: getCustomerFinancialLedger - Lỗi:",
        error
      );
      throw error;
    }
  },

  /**
   * Lấy lịch sử giao dịch chi tiết của khách hàng theo format sổ cái
   * Hiển thị tất cả các giao dịch từ tạo đơn, thanh toán trước, thanh toán sau...
   * 
   * @param {string} customer_id - ID của khách hàng
   * @returns {Promise<Array>} Danh sách giao dịch với dư nợ
   */
  getCustomerTransactionLedger: async (customer_id) => {
    try {
      // 1. Lấy tất cả đơn hàng của khách hàng
      const ordersSql = `
        SELECT 
          o.order_id,
          o.order_code,
          o.order_date,
          o.order_status,
          o.final_amount,
          o.amount_paid,
          o.created_at,
          o.updated_at
        FROM orders o
        WHERE o.customer_id = ? AND o.is_active = 1
        ORDER BY o.created_at ASC
      `;
      const [orders] = await db.promise().query(ordersSql, [customer_id]);

      // 2. Lấy tất cả hóa đơn của khách hàng
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
        WHERE customer_id = ?
        ORDER BY created_at ASC
      `;
      const [invoices] = await db.promise().query(invoicesSql, [customer_id]);

      // 3. Lấy tất cả giao dịch thanh toán
      const transactions = await TransactionModel.getTransactionsByCustomerId(customer_id);
      console.log("🚀 ~ getCustomerTransactionLedger: ~ transactions:", transactions)

      // 3.5. ✅ Lấy tất cả return_orders đã approved/completed
      const returnOrdersSql = `
        SELECT 
          ro.return_id,
          ro.order_id,
          ro.status,
          ro.created_at,
          SUM(roi.refund_amount) as total_refund,
          o.order_code
        FROM return_orders ro
        JOIN return_order_items roi ON ro.return_id = roi.return_id
        LEFT JOIN orders o ON ro.order_id = o.order_id
        WHERE ro.customer_id = ?
          AND ro.status IN ('approved', 'completed')
        GROUP BY ro.return_id, ro.order_id, ro.status, ro.created_at, o.order_code
        ORDER BY ro.created_at ASC
      `;
      const [returnOrders] = await db.promise().query(returnOrdersSql, [customer_id]);

      // 4. Tạo danh sách giao dịch theo thứ tự thời gian
      const allTransactions = [];

      // Xử lý từng đơn hàng
      orders.forEach(order => {
        // BỎ QUA ĐƠN HÀNG BỊ HỦY
        if (order.order_status === 'Huỷ đơn') return;
        const orderDate = new Date(order.created_at);
        const orderAdvanceAmount = parseFloat(order.amount_paid) || 0;

        // Tìm hóa đơn tương ứng với đơn hàng này
        const relatedInvoice = invoices.find(inv => inv.order_id === order.order_id);

        // Tìm các giao dịch thanh toán liên quan đến đơn hàng này
        const relatedTransactions = transactions.filter(trx =>
          trx.related_type === 'order' && trx.related_id === order.order_id
        );

        // Tìm các giao dịch thanh toán liên quan đến invoice của đơn hàng này
        const relatedInvoiceTransactions = transactions.filter(trx => {
          if (trx.related_type === 'invoice' && relatedInvoice) {
            return trx.related_id === relatedInvoice.invoice_id && trx.type === 'receipt';
          }
          return false;
        });

        // Tổng số tiền đã thanh toán thực tế cho invoice này (manual payment, type: 'receipt')
        const totalRealPaidForInvoice = relatedInvoiceTransactions.reduce((sum, trx) => sum + parseFloat(trx.amount), 0);

        // Advance payment chỉ ghi nhận phần còn lại chưa được thanh toán thực tế
        let advanceLeft = orderAdvanceAmount - totalRealPaidForInvoice;
        if (orderAdvanceAmount > 0 && advanceLeft > 0.0001) { // dùng > 0.0001 để tránh lỗi số thực
          allTransactions.push({
            transaction_code: `${order.order_code}-ADVANCE`,
            transaction_date: new Date(orderDate.getTime() + 1000),
            type: 'partial_paid',
            amount: advanceLeft,
            description: `Thanh toán trước cho đơn hàng ${order.order_code}`,
            order_id: order.order_id,
            invoice_id: null,
            transaction_id: null,
            order_code: order.order_code,
            status: 'completed'
          });
        }
        // Nếu transaction thực tế lớn hơn advance, phần dư sẽ được ghi nhận ở transaction thực tế (không cộng dồn với advance)

        // Thêm đơn hàng chính (tạo nợ)
        allTransactions.push({
          transaction_code: order.order_code,
          transaction_date: orderDate,
          type: 'pending',
          amount: parseFloat(order.final_amount),
          description: `Tạo đơn hàng ${order.order_code} - ${order.order_status}`,
          order_id: order.order_id,
          invoice_id: null,
          transaction_id: null,
          order_code: order.order_code,
          status: order.order_status
        });

        // Nếu có hóa đơn và có thanh toán bổ sung (không phải thanh toán trước)
        if (relatedInvoice && parseFloat(relatedInvoice.amount_paid) > orderAdvanceAmount) {
          const additionalPayment = parseFloat(relatedInvoice.amount_paid) - orderAdvanceAmount;
          // Tổng số tiền đã thanh toán thực tế cho invoice này (manual payment, type: 'receipt')
          const totalRealPaidForInvoice = transactions.filter(trx => trx.related_type === 'invoice' && trx.related_id === relatedInvoice.invoice_id && trx.type === 'receipt')
            .reduce((sum, trx) => sum + parseFloat(trx.amount), 0);
          // Số tiền bổ sung còn lại chưa được thanh toán thực tế
          const additionalLeft = additionalPayment - Math.max(0, totalRealPaidForInvoice - orderAdvanceAmount);
          if (additionalPayment > 0 && additionalLeft > 0.0001) {
            allTransactions.push({
              transaction_code: `${relatedInvoice.invoice_code}-ADDITIONAL`,
              transaction_date: new Date(relatedInvoice.created_at),
              type: 'partial_paid',
              amount: additionalLeft,
              description: `Thanh toán bổ sung cho hóa đơn ${relatedInvoice.invoice_code}`,
              order_id: order.order_id,
              invoice_id: relatedInvoice.invoice_id,
              transaction_id: null,
              invoice_code: relatedInvoice.invoice_code,
              status: relatedInvoice.status
            });
          }
        }
      });

      // ✅ Xử lý return_orders (ghi nhận giảm công nợ)
      returnOrders.forEach(returnOrder => {
        const returnDate = new Date(returnOrder.created_at);
        const refundAmount = parseFloat(returnOrder.total_refund || 0);
        
        if (refundAmount > 0) {
          allTransactions.push({
            transaction_code: `RETURN-${returnOrder.return_id}`,
            transaction_date: returnDate,
            type: 'return',
            amount: refundAmount,
            description: `Trả hàng cho đơn hàng ${returnOrder.order_code || returnOrder.order_id} - ${returnOrder.status}`,
            order_id: returnOrder.order_id,
            invoice_id: null,
            transaction_id: null,
            return_id: returnOrder.return_id,
            status: returnOrder.status
          });
        }
      });
      // Thêm các giao dịch thanh toán riêng lẻ (không liên quan đến đơn hàng cụ thể)
      transactions.forEach(transaction => {
        // Kiểm tra xem giao dịch này có liên quan đến order nào không
        let isRelatedToOrder = false;
        let isCancelled = false;
        // Kiểm tra trực tiếp với order
        if (transaction.related_type === 'order') {
          const relatedOrder = orders.find(order => order.order_id === transaction.related_id);
          isRelatedToOrder = true;
          if (relatedOrder && relatedOrder.order_status === 'Huỷ đơn') {
            isCancelled = true;
          }
        }
        // Kiểm tra thông qua invoice
        if (transaction.related_type === 'invoice') {
          const relatedInvoice = invoices.find(inv => inv.invoice_id === transaction.related_id);
          if (relatedInvoice) {
            if (relatedInvoice.status === 'cancelled') {
              isCancelled = true;
            }
            if (orders.some(order => order.order_id === relatedInvoice.order_id)) {
              isRelatedToOrder = true;
            }
          }
        }
        // BỎ QUA TRANSACTION LIÊN QUAN ĐẾN ĐƠN HÀNG/HÓA ĐƠN BỊ HỦY
        if (isCancelled) return;
        // Thêm tất cả giao dịch thanh toán (bao gồm cả manual payments)
        // Nhưng đánh dấu rõ ràng loại thanh toán
        allTransactions.push({
          transaction_code: transaction.transaction_code,
          transaction_date: new Date(transaction.created_at),
          type: transaction.type,
          amount: parseFloat(transaction.amount),
          description: transaction.description || `Thanh toán ${transaction.transaction_code}`,
          order_id: transaction.related_type === 'order' ? transaction.related_id : null,
          invoice_id: transaction.related_type === 'invoice' ? transaction.related_id : null,
          transaction_id: transaction.transaction_id,
          status: 'completed',
          payment_method: transaction.payment_method,
          is_manual_payment: true // Đánh dấu đây là thanh toán manual
        });
      });

      // 5. Sắp xếp theo thời gian (từ mới đến cũ)
      allTransactions.sort((a, b) => b.transaction_date - a.transaction_date);

      // Debug: In ra thứ tự giao dịch
      console.log('🔍 Debug - Thứ tự giao dịch sau khi sắp xếp (mới đến cũ):');
      allTransactions.forEach((t, index) => {
        console.log(`${index + 1}. ${t.transaction_code} | ${t.transaction_date} | ${t.type} | ${t.amount}`);
      });

      // 6. Tính toán dư nợ theo logic sổ cái (từ cũ đến mới để tính đúng)
      // Đảo ngược lại để tính từ cũ đến mới
      const reversedTransactions = [...allTransactions].reverse();
      let runningBalance = 0;
      const calculatedBalances = [];

      // Tính dư nợ từ cũ đến mới
      reversedTransactions.forEach((transaction, index) => {
        if (transaction.type === 'pending') {
          runningBalance += transaction.amount;
        } else if (transaction.type === 'partial_paid' || transaction.type === 'payment' || transaction.type === 'receipt' || transaction.type === 'refund') {
          runningBalance -= transaction.amount;
        } else if (transaction.type === 'return') {
          // ✅ Xử lý trả hàng - giảm dư nợ
          runningBalance -= transaction.amount;
        }
        calculatedBalances.push(runningBalance);
      });

      // Đảo ngược lại để hiển thị từ mới đến cũ
      calculatedBalances.reverse();

      const result = allTransactions.map((transaction, index) => {
        // Debug: In ra từng bước tính dư nợ
        console.log(`💰 ${index + 1}. ${transaction.transaction_code} | ${transaction.type} | ${transaction.amount} | Dư nợ: ${calculatedBalances[index]}`);

        // Format dữ liệu trả về
        return {
          ma_giao_dich: transaction.transaction_code,
          ngay_giao_dich: transaction.transaction_date,
          // loai: CustomerReportService.getTransactionTypeDisplay(transaction.type),
          loai: transaction.type,
          gia_tri: transaction.amount,
          du_no: calculatedBalances[index],
          mo_ta: transaction.description,
          order_id: transaction.order_id,
          invoice_id: transaction.invoice_id,
          transaction_id: transaction.transaction_id,
          order_code: transaction.order_code,
          invoice_code: transaction.invoice_code,
          status: transaction.status,
          phuong_thuc_thanh_toan: transaction.payment_method || null,
          la_thanh_toan_manual: transaction.is_manual_payment || false
        };
      });

      return result;
    } catch (error) {
      console.error(
        "🚀 ~ CustomerReportService: getCustomerTransactionLedger - Lỗi:",
        error
      );
      throw error;
    }
  },

  /**
   * Hàm helper để chuyển đổi loại giao dịch sang tiếng Việt
   */
  // getTransactionTypeDisplay: (type) => {
  //   const typeMap = {
  //     'pending': 'Tạo đơn hàng',
  //     'partial_paid': 'Thanh toán một phần',
  //     'payment': 'Thanh toán thủ công',
  //     'completed': 'Hoàn tất',
  //     'cancelled': 'Hủy bỏ'
  //   };
  //   return typeMap[type] || type;
  // },
};

module.exports = CustomerReportService;
