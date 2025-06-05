// const {
//   createTransaction,
//   getAllTransactions,
//   getTransactionById,
//   updateTransactionById,
//   deleteTransactionById
// } = require('./transaction.service');

// // Tạo mới
// const create = (req, res) => {
//   const data = req.body;
//   createTransaction(data, (error, result) => {
//     if (error) {
//       return res.status(500).json({ success: false, error: error.message });
//     }
//     return res.status(201).json({ success: true, data: result });
//   });
// };

// // Lấy tất cả
// const getAll = (req, res) => {
//   getAllTransactions((error, results) => {
//     if (error) {
//       return res.status(500).json({ success: false, error: error.message });
//     }
//     return res.json({ success: true, data: results });
//   });
// };

// // Lấy theo ID
// const getById = (req, res) => {
//   const id = req.params.id;
//   getTransactionById(id, (error, result) => {
//     if (error) {
//       return res.status(404).json({ success: false, error: error.message });
//     }
//     return res.json({ success: true, data: result });
//   });
// };

// // Cập nhật theo ID
// const updateById = (req, res) => {
//   const id = req.params.id;
//   const data = req.body;
//   updateTransactionById(id, data, (error, result) => {
//     if (error) {
//       return res.status(500).json({ success: false, error: error.message });
//     }
//     return res.json({ success: true, data: result });
//   });
// };

// // Xóa theo ID
// const deleteById = (req, res) => {
//   const id = req.params.id;
//   deleteTransactionById(id, (error) => {
//     if (error) {
//       return res.status(500).json({ success: false, error: error.message });
//     }
//     return res.json({ success: true });
//   });
// };

// module.exports = {
//   create,
//   getAll,
//   getById,
//   updateById,
//   deleteById
// };

// transaction.controller.js
const createResponse = require("../../utils/response");
const TransactionService = require("./transaction.service");

const TransactionController = {
  // createTransaction: (req, res) => {
  //   TransactionService.createTransaction(req.body, (err, transaction) => {
  //     if (err) {
  //       return res
  //         .status(500)
  //         .json({ message: "Failed to create transaction", error: err });
  //     }
  //     return res.status(201).json({
  //       message: "Transaction created successfully",
  //       data: transaction,
  //     });
  //   });
  // },

  createTransaction: async (req, res) => {
    try {
      const transaction = await TransactionService.createTransaction(req.body);
      return createResponse(
        res,
        201,
        true,
        transaction,
        "Transaction created successfully"
      );
    } catch (err) {
      console.error(
        "🚀 ~ transaction.controller.js: createTransaction - Error:",
        err
      );
      // Kiểm tra lỗi validate từ model
      if (
        err.message.includes("Thiếu thông tin bắt buộc") ||
        err.message.includes("dữ liệu không hợp lệ")
      ) {
        return createResponse(res, 400, false, null, err.message); // Lỗi client (bad request)
      }
      return createResponse(
        res,
        500,
        false,
        null,
        "Failed to create transaction",
        err.message
      ); // Lỗi server
    }
  },

  getTransactionById: (req, res) => {
    const transactionId = req.params.id;
    TransactionService.getTransactionById(transactionId)
      .then((transaction) => {
        if (transaction) {
          createResponse(
            res,
            200,
            true,
            transaction,
            "Transaction retrieved successfully"
          );
        } else {
          createResponse(res, 404, false, null, "Transaction not found");
        }
      })
      .catch((err) =>
        createResponse(
          res,
          500,
          false,
          null,
          "Failed to retrieve transaction",
          err
        )
      );
  },
};

module.exports = TransactionController;
