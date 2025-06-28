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
   * Lấy lịch sử tất cả các đơn hàng của một khách hàng, bao gồm chi tiết từng đơn hàng.
   *
   * @param {string} customer_id - ID của khách hàng.
   * @returns {Promise<Array<Object>>} Promise giải quyết với mảng các đối tượng đơn hàng đã định dạng.
   * @throws {Error} Nếu có lỗi trong quá trình truy vấn database.
   */
  getOrderHistoryWithDetails: async (customer_id) => {
    try {
      // Giả định OrderModel có hàm để lấy đơn hàng kèm chi tiết sản phẩm cho một customer_id
      // Nếu không, cần thêm hàm này vào OrderModel hoặc viết truy vấn JOIN phức tạp ở đây.
      // Dựa trên hàm OrderModel.readById, chúng ta có thể gọi từng đơn hàng.
      // Tuy nhiên, để tối ưu, tốt hơn là viết một truy vấn JOIN lớn ở model hoặc service.
      const sql = `
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
          o.updated_at,
          od.order_detail_id,
          od.product_id,
          p.product_name, -- Giả định có bảng products để JOIN
          p.sku, -- Giả định có bảng products để JOIN
          od.quantity,
          od.price
        FROM orders o
        JOIN order_details od ON o.order_id = od.order_id
        LEFT JOIN products p ON od.product_id = p.product_id
        WHERE o.customer_id = ?
        ORDER BY o.created_at DESC, od.created_at ASC;
      `;
      const [rows] = await db.promise().query(sql, [customer_id]);

      // Nhóm kết quả theo từng đơn hàng
      const ordersMap = new Map();
      rows.forEach((row) => {
        if (!ordersMap.has(row.order_id)) {
          ordersMap.set(row.order_id, {
            order_id: row.order_id,
            order_code: row.order_code,
            order_date: row.order_date,
            order_status: row.order_status,
            total_amount: row.total_amount,
            final_amount: row.final_amount,
            discount_amount: row.discount_amount,
            note: row.note,
            payment_method: row.payment_method,
            created_at: row.created_at,
            updated_at: row.updated_at,
            details: [],
          });
        }
        ordersMap.get(row.order_id).details.push({
          order_detail_id: row.order_detail_id,
          product_id: row.product_id,
          product_name: row.product_name,
          sku: row.sku,
          quantity: row.quantity,
          price: row.price,
        });
      });

      return Array.from(ordersMap.values());
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
      const sql = `
        SELECT
          COALESCE(SUM(final_amount - amount_paid), 0) AS total_receivables
        FROM invoices
        WHERE customer_id = ?
          AND (status = 'pending' OR status = 'partial_paid' OR status = 'overdue'); -- Hoặc các trạng thái khác biểu thị chưa thanh toán đủ
      `;
      const [rows] = await db.promise().query(sql, [customer_id]);
      return rows[0].total_receivables;
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

      // 4. Tạo danh sách giao dịch theo thứ tự thời gian
      const allTransactions = [];

      // Xử lý từng đơn hàng
      orders.forEach(order => {
        const orderDate = new Date(order.created_at);
        const orderAdvanceAmount = parseFloat(order.amount_paid) || 0;
        
        // Tìm hóa đơn tương ứng với đơn hàng này
        const relatedInvoice = invoices.find(inv => inv.order_id === order.order_id);
        
        // Tìm các giao dịch thanh toán liên quan đến đơn hàng này
        const relatedTransactions = transactions.filter(trx => 
          trx.related_type === 'order' && trx.related_id === order.order_id
        );

        // Nếu có thanh toán trước và chưa có giao dịch nào được ghi nhận
        if (orderAdvanceAmount > 0 && relatedTransactions.length === 0) {
          // Ghi nhận thanh toán trước từ amount_paid của order
          allTransactions.push({
            transaction_code: `${order.order_code}-ADVANCE`,
            transaction_date: new Date(orderDate.getTime() + 1000), // Thêm 1 giây để đảm bảo thứ tự
            type: 'partial_paid',
            amount: orderAdvanceAmount,
            description: `Thanh toán trước cho đơn hàng ${order.order_code}`,
            order_id: order.order_id,
            invoice_id: null,
            transaction_id: null,
            order_code: order.order_code,
            status: 'completed'
          });
        }

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
          if (additionalPayment > 0) {
            allTransactions.push({
              transaction_code: `${relatedInvoice.invoice_code}-ADDITIONAL`,
              transaction_date: new Date(relatedInvoice.created_at),
              type: 'partial_paid',
              amount: additionalPayment,
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

      // Thêm các giao dịch thanh toán riêng lẻ (không liên quan đến đơn hàng cụ thể)
      transactions.forEach(transaction => {
        // Kiểm tra xem giao dịch này có liên quan đến order nào không
        let isRelatedToOrder = false;
        
        // Kiểm tra trực tiếp với order
        if (transaction.related_type === 'order') {
          isRelatedToOrder = true;
        }
        
        // Kiểm tra thông qua invoice
        if (transaction.related_type === 'invoice') {
          const relatedInvoice = invoices.find(inv => inv.invoice_id === transaction.related_id);
          if (relatedInvoice && orders.some(order => order.order_id === relatedInvoice.order_id)) {
            isRelatedToOrder = true;
          }
        }
        
        // Chỉ thêm những giao dịch KHÔNG liên quan đến order
        if (!isRelatedToOrder) {
          allTransactions.push({
            transaction_code: transaction.transaction_code,
            transaction_date: new Date(transaction.created_at),
            type: 'payment',
            amount: parseFloat(transaction.amount),
            description: transaction.description || `Thanh toán ${transaction.transaction_code}`,
            order_id: null,
            invoice_id: transaction.related_type === 'invoice' ? transaction.related_id : null,
            transaction_id: transaction.transaction_id,
            status: 'completed'
          });
        }
      });

      // 5. Sắp xếp theo thời gian (từ cũ đến mới)
      allTransactions.sort((a, b) => a.transaction_date - b.transaction_date);

      // 6. Tính toán dư nợ theo logic sổ cái
      let runningBalance = 0;
      const result = allTransactions.map(transaction => {
        // Logic tính dư nợ:
        // - pending: tăng nợ (tạo đơn hàng)
        // - partial_paid/payment: giảm nợ (thanh toán)
        if (transaction.type === 'pending') {
          runningBalance += transaction.amount;
        } else if (transaction.type === 'partial_paid' || transaction.type === 'payment') {
          runningBalance -= transaction.amount;
        }

        // Format dữ liệu trả về
        return {
          ma_giao_dich: transaction.transaction_code,
          ngay_giao_dich: transaction.transaction_date,
          loai: CustomerReportService.getTransactionTypeDisplay(transaction.type),
          gia_tri: transaction.amount,
          du_no: runningBalance,
          mo_ta: transaction.description,
          order_id: transaction.order_id,
          invoice_id: transaction.invoice_id,
          transaction_id: transaction.transaction_id,
          order_code: transaction.order_code,
          invoice_code: transaction.invoice_code,
          status: transaction.status
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
  getTransactionTypeDisplay: (type) => {
    const typeMap = {
      'pending': 'Tạo đơn hàng',
      'partial_paid': 'Thanh toán một phần',
      'payment': 'Thanh toán',
      'completed': 'Hoàn tất',
      'cancelled': 'Hủy bỏ'
    };
    return typeMap[type] || type;
  },
};

module.exports = CustomerReportService;
