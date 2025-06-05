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
  const { customer_name, email, phone } = data;
  try {
    await db.query(
      "INSERT INTO customers (customer_id, customer_name, email, phone) VALUES (?, ?, ?, ?)",
      [customer_id, customer_name, email, phone]
    );
    return { customer_id, ...data };
  } catch (err) {
    console.error("Lỗi khi tạo khách hàng:", err.message);
    throw err;
  }
};

// exports.getAll = async (skip, limit) => {
//   try {
//     const [results] = await db.query("SELECT * FROM customers");
//     return results;
//   } catch (err) {
//     console.error("Lỗi khi lấy tất cả khách hàng:", err.message);
//     throw err;
//   }
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
    return { customers: results, total: total };
  } catch (err) {
    console.error("Lỗi khi lấy tất cả khách hàng:", err.message);
    throw err;
  }
};

exports.getById = async (customer_id) => {
  try {
    const [results] = await db.query(
      "SELECT * FROM customers WHERE customer_id = ?",
      [customer_id]
    );
    return results[0] || null;
  } catch (err) {
    console.error(`Lỗi khi lấy khách hàng với ID ${customer_id}:`, err.message);
    throw err;
  }
};

exports.update = async (customer_id, data) => {
  const {
    customer_name,
    email,
    phone,
    total_expenditure,
    status,
    total_orders,
  } = data;
  try {
    const [result] = await db.query(
      "UPDATE customers SET customer_name = ?, email = ?, phone = ?, total_expenditure = ?, status = ?, total_orders = ?, updated_at = CURRENT_TIMESTAMP WHERE customer_id = ?",
      [
        customer_name,
        email,
        phone,
        total_expenditure,
        status,
        total_orders,
        customer_id,
      ]
    );
    return result.affectedRows > 0 ? { customer_id, ...data } : null;
  } catch (err) {
    console.error(
      `Lỗi khi cập nhật khách hàng với ID ${customer_id}:`,
      err.message
    );
    throw err;
  }
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
