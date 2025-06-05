// const { v4: uuidv4 } = require("uuid");
// const PurchaseOrder = require("./purchaseOrder.model");
// const PurchaseOrderDetail = require("./purchaseOrderDetail.model");
// const Inventory = require("../inventories/inventory.model"); // dùng chung module inventory
// const Payment = require("../payments/payments.model"); // Import model Payments
// const Product = require("../../controllers/product.controller");

// exports.createPurchaseOrder = (data, callback) => {
//   const { supplier_name, warehouse_id, note, details } = data;
//   const po_id = uuidv4();

//   // Tính toán totalAmount ở Backend
//   const totalAmount = details
//     ? details.reduce(
//         (sum, detail) => sum + detail.quantity * parseFloat(detail.price || 0),
//         0
//       )
//     : 0;

//   console.log("Total Amount:", totalAmount);

//   PurchaseOrder.create(
//     {
//       po_id,
//       supplier_name,
//       warehouse_id,
//       note,
//       status: "draft",
//       total_amount: totalAmount,
//     },
//     (err) => {
//       if (err) return callback(err);

//       let completed = 0;
//       const numDetails = details ? details.length : 0;

//       if (numDetails === 0) {
//         return callback(null, {
//           message: "Purchase order saved as draft",
//           po_id,
//           total_amount: totalAmount,
//         });
//       }

//       for (const item of details) {
//         const po_detail_id = uuidv4();
//         PurchaseOrderDetail.create(
//           {
//             po_detail_id,
//             po_id,
//             product_id: item.product_id,
//             quantity: item.quantity,
//             price: item.price,
//           },
//           (err) => {
//             if (err) return callback(err);
//             if (++completed === numDetails) {
//               callback(null, {
//                 message: "Purchase order saved as draft",
//                 po_id,
//                 total_amount: totalAmount,
//               });
//             }
//           }
//         );
//       }
//     }
//   );
// };

// exports.updatePurchaseOrder = (po_id, data, callback) => {
//   PurchaseOrder.update(po_id, data, callback);
// };

// // exports.updatePOWithDetails = (poId, data, details, callback) => {
// //   PurchaseOrder.update(poId, data, (err, result) => {
// //     if (err) return callback(err);

// //     let completed = 0;
// //     const detailsToProcess = details || [];
// //     const totalDetails = detailsToProcess.length;

// //     if (totalDetails === 0) {
// //       return callback(null, {
// //         message: "PO updated successfully (no details).",
// //       });
// //     }

// //     for (const item of detailsToProcess) {
// //       if (item.po_detail_id) {
// //         // Cập nhật chi tiết đã tồn tại
// //         PurchaseOrderDetail.update(item.po_detail_id, item, (err) => {
// //           if (err) return callback(err);
// //           if (++completed === totalDetails) {
// //             callback(null, { message: "PO and details updated successfully" });
// //           }
// //         });
// //       } else {
// //         // Tạo mới chi tiết nếu không có po_detail_id
// //         const po_detail_id = uuidv4();
// //         PurchaseOrderDetail.create(
// //           {
// //             po_detail_id,
// //             po_id: poId,
// //             product_id: item.product_id,
// //             quantity: item.quantity,
// //             price: item.price,
// //           },
// //           (err) => {
// //             if (err) return callback(err);
// //             if (++completed === totalDetails) {
// //               callback(null, {
// //                 message: "PO and details updated successfully",
// //               });
// //             }
// //           }
// //         );
// //       }
// //     }
// //   });
// // };

// exports.updatePOWithDetails = (poId, data, details, callback) => {
//   PurchaseOrder.update(poId, data, (err, result) => {
//     if (err) return callback(err);

//     const detailsToProcess = details || [];
//     const totalDetails = detailsToProcess.length;

//     PurchaseOrderDetail.findByPOId(poId, (err, existingDetails) => {
//       if (err) return callback(err);

