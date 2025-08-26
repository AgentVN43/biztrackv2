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
//     //console.error("Lỗi khi lấy danh sách khách hàng:", err.message);
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

		// 🔄 Auto-sync debt for each customer to ensure up-to-date values
		const CustomerModel = require("./customer.model");
		await Promise.all(
			customers.map((c) => CustomerModel.updateDebt(c.customer_id, 0, true))
		);

		// Refetch customers after sync to return updated debt values
		const { customers: refreshedCustomers } = await CustomerService.getAllCustomers(
			skip,
			parsedLimit,
			{ startDate: effectiveStartDate, endDate: effectiveEndDate }
		);

    // Bổ sung total_remaining_value và total_payable cho từng khách hàng
    const customersWithRemaining = await Promise.all(
			refreshedCustomers.map(async (c) => {
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
    //console.error("Lỗi khi lấy danh sách khách hàng:", err.message);
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

exports.importFromText = async (req, res) => {
  try {
    const { textData, delimiter = '\t', validateOnly = false } = req.body;

    if (!textData || typeof textData !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Dữ liệu text không hợp lệ'
      });
    }

    //console.log('🚀 ~ CustomerController.importFromText - Processing:', {
    //   textDataLength: textData.length,
    //   delimiter,
    //   validateOnly
    // });

    const result = await CustomerService.importFromText(textData, delimiter, validateOnly);
    
    const message = validateOnly 
      ? `Validation hoàn thành: ${result.summary.valid} records hợp lệ, ${result.summary.invalid} lỗi`
      : `Import thành công: ${result.summary.valid} records, ${result.summary.invalid} lỗi`;
    
    return res.status(200).json({
      success: true,
      data: result,
      message: message
    });

  } catch (error) {
    //console.error('🚀 ~ CustomerController.importFromText - Error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Lỗi import dữ liệu'
    });
  }
};

exports.downloadImportTemplate = async (req, res) => {
  try {
    const template = CustomerService.createImportTemplate();
    
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="customers-import-template.txt"');
    res.send(template);
    
  } catch (error) {
    //console.error('🚀 ~ CustomerController.downloadImportTemplate - Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi tạo template'
    });
  }
};

// Tính lại debt cho customer
exports.calculateDebt = async (req, res) => {
  try {
    const { customer_id } = req.params;

    if (!customer_id) {
      return errorResponse(res, 'Thiếu customer_id', 400);
    }

    //console.log(`🚀 ~ CustomerController.calculateDebt - Tính debt cho customer: ${customer_id}`);

    // Gọi hàm tính debt từ model
    const CustomerModel = require('./customer.model');
    await CustomerModel.updateDebt(customer_id, 0, true);
    const calculatedDebt = await CustomerModel.calculateDebtFromLedger(customer_id);

    // Cập nhật debt vào database
    await CustomerModel.update(customer_id, { debt: calculatedDebt });

    // Lấy thông tin customer sau khi cập nhật
    const updatedCustomer = await CustomerModel.getById(customer_id);

    return createResponse(res, 200, true, {
      customer_id,
      calculated_debt: calculatedDebt,
      customer: updatedCustomer
    }, `Tính debt thành công (ledger): ${calculatedDebt}`);

  } catch (error) {
    //console.error('🚀 ~ CustomerController.calculateDebt - Error:', error);
    return errorResponse(res, error.message || 'Lỗi tính debt', 500);
  }
};

const CustomerController = {
  /**
   * Đồng bộ debt cho tất cả customers
   * @param {Object} req - Express request object.
   * @param {Object} res - Express response object.
   * @param {Function} next - Express next middleware function.
   */
  syncAllDebts: async (req, res, next) => {
    try {
      //console.log("🔄 CustomerController: Bắt đầu đồng bộ debt cho tất cả customers...");
      
      const CustomerModel = require('./customer.model');
      const result = await CustomerModel.syncAllDebts();
      
      createResponse(
        res,
        200,
        true,
        result,
        `Đã đồng bộ debt thành công cho ${result.successCount} customers. ${result.errorCount > 0 ? `${result.errorCount} customers có lỗi.` : ''}`
      );
    } catch (error) {
      console.error(
        "🚀 ~ customer.controller.js: syncAllDebts - Error:",
        error
      );
      next(error);
    }
  },

  /**
   * Đồng bộ debt cho một customer cụ thể
   * @param {Object} req - Express request object.
   * @param {Object} res - Express response object.
   * @param {Function} next - Express next middleware function.
   */
  syncCustomerDebt: async (req, res, next) => {
    try {
      const { id } = req.params;
      //console.log(`🔄 CustomerController: Đang đồng bộ debt cho customer ${id}...`);
      
      const CustomerModel = require('./customer.model');
      // Gọi updateDebt để trigger tính toán lại và đồng bộ
      const result = await CustomerModel.updateDebt(id, 0, true);
      
      if (result > 0) {
        // Lấy thông tin customer sau khi update
        const updatedCustomer = await CustomerModel.getById(id);
        
        createResponse(
          res,
          200,
          true,
          {
            customer_id: id,
            current_debt: updatedCustomer.debt,
            sync_status: "success"
          },
          `Đã đồng bộ debt thành công cho customer ${id}. Debt hiện tại: ${updatedCustomer.debt}`
        );
      } else {
        createResponse(
          res,
          404,
          false,
          null,
          `Không tìm thấy customer với ID: ${id}`
        );
      }
    } catch (error) {
      console.error(
        "🚀 ~ customer.controller.js: syncCustomerDebt - Error:",
        error
      );
      next(error);
    }
  }
};
