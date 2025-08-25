// const db = require("../../config/db.config"); // Giả sử bạn có thiết lập kết nối database ở file database.js
// const { v4: uuidv4 } = require("uuid");

// exports.create = (data, callback) => {
//   const customer_id = uuidv4();
//   const { customer_name, email, phone } = data;
//   db.query(
//     "INSERT INTO customers (customer_id, customer_name, email, phone) VALUES (?, ?, ?, ?)",
//     [customer_id, customer_name, email, phone],
//     (err, result) => {
//       if (err) {
//         return callback(err, null);
//       }
//       callback(null, { customer_id, ...data });
//     }
//   );
// };

// exports.getAll = (callback) => {
//   db.query("SELECT * FROM customers", (err, results) => {
//     if (err) {
//       return callback(err, null);
//     }
//     callback(null, results); // ✅ Trả mảng thẳng, không bọc { results }
//   });
// };

// exports.getById = (customer_id, callback) => {
//   db.query(
//     "SELECT * FROM customers WHERE customer_id = ?",
//     [customer_id],
//     (err, results) => {
//       if (err) {
//         return callback(err, null);
//       }
//       if (results.length === 0) {
//         return callback(null, null); // Không tìm thấy customer
//       }
//       callback(null, results[0]);
//     }
//   );
// };

// exports.update = (customer_id, data, callback) => {
//   const {
//     customer_name,
//     email,
//     phone,
//     total_expenditure,
//     status,
//     total_orders,
//   } = data;
//   db.query(
//     "UPDATE customers SET customer_name = ?, email = ?, phone = ?, total_expenditure = ?, status = ?, total_orders = ?, updated_at = CURRENT_TIMESTAMP WHERE customer_id = ?",
//     [
//       customer_name,
//       email,
//       phone,
//       total_expenditure,
//       status,
//       total_orders,
//       customer_id,
//     ],
//     (err, result) => {
//       if (err) {
//         return callback(err, null);
//       }
//       if (result.affectedRows === 0) {
//         return callback(null, null); // Không tìm thấy customer
//       }
//       callback(null, { customer_id, ...data });
//     }
//   );
// };

// exports.countCompletedOrders = (customerId, callback) => {
//   const countQuery = `
//     SELECT COUNT(*) AS completedOrders
//     FROM Orders
//     WHERE customer_id = ? AND order_status = 'Hoàn tất'
//   `;
//   db.query(countQuery, [customerId], (err, result) => {
//     if (err) {
//       return callback(err);
//     }
//     callback(null, result[0].completedOrders);
//   });
// };

// exports.delete = (customer_id, callback) => {
//   db.query(
//     "DELETE FROM customers WHERE customer_id = ?",
//     [customer_id],
//     (err, result) => {
//       if (err) {
//         return callback(err, null);
//       }
//       if (result.affectedRows === 0) {
//         return callback(null, null); // Không tìm thấy customer
//       }
//       callback(null, { message: "Customer deleted successfully" });
//     }
//   );
// };
const dbConfig = require("../../config/db.config");
const db = dbConfig.promise();
const { v4: uuidv4 } = require("uuid");

exports.create = async (data) => {
  const customer_id = uuidv4();
  const { customer_name, email, phone, debt = 0 } = data;
  try {
    await db.query(
      "INSERT INTO customers (customer_id, customer_name, email, phone, debt) VALUES (?, ?, ?, ?, ?)",
      [customer_id, customer_name, email, phone, debt]
    );
    return { customer_id, ...data, debt };
  } catch (err) {
    //console.error("Lỗi khi tạo khách hàng:", err.message);
    throw err;
  }
};

// exports.getAll = (callback) => {
//   db.query("SELECT * FROM customers", (err, results) => {
//     if (err) {
//       return callback(err, null);
//     }
//     callback(null, results); // ✅ Trả mảng thẳng, không bọc { results }
//   });
// };

// exports.getAll = async (skip, limit, filters = {}) => {
//   try {
//     const [results] = await db.query("SELECT * FROM customers LIMIT ?, ?", [
//       skip,
//       limit,
//     ]);
//     const [countResult] = await db.query(
//       "SELECT COUNT(*) AS total FROM customers"
//     );
//     const total = countResult[0].total;
//     return { customers: results, total: total };
//   } catch (err) {
//     //console.error("Lỗi khi lấy tất cả khách hàng:", err.message);
//     throw err;
//   }
// };