//       const existingDetailIds = existingDetails.map(
//         (detail) => detail.po_detail_id
//       );
//       const detailsToKeepIds = detailsToProcess
//         .filter((item) => item.po_detail_id)
//         .map((item) => item.po_detail_id);
//       const detailsToDeleteIds = existingDetailIds.filter(
//         (id) => !detailsToKeepIds.includes(id)
//       );

//       let completed = 0;
//       const totalOperations = totalDetails + detailsToDeleteIds.length;

//       const checkCompletionAndFinalize = () => {
//         if (completed === totalOperations) {
//           updateTotalAmount();
//         }
//       };

//       // const updateTotalAmount = () => {
//       //   PurchaseOrderDetail.findByPOId(poId, (err, detailResults) => {
//       //     if (err) return callback(err);

//       //     const totalAmount = detailResults.reduce(
//       //       (sum, detail) =>
//       //         sum + detail.quantity * parseFloat(detail.price || 0),
//       //       0
//       //     );

//       //       console.log("Updating PO with totalAmount:", totalAmount);

//       //     PurchaseOrder.update(poId, { total_amount: totalAmount }, (err) => {
//       //       if (err) return callback(err);
//       //       callback(null, {
//       //         message: "PO and details updated successfully",
//       //         total_amount: totalAmount,
//       //       });
//       //     });
//       //   });
//       // };

//       const updateTotalAmount = () => {
//         PurchaseOrderDetail.findByPOId(poId, (err, detailResults) => {
//           if (err) return callback(err);

//           const totalAmount = detailResults.reduce(
//             (sum, detail) =>
//               sum + detail.quantity * parseFloat(detail.price || 0),
//             0
//           );

//           PurchaseOrder.update(poId, { total_amount: totalAmount }, (err) => {
//             if (err) return callback(err);

//             // Sau khi cập nhật total_amount của PO, cập nhật payment (nếu có)
//             Payment.findByPOId(poId, (err, paymentResults) => {
//               console.log(paymentResults);
//               if (err) {
//                 console.error("Error finding payment for PO:", err);
//                 // Không return callback ở đây, tiếp tục để callback chính được gọi
//               } else if (paymentResults && paymentResults.length > 0) {
//                 const payment = paymentResults[0]; // Giả sử mỗi PO có một payment chính
//                 Payment.update(
//                   payment.payment_id,
//                   { amount: totalAmount },
//                   (err) => {
//                     if (err) {
//                       console.error("Error updating payment amount:", err);
//                     } else {
//                       console.log("Payment amount updated to:", totalAmount);
//                     }
//                   }
//                 );
//               } else {
//                 console.log("No payment found for PO:", poId);
//                 // Có thể tạo một payment mới ở đây nếu cần
//               }
//               callback(null, {
//                 message: "PO and details updated successfully",
//                 total_amount: totalAmount,
//               });
//             });
//           });
//         });
//       };

//       // Delete details to be removed
//       detailsToDeleteIds.forEach((detailId) => {
//         PurchaseOrderDetail.delete(detailId, (err) => {
//           if (err) {
//             console.error("Error deleting detail:", err);
//             return callback(err);
//           }
//           completed++;
//           checkCompletionAndFinalize();
//         });
//       });

//       // Add new and update existing details
//       detailsToProcess.forEach((item) => {
//         if (item.po_detail_id) {
//           PurchaseOrderDetail.update(item.po_detail_id, item, (err) => {
//             if (err) {
//               console.error("Error updating detail:", err);
//               return callback(err);
//             }
//             completed++;
//             checkCompletionAndFinalize();
//           });
//         } else {
//           const po_detail_id = uuidv4();
//           PurchaseOrderDetail.create(
//             {
//               po_detail_id,
//               po_id: poId,
//               product_id: item.product_id,
//               quantity: item.quantity,
//               price: item.price,
//             },
//             (err) => {
//               if (err) {
//                 console.error("Error creating detail:", err);
//                 return callback(err);
//               }
//               completed++;
//               checkCompletionAndFinalize();
//             }
//           );
//         }
//       });

