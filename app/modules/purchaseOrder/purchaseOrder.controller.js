// const service = require("./purchaseOrder.service");
// const paymentService = require("../payments/payments.service"); // Import payment service
// const transactionService = require("../transactions/transaction.service");

// exports.create = (req, res, next) => {
//   // service.createPurchaseOrder(req.body, (err, result) => {
//   //   if (err) return next(err);

//   //   // Tự động tạo phiếu chi khi Purchase Order được tạo thành công
//   //   paymentService.createPaymentOnPOCreation(
//   //     result.po_id,
//   //     result.total_amount || 0,
//   //     (paymentErr, payment) => {
//   //       // Truyền callback vào đây
//   //       if (paymentErr) {
//   //         // Xử lý lỗi khi tạo phiếu chi
//   //         //console.error("Error creating payment:", paymentErr);
//   //         // *Quan trọng*:  Bạn CẦN gọi res.status và res.json ở ĐÂY để kết thúc request
//   //         res.status(201).json({
//   //           // Hoặc 500, tùy logic
//   //           success: true, // Có thể là false tùy vào việc bạn có muốn báo lỗi không
//   //           data: { purchaseOrder: result, payment: null },
//   //           message: "Purchase Order created, but Payment creation failed.",
//   //         });
//   //       } else {
//   //         // Nếu tạo phiếu chi thành công, trả về cả thông tin PO và Payment
//   //         res
//   //           .status(201)
//   //           .json({ success: true, data: { purchaseOrder: result, payment } });
//   //       }
//   //     }
//   //   );

//   // });
//   service.createPurchaseOrder(req.body, (err, result) => {
//     if (err) return next(err);

//     paymentService.createPaymentOnPOCreation(
//       result.po_id,
//       result.total_amount || 0,
//       (paymentErr, payment) => {
//         if (paymentErr) {
//           //console.error("Error creating payment:", paymentErr);

//           // Có thể chọn không dừng flow mà vẫn trả về PO + báo lỗi ở payment
//           return res.status(201).json({
//             success: true,
//             data: { purchaseOrder: result, payment: null },
//             message: "Purchase Order created, but Payment creation failed.",
//           });
//         }

//         // Nếu tạo payment thành công, thì tiếp tục tạo transaction
//         const transactionData = {
//           transaction_code: `TX-P-${payment.payment_code}`,
//           transaction_type: "expense",
//           amount: payment.amount,
//           description: `Chi cho đơn mua hàng ${result.po_id}`,
//           category: "purchase_payment",
//           payment_method: payment.payment_method,
//           source_type: "payment",
//           source_id: payment.payment_id,
//         };

//         transactionService.createTransaction(
//           transactionData,
//           (transactionErr, transaction) => {
//             if (transactionErr) {
//               //console.error(
//                 "Lỗi khi tạo transaction từ payment:",
//                 transactionErr.message
//               );
//               // Vẫn tiếp tục trả kết quả, chỉ log lỗi
//             }

//             return res.status(201).json({
//               success: true,
//               data: {
//                 purchaseOrder: result,
//                 payment,
//                 transaction,
//               },
//             });
//           }
//         );
//       }
//     );
//   });
// };

// exports.getById = (req, res, next) => {
//   service.getPurchaseOrderById(req.params.id, (err, result) => {
//     if (err) return next(err);
//     if (!result)
//       return res.status(404).json({ success: false, message: "Not found" });
//     res.json({ success: true, data: result });
//   });
// };

// exports.getWithDetailsById = (req, res, next) => {
//   service.getPurchaseOrderDetailsById(req.params.id, (err, result) => {
//     if (err) return next(err);
//     if (!result)
//       return res.status(404).json({ success: false, message: "Not found" });
//     res.json({ success: true, data: result });
//   });
// };

// exports.remove = (req, res, next) => {
//   service.deletePurchaseOrder(req.params.id, (err) => {
//     if (err) return next(err);
//     res.json({ success: true, message: "Deleted" });
//   });
// };

// exports.postOrder = (req, res, next) => {
//   service.confirmPurchaseOrder(req.params.id, (err, result) => {
//     if (err) return next(err);
//     res.json({ success: true, data: result });
//   });
// };

// exports.update = (req, res, next) => {
//   service.updatePurchaseOrder(req.params.id, req.body, (err, result) => {
//     if (err) return next(err);
//     if (!result)
//       return res.status(404).json({ success: false, message: "Not found" });
//     res.json({ success: true, data: result });
//   });
// };

// exports.updatePOWithDetails = (req, res, next) => {
//   const poId = req.params.id;
//   const { supplier_name, note, status, details } = req.body;

//   service.updatePOWithDetails(
//     poId,
//     { supplier_name, note, status },
//     details,
//     (err, result) => {
//       if (err) return next(err);
//       res.json({ success: true, data: result });
//     }
//   );
// };
const service = require("./purchaseOrder.service");
const TransactionService = require("../transactions/transaction.service");
const InvoiceService = require("../invoice/invoice.service");
const {createResponse} = require("../../utils/response");