exports.getAll = async (skip, limit, filters = {}) => {
  let whereClause = "";
  const queryParams = [skip, limit];

  if (filters.startDate && filters.endDate) {
    whereClause += ` WHERE DATE(created_at) BETWEEN DATE(?) AND DATE(?)`;
    queryParams.unshift(filters.endDate);
    queryParams.unshift(filters.startDate);
  } else if (filters.startDate) {
    whereClause += ` WHERE DATE(created_at) = DATE(?)`;
    queryParams.unshift(filters.startDate);
  } else if (filters.endDate) {
    whereClause += ` WHERE DATE(created_at) <= DATE(?)`;
    queryParams.unshift(filters.endDate);
  } else if (filters.year) {
    whereClause += ` WHERE YEAR(created_at) = ?`;
    queryParams.unshift(filters.year);
  } else if (filters.month && filters.year) {
    whereClause += ` WHERE YEAR(created_at) = ? AND MONTH(created_at) = ?`;
    queryParams.unshift(filters.year);
    queryParams.unshift(filters.month);
  } else if (filters.day && filters.month && filters.year) {
    whereClause += ` WHERE DATE(created_at) = DATE(?)`;
    const dateString = `${filters.year}-${String(filters.month).padStart(
      2,
      "0"
    )}-${String(filters.day).padStart(2, "0")}`;
    queryParams.unshift(dateString);
  }

  try {
    const baseQuery = `SELECT * FROM customers ${whereClause} LIMIT ?, ?`;
    const countQuery = `SELECT COUNT(*) AS total FROM customers ${whereClause}`;

    const [results] = await db.query(baseQuery, queryParams);
    const [countResult] = await db.query(
      countQuery,
      queryParams.slice(0, queryParams.length - 2)
    );

    const total = countResult[0].total;
    return {
      customers: results.map((c) => ({ ...c, debt: Number(c.debt) })),
      total: total,
    };
  } catch (err) {
    //console.error("Lỗi khi lấy tất cả khách hàng:", err.message);
    throw err;
  }
};

exports.getById = async (customer_id) => {
  try {
    const [results] = await db.query(
      "SELECT * FROM customers WHERE customer_id = ?",
      [customer_id]
    );
    if (results.length === 0) return null;
    return { ...results[0], debt: Number(results[0].debt) };
  } catch (err) {
    //console.error("Lỗi khi lấy khách hàng theo ID:", err.message);
    throw err;
  }
};

// exports.update = async (customer_id, data) => {
//   const {
//     customer_name,
//     email,
//     phone,
//     total_expenditure,
//     status,
//     total_orders,
//   } = data;
//   try {
//     const [result] = await db.query(
//       "UPDATE customers SET customer_name = ?, email = ?, phone = ?, total_expenditure = ?, status = ?, total_orders = ?, updated_at = CURRENT_TIMESTAMP WHERE customer_id = ?",
//       [
//         customer_name,
//         email,
//         phone,
//         total_expenditure,
//         status,
//         total_orders,
//         customer_id,
//       ]
//     );
//     return result.affectedRows > 0 ? { customer_id, ...data } : null;
//   } catch (err) {
//     //console.error(
//       `Lỗi khi cập nhật khách hàng với ID ${customer_id}:`,
//       err.message
//     );
//     throw err;
//   }
// };

exports.update = async (customer_id, data) => {
  // Lấy thông tin hiện tại
  const current = await exports.getById(customer_id);
  if (!current) throw new Error("Customer not found");
  // Chỉ update các trường được truyền vào, giữ nguyên các trường còn lại
  const fields = [];
  const values = [];
  const allowedFields = [
    "customer_name",
    "email",
    "phone",
    "total_expenditure",
    "status",
    "total_orders",
    "debt",
    "updated_at",
  ];
  for (const key of allowedFields) {
    if (key === "updated_at") continue; // sẽ cập nhật cuối cùng
    if (data[key] !== undefined) {
      fields.push(`${key} = ?`);
      values.push(data[key]);
    }
  }
  fields.push("updated_at = CURRENT_TIMESTAMP");
  values.push(customer_id);
  if (fields.length === 1) return current; // Không có gì để update ngoài updated_at
  const sql = `UPDATE customers SET ${fields.join(", ")} WHERE customer_id = ?`;
  const [result] = await db.query(sql, values);
  if (result.affectedRows === 0) return null;
  return await exports.getById(customer_id);
};

