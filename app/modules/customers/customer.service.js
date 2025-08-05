// const Customer = require("./customer.model");

// exports.createCustomer = (data, callback) => {
//   Customer.create(data, callback);
// };
// exports.getAllCustomers = (callback) => {
//   Customer.getAll(callback);
// };
// exports.getCustomerById = (id, callback) => {
//   Customer.getById(id, callback);
// };
// exports.updateCustomer = (id, data, callback) => {
//   Customer.update(id, data, callback);
// };
// exports.deleteCustomer = (id, callback) => {
//   Customer.delete(id, callback);
// };

// exports.updateOrdersAndStatus = (customerId, finalCallback) => {
//   // 1. Lấy thông tin khách hàng hiện tại
//   Customer.getById(customerId, (err, customer) => {
//     if (err) {
//       return finalCallback(err);
//     }
//     if (!customer) {
//       return finalCallback(new Error('Customer not found'));
//     }

//     // 2. Đếm số đơn hàng "Hoàn tất" của khách hàng từ bảng Orders (sử dụng hàm từ model)
//     Customer.countCompletedOrders(customerId, (countErr, newTotalOrders) => {
//       if (countErr) {
//         return finalCallback(countErr);
//       }

//       // 3. Xác định trạng thái mới dựa trên newTotalOrders
//       let newStatus;
//       if (newTotalOrders < 10) {
//         newStatus = 'khách hàng mới';
//       } else if (newTotalOrders <= 20) {
//         newStatus = 'khách hàng thân thiết';
//       } else if (newTotalOrders < 50) {
//         newStatus = 'khách hàng thường xuyên';
//       } else {
//         newStatus = 'khách hàng VIP';
//       }

//       // 4. Tạo đối tượng chứa dữ liệu cập nhật
//       const updatedCustomerData = {
//         customer_name: customer.customer_name,
//         email: customer.email,
//         phone: customer.phone,
//         total_expenditure: customer.total_expenditure,
//         status: newStatus,
//         total_orders: newTotalOrders,
//       };

//       // 5. Cập nhật thông tin khách hàng
//       Customer.update(customerId, updatedCustomerData, (updateErr, updatedCustomerWithStatus) => {
//         if (updateErr) {
//           return finalCallback(updateErr);
//         }
//         finalCallback(null, updatedCustomerWithStatus);
//       });
//     });
//   });
// };

const Customer = require("./customer.model");
const OrderService = require("../orders/order.service");
const CustomerModel = require("./customer.model"); // Added for importFromText

exports.createCustomer = async (data) => {
  return await Customer.create(data);
};

exports.getAllCustomers = async (skip, limit, filters = {}) => {
  const { customers, total } = await Customer.getAll(skip, limit, filters);
  return { customers, total };
};

exports.getCustomerById = async (id) => {
  return await Customer.getById(id);
};

exports.updateCustomer = async (id, data) => {
  return await Customer.update(id, data);
};

exports.deleteCustomer = async (id) => {
  return await Customer.delete(id);
};

exports.updateOrdersAndStatus = async (customerId) => {
  try {
    // 1. Lấy thông tin khách hàng hiện tại
    const customer = await Customer.getById(customerId);
    if (!customer) {
      throw new Error("Customer not found");
    }

    // 2. Đếm số đơn hàng "Hoàn tất" của khách hàng
    const newTotalOrders = await Customer.countCompletedOrders(customerId);

    // 3. Xác định trạng thái mới
    let newStatus;
    if (newTotalOrders < 10) {
      newStatus = "khách hàng mới";
    } else if (newTotalOrders <= 20) {
      newStatus = "khách hàng thân thiết";
    } else if (newTotalOrders < 50) {
      newStatus = "khách hàng thường xuyên";
    } else {
      newStatus = "khách hàng VIP";
    }

    // 4. Tạo đối tượng chứa dữ liệu cập nhật
    const updatedCustomerData = {
      customer_name: customer.customer_name,
      email: customer.email,
      phone: customer.phone,
      total_expenditure: customer.total_expenditure,
      status: newStatus,
      total_orders: newTotalOrders,
    };

    // 5. Cập nhật thông tin khách hàng
    return await Customer.update(customerId, updatedCustomerData);
  } catch (error) {
    console.error("Lỗi trong updateOrdersAndStatus:", error.message);
    throw error;
  }
};

