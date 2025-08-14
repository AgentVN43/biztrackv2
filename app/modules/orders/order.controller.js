// const OrderService = require("./order.service");
// const OrderDetailService = require("../orderDetails/orderDetail.service");
// const TransactionService = require("../transactions/transaction.service");
// const Product = require("../../controllers/product.controller");
// const Inventory = require("../inventories/inventory.service");

// const { v4: uuidv4 } = require("uuid");

// // --- Hàm tạo receipt trong controller (tách khỏi Express) ---
// // function createReceiptData(order, paymentMethod) {
// //   return {
// //     order_id: order.order_id,
// //     receipt_code: `REC-${Date.now()}`, // Có thể thay bằng hàm generateReceiptCode()
// //     receipt_date: new Date(),
// //     amount: order.final_amount || order.total_amount || 0,
// //     payment_method: paymentMethod || "Unknown",
// //     note: `Receipt for order ${order.order_code}`,
// //   };
// // }

// // --- Hàm tạo receipt và gọi callback khi xong ---
// // function createReceiptAndRespond(order, orderDetails, paymentMethod, res) {
// //   const receiptData = createReceiptData(order, paymentMethod);

// //   ReceiptService.create(receiptData, (errorReceipt, newReceipt) => {
// //     if (errorReceipt) {
// //       return res.status(500).json({
// //         message: "Failed to create receipt",
// //         error: errorReceipt,
// //       });
// //     }

// //     res.status(201).json({
// //       order,
// //       orderDetails,
// //       receipt: newReceipt,
// //     });
// //   });
// // }

// function calculateOrderTotals(orderDetails, orderData = {}) {
//   let calculatedTotalAmount = 0;
//   let calculatedDiscountProductAmount = 0;

//   const validDetails = Array.isArray(orderDetails) ? orderDetails : [];

//   validDetails.forEach((detail) => {
//     const price = parseFloat(detail.price) || 0;
//     const quantity = parseInt(detail.quantity) || 0;
//     const discount = parseFloat(detail.discount) || 0;

//     calculatedTotalAmount += price * quantity;
//     calculatedDiscountProductAmount += discount * quantity;
//   });

//   const orderDiscountAmount = parseFloat(orderData.order_amount || 0);
//   const totalDiscountAmount =
//     orderDiscountAmount + calculatedDiscountProductAmount;
//   const shippingFee = parseFloat(orderData.shipping_fee) || 0;

//   const finalAmount = calculatedTotalAmount - totalDiscountAmount + shippingFee;

//   return {
//     total_amount: calculatedTotalAmount,
//     discount_amount: totalDiscountAmount,
//     final_amount: finalAmount,
//     shipping_fee: shippingFee,
//     order_amount: orderDiscountAmount,
//   };
// }

// const OrderController = {
//   create: (req, res) => {
//     OrderService.create(req.body, (error, order) => {
//       if (error) {
//         return res.status(500).json({ success: false, error: error });
//       }
//       res.status(201).json({ success: true, data: order });
//     });
//   },

//   read: (req, res) => {
//     OrderService.read((error, order) => {
//       if (error) {
//         return res
//           .status(500)
//           .json({ message: "Failed to read orders", error });
//       }
//       res.status(200).json({ success: true, data: order });
//     });
//   },

//   readById: (req, res) => {
//     const { id } = req.params;
//     OrderService.readById(id, (error, order) => {
//       if (error) {
//         return res.status(500).json({ message: "Failed to read order", error });
//       }
//       if (!order) {
//         return res.status(404).json({ message: "Order not found" });
//       }
//       res.status(200).json(order);
//     });
//   },

//   update: (req, res) => {
//     const { id } = req.params;
//     OrderService.update(id, req.body, (error, order) => {
//       if (error) {
//         //console.error("🔥 Lỗi cập nhật order:", error);
//         return res
//           .status(500)
//           .json({
//             message: "Failed to update order",
//             error: error.message || error,
//           });
//       }
//       if (!order) {
//         return res.status(404).json({ message: "Order not found" });
//       }
//       res.status(200).json(order);
//     });
//   },

