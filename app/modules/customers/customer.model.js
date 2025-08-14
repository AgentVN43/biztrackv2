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
    // Cách 1: Update trực tiếp (cũ)
    // const [result] = await db.query(
    //   `UPDATE customers SET debt = debt ${
    //     increase ? "+" : "-"
    //   } ? WHERE customer_id = ?`,
    //   [amount, customer_id]
    // );
    // return result.affectedRows;

    // ✅ Cách 2: Tính lại toàn bộ debt để đảm bảo đồng bộ
    //console.log(`🔄 updateDebt: Đang đồng bộ debt cho customer ${customer_id}`);
    
    // Tính lại debt chính xác
    const calculatedDebt = await exports.calculateDebt(customer_id);
    
    // Update trường debt trong database
    const [result] = await db.query(
      `UPDATE customers SET debt = ? WHERE customer_id = ?`,
      [calculatedDebt, customer_id]
    );
    
    //console.log(`✅ updateDebt: Đã đồng bộ debt từ ${calculatedDebt} cho customer ${customer_id}`);
    
    return result.affectedRows;
  } catch (err) {
    //console.error("🚀 ~ customer.model.js: updateDebt - Lỗi:", err);
    throw err;
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
        const calculatedDebt = await exports.calculateDebt(customer.customer_id);
        
        await db.query(
          `UPDATE customers SET debt = ? WHERE customer_id = ?`,
          [calculatedDebt, customer.customer_id]
        );
        
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
exports.calculateDebt = async (customer_id) => {
  try {
    //console.log(`🔍 Bắt đầu tính debt cho customer: ${customer_id}`);

    // 1. Lấy tất cả invoices của customer
    const invoiceSql = `
      SELECT 
        invoice_id,
        order_id,
        final_amount,
        amount_paid,
        status
      FROM invoices
      WHERE customer_id = ?
        AND (status = 'pending' OR status = 'partial_paid' OR status = 'overdue')
        AND status != 'cancelled'
    `;
    const [invoiceRows] = await db.query(invoiceSql, [customer_id]);

    // 2. Lấy tất cả orders chưa có invoice
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

    // 3. Lấy tất cả customer returns đã approved/completed (TRỪ VÀO DEBT)
    const returnSql = `
      SELECT 
        ro.return_id,
        ro.order_id,
        ro.status,
        ro.created_at,
        SUM(roi.refund_amount) as total_refund
      FROM return_orders ro
      JOIN return_order_items roi ON ro.return_id = roi.return_id
      WHERE ro.customer_id = ?
        AND ro.type = 'customer_return'
        AND ro.status IN ('approved', 'completed')
      GROUP BY ro.return_id, ro.order_id, ro.status, ro.created_at
      ORDER BY ro.created_at ASC
    `;
    const [returnRows] = await db.query(returnSql, [customer_id]);

    // 4. Tính debt cho từng invoice (KHÔNG tính refund trong order nữa)
    let totalInvoiceDebt = 0;

    for (const invoice of invoiceRows) {
      const final_amount = parseFloat(invoice.final_amount || 0);
      const amount_paid = parseFloat(invoice.amount_paid || 0);

      // ✅ CHỈ tính debt dựa trên final_amount và amount_paid
      // ✅ KHÔNG trừ refund ở đây vì sẽ tính riêng ở bước 6
      const debt = final_amount - amount_paid;

      //console.log(
      //   `📊 Invoice ${invoice.invoice_id} (Order ${invoice.order_id}):`
      // );
      //console.log(`  - Final amount: ${final_amount}`);
      //console.log(`  - Amount paid: ${amount_paid}`);
      //console.log(`  - Debt: ${debt}`);

      totalInvoiceDebt += debt;
    }

    // 5. Tính debt cho từng order (KHÔNG tính refund trong order nữa)
    let totalOrderDebt = 0;

    for (const order of orderRows) {
      const final_amount = parseFloat(order.final_amount || 0);
      const amount_paid = parseFloat(order.amount_paid || 0);

      // ✅ CHỈ tính debt dựa trên final_amount và amount_paid
      // ✅ KHÔNG trừ refund ở đây vì sẽ tính riêng ở bước 6
      const debt = final_amount - amount_paid;

      //console.log(`📊 Order ${order.order_id}:`);
      //console.log(`  - Final amount: ${final_amount}`);
      //console.log(`  - Amount paid: ${amount_paid}`);
      //console.log(`  - Debt: ${debt}`);

      totalOrderDebt += debt;
    }

    // 6. Tính tổng refund từ customer returns (TRỪ VÀO DEBT)
    let totalReturnRefund = 0;

    for (const returnOrder of returnRows) {
      const totalRefund = parseFloat(returnOrder.total_refund || 0);
      totalReturnRefund += totalRefund;

      //console.log(
      //   `📊 Customer Return ${returnOrder.return_id} (Order ${returnOrder.order_id}):`
      // );
      //console.log(`  - Total refund: ${totalRefund}`);
      //console.log(`  - Status: ${returnOrder.status}`);
    }

    // 7. ✅ Lấy tất cả adjustment transactions (bao gồm opening_balance từ migration)
    const adjustmentSql = `
      SELECT 
        transaction_id,
        type,
        amount,
        description,
        created_at
      FROM transactions
      WHERE customer_id = ?
        AND type IN ('adjustment')
      ORDER BY created_at ASC
    `;
    const [adjustmentRows] = await db.query(adjustmentSql, [customer_id]);

    let totalAdjustmentDebt = 0;
    for (const adjustment of adjustmentRows) {
      const amount = parseFloat(adjustment.amount || 0);
      totalAdjustmentDebt += amount;

      //console.log(`📊 Adjustment Transaction ${adjustment.transaction_id}:`);
      //console.log(`  - Type: ${adjustment.type}`);
      //console.log(`  - Amount: ${amount}`);
      //console.log(`  - Description: ${adjustment.description}`);
    }

    // 8. ✅ Lấy tổng điều chỉnh tăng (adj_increase) và điều chỉnh giảm (adj_decrease)
    const adjIncreaseSql = `
      SELECT COALESCE(SUM(amount), 0) AS total_adj_increase
      FROM transactions
      WHERE customer_id = ?
        AND type = 'adj_increase'
    `;
    const [adjIncreaseRows] = await db.query(adjIncreaseSql, [customer_id]);
    const adjIncreaseDebt = parseFloat(adjIncreaseRows[0].total_adj_increase || 0);

    const adjDecreaseSql = `
      SELECT COALESCE(SUM(amount), 0) AS total_adj_decrease
      FROM transactions
      WHERE customer_id = ?
        AND type = 'adj_decrease'
    `;
    const [adjDecreaseRows] = await db.query(adjDecreaseSql, [customer_id]);
    const adjDecreaseDebt = parseFloat(adjDecreaseRows[0].total_adj_decrease || 0);

    // ✅ TÍNH TỔNG DEBT từ: invoices + orders + adjustments + adj_increase - adj_decrease - returns
    const totalDebt = totalInvoiceDebt + totalOrderDebt + totalAdjustmentDebt + adjIncreaseDebt - adjDecreaseDebt - totalReturnRefund;

    //console.log(`🔍 Kết quả tính debt cho customer ${customer_id}:`);
    //console.log(`  - Total invoice debt: ${totalInvoiceDebt}`);
    //console.log(`  - Total order debt: ${totalOrderDebt}`);
    //console.log(`  - Total adjustment debt (bao gồm opening_balance): ${totalAdjustmentDebt}`);
    //console.log(`  - Adjustment increase (adj_increase): ${adjIncreaseDebt}`);
    //console.log(`  - Adjustment decrease (adj_decrease): ${adjDecreaseDebt}`);
    //console.log(`  - Total customer returns refund: ${totalReturnRefund}`);
    //console.log(`  - Final total debt: ${totalDebt} (có thể âm)`);

    return totalDebt;
  } catch (error) {
    //console.error("🚀 ~ customer.model.js: calculateDebt - Lỗi:", error);
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