exports.updateDebt = async (customerId, amount, increase = true) => {
  // amount: số tiền tăng/giảm
  // increase: true => tăng, false => giảm
  return await Customer.updateDebt(customerId, amount, increase);
};

/**
 * Import customers từ text data (copy-paste từ Excel) - VALIDATION MODE
 * @param {string} textData - Dữ liệu text được copy từ Excel
 * @param {string} delimiter - Ký tự phân cách (mặc định: tab)
 * @param {boolean} validateOnly - Chỉ validate, không insert vào DB
 * @returns {Object} - Kết quả import với validation
 */
exports.importFromText = async (textData, delimiter = '\t', validateOnly = false) => {
  try {
    // Parse text data thành array
    const lines = textData.trim().split('\n');
    if (lines.length < 2) {
      throw new Error('Dữ liệu phải có ít nhất 1 dòng header và 1 dòng dữ liệu');
    }

    // Parse headers
    const headers = lines[0].split(delimiter).map(h => h.trim().toLowerCase());
    
    // Validate required headers
    const requiredHeaders = ['customer_name', 'phone'];
    const missingHeaders = requiredHeaders.filter(header => 
      !headers.includes(header)
    );

    if (missingHeaders.length > 0) {
      throw new Error(`Thiếu các cột bắt buộc: ${missingHeaders.join(', ')}`);
    }

    // Process data rows
    const validData = [];
    const errors = [];
    const summary = {
      total: lines.length - 1,
      valid: 0,
      invalid: 0,
      skipped: 0
    };

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) {
        summary.skipped++;
        continue;
      }

      const values = line.split(delimiter);
      const rowData = {};
      const rowErrors = [];

      // Map values to headers
      headers.forEach((header, index) => {
        rowData[header] = values[index] ? values[index].trim() : '';
      });

      // Validate required fields
      if (!rowData.customer_name) {
        rowErrors.push('Tên khách hàng không được để trống');
      }

      if (!rowData.phone) {
        rowErrors.push('Số điện thoại không được để trống');
      }

      // Validate email format
      if (rowData.email && rowData.email !== '') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(rowData.email)) {
          rowErrors.push('Email không đúng định dạng');
        }
      }

      // Validate phone format
      if (rowData.phone) {
        const phoneRegex = /^[0-9+\-\s()]+$/;
        if (!phoneRegex.test(rowData.phone)) {
          rowErrors.push('Số điện thoại chỉ được chứa số, dấu +, -, (), và khoảng trắng');
        }
      }

      // Validate numeric fields
      if (rowData.total_expenditure && parseFloat(rowData.total_expenditure) < 0) {
        rowErrors.push('Tổng chi tiêu không được âm');
      }

      if (rowData.total_orders && parseInt(rowData.total_orders) < 0) {
        rowErrors.push('Tổng đơn hàng không được âm');
      }

      if (rowData.debt && parseFloat(rowData.debt) < 0) {
        rowErrors.push('Công nợ không được âm');
      }

      // Check for duplicate phone (chỉ khi không phải validateOnly)
      if (rowData.phone && !validateOnly) {
        try {
          const existingCustomer = await CustomerModel.findByPhone(rowData.phone);
          if (existingCustomer) {
            rowErrors.push('Số điện thoại đã tồn tại trong hệ thống');
          }
        } catch (dbError) {
          console.warn('⚠️ Database check skipped due to connection error:', dbError.message);
          // Skip duplicate check if database is not available
        }
      }

      // Add to results
      if (rowErrors.length > 0) {
        errors.push({
          row: i + 1,
          errors: rowErrors,
          data: rowData
        });
        summary.invalid++;
      } else {
        // Transform data for database
        const customerData = {
          customer_id: require('crypto').randomUUID(),
          customer_name: rowData.customer_name,
          email: rowData.email || null,
          phone: rowData.phone,
          status: rowData.status || 'active',
          total_expenditure: parseFloat(rowData.total_expenditure) || 0,
          total_orders: parseInt(rowData.total_orders) || 0,
          debt: parseFloat(rowData.debt) || 0,
          created_at: new Date(),
          updated_at: new Date()
        };

        validData.push(customerData);
        summary.valid++;
      }
    }

    // Insert valid data to database (chỉ khi không phải validateOnly)
    let insertedCount = 0;
    if (validData.length > 0 && !validateOnly) {
      try {
        insertedCount = await CustomerModel.bulkInsert(validData);
      } catch (dbError) {
        console.error('🚀 ~ CustomerService.importFromText - Database insert failed:', dbError);
        throw new Error(`Lỗi lưu dữ liệu: ${dbError.message}`);
      }
    }

    return {
      summary: {
        ...summary,
        inserted: insertedCount,
        validateOnly: validateOnly
      },
      validData,
      errors
    };

  } catch (error) {
    throw new Error(`Lỗi import dữ liệu: ${error.message}`);
  }
};

