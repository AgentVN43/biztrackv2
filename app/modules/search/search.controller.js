const SearchService = require("./search.service");
const {createResponse} = require("../../utils/response"); // Đảm bảo đường dẫn đúng
const CustomerService = require("../customers/customer.service"); // Import để lấy tổng nợ

const getPaginationParams = (req) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (parseInt(page) - 1) * parseInt(limit);
  return { page, skip, limit };
};

exports.searchCustomerByPhone = async (req, res) => {
  const { phone } = req.query;
  const { page, skip, limit } = getPaginationParams(req);

  if (!phone) {
    return createResponse(res, 400, false, null, "Số điện thoại là bắt buộc");
  }

  try {
    const { customers, total } = await SearchService.getCustomerByPhone(
      phone,
      skip,
      limit
    );
    // Bổ sung trường tổng nợ và net_debt
    const customersWithRemaining = await Promise.all(
      customers.map(async (c) => {
        const { total_remaining_value, net_debt } =
          await CustomerService.getTotalRemainingValueForCustomer(
            c.customer_id
          );
        return {
          ...c,
          total_remaining_value: Math.round(total_remaining_value),
          net_debt: Math.round(net_debt),
        };
      })
    );
    return createResponse(res, 200, true, customersWithRemaining, null, total, page, limit);
  } catch (error) {
    return createResponse(res, 404, false, null, error.message);
  }
};

exports.searchCustomerByName = async (req, res) => {
  const { name } = req.query;
  const { page, skip, limit } = getPaginationParams(req);

  if (!name) {
    return createResponse(res, 400, false, null, "Tên khách hàng là bắt buộc");
  }

  try {
    const { customers, total } = await SearchService.getCustomerByName(
      name,
      skip,
      limit
    );
    // Bổ sung trường tổng nợ và net_debt
    const customersWithRemaining = await Promise.all(
      customers.map(async (c) => {
        const { total_remaining_value, net_debt } =
          await CustomerService.getTotalRemainingValueForCustomer(
            c.customer_id
          );
        return {
          ...c,
          total_remaining_value: Math.round(total_remaining_value),
          net_debt: Math.round(net_debt),
        };
      })
    );
    return createResponse(res, 200, true, customersWithRemaining, null, total, page, limit);
  } catch (error) {
    return createResponse(res, 404, false, null, error.message);
  }
};

exports.searchOrdersByPhone = async (req, res) => {
  const { phone } = req.query;
  const { page, skip, limit } = getPaginationParams(req);

  if (!phone) {
    return createResponse(res, 400, false, null, "Số điện thoại là bắt buộc");
  }

  try {
    const { orders, total } = await SearchService.getOrdersByCustomerPhone(
      phone,
      skip,
      limit
    );
    //console.log("Total orders:", total);
    return createResponse(res, 200, true, orders, null, total, page, limit);
  } catch (error) {
    return createResponse(res, 404, false, null, error.message);
  }
};

exports.searchOrdersByCustomerName = async (req, res) => {
  const { name } = req.query;
  const { page, skip, limit } = getPaginationParams(req);

  if (!name) {
    return createResponse(res, 400, false, null, "Tên khách hàng là bắt buộc");
  }

  try {
    const { orders, total } = await SearchService.getOrdersByCustomerName(
      name,
      skip,
      limit
    );
    return createResponse(res, 200, true, orders, null, total, page, limit);
  } catch (error) {
    return createResponse(res, 404, false, null, error.message);
  }
};

exports.searchOrdersAuto = async (req, res) => {
  const { q } = req.query;
  const { page, skip, limit } = getPaginationParams(req);

  if (!q) {
    return createResponse(res, 400, false, null, "Thiếu tham số tìm kiếm (q)");
  }

  try {
    const { orders, total } = await SearchService.searchOrdersByQuery(
      q,
      skip,
      limit
    );
    return createResponse(res, 200, true, orders, null, total, page, limit);
  } catch (error) {
    return createResponse(res, 500, false, null, error.message);
  }
};

