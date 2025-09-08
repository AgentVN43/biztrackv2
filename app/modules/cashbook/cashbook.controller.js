const TransactionService = require('../transactions/transaction.service');
const CashbookService = require("./cashbook.service");
const { createResponse, errorResponse } = require("../../utils/response");
const db = require("../../config/db.config");
// Tạo phiếu thu/chi
exports.createTransaction = async (req, res) => {
  try {
    const transactionData = req.body;
    
    // Sử dụng TransactionService thay vì TransactionModel trực tiếp
    const transaction = await TransactionService.createTransaction(transactionData);
    
    res.status(201).json({
      success: true,
      data: transaction,
      message: "Transaction created successfully"
    });
  } catch (error) {
    //console.error("🚀 ~ cashbook.controller.js: createTransaction - Error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Internal server error"
    });
  }
};

// Lấy sổ quỹ tổng hợp
exports.getLedger = async (req, res) => {
  try {
    const {
      from,
      to,
      type,
      category,
      customer_id,
      supplier_id,
      page = 1,
      limit = 20,
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10)) || 1;
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10))) || 20;
    const offset = (pageNum - 1) * limitNum;

    // Xây dựng điều kiện truy vấn
    let where = "WHERE 1=1";
    const params = [];
    if (from) {
      where += " AND created_at >= ? AND type != 'refund'";
      params.push(from);
    }
    if (to) {
      where += " AND created_at <= ? AND type != 'refund'";
      params.push(to);
    }

    if (category) {
      where += " AND category = ? AND type != 'refund'";
      params.push(category);
    }
    if (customer_id) {
      where += " AND customer_id = ? AND type != 'refund'";
      params.push(customer_id);
    }
    if (supplier_id) {
      where += " AND supplier_id = ? AND type != 'refund'";
      params.push(supplier_id);
    }

    // Lấy danh sách giao dịch với LIMIT và OFFSET
    // const [rows] = await db
    //   .promise()
    //   .query(
    //     `SELECT * FROM transactions ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    //     [...params, limitNum, offset]
    //   );

    const [rows] = await db.promise().query(
      `SELECT t.*, 
              c.customer_name, c.phone as customer_phone, c.email as customer_email,
              s.supplier_name, s.phone as supplier_phone, s.email as supplier_email
       FROM transactions t
       LEFT JOIN customers c ON t.customer_id = c.customer_id
       LEFT JOIN suppliers s ON t.supplier_id = s.supplier_id
       ${where} AND t.type NOT IN ('refund','adjustment', 'adj_increase', 'adj_decrease')
       ORDER BY t.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, limitNum, offset]
    );

    const resultRows = rows.map((row) => ({
      ...row,
      customer: row.customer_id
        ? {
          customer_id: row.customer_id,
          customer_name: row.customer_name,
          phone: row.customer_phone,
          email: row.customer_email,
        }
        : null,
      supplier: row.supplier_id
        ? {
          supplier_id: row.supplier_id,
          supplier_name: row.supplier_name,
          phone: row.supplier_phone,
          email: row.supplier_email,
        }
        : null,
    }));

    // Xóa các trường lẻ nếu muốn
    resultRows.forEach((r) => {
      delete r.customer_name;
      delete r.customer_phone;
      delete r.customer_email;
      delete r.supplier_name;
      delete r.supplier_phone;
      delete r.supplier_email;
    });

    // Lấy tổng số bản ghi để tính tổng trang
    const [[{ total }]] = await db
      .promise()
      .query(`SELECT COUNT(*) as total FROM transactions ${where} AND type != 'refund'`, params);

    const totalPages = Math.ceil(total / limitNum);

    // Lấy tổng thu (receipt)
    const [receiptRows] = await db
      .promise()
      .query(
        `SELECT IFNULL(SUM(amount), 0) as total_receipt FROM transactions ${where} AND type = 'receipt' AND type != 'refund'`,
        params
      );
    const total_receipt = Number(receiptRows[0]?.total_receipt || 0);

    // Lấy tổng chi (payment)
    const [paymentRows] = await db
      .promise()
      .query(
        `SELECT IFNULL(SUM(amount), 0) as total_payment FROM transactions ${where} AND type = 'payment' AND type != 'refund'`,
        params
      );
    const total_payment = Number(paymentRows[0]?.total_payment || 0);

      const balance = total_receipt - total_payment;

    // Trả về kết quả với thông tin phân trang và tổng hợp
    const responseData = {
      resultRows,
      summary: {
        total_receipt,
        total_payment,
        balance,
      },
    };
    return createResponse(
      res,
      200,
      true,
      responseData,
      "Lấy sổ quỹ thành công",
      total,
      pageNum,
      limitNum
    );
  } catch (err) {
    return errorResponse(res, err.message || "Lỗi lấy sổ quỹ", 500);
  }
};

// Lấy sổ cái giao dịch tổng hợp hệ thống
exports.getSystemTransactionLedger = async (req, res) => {
  try {
    const {
      from_date,
      to_date,
      customer_id,
      supplier_id,
      transaction_type,
      page = 1,
      limit = 50
    } = req.query;

    const filters = {
      from_date,
      to_date,
      customer_id,
      supplier_id,
      transaction_type,
      page: parseInt(page),
      limit: parseInt(limit)
    };

    const result = await CashbookService.getSystemTransactionLedger(filters);

    return createResponse(
      res,
      200,
      true,
      result.transactions,
      "Lấy sổ cái giao dịch hệ thống thành công",
      result.pagination.total,
      result.pagination.page,
      result.pagination.limit
    );
  } catch (err) {
    return errorResponse(res, err.message || "Lỗi lấy sổ cái giao dịch hệ thống", 500);
  }
};

// Lấy thống kê tổng hợp giao dịch hệ thống
exports.getSystemTransactionSummary = async (req, res) => {
  try {
    const {
      from_date,
      to_date,
      customer_id,
      supplier_id
    } = req.query;

    const filters = {
      from_date,
      to_date,
      customer_id,
      supplier_id
    };

    const result = await CashbookService.getSystemTransactionSummary(filters);

    return createResponse(
      res,
      200,
      true,
      result,
      "Lấy thống kê giao dịch hệ thống thành công"
    );
  } catch (err) {
    return errorResponse(res, err.message || "Lỗi lấy thống kê giao dịch hệ thống", 500);
  }
};

// Lấy hoạt động gần đây tổng hợp
exports.getRecentActivitiesCombined = async (req, res) => {
  try {
    const {
      limit = 10,
      hours = 24,
      include_alerts = true
    } = req.query;

    const filters = {
      limit: parseInt(limit),
      hours: parseInt(hours),
      include_alerts: include_alerts === 'true'
    };

    const result = await CashbookService.getRecentActivitiesCombined(filters);

    return createResponse(
      res,
      200,
      true,
      result,
      "Lấy hoạt động gần đây tổng hợp thành công"
    );
  } catch (err) {
    return errorResponse(res, err.message || "Lỗi lấy hoạt động gần đây tổng hợp", 500);
  }
};

// CRUD operations for transactions

// Lấy giao dịch theo ID
exports.getTransactionById = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return errorResponse(res, "Transaction ID là bắt buộc", 400);
    }

    const transaction = await CashbookService.getTransactionById(id);
    
    if (!transaction) {
      return errorResponse(res, "Không tìm thấy giao dịch", 404);
    }

    return createResponse(
      res,
      200,
      true,
      transaction,
      "Lấy thông tin giao dịch thành công"
    );
  } catch (err) {
    return errorResponse(res, err.message || "Lỗi lấy thông tin giao dịch", 500);
  }
};

// Cập nhật giao dịch
exports.updateTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    if (!id) {
      return errorResponse(res, "Transaction ID là bắt buộc", 400);
    }

    // Validate required fields
    if (updateData.amount !== undefined && (isNaN(updateData.amount) || updateData.amount <= 0)) {
      return errorResponse(res, "Số tiền phải là số dương", 400);
    }

    const updatedTransaction = await CashbookService.updateTransaction(id, updateData);
    
    if (!updatedTransaction) {
      return errorResponse(res, "Không tìm thấy giao dịch để cập nhật", 404);
    }

    return createResponse(
      res,
      200,
      true,
      updatedTransaction,
      "Cập nhật giao dịch thành công"
    );
  } catch (err) {
    return errorResponse(res, err.message || "Lỗi cập nhật giao dịch", 500);
  }
};

// Xóa giao dịch
exports.deleteTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return errorResponse(res, "Transaction ID là bắt buộc", 400);
    }

    const result = await CashbookService.deleteTransaction(id);
    
    if (!result) {
      return errorResponse(res, "Không tìm thấy giao dịch để xóa", 404);
    }

    return createResponse(
      res,
      200,
      true,
      { deleted: true, transaction_id: id },
      "Xóa giao dịch thành công"
    );
  } catch (err) {
    return errorResponse(res, err.message || "Lỗi xóa giao dịch", 500);
  }
};
