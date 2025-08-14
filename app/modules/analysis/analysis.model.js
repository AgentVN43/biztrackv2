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
const { processDateFilters } = require("../../utils/dateUtils");

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
              //console.warn(`Operator "${operator}" không được hỗ trợ.`);
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
      //console.error("Lỗi ở Model khi lấy hóa đơn với bộ lọc:", error);
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
              //console.warn(`Operator "${operator}" không được hỗ trợ.`);
          }
        }
      }
    }

    const query = `SELECT COUNT(*) AS total FROM invoices ${whereClause}`;
    try {
      const [results] = await db.promise().query(query);
      return results[0].total;
    } catch (error) {
      //console.error("Lỗi ở Model khi đếm hóa đơn với bộ lọc:", error);
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
            ${period && period.toLowerCase() !== "total_range"
          ? `DATE_FORMAT(t.created_at, "${period === "daily" ? "%Y-%m-%d" : "%Y-%m"
          }") AS time_period,`
          : ""
        }
            SUM(t.amount) AS actual_revenue
        FROM transactions t
        WHERE t.type IN ('receipt')
          AND (t.related_type IS NULL OR t.related_id IS NULL)
          ${conditions.length > 0
          ? "AND " +
          conditions
            .map((cond) => cond.replace("i.issued_date", "t.created_at"))
            .join(" AND ")
          : ""
        }
        ${period && period.toLowerCase() !== "total_range"
          ? `GROUP BY DATE_FORMAT(t.created_at, "${period === "daily" ? "%Y-%m-%d" : "%Y-%m"
          }")`
          : ""
        }
        ${period && period.toLowerCase() !== "total_range"
          ? `ORDER BY time_period`
          : ""
        };
      `;

      // 3. Công nợ phải thu được tính toán từ: revenue_by_invoice - actual_revenue

      //console.log("1. Revenue by Invoice:", revenueByInvoiceQuery);
      // //console.log(
      //   "2a. Actual Revenue from Orders:",
      //   actualRevenueFromOrdersQuery
      // );
      // //console.log(
      //   "2b. Actual Revenue from Direct:",
      //   actualRevenueFromDirectQuery
      // );
      // //console.log(
      //   "3. Outstanding Receivables: Calculated from revenue_by_invoice - actual_revenue"
      // );

      const [revenueByInvoiceResults] = await db
        .promise()
        .query(revenueByInvoiceQuery);
      const [actualRevenueFromOrdersResults] = await db
        .promise()
        .query(actualRevenueFromOrdersQuery);
      const [actualRevenueFromDirectResults] = await db
        .promise()
        .query(actualRevenueFromDirectQuery);

      // Kết hợp kết quả
      const combinedResults = [];

      if (!period || period.toLowerCase() === "total_range") {
        // Trường hợp total_range - trả về tổng
        const revenueByInvoice = parseFloat(
          revenueByInvoiceResults[0]?.revenue_by_invoice || 0
        );
        const actualRevenueFromOrders = parseFloat(
          actualRevenueFromOrdersResults[0]?.actual_revenue || 0
        );
        const actualRevenueFromDirect = parseFloat(
          actualRevenueFromDirectResults[0]?.actual_revenue || 0
        );
        const totalActualRevenue =
          actualRevenueFromOrders + actualRevenueFromDirect;

        // Tính công nợ phải thu: Doanh thu theo invoice - Doanh thu thực thu
        const outstandingReceivables = revenueByInvoice - totalActualRevenue;

        combinedResults.push({
          revenue_by_invoice: revenueByInvoice,
          actual_revenue: totalActualRevenue,
          actual_revenue_from_orders: actualRevenueFromOrders,
          actual_revenue_from_direct: actualRevenueFromDirect,
          outstanding_receivables: outstandingReceivables,
        });
      } else {
        // Trường hợp có period - trả về theo thời gian
        const timeMap = new Map();

        // Thêm revenue by invoice
        revenueByInvoiceResults.forEach((row) => {
          timeMap.set(row.time_period, {
            time_period: row.time_period,
            revenue_by_invoice: parseFloat(row.revenue_by_invoice || 0),
            actual_revenue: 0,
            actual_revenue_from_orders: 0,
            actual_revenue_from_direct: 0,
            outstanding_receivables: 0,
          });
        });

        // Thêm actual revenue from orders
        actualRevenueFromOrdersResults.forEach((row) => {
          if (timeMap.has(row.time_period)) {
            timeMap.get(row.time_period).actual_revenue_from_orders =
              parseFloat(row.actual_revenue || 0);
          } else {
            timeMap.set(row.time_period, {
              time_period: row.time_period,
              revenue_by_invoice: 0,
              actual_revenue: 0,
              actual_revenue_from_orders: parseFloat(row.actual_revenue || 0),
              actual_revenue_from_direct: 0,
              outstanding_receivables: 0,
            });
          }
        });

        // Thêm actual revenue from direct
        actualRevenueFromDirectResults.forEach((row) => {
          if (timeMap.has(row.time_period)) {
            timeMap.get(row.time_period).actual_revenue_from_direct =
              parseFloat(row.actual_revenue || 0);
          } else {
            timeMap.set(row.time_period, {
              time_period: row.time_period,
              revenue_by_invoice: 0,
              actual_revenue: 0,
              actual_revenue_from_orders: 0,
              actual_revenue_from_direct: parseFloat(row.actual_revenue || 0),
              outstanding_receivables: 0,
            });
          }
        });

        // Tính tổng actual_revenue và outstanding_receivables cho từng time period
        timeMap.forEach((value, key) => {
          value.actual_revenue =
            value.actual_revenue_from_orders + value.actual_revenue_from_direct;
          // Tính công nợ phải thu: Doanh thu theo invoice - Doanh thu thực thu
          value.outstanding_receivables =
            value.revenue_by_invoice - value.actual_revenue;
        });

        combinedResults.push(...Array.from(timeMap.values()));
        if (orderByClause.includes("ORDER BY")) {
          combinedResults.sort((a, b) =>
            a.time_period.localeCompare(b.time_period)
          );
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
      //console.error("Lỗi ở Model khi lấy thống kê công nợ và phải thu:", error);
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
  //     //console.error("Lỗi ở Model khi lấy danh sách order phải thu:", error);
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
  //     //console.error(
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

  async getFinanceManagementByPeriod(query) {
    // 1. Xử lý ngày tháng
    const { effectiveStartDate, effectiveEndDate } = processDateFilters(query);

    // 2. Điều kiện riêng cho từng bảng
    const orderDateConditionParts = [];
    if (effectiveStartDate) orderDateConditionParts.push(`DATE(order_date) >= ${db.escape(effectiveStartDate)}`);
    if (effectiveEndDate) orderDateConditionParts.push(`DATE(order_date) <= ${db.escape(effectiveEndDate)}`);
    const orderDateCondition = orderDateConditionParts.length
      ? " AND " + orderDateConditionParts.join(" AND ")
      : "";

    const returnDateConditionParts = [];
    if (effectiveStartDate) returnDateConditionParts.push(`DATE(return_orders.created_at) >= ${db.escape(effectiveStartDate)}`);
    if (effectiveEndDate) returnDateConditionParts.push(`DATE(return_orders.created_at) <= ${db.escape(effectiveEndDate)}`);
    const returnDateCondition = returnDateConditionParts.length
      ? " AND " + returnDateConditionParts.join(" AND ")
      : "";

    const purchaseDateConditionParts = [];
    if (effectiveStartDate) purchaseDateConditionParts.push(`DATE(posted_at) >= ${db.escape(effectiveStartDate)}`);
    if (effectiveEndDate) purchaseDateConditionParts.push(`DATE(posted_at) <= ${db.escape(effectiveEndDate)}`);
    const purchaseDateCondition = purchaseDateConditionParts.length
      ? " AND " + purchaseDateConditionParts.join(" AND ")
      : "";

    const transactionDateConditionParts = [];
    if (effectiveStartDate) transactionDateConditionParts.push(`DATE(created_at) >= ${db.escape(effectiveStartDate)}`);
    if (effectiveEndDate) transactionDateConditionParts.push(`DATE(created_at) <= ${db.escape(effectiveEndDate)}`);
    const transactionDateCondition = transactionDateConditionParts.length
      ? " AND " + transactionDateConditionParts.join(" AND ")
      : "";

    // 3. Query con
    const revenueQuery = `
      SELECT DATE(order_date) AS time_period, SUM(final_amount) AS revenue
      FROM orders
      WHERE order_status = 'Hoàn tất'${orderDateCondition}
      GROUP BY time_period
      ORDER BY time_period
    `;

    const refundOrderQuery = `
      SELECT DATE(return_orders.created_at) AS time_period, SUM(roi.refund_amount) AS total_order_return
      FROM return_orders
      JOIN return_order_items roi ON return_orders.return_id = roi.return_id
      WHERE type = 'customer_return' AND status = 'completed'${returnDateCondition}
      GROUP BY time_period
      ORDER BY time_period
    `;

    const expenseQuery = `
      SELECT DATE(posted_at) AS time_period, SUM(total_amount) AS expense
      FROM purchase_orders
      WHERE status = 'posted'${purchaseDateCondition}
      GROUP BY time_period
      ORDER BY time_period
    `;

    const refundPurchaseOrderQuery = `
      SELECT DATE(return_orders.created_at) AS time_period, SUM(roi.refund_amount) AS total_purchase_return
      FROM return_orders
      JOIN return_order_items roi ON return_orders.return_id = roi.return_id
      WHERE type = 'supplier_return' AND status = 'approved'${returnDateCondition}
      GROUP BY time_period
      ORDER BY time_period
    `;

    const cashFlowRevenueQuery = `
      SELECT DATE(created_at) AS time_period, SUM(amount) AS cashFlowRevenue
      FROM transactions
      WHERE category = 'other_receipt'${transactionDateCondition}
      GROUP BY time_period
      ORDER BY time_period
    `;

    const cashFlowExpenseQuery = `
      SELECT DATE(created_at) AS time_period, SUM(amount) AS cashFlowExpense
      FROM transactions
      WHERE category = 'other_payment'${transactionDateCondition}
      GROUP BY time_period
      ORDER BY time_period
    `;

    // 3. Thực thi song song
    const [
      [revenueResults],
      [refundOrderResults],
      [expenseResults],
      [refundPurchaseOrderResults],
      [cashFlowRevenueResults],
      [cashFlowExpenseResults],
    ] = await Promise.all([
      db.promise().query(revenueQuery),
      db.promise().query(refundOrderQuery),
      db.promise().query(expenseQuery),
      db.promise().query(refundPurchaseOrderQuery),
      db.promise().query(cashFlowRevenueQuery),
      db.promise().query(cashFlowExpenseQuery),
    ]);
    // Merge theo time_period, format lại time_period về dạng YYYY-MM-DD
    const getDefaultRow = () => ({
      revenue: 0,
      expense: 0,
      total_order_return: 0,
      total_purchase_return: 0,
      cashFlowRevenue: 0,
      cashFlowExpense: 0,
    });

    const datasets = [
      { data: revenueResults, key: 'revenue' },
      { data: expenseResults, key: 'expense' },
      { data: refundOrderResults, key: 'total_order_return' },
      { data: refundPurchaseOrderResults, key: 'total_purchase_return' },
      { data: cashFlowRevenueResults, key: 'cashFlowRevenue' },
      { data: cashFlowExpenseResults, key: 'cashFlowExpense' },
    ];

    const merged = {};

    const formatDate = (dateStr) => {
      // Nếu đã đúng ISO thì trả về, nếu không thì cố gắng parse
      if (!dateStr) return dateStr;
      // Nếu đã là YYYY-MM-DD
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
      // Nếu là Date object
      const d = new Date(dateStr);
      if (!isNaN(d)) {
        return d.toISOString().slice(0, 10);
      }
      return dateStr;
    };

    datasets.forEach(({ data, key }) => {
      data.forEach((row) => {
        const formattedTime = formatDate(row.time_period);
        if (!merged[formattedTime]) {
          merged[formattedTime] = getDefaultRow();
        }
        merged[formattedTime] = {
          ...merged[formattedTime],
          [key]: Number(row[key]) || 0,
        };
      });
    });

    return merged;

  },

  // async getFinanceManagementByPeriod({ type = "month", year, month }) {
  //   // 1. Xác định thời gian bắt đầu và format
  //   // let startDate;
  //   // if (type === "day" && year && month) {
  //   //   startDate = `${year}-${String(month).padStart(2, "0")}`;
  //   // } else if (year) {
  //   //   startDate = `${year}`;
  //   // }

  //   let startDate;
  //   // if (type === "month") {
  //   //   startDate = year ? `${year}` : undefined;
  //   // } else if (type === "week") {
  //   //   startDate = year ? `${year}` : undefined;
  //   // } else if (type === "day") {
  //   //   if (year && month) {
  //   //     startDate = `${year}-${String(month).padStart(2, "0")}`;
  //   //   } else if (year) {
  //   //     startDate = `${year}`;
  //   //   }
  //   // }

  //   if (year) {
  //     switch (type) {
  //       case "day":
  //         startDate = month
  //           ? `${year}-${String(month).padStart(2, "0")}`
  //           : `${year}`;
  //         break;
  //       case "month":
  //       case "week":
  //         startDate = `${year}`;
  //         break;
  //       default:
  //         startDate = undefined;
  //     }
  //   }

  //   let dateFormat = "%Y-%m";
  //   if (type === "week") dateFormat = "%Y-W%v";
  //   if (type === "day") dateFormat = "%Y-%m-%d";

  //   const condition = (field) =>
  //     startDate ? `AND ${field} >= '${startDate}-01'` : "";

  //   // 2. Các truy vấn
  //   const queries = {
  //     revenue: `
  //     SELECT DATE_FORMAT(created_at, '${dateFormat}') AS time_period, SUM(final_amount) AS revenue
  //     FROM orders
  //     WHERE order_status = 'Hoàn tất' ${condition("created_at")}
  //     GROUP BY time_period ORDER BY time_period
  //   `,
  //     refundOrder: `
  //     SELECT DATE_FORMAT(ro.created_at, '${dateFormat}') AS time_period, SUM(roi.refund_amount) AS total_order_return
  //     FROM return_orders ro
  //     JOIN return_order_items roi ON ro.return_id = roi.return_id
  //     WHERE ro.type = 'customer_return' AND ro.status = 'completed' ${condition(
  //       "ro.created_at"
  //     )}
  //     GROUP BY time_period ORDER BY time_period
  //   `,
  //     expense: `
  //     SELECT DATE_FORMAT(issued_date, '${dateFormat}') AS time_period, SUM(final_amount) AS expense
  //     FROM invoices
  //     WHERE invoice_type = 'purchase_invoice' ${condition("issued_date")}
  //     GROUP BY time_period ORDER BY time_period
  //   `,
  //     refundPurchase: `
  //     SELECT DATE_FORMAT(ro.created_at, '${dateFormat}') AS time_period, SUM(roi.refund_amount) AS total_purchase_return
  //     FROM return_orders ro
  //     JOIN return_order_items roi ON ro.return_id = roi.return_id
  //     WHERE ro.type = 'supplier_return' AND ro.status = 'approved' ${condition(
  //       "ro.created_at"
  //     )}
  //     GROUP BY time_period ORDER BY time_period
  //   `,
  //     cashIn: `
  //     SELECT DATE_FORMAT(created_at, '${dateFormat}') AS time_period, SUM(amount) AS cashFlowRevenue
  //     FROM transactions
  //     WHERE category = 'other_receipt' ${condition("created_at")}
  //     GROUP BY time_period ORDER BY time_period
  //   `,
  //     cashOut: `
  //     SELECT DATE_FORMAT(created_at, '${dateFormat}') AS time_period, SUM(amount) AS cashFlowExpense
  //     FROM transactions
  //     WHERE category = 'other_payment' ${condition("created_at")}
  //     GROUP BY time_period ORDER BY time_period
  //   `,
  //   };

  //   // 3. Thực thi song song
  //   const [
  //     [revenueResults],
  //     [refundResults],
  //     [expenseResults],
  //     [refundPurchaseResults],
  //     [cashInResults],
  //     [cashOutResults],
  //   ] = await Promise.all([
  //     db.promise().query(queries.revenue),
  //     db.promise().query(queries.refundOrder),
  //     db.promise().query(queries.expense),
  //     db.promise().query(queries.refundPurchase),
  //     db.promise().query(queries.cashIn),
  //     db.promise().query(queries.cashOut),
  //   ]);

  //   // 4. Merge tất cả theo time_period
  //   const mergedMap = new Map();

  //   const initRow = (time_period) => {
  //     if (!mergedMap.has(time_period)) {
  //       mergedMap.set(time_period, {
  //         time_period,
  //         revenue: 0,
  //         total_order_return: 0,
  //         expense: 0,
  //         total_purchase_return: 0,
  //         cashFlowRevenue: 0,
  //         cashFlowExpense: 0,
  //       });
  //     }
  //     return mergedMap.get(time_period);
  //   };

  //   const mergeResult = (results, field) => {
  //     results.forEach((row) => {
  //       const r = initRow(row.time_period);
  //       r[field] = Number(row[field]) || 0;
  //     });
  //   };

  //   mergeResult(revenueResults, "revenue");
  //   mergeResult(refundResults, "total_order_return");
  //   mergeResult(expenseResults, "expense");
  //   mergeResult(refundPurchaseResults, "total_purchase_return");
  //   mergeResult(cashInResults, "cashFlowRevenue");
  //   mergeResult(cashOutResults, "cashFlowExpense");

  //   // 5. Convert sang array và tính toán thêm nếu cần
  //   // const result = Array.from(mergedMap.entries()).reduce(
  //   //   (acc, [time_period, item]) => {
  //   //     acc[time_period] = {
  //   //       ...item,
  //   //       netRevenue:
  //   //         item.revenue - item.total_order_return + item.cashFlowRevenue,
  //   //       netExpense:
  //   //         item.expense - item.total_purchase_return + item.cashFlowExpense,
  //   //     };
  //   //     return acc;
  //   //   },
  //   //   {}
  //   // );

  //   const result = {};

  //   for (const [key, item] of mergedMap.entries()) {
  //     result[key] = {
  //       ...item,
  //       netRevenue:
  //         item.revenue - item.total_order_return + item.cashFlowRevenue,
  //       netExpense:
  //         item.expense - item.total_purchase_return + item.cashFlowExpense,
  //     };
  //   }

  //   //console.log(result);
  //   return result;
  // },

  async getTopCustomers(query) {
    // 1. Xử lý ngày tháng
    const { effectiveStartDate, effectiveEndDate } = processDateFilters(query);
    const limit = query.limit ? parseInt(query.limit) : 5;

    // 2. Tạo điều kiện cho orders
    const orderDateConditionParts = [];
    if (effectiveStartDate) orderDateConditionParts.push(`DATE(o.created_at) >= ${db.escape(effectiveStartDate)}`);
    if (effectiveEndDate) orderDateConditionParts.push(`DATE(o.created_at) <= ${db.escape(effectiveEndDate)}`);
    const orderDateCondition = orderDateConditionParts.length > 0
      ? " AND " + orderDateConditionParts.join(" AND ")
      : "";

    // 3. Tạo điều kiện cho return_orders
    const refundDateConditionParts = [];
    if (effectiveStartDate) refundDateConditionParts.push(`DATE(ro.created_at) >= ${db.escape(effectiveStartDate)}`);
    if (effectiveEndDate) refundDateConditionParts.push(`DATE(ro.created_at) <= ${db.escape(effectiveEndDate)}`);
    const refundDateCondition = refundDateConditionParts.length > 0
      ? " AND " + refundDateConditionParts.join(" AND ")
      : "";
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
      LEFT JOIN orders o ON o.customer_id = c.customer_id${orderDateCondition}
      GROUP BY c.customer_id, c.customer_name, c.phone, c.email
    `;

    // Query 2: Lấy tổng số tiền hoàn trả cho từng khách hàng
    const customerRefundQuery = `
      SELECT 
        ro.customer_id,
        c.customer_name, 
        c.phone, 
        c.email,
        IFNULL(SUM(roi.refund_amount), 0) AS total_refund
      FROM return_orders ro
      JOIN return_order_items roi ON ro.return_id = roi.return_id
      LEFT JOIN customers c ON c.customer_id = ro.customer_id
      WHERE ro.type = 'customer_return' AND ro.status = 'completed'${refundDateCondition}
      GROUP BY ro.customer_id
    `;

    // Query 3: Kết hợp thông tin và tính net_spent
    const finalQuery = `
      SELECT 
        cr.customer_id,
        cr.customer_name,
        cr.phone,
        cr.email,
        IFNULL(cr.total_revenue, 0) AS total_revenue,
        IFNULL(crf.total_refund, 0) AS total_refund,
        (cr.total_revenue - IFNULL(crf.total_refund, 0)) AS net_spent,
        cr.total_orders
      FROM (${customerRevenueQuery}) cr
      LEFT JOIN (${customerRefundQuery}) crf ON cr.customer_id = crf.customer_id
      ORDER BY net_spent DESC
      LIMIT ?
    `;

    try {
      // Chạy từng query con để debug
      //console.log('\n=== EXECUTING SUB-QUERIES ===');

      // Query 1: Lấy dữ liệu doanh thu khách hàng
      const [customerRevenueResults] = await db.promise().query(customerRevenueQuery);
      //console.log('Customer Revenue Results:', JSON.stringify(customerRevenueResults, null, 2));

      // Query 2: Lấy dữ liệu hoàn trả khách hàng
      const [customerRefundResults] = await db.promise().query(customerRefundQuery);
      //console.log('Customer Refund Results:', JSON.stringify(customerRefundResults, null, 2));

      // Query cuối cùng
      const [results] = await db.promise().query(finalQuery, [limit]);
      //console.log('Final Results:', JSON.stringify(results, null, 2));
      //console.log('=== END DEBUG ===\n');

      return results;
    } catch (error) {
      //console.error('Error in getTopCustomers:', error);
      throw error;
    }
  },

  async getTopSellingProducts(query) {
    try {
      // 1. Xử lý ngày tháng
      const { effectiveStartDate, effectiveEndDate } = processDateFilters(query);
      const limit = query.limit ? parseInt(query.limit) : 5;

      // 2. Điều kiện thời gian cho orders
      const orderDateConditionParts = [];
      if (effectiveStartDate) orderDateConditionParts.push(`DATE(o.created_at) >= ${db.escape(effectiveStartDate)}`);
      if (effectiveEndDate) orderDateConditionParts.push(`DATE(o.created_at) <= ${db.escape(effectiveEndDate)}`);
      const orderDateCondition = orderDateConditionParts.length > 0
        ? " AND " + orderDateConditionParts.join(" AND ")
        : "";

      // 3. Điều kiện thời gian cho return_orders
      const refundDateConditionParts = [];
      if (effectiveStartDate) refundDateConditionParts.push(`DATE(ro.created_at) >= ${db.escape(effectiveStartDate)}`);
      if (effectiveEndDate) refundDateConditionParts.push(`DATE(ro.created_at)<= ${db.escape(effectiveEndDate)}`);
      const refundDateCondition = refundDateConditionParts.length > 0
        ? " AND " + refundDateConditionParts.join(" AND ")
        : "";

      // Query 1: Lấy thông tin sản phẩm và tổng số lượng bán từ order_details
      const productSalesQuery = `
        SELECT 
          p.product_id,
          p.product_name,
          p.category_id,
          c.category_name,
          IFNULL(SUM(od.quantity), 0) AS total_quantity_sold,
          IFNULL(SUM(od.quantity * od.price), 0) AS total_revenue,
          COUNT(DISTINCT o.order_id) AS total_orders
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.category_id
        LEFT JOIN order_details od ON p.product_id = od.product_id
        LEFT JOIN orders o ON od.order_id = o.order_id
        WHERE (o.order_status = 'Hoàn tất' OR o.order_status IS NULL)${orderDateCondition}
        GROUP BY p.product_id, p.product_name, p.category_id, c.category_name
      `;

      // Query 2: Lấy tổng số lượng hoàn trả cho từng sản phẩm
      const productReturnQuery = `
        SELECT 
          roi.product_id,
          IFNULL(SUM(roi.quantity), 0) AS total_quantity_returned,
          IFNULL(SUM(roi.refund_amount), 0) AS total_refund_amount
        FROM return_order_items roi
        JOIN return_orders ro ON roi.return_id = ro.return_id
        WHERE ro.type = 'customer_return' AND ro.status = 'completed'${refundDateCondition}
        GROUP BY roi.product_id
      `;

      // Query 3: Kết hợp thông tin và tính net sales
      const finalQuery = `
        SELECT 
          ps.product_id,
          ps.product_name,
          ps.category_id,
          ps.category_name,
          (ps.total_quantity_sold - IFNULL(pr.total_quantity_returned, 0)) AS net_quantity_sold,
          (ps.total_revenue - IFNULL(pr.total_refund_amount, 0)) AS net_revenue,
          ps.total_orders,
          IFNULL(pr.total_quantity_returned, 0) AS total_quantity_returned,
          IFNULL(pr.total_refund_amount, 0) AS total_refund,
          IFNULL(ps.total_revenue, 0) AS total_revenue
        FROM (${productSalesQuery}) ps
        LEFT JOIN (${productReturnQuery}) pr ON ps.product_id = pr.product_id
        WHERE (ps.total_quantity_sold - IFNULL(pr.total_quantity_returned, 0)) > 0
        ORDER BY net_quantity_sold DESC, net_revenue DESC
        LIMIT ?
      `;

      //console.log('\n=== EXECUTING TOP SELLING PRODUCTS QUERIES ===');

      // Query 1: Lấy dữ liệu bán hàng sản phẩm
      const [productSalesResults] = await db.promise().query(productSalesQuery);
      //console.log('Product Sales Results Count:', productSalesResults.length);

      // Query 2: Lấy dữ liệu hoàn trả sản phẩm
      const [productReturnResults] = await db.promise().query(productReturnQuery);
      //console.log('Product Return Results Count:', productReturnResults.length);

      // Query cuối cùng
      const [results] = await db.promise().query(finalQuery, [limit]);
      //console.log('Final Top Selling Products Results:', JSON.stringify(results, null, 2));
      //console.log('=== END TOP SELLING PRODUCTS DEBUG ===\n');

      return results;
    } catch (error) {
      //console.error('Error in getTopSellingProducts:', error);
      throw error;
    }
  },

  async getTopPurchasingSuppliers(query) {
    try {
      // 1. Xử lý ngày tháng
      const { effectiveStartDate, effectiveEndDate } = processDateFilters(query);
      //console.log("🚀 ~ getTopPurchasingSuppliers ~ effectiveEndDate:", effectiveEndDate)
      //console.log("🚀 ~ getTopPurchasingSuppliers ~ effectiveStartDate:", effectiveStartDate)
      const limit = query.limit ? parseInt(query.limit) : 5;

      // 2. Điều kiện thời gian cho purchase_orders
      const purchaseDateParts = [];
      if (effectiveStartDate) purchaseDateParts.push(`DATE(po.posted_at) >= ${db.escape(effectiveStartDate)}`);
      if (effectiveEndDate) purchaseDateParts.push(`DATE(po.posted_at) <= ${db.escape(effectiveEndDate)}`);
      const purchaseDateCondition = purchaseDateParts.length > 0 ? " AND " + purchaseDateParts.join(" AND ") : "";

      // 3. Điều kiện thời gian cho return_orders (supplier_return)
      const supplierReturnDateParts = [];
      if (effectiveStartDate) supplierReturnDateParts.push(`DATE(ro.created_at) >= ${db.escape(effectiveStartDate)}`);
      if (effectiveEndDate) supplierReturnDateParts.push(`DATE(ro.created_at) <= ${db.escape(effectiveEndDate)}`);
      const supplierReturnDateCondition = supplierReturnDateParts.length > 0 ? " AND " + supplierReturnDateParts.join(" AND ") : "";

      // Query 1: Lấy dữ liệu nhập hàng từ nhà cung cấp
      const supplierPurchaseQuery = `
      SELECT 
        s.supplier_id,
        s.supplier_name,
        s.phone,
        s.email,
        s.address,
        IFNULL(SUM(po.total_amount), 0) AS total_purchase_amount,
        COUNT(DISTINCT po.po_id) AS total_purchase_orders
      FROM suppliers s
      LEFT JOIN purchase_orders po ON s.supplier_id = po.supplier_id${purchaseDateCondition}
      WHERE po.status = 'posted' OR po.status IS NULL
      GROUP BY s.supplier_id, s.supplier_name, s.phone, s.email, s.address
    `;

      // Query 2: Lấy dữ liệu hoàn trả cho nhà cung cấp
      const supplierReturnQuery = `
      SELECT 
        ro.supplier_id,
        IFNULL(SUM(roi.quantity), 0) AS total_quantity_returned,
        IFNULL(SUM(roi.refund_amount), 0) AS total_refund_amount
      FROM return_orders ro
      JOIN return_order_items roi ON ro.return_id = roi.return_id
      WHERE ro.type = 'supplier_return' AND ro.status = 'approved'${supplierReturnDateCondition}
      GROUP BY ro.supplier_id
    `;

      // Query 3: Kết hợp dữ liệu
      const finalQuery = `
      SELECT 
        sp.supplier_id,
        sp.supplier_name,
        sp.phone,
        sp.email,
        sp.address,
        (sp.total_purchase_amount - IFNULL(sr.total_refund_amount, 0)) AS net_purchase_amount,
        sp.total_purchase_orders,
        IFNULL(sr.total_quantity_returned, 0) AS total_quantity_returned,
        IFNULL(sr.total_refund_amount, 0) AS total_refund_amount,
        IFNULL(sp.total_purchase_amount, 0) AS total_purchase_amount
      FROM (${supplierPurchaseQuery}) sp
      LEFT JOIN (${supplierReturnQuery}) sr ON sp.supplier_id = sr.supplier_id
      WHERE (sp.total_purchase_amount - IFNULL(sr.total_refund_amount, 0)) > 0
      ORDER BY net_purchase_amount DESC
      LIMIT ?
    `;

      //console.log('\n=== EXECUTING TOP PURCHASING SUPPLIERS QUERIES ===');

      const [supplierPurchaseResults] = await db.promise().query(supplierPurchaseQuery);
      //console.log('Supplier Purchase Results Count:', supplierPurchaseResults.length);
      //console.log('Supplier Purchase', supplierPurchaseResults);

      const [supplierReturnResults] = await db.promise().query(supplierReturnQuery);
      //console.log('Supplier Return Results Count:', supplierReturnResults.length);
      //console.log('Supplier Return', supplierReturnResults);

      const [results] = await db.promise().query(finalQuery, [limit]);
      //console.log('Final Top Purchasing Suppliers Results:', JSON.stringify(results, null, 2));
      //console.log('=== END TOP PURCHASING SUPPLIERS DEBUG ===\n');

      return results;
    } catch (error) {
      //console.error('Error in getTopPurchasingSuppliers:', error);
      throw error;
    }
  },

  async getRevenueByCategory(query) {
    try {
      // 1. Xử lý ngày tháng
      const { effectiveStartDate, effectiveEndDate } = processDateFilters(query);
      const limit = query.limit ? parseInt(query.limit) : 5;

      // 2. Điều kiện thời gian cho category_orders
      const categoryDateParts = [];
      if (effectiveStartDate) categoryDateParts.push(`DATE(o.created_at) >= ${db.escape(effectiveStartDate)}`);
      if (effectiveEndDate) categoryDateParts.push(`DATE(o.created_at) <= ${db.escape(effectiveEndDate)}`);
      const categoryDateCondition = categoryDateParts.length > 0 ? " AND " + categoryDateParts.join(" AND ") : "";

      // 3. Điều kiện thời gian cho return_category
      const categoryReturnDateParts = [];
      if (effectiveStartDate) categoryReturnDateParts.push(`DATE(ro.created_at) >= ${db.escape(effectiveStartDate)}`);
      if (effectiveEndDate) categoryReturnDateParts.push(`DATE(ro.created_at) <= ${db.escape(effectiveEndDate)}`);
      const categoryReturnDateCondition = categoryReturnDateParts.length > 0 ? " AND " + categoryReturnDateParts.join(" AND ") : "";


      // Query 1: Doanh thu bán hàng theo danh mục
      const categorySalesQuery = `
        SELECT 
          c.category_id,
          c.category_name,
          IFNULL(SUM(od.quantity * od.price - od.discount), 0) AS total_sales
        FROM categories c
        JOIN products p ON c.category_id = p.category_id
        JOIN order_details od ON p.product_id = od.product_id
        JOIN orders o ON od.order_id = o.order_id
        WHERE o.order_status = 'Hoàn tất'
          AND o.is_active = 1
          ${categoryDateCondition}
        GROUP BY c.category_id, c.category_name
      `;

      // Query 2: Hoàn trả theo danh mục
      const categoryRefundQuery = `
        SELECT 
          p.category_id,
          IFNULL(SUM(roi.refund_amount), 0) AS total_refund
        FROM return_orders ro
        JOIN return_order_items roi ON ro.return_id = roi.return_id
        JOIN products p ON roi.product_id = p.product_id
        WHERE ro.type = 'customer_return'
          AND ro.status = 'completed'
          ${categoryReturnDateCondition}
        GROUP BY p.category_id
      `;

      // Query 3: Kết hợp và tính doanh thu thuần (net revenue)
      const finalQuery = `
        SELECT 
          cs.category_id,
          cs.category_name,
          (cs.total_sales - IFNULL(cr.total_refund, 0)) AS net_revenue,
          cs.total_sales,
          IFNULL(cr.total_refund, 0) AS total_refund
        FROM (${categorySalesQuery}) cs
        LEFT JOIN (${categoryRefundQuery}) cr ON cs.category_id = cr.category_id
        WHERE (cs.total_sales - IFNULL(cr.total_refund, 0)) > 0
        ORDER BY net_revenue DESC
        LIMIT ?
      `;

      //console.log('\n=== EXECUTING REVENUE BY CATEGORY QUERIES ===');

      const [salesResults] = await db.promise().query(categorySalesQuery);
      //console.log('Category Sales Results Count:', salesResults.length);

      const [refundResults] = await db.promise().query(categoryRefundQuery);
      //console.log('Category Refund Results Count:', refundResults.length);

      const [results] = await db.promise().query(finalQuery, [limit]);
      //console.log('Final Revenue by Category Results:', JSON.stringify(results, null, 2));
      //console.log('=== END REVENUE BY CATEGORY DEBUG ===\n');

      return results;
    } catch (error) {
      //console.error('Error in getRevenueByCategory:', error);
      throw error;
    }
  }

};

module.exports = AnalysisModel;
