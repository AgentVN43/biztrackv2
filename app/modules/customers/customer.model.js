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
    console.error("Lỗi khi tạo khách hàng:", err.message);
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
//     console.error("Lỗi khi lấy tất cả khách hàng:", err.message);
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
    return { customers: results.map(c => ({ ...c, debt: Number(c.debt) })), total: total };
  } catch (err) {
    console.error("Lỗi khi lấy tất cả khách hàng:", err.message);
    throw err;
  }
};

exports.getById = async (customer_id) => {
  try {
    const [results] = await db.query("SELECT * FROM customers WHERE customer_id = ?", [customer_id]);
    if (results.length === 0) return null;
    return { ...results[0], debt: Number(results[0].debt) };
  } catch (err) {
    console.error("Lỗi khi lấy khách hàng theo ID:", err.message);
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
//     console.error(
//       `Lỗi khi cập nhật khách hàng với ID ${customer_id}:`,
//       err.message
//     );
//     throw err;
//   }
// };

exports.update = async (customer_id, data) => {
  // Lấy thông tin hiện tại
  const current = await exports.getById(customer_id);
  if (!current) throw new Error('Customer not found');
  // Chỉ update các trường được truyền vào, giữ nguyên các trường còn lại
  const fields = [];
  const values = [];
  const allowedFields = [
    'customer_name', 'email', 'phone', 'total_expenditure', 'status', 'total_orders', 'debt', 'updated_at'
  ];
  for (const key of allowedFields) {
    if (key === 'updated_at') continue; // sẽ cập nhật cuối cùng
    if (data[key] !== undefined) {
      fields.push(`${key} = ?`);
      values.push(data[key]);
    }
  }
  fields.push('updated_at = CURRENT_TIMESTAMP');
  values.push(customer_id);
  if (fields.length === 1) return current; // Không có gì để update ngoài updated_at
  const sql = `UPDATE customers SET ${fields.join(', ')} WHERE customer_id = ?`;
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
    console.error(`Lỗi khi xóa khách hàng với ID ${customer_id}:`, err.message);
    throw err;
  }
};

// Hàm cập nhật debt cho khách hàng (tăng hoặc giảm)
exports.updateDebt = async (customer_id, amount, increase = true) => {
  // amount: số tiền tăng/giảm
  // increase: true => tăng, false => giảm
  try {
    const [result] = await db.query(
      `UPDATE customers SET debt = debt ${increase ? "+" : "-"} ? WHERE customer_id = ?`,
      [amount, customer_id]
    );
    return result.affectedRows;
  } catch (err) {
    console.error("Lỗi khi cập nhật debt cho khách hàng:", err.message);
    throw err;
  }
};

// Hàm tính lại debt dựa trên các hóa đơn chưa thanh toán và đơn hàng chưa có hóa đơn
exports.calculateDebt = async (customer_id) => {
  try {
    console.log(`🔍 Bắt đầu tính debt cho customer: ${customer_id}`);
    
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
    
    // 3. Tính debt cho từng invoice (có tính đến refund)
    let totalInvoiceDebt = 0;
    const CustomerReportService = require("../customer_report/customer_report.service");
    
    for (const invoice of invoiceRows) {
      const final_amount = parseFloat(invoice.final_amount || 0);
      const amount_paid = parseFloat(invoice.amount_paid || 0);
      
      // Tính refund cho order này (nếu có)
      let totalRefund = 0;
      if (invoice.order_id) {
        totalRefund = await CustomerReportService.calculateOrderTotalRefund(invoice.order_id);
      }
      
      // Debt = (final_amount - total_refund) - amount_paid
      // Nếu trả hết hàng thì actualAmountToPay = 0
      // Cho phép debt âm khi khách hàng đã thanh toán quá
      const actualAmountToPay = totalRefund >= final_amount ? 0 : final_amount - totalRefund;
      const debt = actualAmountToPay - amount_paid;
      
      console.log(`📊 Invoice ${invoice.invoice_id} (Order ${invoice.order_id}):`);
      console.log(`  - Final amount: ${final_amount}`);
      console.log(`  - Amount paid: ${amount_paid}`);
      console.log(`  - Total refund: ${totalRefund}`);
      console.log(`  - Actual amount to pay: ${actualAmountToPay}`);
      console.log(`  - Debt: ${debt}`);
      
      totalInvoiceDebt += debt;
    }
    
    // 4. Tính debt cho từng order (có tính đến refund)
    let totalOrderDebt = 0;
    
    for (const order of orderRows) {
      const final_amount = parseFloat(order.final_amount || 0);
      const amount_paid = parseFloat(order.amount_paid || 0);
      
      // Tính refund cho order này
      const totalRefund = await CustomerReportService.calculateOrderTotalRefund(order.order_id);
      
      // Debt = (final_amount - total_refund) - amount_paid
      // Nếu trả hết hàng thì actualAmountToPay = 0
      // Cho phép debt âm khi khách hàng đã thanh toán quá
      const actualAmountToPay = totalRefund >= final_amount ? 0 : final_amount - totalRefund;
      const debt = actualAmountToPay - amount_paid;
      
      console.log(`📊 Order ${order.order_id}:`);
      console.log(`  - Final amount: ${final_amount}`);
      console.log(`  - Amount paid: ${amount_paid}`);
      console.log(`  - Total refund: ${totalRefund}`);
      console.log(`  - Actual amount to pay: ${actualAmountToPay}`);
      console.log(`  - Debt: ${debt}`);
      
      totalOrderDebt += debt;
    }
    
    // 5. Tổng debt
    const totalDebt = totalInvoiceDebt + totalOrderDebt;
    
    console.log(`🔍 Kết quả tính debt cho customer ${customer_id}:`);
    console.log(`  - Total invoice debt: ${totalInvoiceDebt}`);
    console.log(`  - Total order debt: ${totalOrderDebt}`);
    console.log(`  - Final total debt: ${totalDebt}`);
    
    return totalDebt;
  } catch (error) {
    console.error("🚀 ~ customer.model.js: calculateDebt - Lỗi:", error);
    throw error;
  }
};
