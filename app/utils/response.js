// utils/response.js

/**
 * Tạo response cơ bản (tương đương successResponse)
 * @param {Object} res - Express response object
 * @param {number} statusCode - HTTP status code
 * @param {boolean} success - Trạng thái thành công
 * @param {any} data - Dữ liệu trả về
 * @param {string} message - Thông báo
 * @param {number} totalItems - Tổng số items (cho pagination)
 * @param {number} page - Trang hiện tại
 * @param {number} limit - Số items mỗi trang
 * @returns {Object} Response object
 */
const createResponse = (
  res,
  statusCode,
  success,
  data,
  message = null,
  totalItems = null,
  page = null,
  limit = null
) => {
  const response = {
    success: success,
    data: data,
  };

  if (message) {
    response.message = message;
  }

  if (totalItems !== null && page !== null && limit !== null) {
    response.pagination = {
      total: totalItems,
      currentPage: page,
      pageSize: limit,
      totalPages: Math.ceil(totalItems / limit),
    };
  }

  return res.status(statusCode).json(response);
};

/**
 * Tạo error response
 * @param {Object} res - Express response object
 * @param {string} message - Thông báo lỗi
 * @param {number} statusCode - HTTP status code (mặc định 500)
 * @returns {Object} Error response
 */
const errorResponse = (res, message, statusCode = 500) => {
  const response = {
    success: false,
    message: message
  };

  return res.status(statusCode).json(response);
};

module.exports = {
  createResponse,
  errorResponse
};
