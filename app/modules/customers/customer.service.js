// const Customer = require("./customer.model");

// exports.createCustomer = (data, callback) => {
//   Customer.create(data, callback);
// };
// exports.getAllCustomers = (callback) => {
//   Customer.getAll(callback);
// };
// exports.getCustomerById = (id, callback) => {
//   Customer.getById(id, callback);
// };
// exports.updateCustomer = (id, data, callback) => {
//   Customer.update(id, data, callback);
// };
// exports.deleteCustomer = (id, callback) => {
//   Customer.delete(id, callback);
// };

// exports.updateOrdersAndStatus = (customerId, finalCallback) => {
//   // 1. Lấy thông tin khách hàng hiện tại
//   Customer.getById(customerId, (err, customer) => {
//     if (err) {
//       return finalCallback(err);
//     }
//     if (!customer) {
//       return finalCallback(new Error('Customer not found'));
//     }

//     // 2. Đếm số đơn hàng "Hoàn tất" của khách hàng từ bảng Orders (sử dụng hàm từ model)
//     Customer.countCompletedOrders(customerId, (countErr, newTotalOrders) => {
//       if (countErr) {
//         return finalCallback(countErr);
//       }

//       // 3. Xác định trạng thái mới dựa trên newTotalOrders
//       let newStatus;
//       if (newTotalOrders < 10) {
//         newStatus = 'khách hàng mới';
//       } else if (newTotalOrders <= 20) {
//         newStatus = 'khách hàng thân thiết';
//       } else if (newTotalOrders < 50) {
//         newStatus = 'khách hàng thường xuyên';
//       } else {
//         newStatus = 'khách hàng VIP';
//       }

//       // 4. Tạo đối tượng chứa dữ liệu cập nhật
//       const updatedCustomerData = {
//         customer_name: customer.customer_name,
//         email: customer.email,
//         phone: customer.phone,
//         total_expenditure: customer.total_expenditure,
//         status: newStatus,
//         total_orders: newTotalOrders,
//       };

//       // 5. Cập nhật thông tin khách hàng
//       Customer.update(customerId, updatedCustomerData, (updateErr, updatedCustomerWithStatus) => {
//         if (updateErr) {
//           return finalCallback(updateErr);
//         }
//         finalCallback(null, updatedCustomerWithStatus);
//       });
//     });
//   });
// };

const Customer = require("./customer.model");
const OrderService = require("../orders/order.service");

exports.createCustomer = async (data) => {
  return await Customer.create(data);
};

exports.getAllCustomers = async (skip, limit, filters = {}) => {
  const { customers, total } = await Customer.getAll(skip, limit, filters);
  return { customers, total };
};

exports.getCustomerById = async (id) => {
  return await Customer.getById(id);
};

exports.updateCustomer = async (id, data) => {
  return await Customer.update(id, data);
};

exports.deleteCustomer = async (id) => {
  return await Customer.delete(id);
};

exports.updateOrdersAndStatus = async (customerId) => {
  try {
    // 1. Lấy thông tin khách hàng hiện tại
    const customer = await Customer.getById(customerId);
    if (!customer) {
      throw new Error("Customer not found");
    }

    // 2. Đếm số đơn hàng "Hoàn tất" của khách hàng
    const newTotalOrders = await Customer.countCompletedOrders(customerId);

    // 3. Xác định trạng thái mới
    let newStatus;
    if (newTotalOrders < 10) {
      newStatus = "khách hàng mới";
    } else if (newTotalOrders <= 20) {
      newStatus = "khách hàng thân thiết";
    } else if (newTotalOrders < 50) {
      newStatus = "khách hàng thường xuyên";
    } else {
      newStatus = "khách hàng VIP";
    }

    // 4. Tạo đối tượng chứa dữ liệu cập nhật
    const updatedCustomerData = {
      customer_name: customer.customer_name,
      email: customer.email,
      phone: customer.phone,
      total_expenditure: customer.total_expenditure,
      status: newStatus,
      total_orders: newTotalOrders,
    };

    // 5. Cập nhật thông tin khách hàng
    return await Customer.update(customerId, updatedCustomerData);
  } catch (error) {
    console.error("Lỗi trong updateOrdersAndStatus:", error.message);
    throw error;
  }
};

exports.updateDebt = async (customerId, amount, increase = true) => {
  // amount: số tiền tăng/giảm
  // increase: true => tăng, false => giảm
  return await Customer.updateDebt(customerId, amount, increase);
};

// exports.getTotalRemainingValueForCustomer = async (customer_id) => {
//   const db = require("../../config/db.config");
//   // Lấy tất cả order_id của khách, bỏ qua đơn bị huỷ
//   const [orders] = await db
//     .promise()
//     .query(
//       "SELECT order_id FROM orders WHERE customer_id = ? AND order_status != 'Huỷ đơn'",
//       [customer_id]
//     );
//     if (!orders.length) return { total_remaining_value: 0, total_payable: 0 };
//   // Tính tổng remaining_value
//   const values = await Promise.all(
//     orders.map(async (o) => {
//       const summary = await OrderService.getOrderWithReturnSummary(o.order_id);
//       return summary ? Number(summary.remaining_value) : 0;
//     })
//   );

//   const total_remaining_value = values
//     .filter((v) => v > 0)
//     .reduce((sum, v) => sum + v, 0);
//   // Tổng doanh nghiệp nợ khách (chỉ cộng phần âm, lấy trị tuyệt đối)
//   const total_payable = values
//     .filter((v) => v < 0)
//     .reduce((sum, v) => sum + Math.abs(v), 0);

//   return { total_remaining_value, total_payable };
// };

exports.getTotalRemainingValueForCustomer = async (customer_id) => {
  const db = require("../../config/db.config");
  // Lấy tất cả order_id của khách, bỏ qua đơn bị huỷ
  const [orders] = await db
    .promise()
    .query(
      "SELECT order_id FROM orders WHERE customer_id = ? AND order_status != 'Huỷ đơn'",
      [customer_id]
    );
  // Nếu không có đơn hàng, vẫn phải kiểm tra giao dịch thu/chi
  // Lấy tổng đã thu (receipt)
  const [receipts] = await db
    .promise()
    .query(
      "SELECT IFNULL(SUM(amount), 0) as total_receipt FROM transactions WHERE customer_id = ? AND type = 'receipt'",
      [customer_id]
    );
  const total_receipt = Number(receipts[0]?.total_receipt || 0);

  // Lấy tổng đã chi (payment)
  const [payments] = await db
    .promise()
    .query(
      "SELECT IFNULL(SUM(amount), 0) as total_payment FROM transactions WHERE customer_id = ? AND type = 'payment' AND order_id IS NULL",
      [customer_id]
    );
  const total_payment = Number(payments[0]?.total_payment || 0);

  // Tính tổng remaining_value từ các đơn hàng (nếu cần)
  let total_remaining_value = 0;
  if (orders.length) {
    const values = await Promise.all(
      orders.map(async (o) => {
        const summary = await OrderService.getOrderWithReturnSummary(
          o.order_id
        );
        return summary ? Number(summary.remaining_value) : 0;
      })
    );
    total_remaining_value = values
      .filter((v) => v > 0)
      .reduce((sum, v) => sum + v, 0);
  }

  // Số tiền khách còn nợ doanh nghiệp (hoặc ngược lại)
  const net_debt = total_receipt - total_payment;

  return { total_remaining_value, net_debt };
};