/**
 * Tạo template cho import text
 * @returns {string} - Template text
 */
exports.createImportTemplate = () => {
  const template = `customer_name\temail\tphone\tstatus\ttotal_expenditure\ttotal_orders\tdebt
Nguyễn Văn A\tnguyenvana@email.com\t0123456789\tactive\t1000000\t5\t0
Trần Thị B\ttranthib@email.com\t0987654321\tactive\t2000000\t3\t500000
Lê Văn C\tlevanc@email.com\t0369852147\tactive\t1500000\t2\t0

Hướng dẫn:
- Copy dữ liệu từ Excel và paste vào đây
- Các cột bắt buộc: customer_name, phone
- Các cột tùy chọn: email, status, total_expenditure, total_orders, debt
- Sử dụng Tab (\\t) làm ký tự phân cách
- Dòng trống sẽ được bỏ qua`;
  
  return template;
};

// exports.getTotalRemainingValueForCustomer = async (customer_id) => {
//   const db = require("../../config/db.config");
//   // Lấy tất cả order_id của khách, bỏ qua đơn bị huỷ
//   const [orders] = await db
//     .promise()
//     .query(
//       "SELECT order_id FROM orders WHERE customer_id = ? AND order_status != 'Huỷ đơn'",
//       [customer_id]
//     );
//     if (!orders.length) return { total_remaining_value: 0, total_payable: 0 };
//   // Tính tổng remaining_value
//   const values = await Promise.all(
//     orders.map(async (o) => {
//       const summary = await OrderService.getOrderWithReturnSummary(o.order_id);
//       return summary ? Number(summary.remaining_value) : 0;
//     })
//   );

//   const total_remaining_value = values
//     .filter((v) => v > 0)
//     .reduce((sum, v) => sum + v, 0);
//   // Tổng doanh nghiệp nợ khách (chỉ cộng phần âm, lấy trị tuyệt đối)
//   const total_payable = values
//     .filter((v) => v < 0)
//     .reduce((sum, v) => sum + Math.abs(v), 0);

//   return { total_remaining_value, total_payable };
// };

exports.getTotalRemainingValueForCustomer = async (customer_id) => {
  const db = require("../../config/db.config");
  // Lấy tất cả order_id của khách, bỏ qua đơn bị huỷ
  const [orders] = await db
    .promise()
    .query(
      "SELECT order_id FROM orders WHERE customer_id = ? AND order_status != 'Huỷ đơn'",
      [customer_id]
    );
  // Nếu không có đơn hàng, vẫn phải kiểm tra giao dịch thu/chi
  // Lấy tổng đã thu (receipt)
  const [receipts] = await db
    .promise()
    .query(
      "SELECT IFNULL(SUM(amount), 0) as total_receipt FROM transactions WHERE customer_id = ? AND type = 'receipt'",
      [customer_id]
    );
  const total_receipt = Number(receipts[0]?.total_receipt || 0);

  // Lấy tổng đã chi (payment)
  const [payments] = await db
    .promise()
    .query(
      "SELECT IFNULL(SUM(amount), 0) as total_payment FROM transactions WHERE customer_id = ? AND type = 'payment' AND order_id IS NULL",
      [customer_id]
    );
  const total_payment = Number(payments[0]?.total_payment || 0);

  // Tính tổng remaining_value từ các đơn hàng (nếu cần)
  let total_remaining_value = 0;
  if (orders.length) {
    const values = await Promise.all(
      orders.map(async (o) => {
        const summary = await OrderService.getOrderWithReturnSummary(
          o.order_id
        );
        return summary ? Number(summary.remaining_value) : 0;
      })
    );
    total_remaining_value = values
      .filter((v) => v > 0)
      .reduce((sum, v) => sum + v, 0);
  }

  // Số tiền khách còn nợ doanh nghiệp (hoặc ngược lại)
  const net_debt = total_receipt - total_payment;

  return { total_remaining_value, net_debt };
};
