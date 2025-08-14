const { CustomerModel, OrderModel, ProductModel, CategoryModel, WarehouseModel, InventoryModel } = require("./search.model");

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

exports.getCustomerByName = async (name, skip, limit) => {
  try {
    const customers = await CustomerModel.findByName(name, skip, limit);
    const total = await CustomerModel.countByName(name);
    return { customers, total };
  } catch (error) {
    console.error(
      "Lỗi trong Search Service (getCustomerByName):",
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
//     //console.log("This is allOrders:", allOrders);
//     return allOrders;
//   } catch (error) {
//     //console.error(
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

exports.getOrdersByCustomerName = async (customerName, skip, limit) => {
  try {
    const { orders, total } = await OrderModel.findByCustomerName(
      customerName,
      skip,
      limit
    );
    return { orders, total };
  } catch (error) {
    console.error(
      "Lỗi trong Search Service (getOrdersByCustomerName):",
      error.message
    );
    throw error;
  }
};

exports.searchOrdersByQuery = async (q, skip, limit) => {
  try {
    // Kiểm tra xem query có phải là số điện thoại không (chỉ chứa số và có độ dài từ 9-11 ký tự)
    const isPhoneNumber = /^\d{9,11}$/.test(q);
    
    if (isPhoneNumber) {
      // Tìm kiếm theo số điện thoại
      return await this.getOrdersByCustomerPhone(q, skip, limit);
    } else {
      // Tìm kiếm theo tên khách hàng
      return await this.getOrdersByCustomerName(q, skip, limit);
    }
  } catch (error) {
    console.error(
      "Lỗi trong Search Service (searchOrdersByQuery):",
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

exports.getCategoryByName = async (name, skip, limit) => {
  try {
    const categories = await CategoryModel.findByName(name, skip, limit);
    const total = await CategoryModel.countByName(name);
    return { categories, total };
  } catch (error) {
    console.error(
      "Lỗi trong Search Service (getCategoryByName):",
      error.message
    );
    throw error;
  }
};

exports.getProductsBySku = async (sku, limit, skip) => {
  try {
    const { products, total } = await ProductModel.findBySku(
      sku,
      limit,
      skip
    );
    return { products, total };
  } catch (error) {
    console.error(
      "Lỗi trong Search Service (getProductsBySku):",
      error.message
    );
    throw error;
  }
};

exports.getWarehouseByName = async (name, skip, limit) => {
  try {
    const warehouses = await WarehouseModel.findByName(name, skip, limit);
    const total = await WarehouseModel.countByName(name);
    return { warehouses, total };
  } catch (error) {
    console.error(
      "Lỗi trong Search Service (getWarehouseByName):",
      error.message
    );
    throw error;
  }
};

exports.searchInventory = async (q, warehouseName, status, skip, limit) => {
  try {
    const { inventories, total } = await InventoryModel.searchByProductQueryAndWarehouse(
      q,
      warehouseName,
      status,
      skip,
      limit
    );
    return { inventories, total };
  } catch (error) {
    console.error(
      "Lỗi trong Search Service (searchInventory):",
      error.message
    );
    throw error;
  }
};

exports.searchProductsByQuery = async (q, limit, skip) => {
  try {
    const { products, total } = await ProductModel.searchByQuery(
      q,
      limit,
      skip
    );
    return { products, total };
  } catch (error) {
    console.error(
      "Lỗi trong Search Service (searchProductsByQuery):",
      error.message
    );
    throw error;
  }
};
