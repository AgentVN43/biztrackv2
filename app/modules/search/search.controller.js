const SearchService = require("./search.service");
const createResponse = require("../../utils/response"); // Đảm bảo đường dẫn đúng

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
    return createResponse(res, 200, true, customers, null, total, page, limit);
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
    console.log("Total orders:", total);
    return createResponse(res, 200, true, orders, null, total, page, limit);
  } catch (error) {
    return createResponse(res, 404, false, null, error.message);
  }
};

exports.searchProductsByName = async (req, res) => {
  const { name } = req.query;
  const { page, skip, limit } = getPaginationParams(req);

  // const page = parseInt(req.query.page) || 1;
  // const limit = parseInt(req.query.limit) || 10;
  // const skip = (page - 1) * limit;

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