//       // Nếu không có thao tác nào (không có details gửi lên và không có gì để xóa)
//       if (totalOperations === 0) {
//         updateTotalAmount();
//       }
//     });
//   });
// };

// exports.getAllPurchaseOrders = (callback) => {
//   PurchaseOrder.findAll(callback);
// };

// exports.getPurchaseOrderById = (po_id, callback) => {
//   PurchaseOrder.findById(po_id, callback);
// };

// exports.deletePurchaseOrder = (po_id, callback) => {
//   PurchaseOrder.remove(po_id, callback);
// };

// // exports.confirmPurchaseOrder = (po_id, callback) => {
// //   console.log("=== Running confirmPurchaseOrder ===");

// //   PurchaseOrder.findById(po_id, (err, order) => {
// //     if (err) return callback(err);
// //     if (!order) return callback(new Error("Purchase order not found"));
// //     if (order.status === "posted") return callback(new Error("Already posted"));

// //     PurchaseOrderDetail.findByPOId(po_id, async (err, details) => {
// //       if (err) return callback(err);
// //       if (!details || details.length === 0)
// //         return callback(new Error("No purchase order details found"));

// //       try {
// //         // Xử lý từng detail
// //         await Promise.all(
// //           details.map((item) => {
// //             return new Promise((resolve, reject) => {
// //               Inventory.findByProductAndWarehouse(
// //                 item.product_id,
// //                 order.warehouse_id,
// //                 (err, existingInv) => {
// //                   if (err) return reject(err);

// //                   if (existingInv) {
// //                     console.log("🔁 Inventory exists. Calling update...");

// //                     Inventory.update(
// //                       item.product_id,
// //                       order.warehouse_id,
// //                       item.quantity,
// //                       (err) => {
// //                         if (err) {
// //                           console.error("❌ Inventory.update error:", err);
// //                           return callback(err);
// //                         }
// //                         console.log(
// //                           `✅ Updated inventory for ${item.product_id}`
// //                         );
// //                         resolve();
// //                       }
// //                     );
// //                   } else {
// //                     const newInv = {
// //                       inventory_id: uuidv4(),
// //                       product_id: item.product_id,
// //                       warehouse_id: order.warehouse_id,
// //                       quantity: item.quantity,
// //                     };
// //                     Inventory.create(newInv, (err) => {
// //                       if (err) return reject(err);
// //                       console.log(
// //                         `✅ Created inventory for ${item.product_id}`
// //                       );
// //                       resolve();
// //                     });
// //                   }
// //                 }
// //               );
// //             });
// //           })
// //         );

// //         // Khi tất cả inventory xử lý xong
// //         PurchaseOrder.updateStatus(po_id, "posted", new Date(), (err) => {
// //           if (err) return callback(err);
// //           callback(null, {
// //             message: "Purchase order posted and inventory updated",
// //           });
// //         });
// //       } catch (e) {
// //         console.error("❌ Error in inventory processing:", e);
// //         callback(e);
// //       }
// //     });
// //   });
// // };

// exports.confirmPurchaseOrder = (po_id, callback) => {
//   console.log("=== Running confirmPurchaseOrder ===");

//   PurchaseOrder.findById(po_id, (err, order) => {
//     if (err) return callback(err);
//     if (!order) return callback(new Error("Purchase order not found"));
//     if (order.status === "posted") return callback(new Error("Already posted"));

//     PurchaseOrderDetail.findByPOId(po_id, async (err, details) => {
//       if (err) return callback(err);
//       if (!details || details.length === 0)
//         return callback(new Error("No purchase order details found"));

//       try {
//         // Xử lý từng detail
//         await Promise.all(
//           details.map((item) => {
//             return new Promise((resolve, reject) => {
//               const { product_id, quantity } = item;