exports.countCompletedOrders = async (customerId) => {
  const countQuery = `
    SELECT COUNT(*) AS completedOrders
    FROM Orders
    WHERE customer_id = ? AND order_status = 'Hoàn tất'
  `;
  try {
    const [result] = await db.query(countQuery, [customerId]);
    return result[0].completedOrders;
  } catch (err) {
    console.error(
      `Lỗi khi đếm đơn hàng hoàn tất của khách hàng ${customerId}:`,
      err.message
    );
    throw err;
  }
};

exports.delete = async (customer_id) => {
  try {
    const [result] = await db.query(
      "DELETE FROM customers WHERE customer_id = ?",
      [customer_id]
    );
    return result.affectedRows > 0;
  } catch (err) {
    //console.error(`Lỗi khi xóa khách hàng với ID ${customer_id}:`, err.message);
    throw err;
  }
};

// Hàm cập nhật debt cho khách hàng (tăng hoặc giảm)
exports.updateDebt = async (customer_id, amount, increase = true) => {
	// amount: số tiền tăng/giảm
	// increase: true => tăng, false => giảm
	try {
		// ✅ TÍNH THEO SỔ CÁI GIAO DỊCH (LEDGER) ĐỂ ĐẢM BẢO CHUẨN XÁC
		const calculatedDebt = await exports.calculateDebtFromLedger(customer_id);
		const [result] = await db.query(
			`UPDATE customers SET debt = ? WHERE customer_id = ?`,
			[calculatedDebt, customer_id]
		);
		return result.affectedRows;
	} catch (err) {
		throw err;
	}
};

// ✅ Hàm mới: Tính debt dựa trên sổ cái giao dịch của khách hàng
exports.calculateDebtFromLedger = async (customer_id) => {
	try {
		const CustomerReportService = require('../customer_report/customer_report.service');
		const { ledger } = await CustomerReportService.getCustomerTransactionLedger(customer_id, 1, 100000);
		if (!Array.isArray(ledger) || ledger.length === 0) return 0;
		// Lấy dư nợ mới nhất
		const latestBalance = ledger[0]?.du_no ?? 0;
		return Number(latestBalance) || 0;
	} catch (error) {
		// Không fallback về calculateDebt vì logic cũ sai, trả 0 nếu không lấy được sổ cái
		return 0;
	}
};

// ✅ Hàm mới: Đồng bộ debt cho tất cả customers
exports.syncAllDebts = async () => {
  try {
    //console.log("🔄 Bắt đầu đồng bộ debt cho tất cả customers...");

    // Lấy tất cả customer IDs
    const [customers] = await db.query("SELECT customer_id FROM customers");

    let successCount = 0;
    let errorCount = 0;

    for (const customer of customers) {
      try {
        const calculatedDebt = await exports.calculateDebt(
          customer.customer_id
        );

        await db.query(`UPDATE customers SET debt = ? WHERE customer_id = ?`, [
          calculatedDebt,
          customer.customer_id,
        ]);

        successCount++;
        //console.log(`✅ Đã đồng bộ debt cho customer ${customer.customer_id}: ${calculatedDebt}`);
      } catch (error) {
        errorCount++;
        //console.error(`❌ Lỗi khi đồng bộ debt cho customer ${customer.customer_id}:`, error.message);
      }
    }

    //console.log(`🎯 Kết quả đồng bộ: ${successCount} thành công, ${errorCount} lỗi`);
    return { successCount, errorCount };
  } catch (error) {
    //console.error("🚀 ~ customer.model.js: syncAllDebts - Lỗi:", error);
    throw error;
  }
};

