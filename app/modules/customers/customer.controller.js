const { processDateFilters } = require("../../utils/dateUtils");

const CustomerService = require("./customer.service");
const CustomerReportService = require("../customer_report/customer_report.service");
const { createResponse, errorResponse } = require("../../utils/response");

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
    // Bổ sung total_remaining_value cho từng khách hàng
    const customersWithRemaining = await Promise.all(
      customers.map(async (c) => {
        const total_remaining_value =
          await CustomerService.getTotalRemainingValueForCustomer(
            c.customer_id
          );
        return {
          ...c,
          total_remaining_value: Math.round(total_remaining_value),
        };
      })
    );
    return createResponse(
      res,
      200,
      true,
      customersWithRemaining,
      null,
      total,
      parsedPage,
      parsedLimit
    );
  } catch (err) {
    console.error("Lỗi khi lấy danh sách khách hàng:", err.message);
    return errorResponse(res, 500, false, [], "Lỗi server");
  }
};

// exports.getById = async (req, res) => {
//   const id = req.params.id;
//   try {
//     const result = await CustomerService.getCustomerById(id);
//     if (!result) {
//       return res.status(404).json({ message: "Customer not found" });
//     }
//     res.status(200).json({
//       success: true,
//       data: result, // Trả về kết quả customer
//     });
//   } catch (err) {
//     return res.status(500).json({ error: err.message });
//   }
// };

(exports.getById = async (req, res, next) => {
  const customer_id = req.params.id; // Lấy ID khách hàng từ URL params

  try {
    // 1. Lấy thông tin cơ bản của khách hàng
    const customer = await CustomerService.getCustomerById(customer_id); // Giả định CustomerService có hàm getById
    if (!customer) {
      return createResponse(
        res,
        404,
        false,
        null,
        "Không tìm thấy khách hàng."
      );
    }

    // 2. Lấy dữ liệu báo cáo từ CustomerReportService
    const overview = await CustomerReportService.getTotalOrdersAndExpenditure(
      customer_id
    );
    const receivables = await CustomerReportService.getReceivables(customer_id);
    // Bạn có thể lấy thêm các báo cáo khác nếu muốn, ví dụ:
    // const salesReturnHistory = await CustomerReportService.getSalesReturnHistory(customer_id);
    // const orderHistory = await CustomerReportService.getOrderHistoryWithDetails(customer_id);

    // 3. Kết hợp thông tin cơ bản và dữ liệu báo cáo
    const customerWithReport = {
      ...customer, // Thông tin cơ bản của khách hàng
      total_orders: overview.total_orders,
      total_expenditure: parseFloat(overview.total_expenditure || 0), // Đảm bảo là số
      total_receivables: parseFloat(receivables || 0), // Đảm bảo là số

      // sales_return_history: salesReturnHistory, // Nếu bạn fetch
      // order_history: orderHistory, // Nếu bạn fetch
    };

    // 4. Trả về phản hồi thành công
    createResponse(
      res,
      200,
      true,
      customerWithReport,
      "Thông tin khách hàng và báo cáo đã được tải thành công."
    );
  } catch (error) {
    console.error(
      "🚀 ~ CustomerController: getById - Lỗi khi lấy thông tin khách hàng và báo cáo:",
      error
    );
    next(error); // Chuyển lỗi đến middleware xử lý lỗi
  }
}),
  (exports.update = async (req, res) => {
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
  });

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