//               // 2️⃣ Cập nhật bảng inventories
//               Inventory.findByProductAndWarehouse(
//                 product_id,
//                 order.warehouse_id,
//                 (invErr, existingInv) => {
//                   if (invErr) return reject(invErr);

//                   if (existingInv) {
//                     // Nếu đã tồn tại -> cập nhật quantity
//                     Inventory.update(
//                       product_id,
//                       order.warehouse_id,
//                       quantity,
//                       (updateErr) => {
//                         if (updateErr) return reject(updateErr);
//                         resolve();
//                       }
//                     );
//                   } else {
//                     // Nếu chưa có -> tạo mới inventory
//                     const newInv = {
//                       inventory_id: uuidv4(),
//                       product_id,
//                       warehouse_id: order.warehouse_id,
//                       quantity,
//                     };

//                     Inventory.create(newInv, (createErr) => {
//                       if (createErr) return reject(createErr);
//                       resolve();
//                     });
//                   }
//                 }
//               );
//             });
//           })
//         );

//         // Khi tất cả xử lý xong
//         PurchaseOrder.updateStatus(po_id, "posted", new Date(), (err) => {
//           if (err) return callback(err);
//           callback(null, {
//             message: "Purchase order posted and inventory updated",
//           });
//         });
//       } catch (e) {
//         console.error("❌ Error in inventory processing:", e);
//         callback(e);
//       }
//     });
//   });
// };

// exports.getPurchaseOrderDetailsById = (po_id, callback) => {
//   PurchaseOrder.findWithDetailsById(po_id, (err, results) => {
//     if (err) return callback(err);
//     if (!results.length) return callback(null, null);

//     const { po_id: id, supplier_name, warehouse_id, note, status } = results[0];
//     const details = results.map((row) => ({
//       po_detail_id: row.po_detail_id,
//       product_id: row.product_id,
//       product_name: row.product_name,
//       sku: row.sku,
//       quantity: row.quantity,
//       price: row.price,
//     }));

//     callback(null, {
//       po_id: id,
//       supplier_name,
//       warehouse_id,
//       note,
//       status,
//       details,
//     });
//   });
// };
// purchaseOrder.service.js
const { v4: uuidv4 } = require("uuid");
const PurchaseOrderModel = require("./purchaseOrder.model");
const PurchaseOrderDetailModel = require("./purchaseOrderDetail.model");
const InventoryService = require("../../modules/inventories/inventory.service");

