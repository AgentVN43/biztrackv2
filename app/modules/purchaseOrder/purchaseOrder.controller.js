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
//   //         console.error("Error creating payment:", paymentErr);
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
//           console.error("Error creating payment:", paymentErr);

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
//               console.error(
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
  // ✅ Chuyển hàm thành async
  try {
    // Gọi service.createPurchaseOrder và await kết quả
    // Hàm createPurchaseOrder trong service cần trả về po_id, total_amount, final_amount, order_date, supplier_id, payment_method
    const purchaseOrderResult = await service.createPurchaseOrder(req.body);

    // --- LƯU Ý QUAN TRỌNG: Theo quy trình nghiệp vụ, Invoice và Transaction thường được tạo khi PO được PHÊ DUYỆT/NHẬP KHO,
    // chứ không phải ngay khi PO được tạo nháp. Tuy nhiên, theo yêu cầu hiện tại, chúng ta sẽ tạo chúng ở đây. ---

    // ✅ Tạo Invoice cho đơn mua hàng này
    const invoiceData = {
      invoice_code: `INV-PO-${Date.now()}`, // Tự động sinh mã invoice cho PO
      invoice_type: "purchase_invoice",
      order_id: purchaseOrderResult.po_id, // Không có order_id cho hóa đơn mua hàng
      // purchase_order_id: purchaseOrderResult.po_id, // Liên kết với PO
      supplier_id: purchaseOrderResult.supplier_id, // Lấy từ PO đã tạo
      total_amount: purchaseOrderResult.total_amount,
      tax_amount: 0, // Cần tính toán nếu có thuế
      discount_amount: purchaseOrderResult.discount_amount || 0,
      final_amount: purchaseOrderResult.final_amount,
      issued_date: purchaseOrderResult.order_date || new Date(), // Sử dụng ngày PO hoặc ngày hiện tại
      due_date: purchaseOrderResult.order_date || new Date(), // Hoặc một ngày cụ thể
      status: "pending", // Trạng thái ban đầu của hóa đơn mua hàng
      note: `Hóa đơn mua hàng tự động phát sinh từ PO ${purchaseOrderResult.po_id}`,
    };

    // InvoiceService.create cần được refactor để trả về Promise
    const invoice = await InvoiceService.create(invoiceData);
    console.log(
      "🚀 ~ purchaseOrder.controller.js: Invoice created successfully:",
      invoice
    );

    // ✅ Tạo Transaction cho hóa đơn mua hàng
    const transactionData = {
      transaction_code: `TRX-PO-${Date.now()}`, // Tự động sinh mã transaction
      type: "payment", // Thường là 'payment' cho hóa đơn mua hàng
      amount: invoice.final_amount, // Lấy từ invoice đã tạo
      description: `Thanh toán cho hóa đơn mua hàng ${invoice.invoice_code}`,
      category: "purchase_payment", // Danh mục mua hàng
      payment_method: purchaseOrderResult.payment_method || "Chuyển khoản", // Lấy từ PO hoặc mặc định
      related_type: "invoice", // Liên kết với invoice
      related_id: invoice.invoice_id, // Lấy từ invoice đã tạo
    };

    // transactionService.createTransaction đã được refactor để trả về Promise
    const transaction = await TransactionService.createTransaction(
      transactionData
    );
    console.log(
      "🚀 ~ purchaseOrder.controller.js: Transaction created successfully:",
      transaction
    );

    // Trả về kết quả cuối cùng
    return res.status(201).json({
      success: true,
      data: {
        purchaseOrder: purchaseOrderResult,
        invoice, // ✅ Thêm invoice vào response
        transaction, // ✅ Thêm transaction vào response
      },
      message: "Purchase Order, Invoice, and Transaction created successfully.",
    });
  } catch (err) {
    console.error(
      "🚀 ~ purchaseOrder.controller.js: create - Lỗi trong quá trình tạo Purchase Order và các bản ghi liên quan:",
      err
    );
    // Xử lý lỗi và trả về phản hồi lỗi
    next(err); // Chuyển lỗi đến middleware xử lý lỗi
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
    res.json({ success: true, data: result });
  } catch (err) {
    console.error("🚀 ~ purchaseOrder.controller.js: postOrder - Lỗi:", err);
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
