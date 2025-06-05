// utils/pagination.js
const paginateResponse = (data, total, page, limit) => {
  return {
    success: true,
    data: data,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    },
  };
};

module.exports = { paginateResponse };