const PurchaseOrderService = {
  /**
   * Tạo một đơn mua hàng mới và các chi tiết đơn mua hàng.
   * @param {Object} data - Dữ liệu đơn mua hàng, bao gồm supplier_name, warehouse_id, note, details, (optional) order_date, (optional) payment_method, (optional) discount_amount, (optional) supplier_id (nếu cần cho Invoice/Transaction).
   * @returns {Promise<Object>} Promise giải quyết với thông tin đơn mua hàng đã tạo (bao gồm final_amount, discount_amount, order_date, supplier_name, payment_method, supplier_id).
   */
  createPurchaseOrder: async (data) => {
    // ✅ Destructuring các trường cần thiết từ `data`
    // Lấy supplier_name (từ schema) và supplier_id (nếu cần cho Invoice/Transaction)
    const {
      supplier_name,
      warehouse_id,
      note,
      details,
      order_date,
      payment_method,
      supplier_id,
    } = data;
    const po_id = uuidv4();

    // Tính toán totalAmount từ chi tiết đơn hàng
    const totalAmount = details
      ? details.reduce(
          (sum, detail) =>
            sum + detail.quantity * parseFloat(detail.price || 0),
          0
        )
      : 0;

    // Lấy discount_amount từ data, nếu không có thì mặc định là 0
    const discountAmount = data.discount_amount || 0;
    // Tính final_amount (cho Invoice/Transaction, không lưu vào PO table)
    const finalAmount = totalAmount - discountAmount;

    console.log(
      "🚀 ~ purchaseOrder.service.js: createPurchaseOrder - Calculated Total Amount:",
      totalAmount
    );
    console.log(
      "🚀 ~ purchaseOrder.service.js: createPurchaseOrder - Calculated Discount Amount:",
      discountAmount
    );
    console.log(
      "🚀 ~ purchaseOrder.service.js: createPurchaseOrder - Calculated Final Amount:",
      finalAmount
    );

    try {
      // 1. Tạo đơn mua hàng chính trong DB
      // ✅ Đảm bảo đối tượng `poToCreateInDB` chứa TẤT CẢ các trường có trong bảng `purchase_orders`
      const poToCreateInDB = {
        po_id,
        supplier_name, // ✅ Sử dụng supplier_name
        warehouse_id,
        note: note || null,
        status: "draft", // Trạng thái mặc định
        total_amount: totalAmount, // ✅ total_amount là trường duy nhất liên quan đến số tiền trong PO table
        // Không truyền discount_amount, final_amount, order_date, payment_method vào model.create
        // posted_at, created_at, updated_at sẽ do DB tự xử lý hoặc được cập nhật sau
      };

      const createdPO = await PurchaseOrderModel.create(poToCreateInDB);

      console.log(
        "🚀 ~ purchaseOrder.service.js: Đã tạo đơn mua hàng chính trong DB:",
        createdPO
      );

      // 2. Tạo các chi tiết đơn mua hàng
      if (details && details.length > 0) {
        await Promise.all(
          details.map(async (item) => {
            const po_detail_id = uuidv4();
            await PurchaseOrderDetailModel.create({
              po_detail_id,
              po_id: createdPO.po_id, // Sử dụng po_id từ PO đã tạo
              product_id: item.product_id,
              quantity: item.quantity,
              price: item.price,
            });
          })
        );
        console.log(
          "🚀 ~ purchaseOrder.service.js: Đã tạo các chi tiết đơn mua hàng."
        );
      } else {
        console.warn(
          "🚀 ~ purchaseOrder.service.js: createPurchaseOrder - Không có chi tiết đơn mua hàng."
        );
      }

      // Trả về kết quả đầy đủ cho controller để tạo invoice và transaction
      // Bao gồm cả các trường không lưu trong PO table nhưng cần cho Invoice/Transaction
      return {
        po_id: createdPO.po_id,
        supplier_name: createdPO.supplier_name, // Lấy từ PO đã tạo
        total_amount: createdPO.total_amount, // Lấy từ PO đã tạo
        discount_amount: discountAmount, // ✅ Lấy từ biến tính toán
        final_amount: finalAmount, // ✅ Lấy từ biến tính toán
        order_date: order_date || new Date(), // ✅ Lấy từ data hoặc ngày hiện tại
        supplier_id: supplier_id, // ✅ Lấy từ data ban đầu (nếu cần cho Invoice/Transaction)
        payment_method: payment_method || "Chuyển khoản", // ✅ Lấy từ data hoặc mặc định
      };
    } catch (error) {
      console.error(
        "🚀 ~ purchaseOrder.service.js: createPurchaseOrder - Lỗi khi tạo đơn mua hàng:",
        error
      );
      throw error;
    }
  },

  /**
   * Cập nhật đơn mua hàng.
   * @param {string} po_id - ID đơn mua hàng.
   * @param {Object} data - Dữ liệu cập nhật.
   * @returns {Promise<Object|null>} Promise giải quyết với thông tin đơn mua hàng đã cập nhật hoặc null.
   */
  updatePurchaseOrder: async (po_id, data) => {
    try {
      const result = await PurchaseOrderModel.update(po_id, data);
      return result;
    } catch (error) {
      console.error(
        "🚀 ~ purchaseOrder.service.js: updatePurchaseOrder - Lỗi khi cập nhật đơn mua hàng:",
        error
      );
      throw error;
    }
  },

  /**
   * Cập nhật đơn mua hàng và chi tiết của nó.
   * @param {string} poId - ID đơn mua hàng.
   * @param {Object} data - Dữ liệu cập nhật cho đơn mua hàng chính.
   * @param {Array<Object>} details - Mảng các chi tiết đơn hàng (có thể chứa po_detail_id cho cập nhật hoặc không cho tạo mới).
   * @returns {Promise<Object>} Promise giải quyết với thông báo thành công.
   */
  updatePOWithDetails: async (poId, data, details) => {
    try {
      // 1. Cập nhật thông tin đơn mua hàng chính
      await PurchaseOrderModel.update(poId, data);

      const detailsToProcess = details || [];

      // 2. Lấy chi tiết hiện có và xác định các chi tiết cần xóa
      const existingDetails = await PurchaseOrderDetailModel.findByPOId(poId);
      const existingDetailIds = existingDetails.map(
        (detail) => detail.po_detail_id
      );
      const detailsToKeepIds = detailsToProcess
        .filter((item) => item.po_detail_id)
        .map((item) => item.po_detail_id);
      const detailsToDeleteIds = existingDetailIds.filter(
        (id) => !detailsToKeepIds.includes(id)
      );

      // 3. Xóa các chi tiết không còn tồn tại
      if (detailsToDeleteIds.length > 0) {
        await Promise.all(
          detailsToDeleteIds.map((detailId) =>
            PurchaseOrderDetailModel.delete(detailId)
          )
        );
      }

      // 4. Thêm mới hoặc cập nhật các chi tiết
      await Promise.all(
        detailsToProcess.map(async (item) => {
          if (item.po_detail_id) {
            // Cập nhật chi tiết đã tồn tại
            await PurchaseOrderDetailModel.update(item.po_detail_id, item);
          } else {
            // Tạo mới chi tiết nếu không có po_detail_id
            const po_detail_id = uuidv4();
            await PurchaseOrderDetailModel.create({
              po_detail_id,
              po_id: poId,
              product_id: item.product_id,
              quantity: item.quantity,
              price: item.price,
            });
          }
        })
      );

      // 5. Cập nhật lại tổng số tiền của PO và Payment liên quan
      const updatedDetails = await PurchaseOrderDetailModel.findByPOId(poId);
      const newTotalAmount = updatedDetails.reduce(
        (sum, detail) => sum + detail.quantity * parseFloat(detail.price || 0),
        0
      );

      // Cần tính lại discount_amount và final_amount nếu có logic đó ở đây
      const updatedPOData = { total_amount: newTotalAmount };
      // Nếu có discount logic, cần thêm vào updatedPOData.discount_amount và updatedPOData.final_amount
      await PurchaseOrderModel.update(poId, updatedPOData);
      console.log(
        "🚀 ~ purchaseOrder.service.js: updatePOWithDetails - Updated PO with new totalAmount:",
        newTotalAmount
      );
      return {
        message: "PO and details updated successfully",
        total_amount: newTotalAmount,
      };
    } catch (error) {
      console.error(
        "🚀 ~ purchaseOrder.service.js: updatePOWithDetails - Lỗi khi cập nhật PO và chi tiết:",
        error
      );
      throw error;
    }
  },

  /**
   * Lấy tất cả các đơn mua hàng.
   * @returns {Promise<Array<Object>>} Promise giải quyết với danh sách đơn mua hàng.
   */
  getAllPurchaseOrders: async () => {
    try {
      const orders = await PurchaseOrderModel.findAll();
      return orders;
    } catch (error) {
      console.error(
        "🚀 ~ purchaseOrder.service.js: getAllPurchaseOrders - Lỗi:",
        error
      );
      throw error;
    }
  },

  /**
   * Lấy đơn mua hàng theo ID.
   * @param {string} po_id - ID đơn mua hàng.
   * @returns {Promise<Object|null>} Promise giải quyết với đối tượng đơn mua hàng hoặc null.
   */
  getPurchaseOrderById: async (po_id) => {
    try {
      const order = await PurchaseOrderModel.findById(po_id);
      return order;
    } catch (error) {
      console.error(
        "🚀 ~ purchaseOrder.service.js: getPurchaseOrderById - Lỗi:",
        error
      );
      throw error;
    }
  },

  /**
   * Xóa đơn mua hàng.
   * @param {string} po_id - ID đơn mua hàng.
   * @returns {Promise<Object>} Promise giải quyết với kết quả xóa.
   */
  deletePurchaseOrder: async (po_id) => {
    try {
      const result = await PurchaseOrderModel.remove(po_id);
      return result;
    } catch (error) {
      console.error(
        "🚀 ~ purchaseOrder.service.js: deletePurchaseOrder - Lỗi khi xóa đơn mua hàng:",
        error
      );
      throw error;
    }
  },

  /**
   * Xác nhận đơn mua hàng (chuyển trạng thái sang 'posted' và cập nhật tồn kho).
   * @param {string} po_id - ID đơn mua hàng.
   * @returns {Promise<Object>} Promise giải quyết với thông báo thành công.
   */
  confirmPurchaseOrder: async (po_id) => {
    console.log(
      "🚀 ~ purchaseOrder.service.js: confirmPurchaseOrder - === Running confirmPurchaseOrder ==="
    );

    try {
      const order = await PurchaseOrderModel.findById(po_id);
      if (!order) {
        throw new Error("Purchase order not found");
      }
      if (order.status === "posted") {
        throw new Error("Already posted");
      }

      const details = await PurchaseOrderDetailModel.findByPOId(po_id);
      if (!details || details.length === 0) {
        throw new Error("No purchase order details found");
      }

      // Xử lý từng detail để cập nhật tồn kho
      await Promise.all(
        details.map(async (item) => {
          const { product_id, quantity } = item;

          // InventoryService.increaseStockFromPurchaseOrder đã được refactor để trả về Promise
          // Nó sẽ xử lý logic tìm/tạo và cập nhật tồn kho
          await InventoryService.increaseStockFromPurchaseOrder(
            [{ product_id, quantity }],
            order.warehouse_id
          );
          console.log(
            `✅ Updated inventory for ${product_id} in warehouse ${order.warehouse_id}`
          );
        })
      );

      // Khi tất cả inventory xử lý xong, cập nhật trạng thái PO
      await PurchaseOrderModel.updateStatus(po_id, "posted", new Date());
      console.log(
        "🚀 ~ purchaseOrder.service.js: confirmPurchaseOrder - Purchase order posted and inventory updated."
      );

      return {
        message: "Purchase order posted and inventory updated",
      };
    } catch (error) {
      console.error(
        "🚀 ~ purchaseOrder.service.js: confirmPurchaseOrder - Lỗi trong quá trình xác nhận đơn mua hàng:",
        error
      );
      throw error;
    }
  },

  /**
   * Lấy chi tiết đơn mua hàng theo ID.
   * @param {string} po_id - ID đơn mua hàng.
   * @returns {Promise<Object|null>} Promise giải quyết với đối tượng đơn mua hàng kèm chi tiết hoặc null.
   */
  getPurchaseOrderDetailsById: async (po_id) => {
    try {
      const results = await PurchaseOrderModel.findWithDetailsById(po_id);
      if (!results || results.length === 0) {
        return null;
      }

      const {
        po_id: id,
        supplier_name,
        warehouse_id,
        note,
        status,
      } = results[0];
      const details = results.map((row) => ({
        po_detail_id: row.po_detail_id,
        product_id: row.product_id,
        product_name: row.product_name,
        sku: row.sku,
        quantity: row.quantity,
        price: row.price,
      }));

      return {
        po_id: id,
        supplier_name,
        warehouse_id,
        note,
        status,
        details,
      };
    } catch (error) {
      console.error(
        "🚀 ~ purchaseOrder.service.js: getPurchaseOrderDetailsById - Lỗi:",
        error
      );
      throw error;
    }
  },
};

module.exports = PurchaseOrderService;
