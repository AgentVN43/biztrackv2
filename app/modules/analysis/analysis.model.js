const db = require("../../config/db.config");
const {
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  startOfQuarter,
  endOfQuarter,
  parseISO, // Để phân tích chuỗi YYYY-MM-DD
  format,
  isWithinInterval,
  addDays, // Để định dạng Date object thành chuỗi YYYY-MM-DD
} = require("date-fns");

const AnalysisModel = {
  async findInvoicesWithFilters(fields, filter, sort, page, limit) {
    let selectClause = "*";
    if (fields) {
      selectClause = fields
        .split(",")
        .map((field) => db.escapeId(field.trim()))
        .join(", ");
    }

    let whereClause = "WHERE 1=1"; // Default to select all
    if (filter) {
      for (const field in filter) {
        const conditions = filter[field];
        for (const operator in conditions) {
          const value = conditions[operator];
          const escapedField = db.escapeId(field);
          switch (operator.toLowerCase()) {
            case "eq":
              whereClause += ` AND ${escapedField} = ${db.escape(value)}`;
              break;
            case "ne":
              whereClause += ` AND ${escapedField} != ${db.escape(value)}`;
              break;
            case "gt":
              whereClause += ` AND ${escapedField} > ${db.escape(value)}`;
              break;
            case "gte":
              whereClause += ` AND ${escapedField} >= ${db.escape(value)}`;
              break;
            case "lt":
              whereClause += ` AND ${escapedField} < ${db.escape(value)}`;
              break;
            case "lte":
              whereClause += ` AND ${escapedField} <= ${db.escape(value)}`;
              break;
            case "like":
              whereClause += ` AND ${escapedField} LIKE ${db.escape(
                `%${value}%`
              )}`;
              break;
            default:
              console.warn(`Operator "${operator}" không được hỗ trợ.`);
          }
        }
      }
    }

    let orderByClause = "";
    if (sort) {
      const sortFields = sort.split(",");
      const sortParts = sortFields.map((s) => {
        const trimmed = s.trim();
        const direction = trimmed.startsWith("-") ? "DESC" : "ASC";
        const field = db.escapeId(
          direction === "DESC" ? trimmed.substring(1) : trimmed
        );
        return `${field} ${direction}`;
      });
      orderByClause = `ORDER BY ${sortParts.join(", ")}`;
    }

    const limitClause = limit ? `LIMIT ${db.escape(parseInt(limit))}` : "";
    const offsetClause =
      page && limit
        ? `OFFSET ${db.escape((parseInt(page) - 1) * parseInt(limit))}`
        : "";

    const query = `SELECT ${selectClause} FROM invoices ${whereClause} ${orderByClause} ${limitClause} ${offsetClause}`;

    try {
      const [results] = await db.promise().query(query);
      return results;
    } catch (error) {
      console.error("Lỗi ở Model khi lấy hóa đơn với bộ lọc:", error);
      throw error;
    }
  },

  async countInvoicesWithFilters(filter) {
    let whereClause = "WHERE 1=1";
    if (filter) {
      for (const field in filter) {
        const conditions = filter[field];
        for (const operator in conditions) {
          const value = conditions[operator];
          const escapedField = db.escapeId(field);
          switch (operator.toLowerCase()) {
            case "eq":
              whereClause += ` AND ${escapedField} = ${db.escape(value)}`;
              break;
            case "ne":
              whereClause += ` AND ${escapedField} != ${db.escape(value)}`;
              break;
            case "gt":
              whereClause += ` AND ${escapedField} > ${db.escape(value)}`;
              break;
            case "gte":
              whereClause += ` AND ${escapedField} >= ${db.escape(value)}`;
              break;
            case "lt":
              whereClause += ` AND ${escapedField} < ${db.escape(value)}`;
              break;
            case "lte":
              whereClause += ` AND ${escapedField} <= ${db.escape(value)}`;
              break;
            case "like":
              whereClause += ` AND ${escapedField} LIKE ${db.escape(
                `%${value}%`
              )}`;
              break;
            default:
              console.warn(`Operator "${operator}" không được hỗ trợ.`);
          }
        }
      }
    }

    const query = `SELECT COUNT(*) AS total FROM invoices ${whereClause}`;
    try {
      const [results] = await db.promise().query(query);
      return results[0].total;
    } catch (error) {
      console.error("Lỗi ở Model khi đếm hóa đơn với bộ lọc:", error);
      throw error;
    }
  },

  async getRevenueByTimePeriod(period, startDate, endDate) {
    let groupByClause = "";
    let selectTimePeriod = "";
    let orderByClause = "";
    let whereClause =
      "WHERE o.order_status = 'Hoàn tất' AND i.invoice_type = 'sale_invoice'";

    // --- Sử dụng date-fns để xử lý startDate và endDate ---
    let effectiveStartDate = null;
    let effectiveEndDate = null;

    if (startDate) {
      let parsedStartDate;
      if (startDate.match(/^\d{4}-Q[1-4]$/i)) {
        // Định dạng YYYY-Qx
        const [year, quarterNum] = startDate.split("-Q");
        const monthInQuarter = (parseInt(quarterNum) - 1) * 3;
        parsedStartDate = new Date(parseInt(year), monthInQuarter, 1);
        effectiveStartDate = format(
          startOfQuarter(parsedStartDate),
          "yyyy-MM-dd"
        );
        effectiveEndDate = format(endOfQuarter(parsedStartDate), "yyyy-MM-dd");
      } else if (startDate.match(/^\d{4}-\d{2}$/)) {
        // Định dạng YYYY-MM
        parsedStartDate = new Date(`${startDate}-01`);
        effectiveStartDate = format(
          startOfMonth(parsedStartDate),
          "yyyy-MM-dd"
        );
        effectiveEndDate = format(endOfMonth(parsedStartDate), "yyyy-MM-dd");
      } else if (startDate.match(/^\d{4}$/)) {
        // Định dạng YYYY
        parsedStartDate = new Date(`${startDate}-01-01`);
        effectiveStartDate = format(startOfYear(parsedStartDate), "yyyy-MM-dd");
        effectiveEndDate = format(endOfYear(parsedStartDate), "yyyy-MM-dd");
      } else {
        // Định dạng YYYY-MM-DD hoặc các định dạng ISO khác
        try {
          parsedStartDate = parseISO(startDate);
          effectiveStartDate = format(parsedStartDate, "yyyy-MM-dd");
        } catch (e) {
          console.warn(
            `Không thể phân tích startDate: ${startDate}. Sử dụng nguyên bản.`
          );
          effectiveStartDate = startDate;
        }
      }
    }

    if (endDate) {
      try {
        const parsedEndDate = parseISO(endDate);
        effectiveEndDate = format(parsedEndDate, "yyyy-MM-dd");
      } catch (e) {
        console.warn(
          `Không thể phân tích endDate: ${endDate}. Sử dụng nguyên bản.`
        );
        effectiveEndDate = endDate;
      }
    }

    // Xây dựng điều kiện thời gian
    const conditions = [];
    if (effectiveStartDate && effectiveEndDate) {
      conditions.push(
        `DATE(i.issued_date) >= ${db.escape(effectiveStartDate)}`
      );
      conditions.push(`DATE(i.issued_date) <= ${db.escape(effectiveEndDate)}`);
    } else if (effectiveStartDate) {
      conditions.push(`DATE(i.issued_date) = ${db.escape(effectiveStartDate)}`);
    }

    if (conditions.length > 0) {
      whereClause += " AND " + conditions.join(" AND ");
    }

    // Xử lý period để tạo GROUP BY và SELECT
    if (!period || period.toLowerCase() === "total_range") {
      selectTimePeriod = "";
      groupByClause = "";
      orderByClause = "";
    } else {
      switch (period.toLowerCase()) {
        case "day":
          groupByClause = "DATE(i.issued_date)";
          selectTimePeriod =
            "DATE_FORMAT(i.issued_date, '%Y-%m-%d') AS time_period,";
          orderByClause = "ORDER BY time_period";
          break;
        case "week":
          groupByClause = "WEEK(i.issued_date, 3)";
          selectTimePeriod =
            "DATE_FORMAT(i.issued_date, '%Y-W%v') AS time_period,";
          orderByClause = "ORDER BY time_period";
          break;
        case "month":
          groupByClause = 'DATE_FORMAT(i.issued_date, "%Y-%m")';
          selectTimePeriod =
            'DATE_FORMAT(i.issued_date, "%Y-%m") AS time_period,';
          orderByClause = "ORDER BY time_period";
          break;
        case "quarter":
          groupByClause = "YEAR(i.issued_date), QUARTER(i.issued_date)";
          selectTimePeriod =
            "CONCAT(YEAR(i.issued_date), '-Q', QUARTER(i.issued_date)) AS time_period,";
          orderByClause = "ORDER BY time_period";
          break;
        case "year":
          groupByClause = "YEAR(i.issued_date)";
          selectTimePeriod = "YEAR(i.issued_date) AS time_period,";
          orderByClause = "ORDER BY time_period";
          break;
        default:
          throw new Error(
            'Tham số "period" không hợp lệ (day, week, month, quarter, year, total_range).'
          );
      }
    }

    try {
      // 1. Doanh thu theo hóa đơn (theo thời gian)
      const revenueByInvoiceQuery = `
        SELECT
            ${selectTimePeriod}
            SUM(i.final_amount) AS revenue_by_invoice
        FROM invoices i
        INNER JOIN orders o ON i.order_id = o.order_id
        ${whereClause}
        ${groupByClause ? `GROUP BY ${groupByClause}` : ""}
        ${orderByClause};
      `;

      // 2a. Doanh thu thực thu từ giao dịch liên quan đơn hàng
      const actualRevenueFromOrdersQuery = `
        SELECT
            ${selectTimePeriod}
            SUM(t.amount) AS actual_revenue
        FROM transactions t
        INNER JOIN invoices i ON t.related_id = i.invoice_id
        INNER JOIN orders o ON i.order_id = o.order_id
        WHERE t.type IN ('receipt')
          AND t.related_type IN ('order', 'invoice')
          AND o.order_status = 'Hoàn tất'
          AND i.invoice_type = 'sale_invoice'
          ${conditions.length > 0 ? "AND " + conditions.join(" AND ") : ""}
        ${groupByClause ? `GROUP BY ${groupByClause}` : ""}
        ${orderByClause};
      `;

      // 2b. Doanh thu thực thu từ giao dịch độc lập (phiếu thu trực tiếp)
      const actualRevenueFromDirectQuery = `
        SELECT
            ${period && period.toLowerCase() !== "total_range" ?
          `DATE_FORMAT(t.created_at, "${period === 'daily' ? '%Y-%m-%d' : '%Y-%m'}") AS time_period,`
          : ""
        }
            SUM(t.amount) AS actual_revenue
        FROM transactions t
        WHERE t.type IN ('receipt')
          AND (t.related_type IS NULL OR t.related_id IS NULL)
          ${conditions.length > 0 ?
          "AND " + conditions.map(cond => cond.replace('i.issued_date', 't.created_at')).join(" AND ")
          : ""
        }
        ${period && period.toLowerCase() !== "total_range" ?
          `GROUP BY DATE_FORMAT(t.created_at, "${period === 'daily' ? '%Y-%m-%d' : '%Y-%m'}")`
          : ""
        }
        ${period && period.toLowerCase() !== "total_range" ?
          `ORDER BY time_period`
          : ""
        };
      `;

      // 3. Công nợ phải thu được tính toán từ: revenue_by_invoice - actual_revenue

      console.log("1. Revenue by Invoice:", revenueByInvoiceQuery);
      console.log("2a. Actual Revenue from Orders:", actualRevenueFromOrdersQuery);
      console.log("2b. Actual Revenue from Direct:", actualRevenueFromDirectQuery);
      console.log("3. Outstanding Receivables: Calculated from revenue_by_invoice - actual_revenue");

      const [revenueByInvoiceResults] = await db.promise().query(revenueByInvoiceQuery);
      const [actualRevenueFromOrdersResults] = await db.promise().query(actualRevenueFromOrdersQuery);
      const [actualRevenueFromDirectResults] = await db.promise().query(actualRevenueFromDirectQuery);

      // Kết hợp kết quả
      const combinedResults = [];

      if (!period || period.toLowerCase() === "total_range") {
        // Trường hợp total_range - trả về tổng
        const revenueByInvoice = parseFloat(revenueByInvoiceResults[0]?.revenue_by_invoice || 0);
        const actualRevenueFromOrders = parseFloat(actualRevenueFromOrdersResults[0]?.actual_revenue || 0);
        const actualRevenueFromDirect = parseFloat(actualRevenueFromDirectResults[0]?.actual_revenue || 0);
        const totalActualRevenue = actualRevenueFromOrders + actualRevenueFromDirect;

        // Tính công nợ phải thu: Doanh thu theo invoice - Doanh thu thực thu
        const outstandingReceivables = revenueByInvoice - totalActualRevenue;

        combinedResults.push({
          revenue_by_invoice: revenueByInvoice,
          actual_revenue: totalActualRevenue,
          actual_revenue_from_orders: actualRevenueFromOrders,
          actual_revenue_from_direct: actualRevenueFromDirect,
          outstanding_receivables: outstandingReceivables
        });
      } else {
        // Trường hợp có period - trả về theo thời gian
        const timeMap = new Map();

        // Thêm revenue by invoice
        revenueByInvoiceResults.forEach(row => {
          timeMap.set(row.time_period, {
            time_period: row.time_period,
            revenue_by_invoice: parseFloat(row.revenue_by_invoice || 0),
            actual_revenue: 0,
            actual_revenue_from_orders: 0,
            actual_revenue_from_direct: 0,
            outstanding_receivables: 0
          });
        });

        // Thêm actual revenue from orders
        actualRevenueFromOrdersResults.forEach(row => {
          if (timeMap.has(row.time_period)) {
            timeMap.get(row.time_period).actual_revenue_from_orders = parseFloat(row.actual_revenue || 0);
          } else {
            timeMap.set(row.time_period, {
              time_period: row.time_period,
              revenue_by_invoice: 0,
              actual_revenue: 0,
              actual_revenue_from_orders: parseFloat(row.actual_revenue || 0),
              actual_revenue_from_direct: 0,
              outstanding_receivables: 0
            });
          }
        });

        // Thêm actual revenue from direct
        actualRevenueFromDirectResults.forEach(row => {
          if (timeMap.has(row.time_period)) {
            timeMap.get(row.time_period).actual_revenue_from_direct = parseFloat(row.actual_revenue || 0);
          } else {
            timeMap.set(row.time_period, {
              time_period: row.time_period,
              revenue_by_invoice: 0,
              actual_revenue: 0,
              actual_revenue_from_orders: 0,
              actual_revenue_from_direct: parseFloat(row.actual_revenue || 0),
              outstanding_receivables: 0
            });
          }
        });

        // Tính tổng actual_revenue và outstanding_receivables cho từng time period
        timeMap.forEach((value, key) => {
          value.actual_revenue = value.actual_revenue_from_orders + value.actual_revenue_from_direct;
          // Tính công nợ phải thu: Doanh thu theo invoice - Doanh thu thực thu
          value.outstanding_receivables = value.revenue_by_invoice - value.actual_revenue;
        });

        combinedResults.push(...Array.from(timeMap.values()));
        if (orderByClause.includes("ORDER BY")) {
          combinedResults.sort((a, b) => a.time_period.localeCompare(b.time_period));
        }
      }

      return combinedResults;
    } catch (error) {
      console.error(
        "Lỗi ở Model khi lấy thống kê doanh thu (theo order hoàn tất):",
        error
      );
      throw error;
    }
  },

  async getOutstandingDebt() {
    try {
      const query = `
        SELECT
          SUM(CASE WHEN status NOT IN ('paid', 'cancelled') THEN final_amount ELSE 0 END) AS total_outstanding,
          SUM(CASE WHEN invoice_type = 'sale_invoice' AND status NOT IN ('cancelled') THEN final_amount ELSE 0 END) AS total_receivable
        FROM invoices
      `;
      const [results] = await db.promise().query(query);
      return results[0];
    } catch (error) {
      console.error("Lỗi ở Model khi lấy thống kê công nợ và phải thu:", error);
      throw error;
    }
  },

  // async getReceivableOrders() {
  //   try {
  //     const query = `
  //       SELECT
  //         i.invoice_id,
  //         i.invoice_code,
  //         i.order_id,
  //         i.final_amount,
  //         i.status AS invoice_status,
  //         o.order_code,
  //         o.order_date,
  //         o.order_status
  //       FROM invoices i
  //       LEFT JOIN orders o ON i.order_id = o.order_id
  //       WHERE i.invoice_type = 'sale_invoice'
  //         AND i.status NOT IN ('paid', 'cancelled')
  //         AND o.order_status IN ('Mới', 'Xác nhận')
  //     `;
  //     const [results] = await db.promise().query(query);
  //     return results;
  //   } catch (error) {
  //     console.error("Lỗi ở Model khi lấy danh sách order phải thu:", error);
  //     throw error;
  //   }
  // },

  async getReceivableOrders() {
    try {
      const query = `
      SELECT
        o.order_id,
        o.order_code,
        o.order_date,
        o.order_status,
        o.final_amount, -- Lấy final_amount trực tiếp từ bảng orders
        o.customer_id,
        c.customer_name
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.customer_id -- Join với customers để lấy tên khách hàng
      WHERE o.order_status IN ('Mới', 'Xác nhận') -- ✅ Chỉ lọc theo order_status
    `;
      const [results] = await db.promise().query(query);
      return results; // Trả về trực tiếp mảng kết quả
    } catch (error) {
      console.error("Lỗi ở Model khi lấy danh sách order phải thu:", error);
      throw error; // Ném lỗi để Service/Controller xử lý
    }
  },

  // async getPayablePurchaseOrders() {
  //   try {
  //     const query = `
  //       SELECT
  //         i.invoice_id,
  //         i.invoice_code,
  //         i.supplier_id,
  //         i.total_amount AS purchase_amount,
  //         i.status AS invoice_status
  //       FROM invoices i
  //       WHERE i.invoice_type = 'purchase_invoice'
  //         AND i.status NOT IN ('paid', 'cancelled')
  //     `;
  //     const [results] = await db.promise().query(query);
  //     return results;
  //   } catch (error) {
  //     console.error(
  //       "Lỗi ở Model khi lấy danh sách purchase order phải trả:",
  //       error
  //     );
  //     throw error;
  //   }
  // },

  async getPayablePurchaseOrders() {
    try {
      const query = `
        SELECT
          i.invoice_id,
          i.invoice_code,
          i.total_amount AS invoice_amount,
          i.status AS invoice_status,
          po.po_id,
          po.supplier_name,
          po.created_at AS po_date,
          po.status AS po_status
        FROM invoices i
        LEFT JOIN purchase_orders po ON i.order_id = po.po_id -- Join với purchase_orders
        WHERE i.invoice_type = 'purchase_invoice'
          AND i.status NOT IN ('paid', 'cancelled')
          AND po.status = 'posted' -- Chỉ lấy các PO đã được duyệt/posted
      `;
      const [results] = await db.promise().query(query);
      return results;
    } catch (error) {
      console.error(
        "Lỗi ở Model khi lấy danh sách purchase order phải trả:",
        error
      );
      throw error;
    }
  },

  async getFinanceManagementByPeriod({ type = 'month', year, month }) {
    // Xác định period và startDate
    let period = type;
    let startDate;
    if (type === 'month') {
      startDate = year ? `${year}` : undefined;
    } else if (type === 'week') {
      startDate = year ? `${year}` : undefined;
    } else if (type === 'day') {
      if (year && month) {
        startDate = `${year}-${String(month).padStart(2, '0')}`;
      } else if (year) {
        startDate = `${year}`;
      }
    }
    // Xác định định dạng thời gian
    let dateFormat = '%Y-%m';
    if (type === 'week') dateFormat = '%Y-W%v';
    if (type === 'day') dateFormat = '%Y-%m-%d';
    // Doanh thu: hóa đơn bán hàng
    const revenueQuery = `
      SELECT DATE_FORMAT(order_date, '${dateFormat}') AS time_period, SUM(final_amount) AS revenue
      FROM orders
      WHERE order_status != 'Huỷ đơn'
        ${startDate ? `AND order_date >= '${startDate}-01'` : ''}
      GROUP BY time_period
      ORDER BY time_period
    `;
    // Hoàn trả đơn hàng
    const refundOrderQuery = `
      SELECT DATE_FORMAT(return_orders.created_at, '${dateFormat}') AS time_period, SUM(r.refund_amount) AS total_order_return
      FROM return_orders
      JOIN return_order_items r ON return_orders.return_id = r.return_id
      WHERE type = 'customer_return' AND status = 'completed'
        ${startDate ? `AND return_orders.created_at >= '${startDate}-01'` : ''}
      GROUP BY time_period
      ORDER BY time_period
    `;
    // Chi tiêu: hóa đơn mua hàng
    const expenseQuery = `
      SELECT DATE_FORMAT(issued_date, '${dateFormat}') AS time_period, SUM(final_amount) AS expense
      FROM invoices
      WHERE invoice_type = 'purchase_invoice'
        ${startDate ? `AND issued_date >= '${startDate}-01'` : ''}
      GROUP BY time_period
      ORDER BY time_period
    `;

    // Hoàn trả đơn nhập hàng
    const refundPurchaseOrderQuery = `
       SELECT DATE_FORMAT(return_orders.created_at, '${dateFormat}') AS time_period, SUM(r.refund_amount) AS total_purchase_return
      FROM return_orders
      JOIN return_order_items r ON return_orders.return_id = r.return_id
      WHERE type = 'supplier_return' AND status = 'approved'
        ${startDate ? `AND return_orders.created_at >= '${startDate}-01'` : ''}
      GROUP BY time_period
      ORDER BY time_period
      `;

    // Thu trong sổ quỹ
    const cashFlowRevenueQuery = `
    SELECT DATE_FORMAT(created_at, '${dateFormat}') AS time_period, SUM(amount) AS cashFlowRevenue
    FROM transactions
    WHERE category = 'other_receipt'
      ${startDate ? `AND created_at >= '${startDate}-01'` : ''}
    GROUP BY time_period
    ORDER BY time_period
  `;

    // Chi trong sổ quỹ
    const cashFlowExpenseQuery = `
    SELECT DATE_FORMAT(created_at, '${dateFormat}') AS time_period, SUM(amount) AS cashFlowExpense
    FROM transactions
    WHERE category = 'other_payment' 
      ${startDate ? `AND created_at >= '${startDate}-01'` : ''}
    GROUP BY time_period
    ORDER BY time_period
  `;

    const [revenueResults] = await db.promise().query(revenueQuery);
    const [expenseResults] = await db.promise().query(expenseQuery);
    const [refundOrderResults] = await db.promise().query(refundOrderQuery);
    const [refundPurchaseOrderResults] = await db.promise().query(refundPurchaseOrderQuery);
    const [cashFlowRevenueResults] = await db.promise().query(cashFlowRevenueQuery);
    const [cashFlowExpenseResults] = await db.promise().query(cashFlowExpenseQuery);

    // Merge theo time_period
    const merged = {};
    revenueResults.forEach(row => {
      merged[row.time_period] = {
        revenue: Number(row.revenue) || 0,
        expense: 0,
        total_order_return: 0,
        total_purchase_return: 0,
        cashFlowRevenue: 0,
        cashFlowExpense: 0
      };
    });

    expenseResults.forEach(row => {
      if (!merged[row.time_period]) merged[row.time_period] = {
        revenue: 0,
        expense: 0,
        total_order_return: 0,
        total_purchase_return: 0,
        cashFlowRevenue: 0,
        cashFlowExpense: 0
      };
      merged[row.time_period].expense = Number(row.expense) || 0;
    });

    refundOrderResults.forEach(row => {
      if (!merged[row.time_period]) merged[row.time_period] = {
        revenue: 0,
        expense: 0,
        total_order_return: 0,
        total_purchase_return: 0,
        cashFlowRevenue: 0,
        cashFlowExpense: 0
      };
      merged[row.time_period].total_order_return = Number(row.total_order_return) || 0;
    });
    refundPurchaseOrderResults.forEach(row => {
      if (!merged[row.time_period]) merged[row.time_period] = {
        revenue: 0,
        expense: 0,
        total_order_return: 0,
        total_purchase_return: 0,
        cashFlowRevenue: 0,
        cashFlowExpense: 0
      };
      merged[row.time_period].total_purchase_return = Number(row.total_purchase_return) || 0;
    });
    cashFlowRevenueResults.forEach(row => {
      if (!merged[row.time_period]) merged[row.time_period] = {
        revenue: 0,
        expense: 0,
        total_order_return: 0,
        total_purchase_return: 0,
        cashFlowRevenue: 0,
        cashFlowExpense: 0
      };
      merged[row.time_period].cashFlowRevenue = Number(row.cashFlowRevenue) || 0;
    });
    cashFlowExpenseResults.forEach(row => {
      if (!merged[row.time_period]) merged[row.time_period] = {
        revenue: 0,
        expense: 0,
        total_order_return: 0,
        total_purchase_return: 0,
        cashFlowRevenue: 0,
        cashFlowExpense: 0
      };
      merged[row.time_period].cashFlowExpense = Number(row.cashFlowExpense) || 0;
    });
    return merged;
  },

  async getTopCustomers({ startDate, endDate, limit = 5 }) {
    // Lấy top khách hàng theo tổng giá trị mua hàng (final_amount), trừ đi số tiền hoàn trả từ return_order

    // Xây dựng điều kiện thời gian cho orders
    let dateCondition = '';
    if (startDate && endDate) {
      dateCondition = ` AND o.order_date >= ${db.escape(startDate)} AND o.order_date <= ${db.escape(endDate)}`;
    } else if (startDate) {
      dateCondition = ` AND o.order_date >= ${db.escape(startDate)}`;
    } else if (endDate) {
      dateCondition = ` AND o.order_date <= ${db.escape(endDate)}`;
    }

    // Query 1: Lấy thông tin cơ bản của khách hàng và tổng doanh thu từ orders
    const customerRevenueQuery = `
      SELECT 
        c.customer_id, 
        c.customer_name, 
        c.phone, 
        c.email,
        IFNULL(SUM(o.final_amount), 0) AS total_revenue,
        COUNT(DISTINCT o.order_id) AS total_orders
      FROM customers c
      LEFT JOIN orders o ON o.customer_id = c.customer_id${dateCondition}
      GROUP BY c.customer_id, c.customer_name, c.phone, c.email
    `;

    // Query 2: Lấy tổng số tiền hoàn trả cho từng khách hàng
    const customerRefundQuery = `
      SELECT 
        ro.customer_id,
        IFNULL(SUM(roi.refund_amount), 0) AS total_refund
      FROM return_orders ro
      JOIN return_order_items roi ON ro.return_id = roi.return_id
      WHERE ro.type = 'customer_return' AND ro.status = 'completed'
      GROUP BY ro.customer_id
    `;

    // Query 3: Kết hợp thông tin và tính net_spent
    const finalQuery = `
      SELECT 
        cr.customer_id,
        cr.customer_name,
        cr.phone,
        cr.email,
        (cr.total_revenue - IFNULL(crf.total_refund, 0)) AS net_spent,
        cr.total_orders
      FROM (${customerRevenueQuery}) cr
      LEFT JOIN (${customerRefundQuery}) crf ON cr.customer_id = crf.customer_id
      ORDER BY net_spent DESC
      LIMIT ?
    `;

    try {
      // Chạy từng query con để debug
      console.log('\n=== EXECUTING SUB-QUERIES ===');

      // Query 1: Lấy dữ liệu doanh thu khách hàng
      const [customerRevenueResults] = await db.promise().query(customerRevenueQuery);
      console.log('Customer Revenue Results:', JSON.stringify(customerRevenueResults, null, 2));

      // Query 2: Lấy dữ liệu hoàn trả khách hàng
      const [customerRefundResults] = await db.promise().query(customerRefundQuery);
      console.log('Customer Refund Results:', JSON.stringify(customerRefundResults, null, 2));

      // Query cuối cùng
      const [results] = await db.promise().query(finalQuery, [limit]);
      console.log('Final Results:', JSON.stringify(results, null, 2));
      console.log('=== END DEBUG ===\n');

      return results;
    } catch (error) {
      console.error('Error in getTopCustomers:', error);
      throw error;
    }
  },
};

module.exports = AnalysisModel;