// Hàm tính lại debt dựa trên các hóa đơn chưa thanh toán, đơn hàng chưa có hóa đơn và đơn hàng trả
// exports.calculateDebt = async (customer_id) => {
//   try {
//     //console.log(`🔍 Bắt đầu tính debt cho customer: ${customer_id}`);

//     // 1. Lấy tất cả invoices của customer
//     const invoiceSql = `
//       SELECT
//         invoice_id,
//         order_id,
//         final_amount,
//         amount_paid,
//         status
//       FROM invoices
//       WHERE customer_id = ?
//         AND (status = 'pending' OR status = 'partial_paid' OR status = 'overdue')
//         AND status != 'cancelled'
//     `;
//     const [invoiceRows] = await db.query(invoiceSql, [customer_id]);

//     // 2. Lấy tất cả orders chưa có invoice
//     const orderSql = `
//       SELECT
//         o.order_id,
//         o.final_amount,
//         o.amount_paid,
//         o.order_status
//       FROM orders o
//       LEFT JOIN invoices i ON o.order_id = i.order_id
//       WHERE o.customer_id = ?
//         AND o.order_status IN ('Mới', 'Xác nhận', 'Hoàn tất')
//         AND o.order_status != 'Huỷ đơn'
//         AND i.order_id IS NULL
//     `;
//     const [orderRows] = await db.query(orderSql, [customer_id]);

//     // 3. Lấy tất cả customer returns đã approved/completed (TRỪ VÀO DEBT)
//     const returnSql = `
//       SELECT
//         ro.return_id,
//         ro.order_id,
//         ro.status,
//         ro.created_at,
//         SUM(roi.refund_amount) as total_refund
//       FROM return_orders ro
//       JOIN return_order_items roi ON ro.return_id = roi.return_id
//       WHERE ro.customer_id = ?
//         AND ro.type = 'customer_return'
//         AND ro.status IN ('approved', 'completed')
//       GROUP BY ro.return_id, ro.order_id, ro.status, ro.created_at
//       ORDER BY ro.created_at ASC
//     `;
//     const [returnRows] = await db.query(returnSql, [customer_id]);

//     // 4. Tính debt cho từng invoice (KHÔNG tính refund trong order nữa)
//     let totalInvoiceDebt = 0;

//     for (const invoice of invoiceRows) {
//       const final_amount = parseFloat(invoice.final_amount || 0);
//       const amount_paid = parseFloat(invoice.amount_paid || 0);
//       const debt = final_amount - amount_paid;

//       totalInvoiceDebt += debt;
//     }

//     // 5. Tính debt cho từng order (KHÔNG tính refund trong order nữa)
//     let totalOrderDebt = 0;

//     for (const order of orderRows) {
//       const final_amount = parseFloat(order.final_amount || 0);
//       const amount_paid = parseFloat(order.amount_paid || 0);

//       const debt = final_amount - amount_paid;

//       totalOrderDebt += debt;
//     }

//     // 6. Tính tổng refund từ customer returns (TRỪ VÀO DEBT)
//     let totalReturnRefund = 0;

//     for (const returnOrder of returnRows) {
//       const totalRefund = parseFloat(returnOrder.total_refund || 0);
//       totalReturnRefund += totalRefund;
//     }

//     // 7. ✅ Lấy tất cả adjustment transactions (bao gồm opening_balance từ migration)
//     const adjustmentSql = `
//       SELECT
//         transaction_id,
//         type,
//         amount,
//         description,
//         created_at
//       FROM transactions
//       WHERE customer_id = ?
//         AND type IN ('adjustment')
//       ORDER BY created_at ASC
//     `;
//     const [adjustmentRows] = await db.query(adjustmentSql, [customer_id]);

//     let totalAdjustmentDebt = 0;
//     for (const adjustment of adjustmentRows) {
//       const amount = parseFloat(adjustment.amount || 0);
//       totalAdjustmentDebt += amount;

//       //console.log(`📊 Adjustment Transaction ${adjustment.transaction_id}:`);
//       //console.log(`  - Type: ${adjustment.type}`);
//       //console.log(`  - Amount: ${amount}`);
//       //console.log(`  - Description: ${adjustment.description}`);
//     }

