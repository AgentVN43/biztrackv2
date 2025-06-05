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

  // async getRevenueByTimePeriod(period, startDate, endDate) {
  //   let groupByClause;
  //   let dateFormat;

  //   switch (period.toLowerCase()) {
  //     case "day":
  //       groupByClause = "DATE(i.issued_date)";
  //       dateFormat = "%Y-%m-%d";
  //       break;
  //     case "week":
  //       groupByClause = "WEEK(i.issued_date, 3)";
  //       dateFormat = "%Y-W%v";
  //       break;
  //     case "month":
  //       groupByClause = 'DATE_FORMAT(i.issued_date, "%Y-%m")';
  //       dateFormat = "%Y-%m";
  //       break;
  //     case "year":
  //       groupByClause = "YEAR(i.issued_date)";
  //       dateFormat = "%Y";
  //       break;
  //     default:
  //       throw new Error(
  //         'Tham số "period" không hợp lệ (day, week, month, year).'
  //       );
  //   }

  //   let whereClause =
  //     "WHERE o.order_status = 'Hoàn tất' AND i.invoice_type = 'sale_invoice'";
  //   const conditions = [];
  //   if (startDate) {
  //     conditions.push(`DATE(i.issued_date) >= ${db.escape(startDate)}`);
  //   }
  //   if (endDate) {
  //     conditions.push(`DATE(i.issued_date) <= ${db.escape(endDate)}`);
  //   }
  //   if (conditions.length > 0) {
  //     whereClause += " AND " + conditions.join(" AND ");
  //   }

  //   const query = `
  //     SELECT
  //         ${groupByClause} AS time_period,
  //         SUM(i.final_amount) AS total_revenue
  //     FROM invoices i
  //     INNER JOIN orders o ON i.order_id = o.order_id
  //     WHERE o.order_status = 'Hoàn tất' AND i.invoice_type = 'sale_invoice'
  //     GROUP BY time_period
  //     ORDER BY time_period;
  //   `;

  //   try {
  //     const [results] = await db.promise().query(query);
  //     return results;
  //   } catch (error) {
  //     console.error(
  //       "Lỗi ở Model khi lấy thống kê doanh thu (theo order hoàn tất):",
  //       error
  //     );
  //     throw error;
  //   }
  // },

  // async getRevenueByTimePeriod(period, startDate, endDate) {
  //   let groupByClause = "";
  //   let selectTimePeriod = "";
  //   let orderByClause = "";

  //   // Xác định mệnh đề GROUP BY, SELECT và ORDER BY dựa trên 'period'
  //   if (!period || period.toLowerCase() === "total_range") {
  //     // Nếu không có period hoặc period là 'total_range', không nhóm, chỉ tính tổng
  //     selectTimePeriod = ""; // Không chọn cột time_period
  //     groupByClause = ""; // Không có GROUP BY
  //     orderByClause = ""; // Không có ORDER BY
  //   } else {
  //     switch (period.toLowerCase()) {
  //       case "day":
  //         groupByClause = "DATE(i.issued_date)";
  //         selectTimePeriod =
  //           "DATE_FORMAT(i.issued_date, '%Y-%m-%d') AS time_period,"; // Định dạng cho đầu ra rõ ràng
  //         orderByClause = "ORDER BY time_period";
  //         break;
  //       case "week":
  //         // WEEK(date, mode): mode 3 là tuần bắt đầu từ thứ Hai, 0-53
  //         groupByClause = "WEEK(i.issued_date, 3)";
  //         selectTimePeriod =
  //           "DATE_FORMAT(i.issued_date, '%Y-W%v') AS time_period,";
  //         orderByClause = "ORDER BY time_period";
  //         break;
  //       case "month":
  //         groupByClause = 'DATE_FORMAT(i.issued_date, "%Y-%m")';
  //         selectTimePeriod =
  //           'DATE_FORMAT(i.issued_date, "%Y-%m") AS time_period,';
  //         orderByClause = "ORDER BY time_period";
  //         break;
  //       case "year":
  //         groupByClause = "YEAR(i.issued_date)";
  //         selectTimePeriod = "YEAR(i.issued_date) AS time_period,";
  //         orderByClause = "ORDER BY time_period";
  //         break;
  //       default:
  //         throw new Error(
  //           'Tham số "period" không hợp lệ (day, week, month, year, total_range).'
  //         );
  //     }
  //   }

  //   // Xây dựng mệnh đề WHERE
  //   let whereClause =
  //     "WHERE o.order_status = 'Hoàn tất' AND i.invoice_type = 'sale_invoice'";
  //   const conditions = [];
  //   if (startDate) {
  //     conditions.push(`DATE(i.issued_date) >= ${db.escape(startDate)}`);
  //   }
  //   if (endDate) {
  //     conditions.push(`DATE(i.issued_date) <= ${db.escape(endDate)}`);
  //   }
  //   if (conditions.length > 0) {
  //     whereClause += " AND " + conditions.join(" AND ");
  //   }

  //   // Xây dựng câu truy vấn cuối cùng
  //   const query = `
  //     SELECT
  //         ${selectTimePeriod}
  //         SUM(i.final_amount) AS total_revenue
  //     FROM invoices i
  //     INNER JOIN orders o ON i.order_id = o.order_id
  //     ${whereClause}
  //     ${groupByClause ? `GROUP BY ${groupByClause}` : ""}
  //     ${orderByClause};
  //   `;

  //   try {
  //     console.log(
  //       "🚀 ~ AnalysisModel.getRevenueByTimePeriod - Executing query:",
  //       query
  //     );
  //     const [results] = await db.promise().query(query); // ✅ Sử dụng db.promise().query
  //     return results;
  //   } catch (error) {
  //     console.error(
  //       "Lỗi ở Model khi lấy thống kê doanh thu (theo order hoàn tất):",
  //       error
  //     );
  //     throw error;
  //   }
  // },

  // async getRevenueByTimePeriod(period, startDate, endDate) {
  //   let groupByClause = "";
  //   let selectTimePeriod = "";
  //   let orderByClause = "";
  //   let whereClause =
  //     "WHERE o.order_status = 'Hoàn tất' AND i.invoice_type = 'sale_invoice'";
  //   const conditions = [];

  //   // Xử lý startDate và endDate nếu chỉ có định dạng YYYY-MM, YYYY hoặc YYYY-Qx
  //   // Tạo biến cục bộ để lưu trữ giá trị ngày tháng đã được xử lý
  //   let processedStartDate = startDate;
  //   let processedEndDate = endDate;

  //   if (processedStartDate) {
  //     if (!processedStartDate.includes("-")) {
  //       // Chỉ có năm (YYYY)
  //       processedStartDate = `${processedStartDate}-01-01`;
  //       processedEndDate = `${processedStartDate.substring(0, 4)}-12-31`;
  //     } else if (processedStartDate.split("-").length === 2) {
  //       // Chỉ có năm-tháng (YYYY-MM)
  //       const yearMonth = processedStartDate;
  //       processedStartDate = `${yearMonth}-01`;
  //       // Tính ngày cuối cùng của tháng
  //       const lastDayOfMonth = new Date(
  //         parseInt(yearMonth.substring(0, 4)),
  //         parseInt(yearMonth.substring(5, 7)),
  //         0
  //       ).getDate();
  //       processedEndDate = `${yearMonth}-${String(lastDayOfMonth).padStart(
  //         2,
  //         "0"
  //       )}`;
  //     } else if (processedStartDate.match(/^\d{4}-Q[1-4]$/i)) {
  //       // Định dạng YYYY-Qx (ví dụ: 2025-Q1)
  //       const [year, quarterStr] = processedStartDate.split("-Q");
  //       const quarter = parseInt(quarterStr);
  //       let startMonth, endMonth;

  //       if (quarter === 1) {
  //         startMonth = "01";
  //         endMonth = "03";
  //       } else if (quarter === 2) {
  //         startMonth = "04";
  //         endMonth = "06";
  //       } else if (quarter === 3) {
  //         startMonth = "07";
  //         endMonth = "09";
  //       } else if (quarter === 4) {
  //         startMonth = "10";
  //         endMonth = "12";
  //       } else {
  //         throw new Error("Quý không hợp lệ. Quý phải từ 1 đến 4.");
  //       } // Xử lý trường hợp quý không hợp lệ

  //       processedStartDate = `${year}-${startMonth}-01`;
  //       const lastDayOfEndMonth = new Date(
  //         parseInt(year),
  //         parseInt(endMonth),
  //         0
  //       ).getDate();
  //       processedEndDate = `${year}-${endMonth}-${String(
  //         lastDayOfEndMonth
  //       ).padStart(2, "0")}`;
  //     }
  //   }
  //   // Nếu endDate ban đầu không được cung cấp nhưng startDate đã được xử lý thành một khoảng,
  //   // thì gán processedEndDate cho endDate nếu nó vẫn là undefined.
  //   if (endDate === undefined && processedEndDate !== undefined) {
  //     endDate = processedEndDate;
  //   }

  //   if (!period || period.toLowerCase() === "total_range") {
  //     selectTimePeriod = "";
  //     groupByClause = "";
  //     orderByClause = "";
  //   } else {
  //     switch (period.toLowerCase()) {
  //       case "day":
  //         groupByClause = "DATE(i.issued_date)";
  //         selectTimePeriod =
  //           "DATE_FORMAT(i.issued_date, '%Y-%m-%d') AS time_period,";
  //         orderByClause = "ORDER BY time_period";
  //         break;
  //       case "week":
  //         groupByClause = "WEEK(i.issued_date, 3)"; // Mode 3: tuần bắt đầu từ thứ Hai, 0-53
  //         selectTimePeriod =
  //           "DATE_FORMAT(i.issued_date, '%Y-W%v') AS time_period,";
  //         orderByClause = "ORDER BY time_period";
  //         break;
  //       case "month":
  //         groupByClause = 'DATE_FORMAT(i.issued_date, "%Y-%m")';
  //         selectTimePeriod =
  //           'DATE_FORMAT(i.issued_date, "%Y-%m") AS time_period,';
  //         orderByClause = "ORDER BY time_period";
  //         break;
  //       case "quarter": // ✅ Bổ sung trường hợp quý
  //         groupByClause = "YEAR(i.issued_date), QUARTER(i.issued_date)";
  //         selectTimePeriod =
  //           "CONCAT(YEAR(i.issued_date), '-Q', QUARTER(i.issued_date)) AS time_period,";
  //         orderByClause = "ORDER BY time_period";
  //         break;
  //       case "year":
  //         groupByClause = "YEAR(i.issued_date)";
  //         selectTimePeriod = "YEAR(i.issued_date) AS time_period,";
  //         orderByClause = "ORDER BY time_period";
  //         break;
  //       default:
  //         throw new Error(
  //           'Tham số "period" không hợp lệ (day, week, month, quarter, year, total_range).'
  //         );
  //     }
  //   }

  //   // Sử dụng processedStartDate và processedEndDate trong mệnh đề WHERE
  //   if (processedStartDate) {
  //     // ✅ Sử dụng processedStartDate
  //     conditions.push(
  //       `DATE(i.issued_date) >= ${db.escape(processedStartDate)}`
  //     );
  //   }
  //   if (processedEndDate) {
  //     // ✅ Sử dụng processedEndDate
  //     conditions.push(`DATE(i.issued_date) <= ${db.escape(processedEndDate)}`);
  //   }
  //   if (conditions.length > 0) {
  //     whereClause += " AND " + conditions.join(" AND ");
  //   }

  //   const query = `
  //     SELECT
  //         ${selectTimePeriod}
  //         SUM(i.final_amount) AS total_revenue
  //     FROM invoices i
  //     INNER JOIN orders o ON i.order_id = o.order_id
  //     ${whereClause}
  //     ${groupByClause ? `GROUP BY ${groupByClause}` : ""}
  //     ${orderByClause};
  //   `;

  //   try {
  //     console.log(
  //       "🚀 ~ AnalysisModel.getRevenueByTimePeriod - Executing query:",
  //       query
  //     );
  //     const [results] = await db.promise().query(query);
  //     return results;
  //   } catch (error) {
  //     console.error(
  //       "Lỗi ở Model khi lấy thống kê doanh thu (theo order hoàn tất):",
  //       error
  //     );
  //     throw error;
  //   }
  // },

  async getRevenueByTimePeriod(period, startDate, endDate) {
    let groupByClause = "";
    let selectTimePeriod = "";
    let orderByClause = "";
    let whereClause =
      "WHERE o.order_status = 'Hoàn tất' AND i.invoice_type = 'sale_invoice'";
    // const conditions = []; // Đã sửa lỗi khai báo trùng lặp này ở lần trước

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

          if (startDate?.match(/^\d{4}-\d{2}$/)) {
            const parsedStartDate = parseISO(`${startDate}-01`);
            const firstDayOfMonth = startOfMonth(parsedStartDate);
            const lastDayOfMonth = endOfMonth(parsedStartDate);
            let currentDate = firstDayOfMonth;
            const allDays = [];

            while (
              isWithinInterval(currentDate, {
                start: firstDayOfMonth,
                end: lastDayOfMonth,
              })
            ) {
              allDays.push(format(currentDate, "yyyy-MM-dd"));
              currentDate = addDays(currentDate, 1);
            }

            const query = `
            SELECT
              DATE_FORMAT(i.issued_date, '%Y-%m-%d') AS time_period,
              SUM(i.final_amount) AS total_revenue
            FROM invoices i
            INNER JOIN orders o ON i.order_id = o.order_id
            WHERE o.order_status = 'Hoàn tất'
              AND i.invoice_type = 'sale_invoice'
              AND DATE(i.issued_date) >= ${db.escape(
                format(firstDayOfMonth, "yyyy-MM-dd")
              )}
              AND DATE(i.issued_date) <= ${db.escape(
                format(lastDayOfMonth, "yyyy-MM-dd")
              )}
            GROUP BY DATE(i.issued_date)
            ORDER BY time_period;
          `;

            const [revenueResults] = await db.promise().query(query);
            const revenueMap = new Map(
              revenueResults.map((item) => [
                item.time_period,
                item.total_revenue,
              ])
            );

            results = allDays.map((day) => ({
              time_period: day,
              total_revenue: revenueMap.get(day) || "0.00",
            }));
            return results; // Trả về sớm vì đã xử lý xong trường hợp này
          }

          break;
        case "week":
          groupByClause = "WEEK(i.issued_date, 3)"; // Mode 3: tuần bắt đầu từ thứ Hai, 0-53
          selectTimePeriod =
            "DATE_FORMAT(i.issued_date, '%Y-W%v') AS time_period,";
          orderByClause = "ORDER BY time_period";
          break;
        case "month":
          groupByClause = 'DATE_FORMAT(i.issued_date, "%Y-%m")';
          selectTimePeriod =
            'DATE_FORMAT(i.issued_date, "%Y-%m") AS time_period,';
          orderByClause = "ORDER BY time_period";

          if (startDate?.match(/^\d{4}$/)) {
            // Nếu startDate chỉ là năm
            const year = startDate;
            const allMonths = Array.from({ length: 12 }, (_, i) => {
              const month = (i + 1).toString().padStart(2, "0");
              return `${year}-${month}`;
            });

            const query = `
            SELECT
              DATE_FORMAT(i.issued_date, '%Y-%m') AS time_period,
              SUM(i.final_amount) AS total_revenue
            FROM invoices i
            INNER JOIN orders o ON i.order_id = o.order_id
            WHERE o.order_status = 'Hoàn tất'
              AND i.invoice_type = 'sale_invoice'
              AND YEAR(i.issued_date) = ${db.escape(year)}
            GROUP BY DATE_FORMAT(i.issued_date, '%Y-%m')
            ORDER BY time_period;
          `;

            const [revenueResults] = await db.promise().query(query);
            const revenueMap = new Map(
              revenueResults.map((item) => [
                item.time_period,
                item.total_revenue,
              ])
            );

            results = allMonths.map((month) => ({
              time_period: month,
              total_revenue: revenueMap.get(month) || "0.00",
            }));
            return results; // Trả về sớm
          } else if (startDate?.match(/^\d{4}-\d{2}$/)) {
            // Nếu startDate là năm-tháng (logic mặc định cho month)
            const query = `
            SELECT
              DATE_FORMAT(i.issued_date, '%Y-%m') AS time_period,
              SUM(i.final_amount) AS total_revenue
            FROM invoices i
            INNER JOIN orders o ON i.order_id = o.order_id
            WHERE o.order_status = 'Hoàn tất'
              AND i.invoice_type = 'sale_invoice'
              AND DATE_FORMAT(i.issued_date, '%Y-%m') = ${db.escape(startDate)}
            GROUP BY DATE_FORMAT(i.issued_date, '%Y-%m')
            ORDER BY time_period;
          `;
            const [queryResults] = await db.promise().query(query);
            results = queryResults;
          }
          break;
        case "quarter": // Bổ sung trường hợp quý
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

    const conditions = []; // Chỉ khai báo một lần ở đây
    if (effectiveStartDate && effectiveEndDate) {
      conditions.push(
        `DATE(i.issued_date) >= ${db.escape(effectiveStartDate)}`
      );
      conditions.push(`DATE(i.issued_date) <= ${db.escape(effectiveEndDate)}`);
    } else if (effectiveStartDate) {
      // Nếu chỉ có startDate, lấy dữ liệu cho đúng ngày đó
      conditions.push(`DATE(i.issued_date) = ${db.escape(effectiveStartDate)}`);
    }

    // `whereClause` đã được khai báo ở đầu hàm, chỉ cần thêm điều kiện vào
    if (conditions.length > 0) {
      whereClause += " AND " + conditions.join(" AND ");
    }

    const query = `
      SELECT
          ${selectTimePeriod}
          SUM(i.final_amount) AS total_revenue
      FROM invoices i
      INNER JOIN orders o ON i.order_id = o.order_id
      ${whereClause}
      ${groupByClause ? `GROUP BY ${groupByClause}` : ""}
      ${orderByClause};
    `;

    try {
      console.log(
        "🚀 ~ AnalysisModel.getRevenueByTimePeriod - Executing query:",
        query
      );
      const [results] = await db.promise().query(query);
      return results;
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
};

module.exports = AnalysisModel;
