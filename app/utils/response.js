// utils/response.js
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

module.exports = createResponse;