//     // 8. ✅ Lấy tổng điều chỉnh tăng (adj_increase) và điều chỉnh giảm (adj_decrease)
//     const adjIncreaseSql = `
//       SELECT COALESCE(SUM(amount), 0) AS total_adj_increase
//       FROM transactions
//       WHERE customer_id = ?
//         AND type = 'adj_increase'
//     `;
//     const [adjIncreaseRows] = await db.query(adjIncreaseSql, [customer_id]);
//     const adjIncreaseDebt = parseFloat(adjIncreaseRows[0].total_adj_increase || 0);

//     const adjDecreaseSql = `
//       SELECT COALESCE(SUM(amount), 0) AS total_adj_decrease
//       FROM transactions
//       WHERE customer_id = ?
//         AND type = 'adj_decrease'
//     `;
//     const [adjDecreaseRows] = await db.query(adjDecreaseSql, [customer_id]);
//     const adjDecreaseDebt = parseFloat(adjDecreaseRows[0].total_adj_decrease || 0);

//     // ✅ TÍNH TỔNG DEBT từ: invoices + orders + adjustments + adj_increase - adj_decrease - returns
//     const totalDebt = totalInvoiceDebt + totalOrderDebt + totalAdjustmentDebt + adjIncreaseDebt - adjDecreaseDebt - totalReturnRefund;

//     return totalDebt;
//   } catch (error) {
//     //console.error("🚀 ~ customer.model.js: calculateDebt - Lỗi:", error);
//     throw error;
//   }
// };
exports.calculateDebt = async (customer_id) => {
  try {
    // 1) INVOICES: lấy tất cả trừ cancelled
    const invoiceSql = `
      SELECT 
        invoice_id,
        order_id,
        final_amount,
        amount_paid,
        status
      FROM invoices
      WHERE customer_id = ?
        AND status != 'cancelled'
    `;
    const [invoiceRows] = await db.query(invoiceSql, [customer_id]);

    // 2) ORDERS chưa có invoice 
    const orderSql = `
      SELECT 
        o.order_id,
        o.final_amount,
        o.amount_paid,
        o.order_status
      FROM orders o
      LEFT JOIN invoices i ON o.order_id = i.order_id
      WHERE o.customer_id = ?
        AND o.order_status IN ('Mới', 'Xác nhận', 'Hoàn tất')
        AND o.order_status != 'Huỷ đơn'
        AND i.order_id IS NULL
    `;
    const [orderRows] = await db.query(orderSql, [customer_id]);

    // 3) REFUNDS: nguồn sự thật là return_orders (approved/completed)
    const returnSql = `
      SELECT 
        ro.return_id,
        ro.order_id,
        ro.status,
        ro.created_at,
        SUM(roi.refund_amount) AS total_refund
      FROM return_orders ro
      JOIN return_order_items roi ON ro.return_id = roi.return_id
      WHERE ro.customer_id = ?
        AND ro.type = 'customer_return'
        AND ro.status IN ('approved', 'completed')
      GROUP BY ro.return_id, ro.order_id, ro.status, ro.created_at
      ORDER BY ro.created_at ASC
    `;
    const [returnRows] = await db.query(returnSql, [customer_id]);

    // 4) Gom refund theo order + refund không gắn order
    const returnsByOrder = new Map();
    let unlinkedRefundTotal = 0;

    for (const r of returnRows) {
      const refund = Number.parseFloat(r.total_refund || 0) || 0;
      const oid = r.order_id;
      if (oid) {
        if (!returnsByOrder.has(oid)) returnsByOrder.set(oid, []);
        returnsByOrder.get(oid).push(r);
      } else {
        unlinkedRefundTotal += refund;
      }
    }

    // 5) Tính nợ theo INVOICE, trừ refund theo thời gian
    let totalInvoiceDebt = 0;
    let customerCredit = 0; // âm = còn phải hoàn cho khách

    for (const inv of invoiceRows) {
      const final_amount = Number.parseFloat(inv.final_amount || 0) || 0;
      const amount_paid = Number.parseFloat(inv.amount_paid || 0) || 0;
      const order_id = inv.order_id;

      let debt = final_amount - amount_paid;

      const arr =
        order_id && returnsByOrder.get(order_id)
          ? [...returnsByOrder.get(order_id)]
          : [];
      arr.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

      for (const r of arr) {
        const refund = Number.parseFloat(r.total_refund || 0) || 0;
        debt -= refund;
      }

      // Nếu âm, dồn phần âm sang customerCredit rồi set nợ đơn = 0
      if (debt < 0) {
        customerCredit += debt; // debt là số âm
        debt = 0;
      }
      totalInvoiceDebt += debt;
    }

    // 6) Tính nợ theo ORDER chưa có invoice, trừ refund theo thời gian
    let totalOrderDebt = 0;

    for (const ord of orderRows) {
      const final_amount = Number.parseFloat(ord.final_amount || 0) || 0;
      const amount_paid = Number.parseFloat(ord.amount_paid || 0) || 0;
      const order_id = ord.order_id;

      let debt = final_amount - amount_paid;

      const arr = returnsByOrder.get(order_id)
        ? [...returnsByOrder.get(order_id)]
        : [];
      arr.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

      for (const r of arr) {
        const refund = Number.parseFloat(r.total_refund || 0) || 0;
        debt -= refund;
      }

      if (debt < 0) {
        customerCredit += debt; // âm
        debt = 0;
      }
      totalOrderDebt += debt;
    }

    // 7) Adjustments THUẦN (không phải refund)
    const adjustmentSql = `
      SELECT 
        transaction_id,
        type,
        amount,
        description,
        created_at
      FROM transactions
      WHERE customer_id = ?
        AND type = 'refund'
      ORDER BY created_at ASC
    `;
    const [adjustmentRows] = await db.query(adjustmentSql, [customer_id]);

    let totalAdjustmentDebt = 0;
    for (const a of adjustmentRows) {
      totalAdjustmentDebt += Number.parseFloat(a.amount || 0) || 0;
    }

    // 🚫 Không dùng adj_increase/adj_decrease ở đây để tránh double-count refund

    // 8) Áp refund KHÔNG gắn order ở cấp khách
    let subtotalDebt = totalInvoiceDebt + totalOrderDebt;
    if (unlinkedRefundTotal > 0) {
      const applied = Math.min(subtotalDebt, unlinkedRefundTotal);
      subtotalDebt -= applied;
      const residual = unlinkedRefundTotal - applied; // dư refund ⇒ nợ khách
      if (residual > 0) {
        customerCredit -= residual; // tăng phần âm (nợ khách)
      }
    }

    // 9) Tổng kết: cộng cả customerCredit (âm)
    const totalDebt = subtotalDebt + totalAdjustmentDebt + customerCredit;

    return totalDebt;
  } catch (error) {
    throw error;
  }
};

