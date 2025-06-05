const { CustomerModel, OrderModel, ProductModel } = require("./search.model");

exports.getCustomerByPhone = async (phone, skip, limit) => {
  try {
    const customers = await CustomerModel.findByPhone(phone, skip, limit);
    const total = await CustomerModel.countByPhone(phone);
    return { customers, total };
  } catch (error) {
    console.error(
      "Lỗi trong Search Service (getCustomerByPhone):",
      error.message
    );
    throw error;
  }
};

// exports.getOrdersByCustomerPhone = async (partialPhone) => {
//   try {
//     const customers = await CustomerModel.findByPhone(partialPhone);

//     if (!customers || customers.length === 0) {
//       return [];
//     }

//     const allOrders = [];
//     for (const customer of customers) {
//       const orders = await OrderModel.findByCustomerId(customer.customer_id);
//       allOrders.push(...orders);
//     }
//     console.log("This is allOrders:", allOrders);
//     return allOrders;
//   } catch (error) {
//     console.error(
//       "Lỗi trong Search Service (getOrdersByCustomerPhone):",
//       error.message
//     );
//     throw error;
//   }
// };

exports.getOrdersByCustomerPhone = async (partialPhone, skip, limit) => {
  try {
    const customers = await CustomerModel.findByPhone(partialPhone, skip, limit);

    if (!customers || customers.length === 0) {
      return { orders: [], total: 0 };
    }

    let allOrders = [];

    for (const customer of customers) {
      const ordersResult = await OrderModel.findByCustomerId(
        customer.customer_id
      );
      allOrders.push(...ordersResult.orders);
    }

    const totalOverallOrders = allOrders.length;
    const paginatedOrders = allOrders.slice(skip, skip + limit);
    return { orders: paginatedOrders, total: totalOverallOrders };
  } catch (error) {
    console.error(
      "Lỗi trong Search Service (getOrdersByCustomerPhone):",
      error.message
    );
    throw error;
  }
};

exports.getProductsByName = async (name, limit, skip) => {
  try {
    const { products, total } = await ProductModel.findByName(
      name,
      limit,
      skip
    );
    return { products, total };
  } catch (error) {
    console.error(
      "Lỗi trong Search Service (getProductsByName):",
      error.message
    );
    throw error;
  }
};
