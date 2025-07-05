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
    return result.affectedRows > 0;
  } catch (err) {
    console.error("Lỗi khi cập nhật debt cho khách hàng:", err.message);
    throw err;
  }
};

// Hàm tính lại debt dựa trên các hóa đơn chưa thanh toán và đơn hàng chưa có hóa đơn
exports.calculateDebt = async (customer_id) => {
  console.log(`🔍 Bắt đầu tính debt cho customer: ${customer_id}`);
  
  // 1. Lấy tổng công nợ từ các hóa đơn chưa thanh toán (final_amount - amount_paid)
  // ✅ LOẠI TRỪ CÁC HÓA ĐƠN CÓ TRẠNG THÁI 'cancelled'
  const [invoiceRows] = await db.query(`
    SELECT COALESCE(SUM(final_amount - amount_paid), 0) AS total_receivables
    FROM invoices
    WHERE customer_id = ?
      AND (status = 'pending' OR status = 'partial_paid' OR status = 'overdue')
      AND status != 'cancelled'
  `, [customer_id]);
  const invoiceDebt = parseFloat(invoiceRows[0].total_receivables || 0);
  console.log(`📊 Invoice debt: ${invoiceDebt}`);

  // 2. ✅ Lấy tổng công nợ từ các đơn hàng (bao gồm cả 'Hoàn tất' chưa thanh toán đủ)
  // ✅ LOẠI TRỪ CÁC ĐƠN HÀNG CÓ TRẠNG THÁI 'Huỷ đơn'
  const [orderRows] = await db.query(`
    SELECT COALESCE(SUM(o.final_amount - o.amount_paid), 0) AS total_orders_debt
    FROM orders o
    LEFT JOIN invoices i ON o.order_id = i.order_id
    WHERE o.customer_id = ?
      AND o.order_status IN ('Mới', 'Xác nhận', 'Hoàn tất')
      AND o.order_status != 'Huỷ đơn'
      AND i.order_id IS NULL
  `, [customer_id]);
  const orderDebt = parseFloat(orderRows[0].total_orders_debt || 0);
  console.log(`📊 Order debt: ${orderDebt}`);

  // Debug: Kiểm tra chi tiết orders
  const [orderDetails] = await db.query(`
    SELECT o.order_id, o.final_amount, o.amount_paid, o.order_status, i.order_id as has_invoice
    FROM orders o
    LEFT JOIN invoices i ON o.order_id = i.order_id
    WHERE o.customer_id = ?
      AND o.order_status IN ('Mới', 'Xác nhận', 'Hoàn tất')
      AND o.order_status != 'Huỷ đơn'
  `, [customer_id]);
  console.log(`📋 Chi tiết orders:`, orderDetails);

  // 3. ✅ Lấy tổng số tiền đã trả hàng từ return_orders (đã approved hoặc completed)
  const [returnRows] = await db.query(`
    SELECT COALESCE(SUM(roi.refund_amount), 0) AS total_refund
    FROM return_orders ro
    JOIN return_order_items roi ON ro.return_id = roi.return_id
    WHERE ro.customer_id = ?
      AND ro.status IN ('approved', 'completed')
  `, [customer_id]);
  const totalRefund = parseFloat(returnRows[0].total_refund || 0);
  console.log(`📊 Total refund: ${totalRefund}`);

  // Debug: Kiểm tra chi tiết return_orders
  const [returnDetails] = await db.query(`
    SELECT ro.return_id, ro.order_id, ro.status, SUM(roi.refund_amount) as total_refund
    FROM return_orders ro
    JOIN return_order_items roi ON ro.return_id = roi.return_id
    WHERE ro.customer_id = ?
    GROUP BY ro.return_id, ro.order_id, ro.status
  `, [customer_id]);
  console.log(`📋 Chi tiết return_orders:`, returnDetails);

  // Tổng công nợ thực tế = Công nợ invoices + Công nợ orders - Tổng tiền đã trả hàng
  const totalDebt = invoiceDebt + orderDebt - totalRefund;
  
  console.log(`🔍 Kết quả tính debt cho customer ${customer_id}:`);
  console.log(`  - Invoice debt: ${invoiceDebt}`);
  console.log(`  - Order debt: ${orderDebt}`);
  console.log(`  - Total refund: ${totalRefund}`);
  console.log(`  - Final debt: ${totalDebt}`);
  
  return Math.max(0, totalDebt); // Đảm bảo debt không âm
};