/**
 * Tìm customer theo số điện thoại
 * @param {string} phone - Số điện thoại
 * @returns {Object|null} - Customer object hoặc null
 */
exports.findByPhone = async (phone) => {
  try {
    const [results] = await db.query(
      "SELECT * FROM customers WHERE phone = ?",
      [phone]
    );
    return results.length > 0 ? results[0] : null;
  } catch (error) {
    //console.error("🚀 ~ customer.model.js: findByPhone - Lỗi:", error);
    throw error;
  }
};

/**
 * Bulk insert customers
 * @param {Array} customers - Array of customer objects
 * @returns {number} - Số lượng records đã insert
 */
exports.bulkInsert = async (customers) => {
  try {
    if (!customers || customers.length === 0) {
      return 0;
    }

    // Tạo placeholders cho bulk insert
    const placeholders = customers
      .map(() => "(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
      .join(", ");

    // Flatten data array
    const values = customers.flatMap((customer) => [
      customer.customer_id,
      customer.customer_name,
      customer.email,
      customer.phone,
      customer.status,
      customer.total_expenditure,
      customer.total_orders,
      customer.debt,
      customer.created_at,
      customer.updated_at,
    ]);

    const query = `
      INSERT INTO customers (
        customer_id, customer_name, email, phone, status, 
        total_expenditure, total_orders, debt, created_at, updated_at
      ) VALUES ${placeholders}
    `;

    const [result] = await db.query(query, values);
    return result.affectedRows;
  } catch (error) {
    //console.error("🚀 ~ customer.model.js: bulkInsert - Lỗi:", error);
    throw error;
  }
};