//   delete: (req, res) => {
//     const { id } = req.params;
//     OrderService.delete(id, (error, success) => {
//       if (error) {
//         return res
//           .status(500)
//           .json({ message: "Failed to delete order", error });
//       }
//       if (!success) {
//         return res.status(404).json({ message: "Order not found" });
//       }
//       res.status(204).send();
//     });
//   },

//   createOrderWithDetails: (req, res) => {
//     const { order: orderData, orderDetails } = req.body;

//     //console.log("REQ.BODY:", req.body);

//     if (!Array.isArray(orderDetails) || orderDetails.length === 0) {
//       return res.status(400).json({
//         message: "Danh sách sản phẩm trống hoặc không hợp lệ",
//       });
//     }

//     const calculated = calculateOrderTotals(orderDetails, orderData);

//     const orderToCreate = {
//       ...orderData,
//       total_amount: calculated.total_amount.toFixed(2),
//       discount_amount: calculated.discount_amount.toFixed(2),
//       final_amount: calculated.final_amount.toFixed(2),
//       order_amount: calculated.order_amount.toFixed(2),
//       shipping_fee: calculated.shipping_fee.toFixed(2),
//     };

//     OrderService.create(orderToCreate, (errorOrder, newOrder) => {
//       if (errorOrder) {
//         return res.status(500).json({
//           message: "Tạo đơn hàng thất bại",
//           error: errorOrder,
//         });
//       }

//       const detailPromises = orderDetails.map((detail) => {
//         const detailData = { ...detail, order_id: newOrder.order_id };
//         return new Promise((resolve, reject) => {
//           OrderDetailService.create(detailData, (err, result) => {
//             if (err) reject(err);
//             else resolve(result);
//           });
//         });
//       });

//       Promise.all(detailPromises)
//         .then((createdDetails) => {
//           Inventory.reserveStockFromOrderDetails(
//             orderDetails,
//             orderToCreate.warehouse_id,
//             (reserveError) => {
//               if (reserveError) //console.error(reserveError.message);

//               return res.status(201).json({
//                 message: "Tạo đơn hàng thành công",
//                 order: newOrder,
//                 order_details: createdDetails,
//               });
//             }
//           );
//         })
//         .catch((error) => {
//           return res.status(500).json({
//             message: "Lỗi khi tạo chi tiết đơn hàng",
//             error,
//           });
//         });
//     });
//   },

//   updateOrderWithDetails: (req, res) => {
//     const orderId = req.params.id;
//     const orderData = req.body;
//     OrderService.updateOrderWithDetails(orderId, orderData, (err, result) => {
//       if (err) {
//         //console.error("Error updating order:", err);
//         return res
//           .status(500)
//           .json({ message: "Failed to update order", error: err });
//       }
//       res
//         .status(200)
//         .json({ message: "Order updated successfully", data: result });
//     });
//   },
// };

// module.exports = OrderController;
// order.controller.js
const OrderService = require("./order.service");
const OrderDetailService = require("../orderDetails/orderDetail.service"); // Cần import OrderDetailService
const Inventory = require("../inventories/inventory.service"); // Cần import InventoryService
const { processDateFilters } = require("../../utils/dateUtils");
const { createResponse, errorResponse } = require("../../utils/response");
const Order = require('./order.model');

