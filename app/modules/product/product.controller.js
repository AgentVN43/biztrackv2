const ProductService = require("./product.service");
const createResponse = require("../../utils/response"); // Đảm bảo đường dẫn đúng
const { paginateResponse } = require("../../utils/pagination"); // Import pagination utilities
const { processDateFilters } = require("../../utils/dateUtils");

exports.getAllProducts = async (req, res, next) => {
  const { page = 1, limit = 10 } = req.query;
  const parsedPage = parseInt(page);
  const parsedLimit = parseInt(limit);
  const skip = (parsedPage - 1) * parsedLimit;
  const { effectiveStartDate, effectiveEndDate } = processDateFilters(
    req.query
  );

  try {
    const { products, total } = await ProductService.getAllProducts(
      skip,
      parsedLimit,
      { startDate: effectiveStartDate, endDate: effectiveEndDate }
    ); // Truyền skip, limit vào service
    const responseData = paginateResponse(products, total, page, limit); // Định dạng response với pagination
    res.json(responseData);
  } catch (err) {
    console.error("🚀 ~ product.controller.js: getAllProducts - Error:", err);
    next(err);
  }
};

exports.getProductById = async (req, res, next) => {
  const id = req.params.id;
  try {
    const product = await ProductService.getProductById(id);
    if (!product) {
      return createResponse(res, 404, false, null, "Product not found");
    }
    createResponse(res, 200, true, product);
  } catch (err) {
    console.error("🚀 ~ product.controller.js: getProductById - Error:", err);
    next(err);
  }
};

exports.createProduct = async (req, res, next) => {
  try {
    const result = await ProductService.createProduct(req.body);
    createResponse(
      res,
      201,
      true,
      { product_id: result.product_id },
      "Product created"
    );
  } catch (err) {
    console.error("🚀 ~ product.controller.js: createProduct - Error:", err);
    if (err.message.includes("Invalid category_id")) {
      return createResponse(res, 400, false, null, err.message);
    }
    next(err);
  }
};

exports.updateProduct = async (req, res, next) => {
  const id = req.params.id;
  try {
    const result = await ProductService.updateProduct(id, req.body);
    if (result.affectedRows === 0) {
      return createResponse(
        res,
        404,
        false,
        null,
        "Product not found or no changes made"
      );
    }
    createResponse(res, 200, true, null, "Product updated");
  } catch (err) {
    console.error("🚀 ~ product.controller.js: updateProduct - Error:", err);
    if (err.message.includes("Invalid category_id")) {
      return createResponse(res, 400, false, null, err.message);
    }
    next(err);
  }
};

exports.deleteProduct = async (req, res, next) => {
  const id = req.params.id;
  try {
    const result = await ProductService.deleteProduct(id);
    if (result.affectedRows === 0) {
      return createResponse(res, 404, false, null, "Product not found");
    }
    createResponse(res, 200, true, null, "Product deleted");
  } catch (err) {
    console.error("🚀 ~ product.controller.js: deleteProduct - Error:", err);
    next(err);
  }
};
