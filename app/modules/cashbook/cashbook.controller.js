const TransactionModel = require("../transactions/transaction.model");
const { createResponse, errorResponse } = require("../../utils/response");
const db = require("../../config/db.config");
// Tạo phiếu thu/chi
exports.createTransaction = async (req, res) => {
  try {
    const {
      amount,
      type,
      category,
      payment_method,
      description,
      customer_id,
      supplier_id,
      related_type,
      related_id,
      initiated_by,
    } = req.body;
    if (!amount || !type) {
      return errorResponse(res, "amount và type là bắt buộc", 400);
    }
    const transaction = await TransactionModel.createTransaction({
      transaction_code: `TXN-${Date.now()}`,
      type,
      amount,
      category,
      payment_method,
      description,
      customer_id,
      supplier_id,
      related_type,
      related_id,
      initiated_by,
      status: "completed",
      created_at: new Date(),
    });
    return createResponse(res, 201, true, transaction, "Tạo phiếu thành công");
  } catch (err) {
    return errorResponse(res, err.message || "Lỗi tạo phiếu thu/chi", 500);
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
      where += " AND created_at >= ?";
      params.push(from);
    }
    if (to) {
      where += " AND created_at <= ?";
      params.push(to);
    }
    if (type) {
      where += " AND type = ?";
      params.push(type);
    }
    if (category) {
      where += " AND category = ?";
      params.push(category);
    }
    if (customer_id) {
      where += " AND customer_id = ?";
      params.push(customer_id);
    }
    if (supplier_id) {
      where += " AND supplier_id = ?";
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
       ${where}
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
      .query(`SELECT COUNT(*) as total FROM transactions ${where}`, params);

    const totalPages = Math.ceil(total / limitNum);

    // Lấy tổng thu (receipt)
    const [receiptRows] = await db
      .promise()
      .query(
        `SELECT IFNULL(SUM(amount), 0) as total_receipt FROM transactions ${where} AND type = 'receipt'`,
        params
      );
    const total_receipt = Number(receiptRows[0]?.total_receipt || 0);

    // Lấy tổng chi (payment)
    const [paymentRows] = await db
      .promise()
      .query(
        `SELECT IFNULL(SUM(amount), 0) as total_payment FROM transactions ${where} AND type = 'payment'`,
        params
      );
    const total_payment = Number(paymentRows[0]?.total_payment || 0);

    // Số dư
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
    const paginated = require('../../utils/pagination').paginateResponse(
      responseData,
      total,
      pageNum,
      limitNum
    );
    return createResponse(
      res,
      200,
      true,
      paginated,
      "Lấy sổ quỹ thành công"
    );
  } catch (err) {
    return errorResponse(res, err.message || "Lỗi lấy sổ quỹ", 500);
  }
};