// Hàm tính toán tổng tiền đơn hàng (được giữ lại trong controller vì được sử dụng trực tiếp ở đây)
function calculateOrderTotals(orderDetails, orderData = {}) {
  let calculatedTotalAmount = 0;
  let calculatedDiscountProductAmount = 0;

  const validDetails = Array.isArray(orderDetails) ? orderDetails : [];

  validDetails.forEach((detail) => {
    const price = parseFloat(detail.price) || 0;
    const quantity = parseInt(detail.quantity) || 0;
    const discount = parseFloat(detail.discount) || 0;

    calculatedTotalAmount += price * quantity;
    calculatedDiscountProductAmount += discount;
    // calculatedDiscountProductAmount += discount * quantity;
  });

  const orderDiscountAmount = parseFloat(orderData.order_amount || 0);
  const totalDiscountAmount =
    orderDiscountAmount + calculatedDiscountProductAmount;
  const shippingFee = parseFloat(orderData.shipping_fee) || 0;

  const finalAmount = calculatedTotalAmount - totalDiscountAmount + shippingFee;

  return {
    total_amount: calculatedTotalAmount, // ✅ Đã sửa từ `totalAmount` thành `calculatedTotalAmount`
    discount_amount: totalDiscountAmount,
    final_amount: finalAmount,
    shipping_fee: shippingFee,
    order_amount: orderDiscountAmount,
  };
}

