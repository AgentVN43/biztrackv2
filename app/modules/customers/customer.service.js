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

exports.createCustomer = async (data) => {
  return await Customer.create(data);
};

exports.getAllCustomers = async (skip, limit,filters = {}) => {
  const { customers, total } = await Customer.getAll(skip, limit,filters);
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
