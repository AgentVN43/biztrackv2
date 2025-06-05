const { processDateFilters } = require("../../utils/dateUtils");
const createResponse = require("../../utils/response");
const CustomerService = require("./customer.service");

exports.create = async (req, res) => {
  const customerData = req.body;
  try {
    const result = await CustomerService.createCustomer(customerData);
    res
      .status(201)
      .json({ message: "Customer created successfully", data: result });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// exports.get = async (req, res) => {
//   const { page = 1, limit = 10 } = req.query;
//   const parsedPage = parseInt(page);
//   const parsedLimit = parseInt(limit);
//   const skip = (parsedPage - 1) * parsedLimit;

//   try {
//     const result = await CustomerService.getAllCustomers();
//     return res.status(200).json({ success: true, data: result });
//   } catch (err) {
//     console.error("Lỗi khi lấy danh sách khách hàng:", err.message);
//     return res.status(500).json({
//       success: false,
//       error: "Lỗi server",
//       data: [],
//     });
//   }
// };

exports.get = async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const parsedPage = parseInt(page);
  const parsedLimit = parseInt(limit);
  const skip = (parsedPage - 1) * parsedLimit;
  const { effectiveStartDate, effectiveEndDate } = processDateFilters(
    req.query
  );
  try {
    const { customers, total } = await CustomerService.getAllCustomers(
      skip,
      parsedLimit,
      { startDate: effectiveStartDate, endDate: effectiveEndDate }
    );
    return createResponse(
      res,
      200,
      true,
      customers,
      null,
      total,
      parsedPage,
      parsedLimit
    );
  } catch (err) {
    console.error("Lỗi khi lấy danh sách khách hàng:", err.message);
    return createResponse(res, 500, false, [], "Lỗi server");
  }
};

exports.getById = async (req, res) => {
  const id = req.params.id;
  try {
    const result = await CustomerService.getCustomerById(id);
    if (!result) {
      return res.status(404).json({ message: "Customer not found" });
    }
    res.status(200).json({
      success: true,
      data: result, // Trả về kết quả customer
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

exports.update = async (req, res) => {
  const id = req.params.id;
  const customerData = req.body;
  try {
    const result = await CustomerService.updateCustomer(id, customerData);
    if (!result) {
      return res.status(404).json({ message: "Customer not found" });
    }
    res.status(200).json({ message: "Customer updated successfully" });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

exports.updateStatus = async (req, res) => {
  const id = req.params.id;
  try {
    const result = await CustomerService.updateOrdersAndStatus(id);
    res
      .status(200)
      .json({ message: "Customer updated successfully", data: result });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

exports.delete = async (req, res) => {
  const id = req.params.id;
  try {
    const result = await CustomerService.deleteCustomer(id);
    if (!result) {
      return res.status(404).json({ message: "Customer not found" });
    }
    res.status(200).json({ message: "Customer deleted successfully" });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