const OrderController = {
  /**
   * Xử lý yêu cầu tạo đơn hàng mới.
   * @param {Object} req - Đối tượng Request.
   * @param {Object} res - Đối tượng Response.
   * @param {Function} next - Hàm middleware tiếp theo.
   */
  create: async (req, res, next) => {
    // ✅ Chuyển sang async
    try {
      const newOrder = await OrderService.create(req.body); // ✅ Sử dụng await
      res.status(201).json({
        success: true,
        data: newOrder,
        message: "Order created successfully!",
      });
    } catch (err) {
      //console.error("🚀 ~ order.controller.js: create - Lỗi:", err);
      next(err); // Chuyển lỗi đến middleware xử lý lỗi
    }
  },

  /**
   * Xử lý yêu cầu đọc tất cả đơn hàng.
   * @param {Object} req - Đối tượng Request.
   * @param {Object} res - Đối tượng Response.
   * @param {Function} next - Hàm middleware tiếp theo.
   */
  // read: async (req, res, next) => {
  //   // ✅ Chuyển sang async
  //   try {
  //     const orders = await OrderService.read(); // ✅ Sử dụng await
  //     res.status(200).json({ success: true, data: orders });
  //   } catch (err) {
  //     //console.error("🚀 ~ order.controller.js: read - Lỗi:", err);
  //     next(err);
  //   }
  // },

  read: async (req, res, next) => {
    const orderStatusMap = {
      0: "Mới",
      1: "Xác nhận",
      2: "Đang đóng hàng",
      3: "Đang giao",
      4: "Hoàn tất",
      5: "Huỷ đơn",
      6: "Huỷ điều chỉnh",
    };

    try {
      // 1. Lấy thông tin phân trang
      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 10;

      // 2. Lọc theo trạng thái đơn hàng (số → chuỗi)
      let orderStatus;
      const orderStatusParam = req.query.order_status;

      if (orderStatusParam !== undefined) {
        const parsed = parseInt(orderStatusParam, 10);

        if (isNaN(parsed)) {
          return res.status(400).json({ message: "order_status phải là số." });
        }

        if (parsed !== -1) {
          const mappedStatus = orderStatusMap[parsed];
          if (!mappedStatus) {
            return res
              .status(400)
              .json({ message: "Trạng thái đơn hàng không hợp lệ." });
          }
          orderStatus = mappedStatus; // dùng chuỗi đúng như trong DB
        }
        // Nếu là -1 thì orderStatus vẫn giữ undefined → không lọc
      }

      // 3. Xử lý bộ lọc ngày tháng
      const { effectiveStartDate, effectiveEndDate } = processDateFilters(
        req.query
      );

      // 4. Gọi service
      const { data: orders, total: totalOrders } = await OrderService.read(
        page,
        limit,
        {
          startDate: effectiveStartDate,
          endDate: effectiveEndDate,
          order_status: orderStatus,
        }
      );

      // 5. Trả về dữ liệu phân trang
      return createResponse(res, 200, true, orders, null, totalOrders, page, limit);
    } catch (err) {
      //console.error("🚀 ~ OrderController.read ~ Lỗi:", err);
      next(err);
    }
  },

  /**
   * Xử lý yêu cầu đọc đơn hàng theo ID.
   * @param {Object} req - Đối tượng Request.
   * @param {Object} res - Đối tượng Response.
   * @param {Function} next - Hàm middleware tiếp theo.
   */
  readById: async (req, res, next) => {
    // ✅ Chuyển sang async
    const { id } = req.params;
    try {
      const order = await OrderService.readById(id); // ✅ Sử dụng await
      if (!order) {
        return res
          .status(404)
          .json({ success: false, message: "Order not found" });
      }
      res.status(200).json({ success: true, data: order });
    } catch (err) {
      //console.error("🚀 ~ order.controller.js: readById - Lỗi:", err);
      next(err);
    }
  },

  /**
   * Xử lý yêu cầu cập nhật đơn hàng.
   * @param {Object} req - Đối tượng Request.
   * @param {Object} res - Đối tượng Response.
   * @param {Function} next - Hàm middleware tiếp theo.
   */
  // update: async (req, res, next) => {
  //   // ✅ Chuyển sang async
  //   const { id } = req.params;
  //   try {
  //     const updatedOrder = await OrderService.update(id, req.body); // ✅ Sử dụng await
  //     res.status(200).json({
  //       success: true,
  //       data: updatedOrder,
  //       message: "Order updated successfully",
  //     });
  //   } catch (err) {
  //     //console.error("🚀 ~ order.controller.js: update - Lỗi:", err);
  //     next(err);
  //   }
  // },

  update: async (req, res, next) => {
    const { id } = req.params;
    const updateData = req.body;
    // Lấy user_id từ req.user (do middleware xác thực cung cấp)
    // Nếu req.user không tồn tại (ví dụ: route không được bảo vệ bằng middleware auth), nó sẽ là null.
    const initiatedByUserId = req.user ? req.user.user_id : null;

    try {
      // Truyền order_id, updateData và initiatedByUserId xuống service
      const updatedOrder = await OrderService.update(
        id,
        updateData,
        initiatedByUserId
      );

      // Sử dụng hàm tiện ích createResponse để chuẩn hóa phản hồi
      createResponse(
        res,
        200,
        true,
        updatedOrder,
        "Order updated successfully"
      );
    } catch (err) {
      //console.error("🚀 ~ order.controller.js: update - Lỗi:", err);
      // Chuyển lỗi xuống middleware xử lý lỗi toàn cục
      next(err);
    }
  },

  /**
   * Xử lý yêu cầu xóa đơn hàng.
   * @param {Object} req - Đối tượng Request.
   * @param {Object} res - Đối tượng Response.
   * @param {Function} next - Hàm middleware tiếp theo.
   */
  delete: async (req, res, next) => {
    // ✅ Chuyển sang async
    const { id } = req.params;
    try {
      const success = await OrderService.delete(id); // ✅ Sử dụng await
      if (!success) {
        return res.status(404).json({
          success: false,
          message: "Order not found or already deleted",
        });
      }
      res.status(204).send(); // 204 No Content cho xóa thành công
    } catch (err) {
      //console.error("🚀 ~ order.controller.js: delete - Lỗi:", err);
      next(err);
    }
  },

  /**
   * Xử lý yêu cầu tạo đơn hàng kèm chi tiết.
   * @param {Object} req - Đối tượng Request.
   * @param {Object} res - Đối tượng Response.
   * @param {Function} next - Hàm middleware tiếp theo.
   */
  // createOrderWithDetails: async (req, res, next) => {
  //   // ✅ Chuyển sang async
  //   const { order: orderData, orderDetails } = req.body;

  //   //console.log(
  //     "🚀 ~ order.controller.js: createOrderWithDetails - REQ.BODY:",
  //     req.body
  //   );

  //   if (!Array.isArray(orderDetails) || orderDetails.length === 0) {
  //     return res.status(400).json({
  //       message: "Danh sách sản phẩm trống hoặc không hợp lệ",
  //     });
  //   }

  //   try {
  //     const calculated = calculateOrderTotals(orderDetails, orderData);

  //     const orderToCreate = {
  //       ...orderData,
  //       total_amount: calculated.total_amount.toFixed(2),
  //       discount_amount: calculated.discount_amount.toFixed(2),
  //       final_amount: calculated.final_amount.toFixed(2),
  //       order_amount: calculated.order_amount.toFixed(2),
  //       shipping_fee: calculated.shipping_fee.toFixed(2),
  //     };

  //     const newOrder = await OrderService.create(orderToCreate); // Await OrderService.create

  //     const createdDetails = await Promise.all(
  //       // Await all detail creations
  //       orderDetails.map(async (detail) => {
  //         const detailData = { ...detail, order_id: newOrder.order_id };
  //         return await OrderDetailService.create(detailData); // Await OrderDetailService.create
  //       })
  //     );

  //     // Reserve stock (assuming orderToCreate.warehouse_id is available)
  //     if (orderToCreate.warehouse_id) {
  //       await Inventory.reserveStockFromOrderDetails(
  //         // Await Inventory.reserveStockFromOrderDetails
  //         orderDetails,
  //         orderToCreate.warehouse_id
  //       );
  //       //console.log(
  //         "🚀 ~ order.controller.js: createOrderWithDetails - Stock reserved successfully."
  //       );
  //     } else {
  //       //console.warn(
  //         "🚀 ~ order.controller.js: createOrderWithDetails - No warehouse_id provided for stock reservation."
  //       );
  //     }

  //     res.status(201).json({
  //       message: "Tạo đơn hàng thành công",
  //       order: newOrder,
  //       order_details: createdDetails,
  //     });
  //   } catch (error) {
  //     //console.error(
  //       "🚀 ~ order.controller.js: createOrderWithDetails - Lỗi:",
  //       error
  //     );
  //     next(error); // Pass error to middleware
  //   }
  // },

  createOrderWithDetails: async (req, res, next) => {
    const { order: orderData, orderDetails } = req.body;

    //console.log(
    //   "🚀 ~ order.controller.js: createOrderWithDetails - REQ.BODY (dữ liệu thô từ client):",
    //   req.body
    // );
    //console.log(
    //   "🚀 ~ order.controller.js: createOrderWithDetails - orderData (từ req.body.order):",
    //   orderData
    // ); // <-- LOG THÊM ĐỂ KIỂM TRA amount_paid Ở ĐÂY

    if (!Array.isArray(orderDetails) || orderDetails.length === 0) {
      return createResponse(
        res,
        400,
        false,
        null,
        "Danh sách sản phẩm trống hoặc không hợp lệ."
      );
    }
    if (!orderData || !orderData.customer_id || !orderData.warehouse_id) {
      return createResponse(
        res,
        400,
        false,
        null,
        "Thông tin đơn hàng chính bị thiếu (customer_id, warehouse_id)."
      );
    }

    try {
      const orderDataForService = {
        ...orderData,
        details: orderDetails, // Truyền mảng chi tiết sản phẩm
      };
      //console.log(
      //   "🚀 ~ order.controller.js: createOrderWithDetails - Dữ liệu gửi đến OrderService.create:",
      //   orderDataForService
      // );

      const newOrderWithDetails = await OrderService.create(
        orderDataForService
      ); // Gọi OrderService.create

      createResponse(
        res,
        201,
        true,
        newOrderWithDetails,
        "Tạo đơn hàng thành công!"
      );
    } catch (error) {
      console.error(
        "🚀 ~ order.controller.js: createOrderWithDetails - Lỗi:",
        error
      );
      // Chuyển lỗi đến middleware xử lý lỗi (để hiển thị thông báo lỗi chi tiết hơn)
      next(error);
    }
  },

  /**
   * Xử lý yêu cầu cập nhật đơn hàng và chi tiết của nó.
   * @param {Object} req - Đối tượng Request.
   * @param {Object} res - Đối tượng Response.
   * @param {Function} next - Hàm middleware tiếp theo.
   */
  updateOrderWithDetails: async (req, res, next) => {
    const { id } = req.params;
    const { order, orderDetails } = req.body;

    //console.log(
    //   "🚀 ~ order.controller.js: updateOrderWithDetails - REQ.BODY (dữ liệu thô từ client):",
    //   req.body
    // );
    //console.log(
    //   "🚀 ~ order.controller.js: updateOrderWithDetails - orderData (từ req.body.order):",
    //   order
    // );
    //console.log(
    //   "🚀 ~ order.controller.js: updateOrderWithDetails - amount_paid từ client:",
    //   order?.amount_paid
    // );

    // ✅ Validation cơ bản
    if (!order) {
      return res.status(400).json({
        success: false,
        message: "Thiếu dữ liệu đơn hàng (order)"
      });
    }

    if (!Array.isArray(orderDetails)) {
      return res.status(400).json({
        success: false,
        message: "orderDetails phải là một mảng"
      });
    }

    // ✅ Validation amount_paid
    if (order.amount_paid !== undefined && order.amount_paid !== null) {
      const amountPaid = parseFloat(order.amount_paid);
      if (isNaN(amountPaid) || amountPaid < 0) {
        return res.status(400).json({
          success: false,
          message: "amount_paid phải là số không âm"
        });
      }
      //console.log(
      //   "🚀 ~ order.controller.js: updateOrderWithDetails - amount_paid đã được validate:",
      //   amountPaid
      // );
    }

    try {
      const result = await OrderService.updateOrderWithDetails(id, req.body);
      //console.log(
      //   "🚀 ~ order.controller.js: updateOrderWithDetails - Cập nhật thành công:",
      //   result
      // );
      res
        .status(200)
        .json({ success: true, message: result.message, data: result });
    } catch (err) {
      console.error(
        "🚀 ~ order.controller.js: updateOrderWithDetails - Lỗi:",
        err
      );
      next(err);
    }
  },
  getTotalByStatus: async (req, res, next) => {
    const { effectiveStartDate, effectiveEndDate } = processDateFilters(
      req.query
    );

    try {
      const data = await OrderService.getTotalByStatus({
        startDate: effectiveStartDate,
        endDate: effectiveEndDate,
      });

      res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      //console.error("Controller - getTotalByStatus:", error.message);
      next(error);
    }
  },
  getOrderWithReturnSummary: async (req, res) => {
    try {
      const { order_id } = req.params;
      if (!order_id) return res.status(400).json({ success: false, message: 'Thiếu order_id' });
      const result = await OrderService.getOrderWithReturnSummary(order_id);
      if (!result) return res.status(404).json({ success: false, message: 'Không tìm thấy order' });
      return res.status(200).json({ success: true, data: result });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  },

  getOrderTransactionLedger: async (req, res, next) => {
    const order_id = req.params.id;
    try {
      const ledger = await OrderService.getOrderTransactionLedger(
        order_id
      );

      // if (ledger.length === 0) {
      //   return createResponse(
      //     res,
      //     404,
      //     false,
      //     null,
      //     `Không tìm thấy lịch sử giao dịch cho đơn hàng ID: ${order_id}.`
      //   );
      // }

      createResponse(
        res,
        200,
        true,
        ledger,
        "Sổ cái giao dịch của đơn hàng đã được tải thành công."
      );
    } catch (error) {
      console.error(
        "🚀 ~ OrderController: getOrderTransactionLedger - Lỗi:",
        error
      );
      return errorResponse(res, error.message || "Lỗi server", 500);
    }
  },
};

module.exports = OrderController;