exports.create = async (req, res, next) => {
  try {
    // ✅ Chỉ tạo Purchase Order theo best practice
    const purchaseOrderResult = await service.createPurchaseOrder(req.body);

    // ✅ Trả về chỉ PO, không tạo Invoice và Transaction
    return res.status(201).json({
      success: true,
      data: {
        purchaseOrder: purchaseOrderResult,
        // Invoice và Transaction sẽ được tạo ở các bước sau:
        // - Invoice: khi nhận hàng (confirm/receive)
        // - Transaction: khi thanh toán
      },
      message: "Purchase Order created successfully. Invoice and Transaction will be created when goods are received and payment is made.",
    });
  } catch (err) {
    console.error(
      "🚀 ~ purchaseOrder.controller.js: create - Lỗi trong quá trình tạo Purchase Order:",
      err
    );
    next(err);
  }
};

exports.getAll = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const parsedPage = parseInt(page);
    const parsedLimit = parseInt(limit);
    const skip = (parsedPage - 1) * parsedLimit;
    const result = await service.getAllPurchaseOrders(skip, parsedLimit);
    if (result && result.orders && typeof result.total === 'number') {
      res.json({
        success: true,
        data: result.orders,
        pagination: {
          total: result.total,
          currentPage: parsedPage,
          pageSize: parsedLimit,
          totalPages: Math.ceil(result.total / parsedLimit)
        }
      });
    } else {
      res.json({ success: true, data: result });
    }
  } catch (err) {
    next(err);
  }
};

exports.getWithDetailsById = async (req, res, next) => {
  try {
    const result = await service.getPurchaseOrderDetailsById(req.params.id);
    if (!result) {
      return res.status(404).json({ success: false, message: "Not found" });
    }
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

exports.postOrder = async (req, res, next) => {
  // Lấy user_id từ req.user (do middleware xác thực cung cấp)
  // Nếu req.user không tồn tại (ví dụ: route không được bảo vệ bằng middleware auth), nó sẽ là null.
  const initiatedByUserId = req.user ? req.user.user_id : null;

  try {
    // Truyền po_id và initiatedByUserId xuống service
    const result = await service.confirmPurchaseOrder(
      req.params.id,
      initiatedByUserId
    );
    
    // ✅ Trả về thông tin chỉ gồm Invoice (không có transaction)
    res.json({ 
      success: true, 
      data: {
        message: result.message,
        invoice: result.invoice,
      },
      message: "Purchase order confirmed successfully. Invoice created. Transaction will be created only when payment is made."
    });
  } catch (err) {
    //console.error("🚀 ~ purchaseOrder.controller.js: postOrder - Lỗi:", err);
    next(err);
  }
};

exports.updatePOWithDetails = async (req, res, next) => {
  // ✅ Chuyển hàm thành async
  const poId = req.params.id;
  const { supplier_id, note, status, details } = req.body;

  try {
    // service.updatePOWithDetails cần trả về Promise
    const result = await service.updatePOWithDetails(
      poId,
      { supplier_id, note, status },
      details
    );
    res.json({ success: true, data: result });
  } catch (err) {
    console.error(
      "🚀 ~ purchaseOrder.controller.js: updatePOWithDetails - Lỗi:",
      err
    );
    next(err);
  }
};

exports.getSupplierHistory = async (req, res, next) => {
  const { supplierId } = req.params; // Lấy supplierId từ URL params

  try {
    const history = await service.getPurchaseHistoryBySupplierId(supplierId);
    if (!history || history.length === 0) {
      return createResponse(
        res,
        404,
        false,
        null,
        `Không tìm thấy lịch sử đơn mua hàng cho nhà cung cấp ID: ${supplierId}.`
      );
    }
    createResponse(
      res,
      200,
      true,
      history,
      "Lịch sử đơn mua hàng của nhà cung cấp đã được tải thành công."
    );
  } catch (error) {
    console.error(
      "🚀 ~ purchaseOrder.controller.js: getSupplierPurchaseHistory - Lỗi:",
      error
    );
    next(error); // Chuyển lỗi xuống middleware xử lý lỗi
  }
};

/**
 * Xử lý yêu cầu GET để lấy công nợ phải trả của một nhà cung cấp.
 * GET /api/purchase-orders/supplier/:supplierId/receivables
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 * @param {function} next - Express next middleware function.
 */
exports.getSupplierReceivables = async (req, res, next) => {
  const { supplierId } = req.params; // Lấy supplierId từ URL params

  try {
    // Gọi InvoiceService để lấy tổng công nợ và danh sách các hóa đơn chưa thanh toán
    const receivablesData = await InvoiceService.getSupplierPayables(
      supplierId
    );

    if (
      !receivablesData ||
      (receivablesData.total_payables === 0 &&
        receivablesData.unpaid_purchase_invoices.length === 0)
    ) {
      return createResponse(
        res,
        404,
        false,
        null,
        `Không tìm thấy công nợ phải trả cho nhà cung cấp ID: ${supplierId}.`
      );
    }
    createResponse(
      res,
      200,
      true,
      receivablesData,
      "Công nợ phải trả của nhà cung cấp đã được tải thành công."
    );
  } catch (error) {
    console.error(
      "🚀 ~ purchaseOrder.controller.js: getSupplierPurchaseReceivables - Lỗi:",
      error
    );
    next(error); // Chuyển lỗi xuống middleware xử lý lỗi
  }
};