exports.searchProductsByName = async (req, res) => {
  const { name } = req.query;
  const { page, skip, limit } = getPaginationParams(req);

  if (!name) {
    return createResponse(res, 400, false, null, "Tên sản phẩm là bắt buộc");
  }

  try {
    const { products, total } = await SearchService.getProductsByName(
      name,
      limit,
      skip
    );
    return createResponse(res, 200, true, products, null, total, page, limit);
  } catch (error) {
    return createResponse(res, 500, false, null, error.message);
  }
};

exports.searchProductsBySku = async (req, res) => {
  const { sku } = req.query;
  const { page, skip, limit } = getPaginationParams(req);

  if (!sku) {
    return createResponse(res, 400, false, null, "SKU sản phẩm là bắt buộc");
  }

  try {
    const { products, total } = await SearchService.getProductsBySku(
      sku,
      limit,
      skip
    );
    return createResponse(res, 200, true, products, null, total, page, limit);
  } catch (error) {
    return createResponse(res, 500, false, null, error.message);
  }
};

exports.searchCategoryByName = async (req, res) => {
  const { name } = req.query;
  const { page, skip, limit } = getPaginationParams(req);

  if (!name) {
    return createResponse(res, 400, false, null, "Tên danh mục là bắt buộc");
  }

  try {
    const { categories, total } = await SearchService.getCategoryByName(
      name,
      skip,
      limit
    );
    return createResponse(res, 200, true, categories, null, total, page, limit);
  } catch (error) {
    return createResponse(res, 404, false, null, error.message);
  }
};

exports.searchWarehouseByName = async (req, res) => {
  const { name } = req.query;
  const { page, skip, limit } = getPaginationParams(req);

  if (!name) {
    return createResponse(res, 400, false, null, "Tên kho là bắt buộc");
  }

  try {
    const { warehouses, total } = await SearchService.getWarehouseByName(
      name,
      skip,
      limit
    );
    return createResponse(res, 200, true, warehouses, null, total, page, limit);
  } catch (error) {
    return createResponse(res, 404, false, null, error.message);
  }
};

exports.searchInventory = async (req, res) => {
  const { q, warehouse, status } = req.query;
  const { page, skip, limit } = getPaginationParams(req);

  if (!q && !warehouse && !status) {
    return createResponse(res, 400, false, null, "Ít nhất phải có một tham số tìm kiếm (q, warehouse, hoặc status)");
  }

  try {
    const { inventories, total } = await SearchService.searchInventory(
      q,
      warehouse,
      status,
      skip,
      limit
    );
    return createResponse(res, 200, true, inventories, null, total, page, limit);
  } catch (error) {
    return createResponse(res, 500, false, null, error.message);
  }
};

exports.searchProductsAuto = async (req, res) => {
  const { q } = req.query;
  const { page, skip, limit } = getPaginationParams(req);

  if (!q) {
    return createResponse(res, 400, false, null, "Thiếu tham số tìm kiếm (q)");
  }

  try {
    const { products, total } = await SearchService.searchProductsByQuery(
      q,
      limit,
      skip
    );
    return createResponse(res, 200, true, products, null, total, page, limit);
  } catch (error) {
    return createResponse(res, 500, false, null, error.message);
  }
};

exports.searchCustomerAuto = async (req, res) => {
  const { q } = req.query;
  const { page, skip, limit } = getPaginationParams(req);

  if (!q) {
    return createResponse(res, 400, false, null, "Thiếu tham số tìm kiếm (q)");
  }

  // Kiểm tra nếu là số điện thoại (chỉ chứa số, hoặc bắt đầu bằng số)
  const isPhone = /^\d+$/.test(q.trim());

  try {
    let result;
    if (isPhone) {
      result = await SearchService.getCustomerByPhone(q, skip, limit);
    } else {
      result = await SearchService.getCustomerByName(q, skip, limit);
    }
    // Bổ sung trường tổng nợ và net_debt
    const customersWithRemaining = await Promise.all(
      result.customers.map(async (c) => {
        const { total_remaining_value, net_debt } =
          await CustomerService.getTotalRemainingValueForCustomer(
            c.customer_id
          );
        return {
          ...c,
          total_remaining_value: Math.round(total_remaining_value),
          net_debt: Math.round(net_debt),
        };
      })
    );
    return createResponse(res, 200, true, customersWithRemaining, null, result.total, page, limit);
  } catch (error) {
    return createResponse(res, 500, false, null, error.message);
  }
};
