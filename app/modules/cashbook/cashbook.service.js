const db = require("../../config/db.config");
const TransactionModel = require("../transactions/transaction.model");
const OrderModel = require("../orders/order.model");
const PurchaseOrderModel = require("../purchaseOrder/purchaseOrder.model");
const InvoiceModel = require("../invoice/invoice.model");
const CustomerReturn = require("../customer_return/customer_return.model");
const SupplierReturn = require("../supplier_return/supplier_return.model");

const CashbookService = {
  /**
   * Lấy sổ cái giao dịch tổng hợp của toàn bộ hệ thống
   * Bao gồm tất cả giao dịch từ orders, purchase_orders, invoices, returns, transactions
   * theo thứ tự thời gian với dư nợ
   * @param {Object} filters - Các bộ lọc tùy chọn
   * @returns {Array} Mảng các giao dịch với dư nợ
   */
  getSystemTransactionLedger: async (filters = {}) => {
    try {
      const {
        from_date,
        to_date,
        customer_id,
        supplier_id,
        transaction_type,
        page = 1,
        limit = 50
      } = filters;

      const pageNum = Math.max(1, parseInt(page, 10)) || 1;
      const limitNum = Math.min(200, Math.max(1, parseInt(limit, 10))) || 50;
      const offset = (pageNum - 1) * limitNum;

      // 1. Lấy tất cả đơn hàng bán
      let orderWhere = "WHERE o.is_active = 1";
      const orderParams = [];
      if (from_date) {
        orderWhere += " AND o.created_at >= ?";
        orderParams.push(from_date);
      }
      if (to_date) {
        orderWhere += " AND o.created_at <= ?";
        orderParams.push(to_date);
      }
      if (customer_id) {
        orderWhere += " AND o.customer_id = ?";
        orderParams.push(customer_id);
      }

      const ordersSql = `
        SELECT 
          o.order_id,
          o.order_code,
          o.created_at,
          o.order_status,
          o.final_amount,
          o.amount_paid,
          o.customer_id,
          c.customer_name,
          'order' as source_type
        FROM orders o
        LEFT JOIN customers c ON o.customer_id = c.customer_id
        ${orderWhere}
        ORDER BY o.created_at ASC
      `;
      const [orders] = await db.promise().query(ordersSql, orderParams);

      // 2. Lấy tất cả đơn hàng mua
      let poWhere = "WHERE 1=1";
      const poParams = [];
      if (from_date) {
        poWhere += " AND po.created_at >= ?";
        poParams.push(from_date);
      }
      if (to_date) {
        poWhere += " AND po.created_at <= ?";
        poParams.push(to_date);
      }
      if (supplier_id) {
        poWhere += " AND po.supplier_id = ?";
        poParams.push(supplier_id);
      }

      const purchaseOrdersSql = `
        SELECT 
          po.po_id,
          po.created_at,
          po.status,
          po.total_amount,
          po.supplier_id,
          s.supplier_name,
          'purchase_order' as source_type
        FROM purchase_orders po
        LEFT JOIN suppliers s ON po.supplier_id = s.supplier_id
        ${poWhere}
        ORDER BY po.created_at ASC
      `;
      const [purchaseOrders] = await db.promise().query(purchaseOrdersSql, poParams);

      // 3. Lấy tất cả hóa đơn (chỉ để tham khảo, không add trực tiếp vào allTransactions)
      let invoiceWhere = "WHERE 1=1";
      const invoiceParams = [];
      if (from_date) {
        invoiceWhere += " AND i.issued_date >= ?";
        invoiceParams.push(from_date);
      }
      if (to_date) {
        invoiceWhere += " AND i.issued_date <= ?";
        invoiceParams.push(to_date);
      }
      if (customer_id) {
        invoiceWhere += " AND i.customer_id = ?";
        invoiceParams.push(customer_id);
      }
      if (supplier_id) {
        invoiceWhere += " AND i.supplier_id = ?";
        invoiceParams.push(supplier_id);
      }

      const invoicesSql = `
        SELECT 
          i.invoice_id,
          i.invoice_code,
          i.issued_date as created_at,
          i.status,
          i.final_amount,
          i.amount_paid,
          i.customer_id,
          i.supplier_id,
          c.customer_name,
          s.supplier_name,
          'invoice' as source_type
        FROM invoices i
        LEFT JOIN customers c ON i.customer_id = c.customer_id
        LEFT JOIN suppliers s ON i.supplier_id = s.supplier_id
        ${invoiceWhere}
        ORDER BY i.issued_date ASC
      `;
      const [invoices] = await db.promise().query(invoicesSql, invoiceParams);

      // 4. Lấy tất cả giao dịch thanh toán
      let transactionWhere = "WHERE 1=1";
      const transactionParams = [];
      if (from_date) {
        transactionWhere += " AND t.created_at >= ?";
        transactionParams.push(from_date);
      }
      if (to_date) {
        transactionWhere += " AND t.created_at <= ?";
        transactionParams.push(to_date);
      }
      if (customer_id) {
        transactionWhere += " AND t.customer_id = ?";
        transactionParams.push(customer_id);
      }
      if (supplier_id) {
        transactionWhere += " AND t.supplier_id = ?";
        transactionParams.push(supplier_id);
      }
      if (transaction_type) {
        transactionWhere += " AND t.type = ?";
        transactionParams.push(transaction_type);
      }

      const transactionsSql = `
        SELECT 
          t.transaction_id,
          t.transaction_code,
          t.created_at,
          t.type,
          t.amount,
          t.category,
          t.payment_method,
          t.description,
          t.customer_id,
          t.supplier_id,
          t.related_type,
          t.related_id,
          c.customer_name,
          s.supplier_name,
          'transaction' as source_type
        FROM transactions t
        LEFT JOIN customers c ON t.customer_id = c.customer_id
        LEFT JOIN suppliers s ON t.supplier_id = s.supplier_id
        ${transactionWhere}
        ORDER BY t.created_at ASC
      `;
      const [transactions] = await db.promise().query(transactionsSql, transactionParams);

      // 5. Lấy tất cả đơn trả hàng (cả khách hàng và nhà cung cấp)
      let returnWhere = "WHERE ro.status IN ('approved', 'completed')";
      const returnParams = [];
      if (from_date) {
        returnWhere += " AND ro.created_at >= ?";
        returnParams.push(from_date);
      }
      if (to_date) {
        returnWhere += " AND ro.created_at <= ?";
        returnParams.push(to_date);
      }
      if (customer_id) {
        returnWhere += " AND ro.customer_id = ?";
        returnParams.push(customer_id);
      }
      if (supplier_id) {
        returnWhere += " AND ro.supplier_id = ?";
        returnParams.push(supplier_id);
      }

      const returnsSql = `
        SELECT 
          ro.return_id,
          ro.order_id,
          ro.po_id,
          ro.created_at,
          ro.status,
          ro.customer_id,
          ro.supplier_id,
          SUM(roi.refund_amount) as total_refund,
          c.customer_name,
          s.supplier_name,
          CASE 
            WHEN ro.customer_id IS NOT NULL THEN 'customer_return'
            WHEN ro.supplier_id IS NOT NULL THEN 'supplier_return'
            ELSE 'unknown'
          END as source_type
        FROM return_orders ro
        JOIN return_order_items roi ON ro.return_id = roi.return_id
        LEFT JOIN customers c ON ro.customer_id = c.customer_id
        LEFT JOIN suppliers s ON ro.supplier_id = s.supplier_id
        ${returnWhere}
        GROUP BY ro.return_id, ro.order_id, ro.po_id, ro.created_at, ro.status, ro.customer_id, ro.supplier_id, c.customer_name, s.supplier_name
        ORDER BY ro.created_at ASC
      `;
      const [returns] = await db.promise().query(returnsSql, returnParams);

      // 7. Tạo danh sách giao dịch tổng hợp
      const allTransactions = [];

      // Xử lý đơn hàng bán
      orders.forEach((order) => {
        if (order.order_status === "Huỷ đơn") return;

        allTransactions.push({
          transaction_code: order.order_code,
          transaction_date: new Date(order.created_at),
          type: "order_created",
          amount: parseFloat(order.final_amount),
          description: `Tạo đơn hàng ${order.order_code} - ${order.order_status}`,
          source_type: order.source_type,
          source_id: order.order_id,
          customer_id: order.customer_id,
          customer_name: order.customer_name,
          supplier_id: null,
          supplier_name: null,
          status: order.order_status,
          created_at: order.created_at,
        });
      });

      // Xử lý đơn hàng mua
      purchaseOrders.forEach((po) => {
        if (po.status === "cancelled" || po.status === "Huỷ đơn") return;

        allTransactions.push({
          transaction_code: `PO-${po.po_id}`,
          transaction_date: new Date(po.created_at),
          type: "purchase_order_created",
          amount: parseFloat(po.total_amount),
          description: `Tạo đơn hàng mua ${po.po_id} - ${po.status}`,
          source_type: po.source_type,
          source_id: po.po_id,
          customer_id: null,
          customer_name: null,
          supplier_id: po.supplier_id,
          supplier_name: po.supplier_name,
          status: po.status,
          created_at: po.created_at,
        });
      });

      // Xử lý hóa đơn (chỉ để tham khảo, không add trực tiếp vào allTransactions)
      // Invoice sẽ được xử lý thông qua transactions có related_type = 'invoice'

      // Xử lý giao dịch thanh toán
      transactions.forEach((transaction) => {
        // Bỏ qua transaction có type = 'refund' vì đã được xử lý ở return_orders
        if (transaction.type === 'refund') return;

        // Kiểm tra xem giao dịch này có liên quan đến order/invoice bị hủy không
        let isCancelled = false;

        // Kiểm tra thông qua order
        if (transaction.related_type === "order") {
          const relatedOrder = orders.find(order => order.order_id === transaction.related_id);
          if (relatedOrder && relatedOrder.order_status === "Huỷ đơn") {
            isCancelled = true;
          }
        }

        // Kiểm tra thông qua invoice
        if (transaction.related_type === "invoice") {
          const relatedInvoice = invoices.find(inv => inv.invoice_id === transaction.related_id);
          if (relatedInvoice && relatedInvoice.status === "cancelled") {
            isCancelled = true;
          }
        }

        // Bỏ qua transaction liên quan đến order/invoice bị hủy
        if (isCancelled) return;

        allTransactions.push({
          transaction_code: transaction.transaction_code,
          transaction_date: new Date(transaction.created_at),
          type: transaction.type,
          amount: parseFloat(transaction.amount),
          description: transaction.description || `Giao dịch ${transaction.transaction_code}`,
          source_type: transaction.source_type,
          source_id: transaction.transaction_id,
          customer_id: transaction.customer_id,
          customer_name: transaction.customer_name,
          supplier_id: transaction.supplier_id,
          supplier_name: transaction.supplier_name,
          category: transaction.category,
          payment_method: transaction.payment_method,
          related_type: transaction.related_type,
          related_id: transaction.related_id,
          status: "completed",
          created_at: transaction.created_at,
        });
      });

      // Xử lý đơn trả hàng (cả khách hàng và nhà cung cấp)
      returns.forEach((ret) => {
        const refundAmount = parseFloat(ret.total_refund) || 0;
        if (refundAmount > 0) {
          if (ret.source_type === 'customer_return') {
            allTransactions.push({
              transaction_code: `TH-${ret.return_id}`,
              transaction_date: new Date(ret.created_at),
              type: "customer_return",
              amount: refundAmount,
              description: `Trả hàng khách hàng - Đơn hàng ${ret.order_id} - ${ret.status}`,
              source_type: ret.source_type,
              source_id: ret.return_id,
              customer_id: ret.customer_id,
              customer_name: ret.customer_name,
              supplier_id: null,
              supplier_name: null,
              status: ret.status,
              created_at: ret.created_at,
            });
          } else if (ret.source_type === 'supplier_return') {
            allTransactions.push({
              transaction_code: `TH-PO-${ret.return_id}`,
              transaction_date: new Date(ret.created_at),
              type: "supplier_return",
              amount: refundAmount,
              description: `Trả hàng nhà cung cấp - Đơn hàng mua ${ret.po_id} - ${ret.status}`,
              source_type: ret.source_type,
              source_id: ret.return_id,
              customer_id: null,
              customer_name: null,
              supplier_id: ret.supplier_id,
              supplier_name: ret.supplier_name,
              status: ret.status,
              created_at: ret.created_at,
            });
          }
        }
      });

      // 8. Sắp xếp theo thời gian (từ mới đến cũ)
      allTransactions.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      // 9. Tính toán dư nợ
      const reversedTransactions = [...allTransactions].reverse();
      let runningBalance = 0;
      const calculatedBalances = [];

      reversedTransactions.forEach((transaction) => {
        if (transaction.type === "order_created" || transaction.type === "purchase_order_created") {
          // Tạo nợ (khách hàng nợ doanh nghiệp)
          runningBalance += transaction.amount;
        } else if (transaction.type === "receipt" || transaction.type === "payment" || transaction.type === "customer_return" || transaction.type === "supplier_return") {
          // Thanh toán hoặc trả hàng (giảm nợ)
          if (runningBalance < 0) {
            // Nếu đang dư nợ âm (doanh nghiệp nợ khách), thì cộng vào để giảm nợ
            runningBalance += transaction.amount;
          } else {
            runningBalance -= transaction.amount;
          }
        }
        calculatedBalances.push(runningBalance);
      });

      calculatedBalances.reverse();

      // 10. Format kết quả
      const result = allTransactions.map((transaction, index) => {
        // Tạo thông báo theo loại giao dịch
        let thong_bao = "";
        const formatAmount = (amount) => {
          return new Intl.NumberFormat('vi-VN').format(amount);
        };

        switch (transaction.type) {
          case "order_created":
            thong_bao = `${transaction.customer_name || 'Khách hàng'} vừa tạo đơn hàng với giá trị ${formatAmount(transaction.amount)}`;
            break;
          case "purchase_order_created":
            thong_bao = `Đơn hàng mua được tạo từ ${transaction.supplier_name || 'Nhà cung cấp'} với giá trị ${formatAmount(transaction.amount)}`;
            break;
          case "receipt":
            // Kiểm tra nếu category là other_receipt thì sử dụng description
            if (transaction.category === "other_receipt") {
              thong_bao = `${transaction.description} với giá trị ${formatAmount(transaction.amount)}` || `Thu tiền khác với giá trị ${formatAmount(transaction.amount)}`;
            } else {
              thong_bao = `${transaction.customer_name || 'Khách hàng'} vừa thanh toán với giá trị ${formatAmount(transaction.amount)}`;
            }
            break;
          case "payment":
            // Kiểm tra nếu category là other_payment thì sử dụng description
            if (transaction.category === "other_payment") {
              thong_bao = `${transaction.description} với giá trị ${formatAmount(transaction.amount)}` || `Thanh toán khác với giá trị ${formatAmount(transaction.amount)}`;
            } else {
              thong_bao = `Thanh toán cho ${transaction.supplier_name || 'Nhà cung cấp'} với giá trị ${formatAmount(transaction.amount)}`;
            }
            break;
          case "customer_return":
            thong_bao = `${transaction.customer_name || 'Khách hàng'} vừa nhận hàng trả với giá trị ${formatAmount(transaction.amount)}`;
            break;
          case "supplier_return":
            thong_bao = `Trả hàng cho ${transaction.supplier_name || 'Nhà cung cấp'} với giá trị ${formatAmount(transaction.amount)}`;
            break;
          default:
            thong_bao = `Giao dịch ${transaction.transaction_code} với giá trị ${formatAmount(transaction.amount)}`;
        }

        return {
          transaction_code: transaction.transaction_code,
          transaction_date: transaction.transaction_date,
          transaction_type: transaction.type,
          amount: transaction.amount,
          running_balance: calculatedBalances[index],
          description: transaction.description,
          notification: thong_bao, // Thêm trường thông báo
          source_type: transaction.source_type,
          source_id: transaction.source_id,
          customer_id: transaction.customer_id,
          customer_name: transaction.customer_name,
          supplier_id: transaction.supplier_id,
          supplier_name: transaction.supplier_name,
          category: transaction.category,
          payment_method: transaction.payment_method,
          related_type: transaction.related_type,
          related_id: transaction.related_id,
          status: transaction.status,
          created_at: transaction.created_at,
        };
      });

      // 11. Phân trang
      const total = result.length;
      const paginatedResult = result.slice(offset, offset + limitNum);
      const totalPages = Math.ceil(total / limitNum);

      return {
        transactions: paginatedResult,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          total_pages: totalPages,
          has_next: pageNum < totalPages,
          has_prev: pageNum > 1
        }
      };
    } catch (error) {
      console.error("🚀 ~ CashbookService: getSystemTransactionLedger - Lỗi:", error);
      throw error;
    }
  },

  /**
   * Lấy thống kê tổng hợp giao dịch hệ thống
   * @param {Object} filters - Các bộ lọc
   * @returns {Object} Thống kê tổng hợp
   */
  getSystemTransactionSummary: async (filters = {}) => {
    try {
      const { from_date, to_date, customer_id, supplier_id } = filters;

      // Xây dựng điều kiện WHERE
      let whereConditions = [];
      const params = [];

      if (from_date) {
        whereConditions.push("created_at >= ?");
        params.push(from_date);
      }
      if (to_date) {
        whereConditions.push("created_at <= ?");
        params.push(to_date);
      }
      if (customer_id) {
        whereConditions.push("customer_id = ?");
        params.push(customer_id);
      }
      if (supplier_id) {
        whereConditions.push("supplier_id = ?");
        params.push(supplier_id);
      }

      const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(" AND ")} ` : "";

      // Thống kê theo loại giao dịch
      const summarySql = `
              SELECT
              type,
                COUNT(*) as count,
                SUM(amount) as total_amount
        FROM transactions
        ${whereClause}
        GROUP BY type
                `;
      const [summaryRows] = await db.promise().query(summarySql, params);

      // Thống kê theo category
      const categorySql = `
              SELECT
              category,
                COUNT(*) as count,
                SUM(amount) as total_amount
        FROM transactions
        ${whereClause}
        GROUP BY category
      `;
      const [categoryRows] = await db.promise().query(categorySql, params);

      // Tổng thu chi
      const totalReceipt = summaryRows.find(row => row.type === 'receipt')?.total_amount || 0;
      const totalPayment = summaryRows.find(row => row.type === 'payment')?.total_amount || 0;
      const balance = totalReceipt - totalPayment;

      // Tạo thông báo tổng hợp
      const formatAmount = (amount) => {
        return new Intl.NumberFormat('vi-VN').format(amount);
      };

      const summary_notification = `Tổng thu: ${formatAmount(totalReceipt)}, Tổng chi: ${formatAmount(totalPayment)}, Số dư: ${formatAmount(balance)} `;

      return {
        summary_by_type: summaryRows,
        summary_by_category: categoryRows,
        totals: {
          total_receipt: parseFloat(totalReceipt),
          total_payment: parseFloat(totalPayment),
          balance: parseFloat(balance),
          total_transactions: summaryRows.reduce((sum, row) => sum + parseInt(row.count), 0)
        },
        summary_notification: summary_notification
      };
    } catch (error) {
      console.error("🚀 ~ CashbookService: getSystemTransactionSummary - Lỗi:", error);
      throw error;
    }
  },

  /**
   * Lấy hoạt động gần đây tổng hợp (giao dịch + đăng nhập)
   * @param {Object} filters - Các bộ lọc
   * @returns {Object} Danh sách hoạt động tổng hợp
   */
  getRecentActivitiesCombined: async (filters = {}) => {
    try {
      const {
        limit = 10,
        hours = 24,
        include_alerts = true
      } = filters;

      const hoursAgo = new Date();
      hoursAgo.setHours(hoursAgo.getHours() - hours);

      // 1. Lấy các giao dịch gần đây
      const recentTransactionsSql = `
              SELECT
              t.transaction_code as id,
                t.created_at as timestamp,
                'transaction' as activity_type,
                t.type as sub_type,
                t.amount,
                t.description,
                t.category,
                t.customer_id,
                t.supplier_id,
                c.customer_name,
                s.supplier_name,
                'completed' as status
         FROM transactions t
         LEFT JOIN customers c ON t.customer_id = c.customer_id
         LEFT JOIN suppliers s ON t.supplier_id = s.supplier_id
         WHERE t.created_at >= ?
                ORDER BY t.created_at DESC
              LIMIT ?
                `;
      const [recentTransactions] = await db.promise().query(recentTransactionsSql, [hoursAgo, limit]);

      // 2. Lấy các đơn hàng gần đây
      const recentOrdersSql = `
        SELECT
              o.order_code as id,
                o.created_at as timestamp,
                'order' as activity_type,
                'created' as sub_type,
                o.final_amount as amount,
                CONCAT('Order ', o.order_code, ' - ', o.order_status) as description,
                o.customer_id,
                NULL as supplier_id,
                c.customer_name,
                NULL as supplier_name,
                o.order_status as status
        FROM orders o
        LEFT JOIN customers c ON o.customer_id = c.customer_id
        WHERE o.created_at >= ? AND o.is_active = 1
        ORDER BY o.created_at DESC
              LIMIT ?
                `;
      const [recentOrders] = await db.promise().query(recentOrdersSql, [hoursAgo, limit]);

      // 3. Lấy các đơn hàng mua gần đây
      const recentPurchaseOrdersSql = `
        SELECT
              CONCAT('PO-', po.po_id) as id,
                po.created_at as timestamp,
                'purchase_order' as activity_type,
                'created' as sub_type,
                po.total_amount as amount,
                CONCAT('Purchase Order ', po.po_id, ' - ', po.status) as description,
                NULL as customer_id,
                po.supplier_id,
                NULL as customer_name,
                s.supplier_name,
                po.status as status
        FROM purchase_orders po
        LEFT JOIN suppliers s ON po.supplier_id = s.supplier_id
        WHERE po.created_at >= ?
                ORDER BY po.created_at DESC
              LIMIT ?
                `;
      const [recentPurchaseOrders] = await db.promise().query(recentPurchaseOrdersSql, [hoursAgo, limit]);

      // 4. Tổng hợp tất cả hoạt động
      const allActivities = [
        ...recentTransactions,
        ...recentOrders,
        ...recentPurchaseOrders
      ];

      // 5. Sắp xếp theo thời gian (mới nhất trước)
      allActivities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      // 6. Tạo thông báo cho từng hoạt động
      const formatAmount = (amount) => {
        return new Intl.NumberFormat('vi-VN').format(amount);
      };

      const activitiesWithNotifications = allActivities.map(activity => {
        let notification = '';
        let icon = '';

        switch (activity.activity_type) {
          case 'transaction':
            if (activity.sub_type === 'receipt') {
              // Kiểm tra nếu category là other_receipt thì sử dụng description
              if (activity.category === 'other_receipt') {
                notification = `${activity.description} với giá trị ${formatAmount(activity.amount)}` || `Thu tiền khác với giá trị ${formatAmount(activity.amount)}`;
              } else {
                notification = `${activity.customer_name || 'Khách hàng'} vừa thanh toán với giá trị ${formatAmount(activity.amount)}`;
              }
              icon = '💰';
            } else if (activity.sub_type === 'payment') {
              // Kiểm tra nếu có category và là other_payment thì sử dụng description
              if (activity.category === 'other_payment') {
                notification = `${activity.description} với giá trị ${formatAmount(activity.amount)}` || `Thanh toán khác với giá trị ${formatAmount(activity.amount)}`;
              } else {
                notification = `Thanh toán cho ${activity.supplier_name || 'Nhà cung cấp'} với giá trị ${formatAmount(activity.amount)}`;
              }
              icon = '💸';
            } else {
              notification = `Giao dịch ${activity.id} với giá trị ${formatAmount(activity.amount)}`;
              icon = '💳';
            }
            break;
          case 'order':
            notification = `${activity.customer_name || 'Khách hàng'} vừa tạo đơn hàng với giá trị ${formatAmount(activity.amount)} `;
            icon = '📦';
            break;
          case 'purchase_order':
            notification = `Đơn hàng mua được tạo từ ${activity.supplier_name || 'Nhà cung cấp'} với giá trị ${formatAmount(activity.amount)} `;
            icon = '🛒';
            break;
          default:
            notification = `Hoạt động ${activity.id} đã được xử lý`;
            icon = '📊';
        }

        return {
          ...activity,
          notification,
          icon,
          time_ago: getTimeAgo(activity.timestamp)
        };
      });

      // 7. Phát hiện hoạt động bất thường
      let alerts = [];
      if (include_alerts) {
        // Kiểm tra số lượng giao dịch bất thường
        const transactionCount = recentTransactions.length;
        if (transactionCount > 20) {
          alerts.push({
            type: 'high_activity',
            message: `Có ${transactionCount} giao dịch trong ${hours} giờ qua - cần kiểm tra`,
            severity: 'warning',
            icon: '📈'
          });
        }

        // Kiểm tra giao dịch có giá trị lớn
        const largeTransactions = recentTransactions.filter(t => parseFloat(t.amount) > 10000000);
        if (largeTransactions.length > 0) {
          alerts.push({
            type: 'large_transaction',
            message: `Có ${largeTransactions.length} giao dịch có giá trị lớn cần kiểm tra`,
            severity: 'info',
            icon: '💰'
          });
        }
      }

      return {
        activities: activitiesWithNotifications.slice(0, limit),
        alerts: alerts,
        summary: {
          total_activities: allActivities.length,
          time_period: `${hours} giờ`,
          last_updated: new Date().toISOString(),
          breakdown: {
            transactions: recentTransactions.length,
            orders: recentOrders.length,
            purchase_orders: recentPurchaseOrders.length
          }
        }
      };
    } catch (error) {
      console.error("🚀 ~ CashbookService: getRecentActivitiesCombined - Lỗi:", error);
      throw error;
    }
  }
};

// Helper function để tính thời gian trước
function getTimeAgo(timestamp) {
  const now = new Date();
  const activityTime = new Date(timestamp);
  const diffInMinutes = Math.floor((now - activityTime) / (1000 * 60));

  if (diffInMinutes < 1) return 'Vừa xong';
  if (diffInMinutes < 60) return `${diffInMinutes} phút trước`;

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours} giờ trước`;

  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays} ngày trước`;
}

module.exports = CashbookService; 