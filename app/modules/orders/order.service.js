// const OrderModel = require("./order.model");
// const Inventory = require("../inventories/inventory.service");
// const Transaction = require("../transactions/transaction.service");
// const Invoice = require("../invoice/invoice.service");

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

// function filterValidOrderFields(data) {
//   const allowedFields = [
//     "customer_id",
//     "order_date",
//     "order_code",
//     "order_status",
//     "total_amount",
//     "discount_amount",
//     "final_amount",
//     "shipping_address",
//     "payment_method",
//     "note",
//     "warehouse_id",
//     "order_amount",
//     "shipping_fee",
//   ];

//   const result = {};
//   for (const key in data) {
//     const value = data[key];

//     if (
//       allowedFields.includes(key) &&
//       value !== undefined &&
//       value !== null &&
//       typeof value !== "object" &&
//       !Array.isArray(value)
//     ) {
//       result[key] = value;
//     }
//   }

//   return result;
// }

// const OrderService = {
//   create: (data, callback) => {
//     OrderModel.create(data, callback);
//   },

//   read: (callback) => {
//     OrderModel.read(callback);
//   },

//   readById: (order_id, callback) => {
//     OrderModel.readById(order_id, callback);
//   },

//   // update: (order_id, data, callback) => {
//   //   OrderModel.update(order_id, data, callback);
//   // },

//   // update: (order_id, data, callback) => {
//   //   OrderModel.update(order_id, data, (err, result) => {
//   //     if (err || !result) return callback(err || new Error("Order not found"));

//   //     // Nếu không có thay đổi status thì không xử lý logic phụ
//   //     if (!data.order_status) return callback(null, result);

//   //     // Đọc thêm thông tin đơn hàng để xử lý
//   //     OrderModel.readById(order_id, (err2, order) => {
//   //       if (err2 || !order)
//   //         return callback(err2 || new Error("Order not found"));
//   //       console.log("Fuck order:", order);
//   //       const orderDetails = order.order_details || []; // cần đảm bảo bạn fetch kèm orderDetails
//   //       const warehouse_id = order.warehouse_id || 1; // hoặc lấy từ order nếu có

//   //       if (data.order_status === "Hoàn tất") {
//   //         Inventory.confirmStockReservation(
//   //           orderDetails,
//   //           warehouse_id,
//   //           (err3) => {
//   //             if (err3) return callback(err3);

//   //             const generateInvoiceCode = () => {
//   //               const date = new Date();
//   //               const y = date.getFullYear().toString().substr(-2);
//   //               const m = ("0" + (date.getMonth() + 1)).slice(-2);
//   //               const d = ("0" + date.getDate()).slice(-2);
//   //               // Ví dụ: INV-250601-0001
//   //               return `INV-${y}${m}${d}-${Math.floor(
//   //                 1000 + Math.random() * 9000
//   //               )}`;
//   //             };

//   //             const invoiceData = {
//   //               invoice_code: generateInvoiceCode(),
//   //               invoice_type: "sale_invoice",
//   //               order_id: order.order_id,
//   //               customer_id: order.customer?.customer_id || null,
//   //               total_amount: parseFloat(order.total_amount),
//   //               tax_amount: 0, // Có thể tính nếu có thuế
//   //               discount_amount: parseFloat(order.discount_amount || 0),
//   //               final_amount: parseFloat(order.final_amount),
//   //               issued_date: new Date(),
//   //               due_date: new Date(), // hoặc sau vài ngày
//   //               status: "paid", // Vì đơn hàng đã hoàn tất
//   //               note: "Hóa đơn bán hàng tự động phát sinh từ đơn hàng",
//   //             };

//   //             // ✅ Gọi InvoiceService.create
//   //             InvoiceService.create(
//   //               invoiceData,
//   //               (errInvoice, invoiceResult) => {
//   //                 if (errInvoice) return callback(errInvoice);

//   //                 // ✅ Gọi TransactionService.create liên kết tới invoice
//   //                 const transactionData = {
//   //                   transaction_code: `TRX-${Date.now()}`,
//   //                   type: "receipt",
//   //                   amount: invoiceData.final_amount,
//   //                   description: `Thu tiền từ hóa đơn ${invoiceData.invoice_code}`,
//   //                   category: "sale",
//   //                   payment_method: order.payment_method || "COD",
//   //                   related_type: "invoice",
//   //                   related_id: invoiceResult.invoice_id,
//   //                 };

//   //                 TransactionService.create(
//   //                   transactionData,
//   //                   (errTransaction) => {
//   //                     if (errTransaction) return callback(errTransaction);

//   //                     callback(null, result);
//   //                   }
//   //                 );
//   //               }
//   //             );
//   //           }
//   //         );
//   //       } else if (data.order_status === "Huỷ đơn") {
//   //         Inventory.releaseReservedStock(orderDetails, warehouse_id, (err3) => {
//   //           if (err3) return callback(err3);
//   //           Receipt.markAsCancelled(order_id, (err4) => {
//   //             if (err4) return callback(err4);
//   //             Transaction.markAsCancelled(order_id, (err5) => {
//   //               if (err5) return callback(err5);
//   //               callback(null, result);
//   //             });
//   //           });
//   //         });
//   //       } else {
//   //         // Trạng thái khác => chỉ cập nhật xong là return
//   //         callback(null, result);
//   //       }
//   //     });
//   //   });
//   // },

//   // update: (order_id, data, callback) => {
//   //   console.log("🚀 ~ order.service: update - Incoming data:", data);

//   //   OrderModel.update(order_id, data, (err, result) => {
//   //     if (err || !result)
//   //       return callback(err || new Error("Đơn hàng không tồn tại"));

//   //     // Nếu không có thay đổi status thì không xử lý logic phụ
//   //     if (!data.order_status) return callback(null, result);

//   //     // Đọc thêm thông tin đơn hàng để xử lý
//   //     OrderModel.readById(order_id, (err2, order) => {
//   //       if (err2 || !order)
//   //         return callback(
//   //           err2 || new Error("Không thể đọc thông tin đơn hàng")
//   //         );
//   //       console.log("🚀 ~ This is order:", order);
//   //       const orderDetails = order.order_details || [];
//   //       const warehouse_id = order.warehouse_id || null;

//   //       if (data.order_status === "Hoàn tất") {
//   //         Inventory.confirmStockReservation(
//   //           orderDetails,
//   //           order.warehouse_id,
//   //           (err3) => {
//   //             if (err3) return callback(err3);

//   //             // ✅ Tự động sinh invoice_code
//   //             const generateInvoiceCode = () => {
//   //               const date = new Date();
//   //               const y = date.getFullYear().toString().substr(-2);
//   //               const m = ("0" + (date.getMonth() + 1)).slice(-2);
//   //               const d = ("0" + date.getDate()).slice(-2);
//   //               return `INV-${y}${m}${d}-${String(
//   //                 Math.floor(1000 + Math.random() * 9000)
//   //               ).padStart(4, "0")}`;
//   //             };

//   //             const invoiceData = {
//   //               invoice_code: generateInvoiceCode(),
//   //               invoice_type: "sale_invoice",
//   //               order_id: order.order_id,
//   //               customer_id: order.customer_id || null,
//   //               total_amount: parseFloat(order.total_amount),
//   //               tax_amount: 0, // Có thể tính nếu có thuế
//   //               discount_amount: parseFloat(order.discount_amount || 0),
//   //               final_amount: parseFloat(order.final_amount),
//   //               issued_date: new Date(),
//   //               due_date: new Date(), // hoặc sau vài ngày
//   //               status: "paid", // Vì đơn hàng đã hoàn tất
//   //               note: "Hóa đơn bán hàng tự động phát sinh từ đơn hàng",
//   //             };

//   //             // ✅ Tạo hóa đơn
//   //             Invoice.create(invoiceData, (errInvoice, invoiceResult) => {
//   //               if (errInvoice) {
//   //                 console.error("🚀 ~ Lỗi tạo invoice:", errInvoice);
//   //                 return callback(errInvoice);
//   //               }

//   //               console.log("🚀 ~ Invoice đã tạo:", invoiceResult);

//   //               // ✅ Tạo giao dịch liên kết tới invoice
//   //               const transactionData = {
//   //                 transaction_code: `TRX-${Date.now()}`,
//   //                 type: "receipt",
//   //                 amount: invoiceData.final_amount,
//   //                 description: `Thu tiền từ hóa đơn ${invoiceData.invoice_code}`,
//   //                 category: "sale",
//   //                 payment_method: order.payment_method || "COD",
//   //                 related_type: "invoice",
//   //                 related_id: invoiceResult.invoice_id,
//   //               };

//   //               Transaction.createTransaction(
//   //                 transactionData,
//   //                 (errTransaction) => {
//   //                   if (errTransaction) {
//   //                     console.error(
//   //                       "🚀 ~ Lỗi tạo transaction:",
//   //                       errTransaction
//   //                     ); // ✅
//   //                     return callback(errTransaction);
//   //                   }
//   //                   callback(null, result);
//   //                 }
//   //               );
//   //             });
//   //           }
//   //         );
//   //       } else if (data.order_status === "Huỷ đơn") {
//   //         Inventory.releaseReservedStock(orderDetails, warehouse_id, (err3) => {
//   //           if (err3) return callback(err3);

//   //           // ❌ Loại bỏ Receipt
//   //           // Thay vào đó, nếu cần hủy giao dịch, hãy gọi TransactionService.markAsCancelled
//   //           Transaction.markAsCancelled(order_id, (errTransaction) => {
//   //             if (errTransaction) return callback(errTransaction);

//   //             callback(null, result);
//   //           });
//   //         });
//   //       } else {
//   //         callback(null, result);
//   //       }
//   //     });
//   //   });
//   // },

//   // Đúg 9/10
//   // update: (order_id, data, callback) => {
//   //   console.log("🚀 ~ order.service: update - Incoming data:", data);

//   //   OrderModel.update(order_id, data, (err, result) => {
//   //     if (err) {
//   //       console.error(
//   //         "🚀 ~ order.service: update - Lỗi khi cập nhật OrderModel:",
//   //         err
//   //       );
//   //       return callback(err);
//   //     }
//   //     if (!result) {
//   //       console.log(
//   //         "🚀 ~ order.service: update - OrderModel.update không tìm thấy đơn hàng."
//   //       );
//   //       return callback(new Error("Đơn hàng không tồn tại"));
//   //     }

//   //     // Nếu không có thay đổi status thì không xử lý logic phụ
//   //     if (!data.order_status) {
//   //       console.log(
//   //         "🚀 ~ order.service: update - data.order_status không được cung cấp. Bỏ qua logic phụ."
//   //       );
//   //       return callback(null, result);
//   //     }

//   //     console.log(
//   //       "🚀 ~ order.service: update - order_status đã được cung cấp, tiếp tục xử lý logic phụ."
//   //     );

//   //     // Đọc thêm thông tin đơn hàng để xử lý
//   //     OrderModel.readById(order_id, (err2, order) => {
//   //       if (err2) {
//   //         console.error(
//   //           "🚀 ~ order.service: update - Lỗi khi đọc thông tin đơn hàng (OrderModel.readById):",
//   //           err2
//   //         );
//   //         return callback(err2);
//   //       }
//   //       if (!order) {
//   //         console.log(
//   //           "🚀 ~ order.service: update - OrderModel.readById không tìm thấy đơn hàng."
//   //         );
//   //         return callback(new Error("Không thể đọc thông tin đơn hàng"));
//   //       }

//   //       console.log(
//   //         "🚀 ~ order.service: update - Thông tin đơn hàng đã đọc:",
//   //         order
//   //       );
//   //       const orderDetails = order.order_details || [];
//   //       const warehouse_id = order.warehouse_id || null;

//   //       if (data.order_status === "Hoàn tất") {
//   //         console.log(
//   //           "🚀 ~ order.service: update - Trạng thái đơn hàng là 'Hoàn tất'. Bắt đầu xử lý tồn kho, hóa đơn, giao dịch."
//   //         );

//   //         // Kiểm tra xem orderDetails có dữ liệu không
//   //         if (orderDetails.length === 0) {
//   //           console.warn(
//   //             "� ~ order.service: update - Đơn hàng 'Hoàn tất' nhưng không có chi tiết đơn hàng (orderDetails)."
//   //           );
//   //           // Có thể cần xử lý đặc biệt hoặc trả về lỗi nếu không có sản phẩm
//   //           // Hiện tại vẫn sẽ tiếp tục tạo invoice và transaction nếu không có lỗi khác
//   //         }

//   //         Inventory.confirmStockReservation(
//   //           orderDetails,
//   //           order.warehouse_id,
//   //           (err3) => {
//   //             if (err3) {
//   //               console.error(
//   //                 "🚀 ~ order.service: update - Lỗi từ Inventory.confirmStockReservation:",
//   //                 err3
//   //               );
//   //               return callback(err3);
//   //             }
//   //             console.log(
//   //               "🚀 ~ order.service: update - Xác nhận tồn kho thành công."
//   //             );

//   //             // ✅ Tự động sinh invoice_code
//   //             const generateInvoiceCode = () => {
//   //               const date = new Date();
//   //               const y = date.getFullYear().toString().substr(-2);
//   //               const m = ("0" + (date.getMonth() + 1)).slice(-2);
//   //               const d = ("0" + date.getDate()).slice(-2);
//   //               return `INV-${y}${m}${d}-${String(
//   //                 Math.floor(1000 + Math.random() * 9000)
//   //               ).padStart(4, "0")}`;
//   //             };

//   //             const invoiceData = {
//   //               invoice_code: generateInvoiceCode(),
//   //               invoice_type: "sale_invoice",
//   //               order_id: order.order_id,
//   //               customer_id: order.customer_id || null,
//   //               total_amount: parseFloat(order.total_amount),
//   //               tax_amount: 0, // Có thể tính nếu có thuế
//   //               discount_amount: parseFloat(order.discount_amount || 0),
//   //               final_amount: parseFloat(order.final_amount),
//   //               issued_date: new Date(),
//   //               due_date: new Date(), // hoặc sau vài ngày
//   //               status: "paid", // Vì đơn hàng đã hoàn tất
//   //               note: "Hóa đơn bán hàng tự động phát sinh từ đơn hàng",
//   //             };

//   //             console.log(
//   //               "🚀 ~ order.service: update - Dữ liệu Invoice sẽ tạo:",
//   //               invoiceData
//   //             );

//   //             // ✅ Tạo hóa đơn
//   //             Invoice.create(invoiceData, (errInvoice, invoiceResult) => {
//   //               if (errInvoice) {
//   //                 console.error(
//   //                   "🚀 ~ order.service: update - Lỗi khi tạo Invoice:",
//   //                   errInvoice
//   //                 );
//   //                 return callback(errInvoice);
//   //               }

//   //               console.log(
//   //                 "🚀 ~ order.service: update - Invoice đã tạo thành công:",
//   //                 invoiceResult
//   //               );

//   //               // ✅ Tạo giao dịch liên kết tới invoice
//   //               const transactionData = {
//   //                 transaction_code: `TRX-${Date.now()}`,
//   //                 type: "receipt",
//   //                 amount: invoiceData.final_amount,
//   //                 description: `Thu tiền từ hóa đơn ${invoiceData.invoice_code}`,
//   //                 category: "sale",
//   //                 payment_method: order.payment_method || "COD",
//   //                 related_type: "invoice",
//   //                 related_id: invoiceResult.invoice_id,
//   //               };
//   //               console.log(
//   //                 "🚀 ~ order.service: update - Dữ liệu Transaction sẽ tạo:",
//   //                 transactionData
//   //               );

//   //               Transaction.createTransaction(
//   //                 transactionData,
//   //                 (errTransaction) => {
//   //                   if (errTransaction) {
//   //                     console.error(
//   //                       "🚀 ~ order.service: update - Lỗi khi tạo Transaction:",
//   //                       errTransaction
//   //                     );
//   //                     return callback(errTransaction);
//   //                   }
//   //                   console.log(
//   //                     "🚀 ~ order.service: update - Giao dịch đã tạo thành công."
//   //                   );
//   //                   callback(null, result); // Trả về kết quả cập nhật ban đầu của order
//   //                 }
//   //               );
//   //             });
//   //           }
//   //         );
//   //       } else if (data.order_status === "Huỷ đơn") {
//   //         console.log(
//   //           "🚀 ~ order.service: update - Trạng thái đơn hàng là 'Huỷ đơn'. Bắt đầu giải phóng tồn kho."
//   //         );
//   //         Inventory.releaseReservedStock(orderDetails, warehouse_id, (err3) => {
//   //           if (err3) {
//   //             console.error(
//   //               "🚀 ~ order.service: update - Lỗi từ Inventory.releaseReservedStock:",
//   //               err3
//   //             );
//   //             return callback(err3);
//   //           }
//   //           console.log(
//   //             "🚀 ~ order.service: update - Giải phóng tồn kho thành công."
//   //           );

//   //           Transaction.markAsCancelled(order_id, (errTransaction) => {
//   //             if (errTransaction) {
//   //               console.error(
//   //                 "🚀 ~ order.service: update - Lỗi khi hủy giao dịch liên quan:",
//   //                 errTransaction
//   //               );
//   //               return callback(errTransaction);
//   //             }
//   //             console.log(
//   //               "🚀 ~ order.service: update - Giao dịch liên quan đã được hủy thành công."
//   //             );
//   //             callback(null, result);
//   //           });
//   //         });
//   //       } else {
//   //         console.log(
//   //           "🚀 ~ order.service: update - Trạng thái đơn hàng thay đổi nhưng không có logic xử lý cụ thể."
//   //         );
//   //         callback(null, result);
//   //       }
//   //     });
//   //   });
//   // },

//   update: async (order_id, data, callback) => {
//     console.log("🚀 ~ order.service: update - Incoming data:", data);

//     try {
//       const updateResult = await OrderModel.update(order_id, data);
//       if (!updateResult) {
//         console.log(
//           "🚀 ~ order.service: update - OrderModel.update không tìm thấy đơn hàng."
//         );
//         return callback(new Error("Đơn hàng không tồn tại"));
//       }

//       if (!data.order_status) {
//         console.log(
//           "🚀 ~ order.service: update - data.order_status không được cung cấp. Bỏ qua logic phụ."
//         );
//         return callback(null, updateResult);
//       }

//       console.log(
//         "🚀 ~ order.service: update - order_status đã được cung cấp, tiếp tục xử lý logic phụ."
//       );

//       const order = await OrderModel.readById(order_id);
//       if (!order) {
//         console.log(
//           "🚀 ~ order.service: update - OrderModel.readById không tìm thấy đơn hàng."
//         );
//         return callback(new Error("Không thể đọc thông tin đơn hàng"));
//       }

//       console.log(
//         "🚀 ~ order.service: update - Thông tin đơn hàng đã đọc:",
//         order
//       );
//       const orderDetails = order.order_details || [];
//       const warehouse_id = order.warehouse_id || null;

//       if (data.order_status === "Hoàn tất") {
//         console.log(
//           "🚀 ~ order.service: update - Trạng thái đơn hàng là 'Hoàn tất'. Bắt đầu xử lý tồn kho, hóa đơn, giao dịch."
//         );

//         if (orderDetails.length === 0) {
//           console.warn(
//             "🚀 ~ order.service: update - Đơn hàng 'Hoàn tất' nhưng không có chi tiết đơn hàng (orderDetails)."
//           );
//         }

//         await Inventory.confirmStockReservation(
//           orderDetails,
//           order.warehouse_id
//         );
//         console.log(
//           "🚀 ~ order.service: update - Xác nhận tồn kho thành công."
//         );

//         const generateInvoiceCode = () => {
//           const date = new Date();
//           const y = date.getFullYear().toString().substr(-2);
//           const m = ("0" + (date.getMonth() + 1)).slice(-2);
//           const d = ("0" + date.getDate()).slice(-2);
//           return `INV-${y}${m}${d}-${String(
//             Math.floor(1000 + Math.random() * 9000)
//           ).padStart(4, "0")}`;
//         };

//         const invoiceData = {
//           invoice_code: generateInvoiceCode(),
//           invoice_type: "sale_invoice",
//           order_id: order.order_id,
//           customer_id: order.customer_id || null,
//           total_amount: parseFloat(order.total_amount),
//           tax_amount: 0,
//           discount_amount: parseFloat(order.discount_amount || 0),
//           final_amount: parseFloat(order.final_amount),
//           issued_date: new Date(),
//           due_date: new Date(),
//           status: "paid",
//           note: "Hóa đơn bán hàng tự động phát sinh từ đơn hàng",
//         };

//         console.log(
//           "🚀 ~ order.service: update - Dữ liệu Invoice sẽ tạo:",
//           invoiceData
//         );
//         const invoiceResult = await Invoice.create(invoiceData);
//         console.log(
//           "🚀 ~ order.service: update - Invoice đã tạo thành công (async/await):",
//           invoiceResult
//         );

//         const transactionData = {
//           transaction_code: `TRX-${Date.now()}`,
//           type: "receipt",
//           amount: invoiceResult.final_amount,
//           description: `Thu tiền từ hóa đơn ${invoiceResult.invoice_code}`,
//           category: "sale",
//           payment_method: order.payment_method || "COD",
//           related_type: "invoice",
//           related_id: invoiceResult.invoice_id,
//         };
//         console.log(
//           "🚀 ~ order.service: update - Dữ liệu Transaction sẽ tạo:",
//           transactionData
//         );
//         const transactionResult = await Transaction.createTransaction(
//           transactionData
//         );
//         console.log(
//           "🚀 ~ order.service: update - Giao dịch đã tạo thành công:",
//           transactionResult
//         );

//         callback(null, updateResult);
//       } else if (data.order_status === "Huỷ đơn") {
//         console.log(
//           "🚀 ~ order.service: update - Trạng thái đơn hàng là 'Huỷ đơn'. Bắt đầu giải phóng tồn kho."
//         );
//         await Inventory.releaseReservedStock(orderDetails, warehouse_id);
//         console.log(
//           "🚀 ~ order.service: update - Giải phóng tồn kho thành công."
//         );

//         await TransactionService.markAsCancelled(order_id);
//         console.log(
//           "🚀 ~ order.service: update - Giao dịch liên quan đã được hủy thành công."
//         );
//         callback(null, updateResult);
//       } else {
//         console.log(
//           "🚀 ~ order.service: update - Trạng thái đơn hàng thay đổi nhưng không có logic xử lý cụ thể."
//         );
//         callback(null, updateResult);
//       }
//     } catch (error) {
//       console.error(
//         "🚀 ~ order.service: update - Lỗi trong quá trình xử lý:",
//         error
//       );
//       callback(error);
//     }
//   },

//   delete: (order_id, callback) => {
//     OrderModel.delete, delete (order_id, callback);
//   },

//   // updateOrderWithDetail: (order_id, data, callback) => {
//   //   const orderData = data.order || {};
//   //   const orderDetails = data.orderDetails || [];
//   //   const customer = data.customer; // nếu có

//   //   // Cập nhật thông tin đơn hàng chính
//   //   OrderModel.updateOrder(order_id, orderData, (err) => {
//   //     if (err) return callback(err);

//   //     // Cập nhật thông tin khách hàng nếu có
//   //     if (customer) {
//   //       OrderModel.updateCustomer(order_id, customer, (err) => {
//   //         if (err) return callback(err);
//   //       });
//   //     }

//   //     // Xóa và thêm lại danh sách sản phẩm mới
//   //     OrderModel.deleteOrderDetails(order_id, (err) => {
//   //       if (err) return callback(err);

//   //       if (orderDetails && orderDetails.length > 0) {
//   //         OrderModel.insertOrderDetails(order_id, products, (err) => {
//   //           if (err) return callback(err);
//   //           return callback(null, { updated: true });
//   //         });
//   //       } else {
//   //         return callback(null, { updated: true });
//   //       }
//   //     });
//   //   });
//   // },

//   updateOrderWithDetails: (orderId, data, callback) => {
//     const { order, orderDetails = [] } = data;

//     console.log("This is FE send Order:", order);
//     console.log("This is FE send OrderDetails:", orderDetails);

//     if (!order || !Array.isArray(orderDetails)) {
//       return callback(new Error("Missing 'order' or 'orderDetails'"));
//     }

//     const validOrderData = filterValidOrderFields(order);

//     // const orderFields = { ...order };
//     console.log("~~This is validOrderData:", validOrderData);
//     // const orderDetailsData = orderDetails.map((product) => ({
//     //   order_id: orderId,
//     //   product_id: product.product_id,
//     //   quantity: product.quantity,
//     //   price: product.price,
//     //   discount: product.discount || 0,
//     //   warehouse_id: order.warehouse_id,
//     // }));

//     const orderDetailsData = orderDetails.map((product) => ({
//       ...product,
//       order_id: orderId,
//       warehouse_id: validOrderData.warehouse_id,
//     }));

//     const totals = calculateOrderTotals(orderDetailsData, validOrderData);

//     const updatedOrder = {
//       ...validOrderData,
//       ...totals,
//     };

//     console.log("*****This is updateOrder:", updatedOrder);

//     OrderModel.updateOrderWithDetails(
//       orderId,
//       updatedOrder,
//       orderDetailsData,
//       callback
//     );
//   },
// };

// module.exports = OrderService;
const OrderModel = require("./order.model"); // ✅ Đã đổi tên thành OrderModel
const InventoryService = require("../inventories/inventory.service"); // ✅ Đã đổi tên thành InventoryService
const TransactionService = require("../transactions/transaction.service"); // ✅ Đã đổi tên thành TransactionService
const InvoiceService = require("../invoice/invoice.service"); // ✅ Đã đổi tên thành InvoiceService
const OrderDetailModel = require("../orderDetails/orderDetail.model"); // ✅ Cần import OrderDetailModel nếu có

// Hàm tính toán tổng tiền đơn hàng
function calculateOrderTotals(orderDetails, orderData = {}) {
  let calculatedTotalAmount = 0;
  let calculatedDiscountProductAmount = 0;

  const validDetails = Array.isArray(orderDetails) ? orderDetails : [];

  validDetails.forEach((detail) => {
    const price = parseFloat(detail.price) || 0;
    const quantity = parseInt(detail.quantity) || 0;
    const discount = parseFloat(detail.discount) || 0;

    calculatedTotalAmount += price * quantity;
    calculatedDiscountProductAmount += discount * quantity;
  });

  const orderDiscountAmount = parseFloat(orderData.order_amount || 0);
  const totalDiscountAmount =
    orderDiscountAmount + calculatedDiscountProductAmount;
  const shippingFee = parseFloat(orderData.shipping_fee) || 0;

  const finalAmount = calculatedTotalAmount - totalDiscountAmount + shippingFee;

  return {
    total_amount: calculatedTotalAmount,
    discount_amount: totalDiscountAmount,
    final_amount: finalAmount,
    shipping_fee: shippingFee,
    order_amount: orderDiscountAmount,
  };
}

// Hàm lọc các trường hợp lệ cho bảng orders
function filterValidOrderFields(data) {
  const allowedFields = [
    "customer_id",
    "order_date",
    "order_code",
    "order_status",
    "total_amount",
    "discount_amount",
    "final_amount",
    "shipping_address",
    "payment_method",
    "note",
    "warehouse_id",
    "order_amount",
    "shipping_fee",
  ];

  const result = {};
  for (const key in data) {
    const value = data[key];

    if (
      allowedFields.includes(key) &&
      value !== undefined &&
      value !== null &&
      typeof value !== "object" &&
      !Array.isArray(value)
    ) {
      result[key] = value;
    }
  }
  return result;
}

const OrderService = {
  /**
   * Tạo đơn hàng mới.
   * @param {Object} data - Dữ liệu đơn hàng.
   * @returns {Promise<Object>} Promise giải quyết với đơn hàng đã tạo.
   */
  create: async (data) => {
    // ✅ Chuyển sang async
    try {
      const createdOrder = await OrderModel.create(data); // ✅ Sử dụng await
      return createdOrder;
    } catch (error) {
      console.error("🚀 ~ order.service.js: create - Lỗi:", error);
      throw error;
    }
  },

  /**
   * Đọc tất cả các đơn hàng.
   * @returns {Promise<Array<Object>>} Promise giải quyết với danh sách đơn hàng.
   */
  // read: async () => {
  //   // ✅ Chuyển sang async
  //   try {
  //     const orders = await OrderModel.read(); // ✅ Sử dụng await
  //     return orders;
  //   } catch (error) {
  //     console.error("🚀 ~ order.service.js: read - Lỗi:", error);
  //     throw error;
  //   }
  // },

  read: async (page = 1, limit = 10, filters = {}) => {
    // Hàm này giờ nhận page và limit với giá trị mặc định
    const skip = (page - 1) * limit;
    try {
      // Gọi Model và nhận cả dữ liệu và tổng số lượng
      const { data, total } = await OrderModel.read(skip, limit, filters);
      return { data, total }; // Trả về cả hai
    } catch (error) {
      console.error("🚀 ~ order.service.js: read - Lỗi:", error);
      throw error;
    }
  },

  /**
   * Đọc đơn hàng theo ID.
   * @param {string} order_id - ID đơn hàng.
   * @returns {Promise<Object|null>} Promise giải quyết với đơn hàng hoặc null.
   */
  readById: async (order_id) => {
    // ✅ Chuyển sang async
    try {
      const order = await OrderModel.readById(order_id); // ✅ Sử dụng await
      return order;
    } catch (error) {
      console.error("🚀 ~ order.service.js: readById - Lỗi:", error);
      throw error;
    }
  },

  /**
   * Cập nhật đơn hàng và xử lý logic nghiệp vụ liên quan đến trạng thái.
   * @param {string} order_id - ID đơn hàng.
   * @param {Object} data - Dữ liệu cập nhật.
   * @returns {Promise<Object>} Promise giải quyết với kết quả cập nhật.
   */
  update: async (order_id, data) => {
    // ✅ Chuyển sang async
    console.log("🚀 ~ order.service: update - Incoming data:", data);

    try {
      const updateResult = await OrderModel.update(order_id, data); // ✅ Sử dụng await
      if (!updateResult) {
        console.log(
          "🚀 ~ order.service: update - OrderModel.update không tìm thấy đơn hàng."
        );
        throw new Error("Đơn hàng không tồn tại");
      }

      // Nếu không có thay đổi status thì không xử lý logic phụ
      if (!data.order_status) {
        console.log(
          "🚀 ~ order.service: update - data.order_status không được cung cấp. Bỏ qua logic phụ."
        );
        return updateResult; // ✅ Trả về kết quả
      }

      console.log(
        "🚀 ~ order.service: update - order_status đã được cung cấp, tiếp tục xử lý logic phụ."
      );

      const order = await OrderModel.readById(order_id); // ✅ Sử dụng await
      if (!order) {
        console.log(
          "🚀 ~ order.service: update - OrderModel.readById không tìm thấy đơn hàng."
        );
        throw new Error("Không thể đọc thông tin đơn hàng");
      }

      console.log(
        "🚀 ~ order.service: update - Thông tin đơn hàng đã đọc:",
        order
      );
      const orderDetails = order.order_details || [];
      const warehouse_id = order.warehouse_id || null;

      if (data.order_status === "Hoàn tất") {
        console.log(
          "🚀 ~ order.service: update - Trạng thái đơn hàng là 'Hoàn tất'. Bắt đầu xử lý tồn kho, hóa đơn, giao dịch."
        );

        if (orderDetails.length === 0) {
          console.warn(
            "🚀 ~ order.service: update - Đơn hàng 'Hoàn tất' nhưng không có chi tiết đơn hàng (orderDetails)."
          );
        }

        // ✅ Gọi InventoryService.confirmStockReservation (đã là async)
        await InventoryService.confirmStockReservation(
          orderDetails,
          order.warehouse_id
        );
        console.log(
          "🚀 ~ order.service: update - Xác nhận tồn kho thành công."
        );

        // ✅ Tự động sinh invoice_code
        const generateInvoiceCode = () => {
          const date = new Date();
          const y = date.getFullYear().toString().substr(-2);
          const m = ("0" + (date.getMonth() + 1)).slice(-2);
          const d = ("0" + date.getDate()).slice(-2);
          return `INV-${y}${m}${d}-${String(
            Math.floor(1000 + Math.random() * 9000)
          ).padStart(4, "0")}`;
        };

        const invoiceData = {
          invoice_code: generateInvoiceCode(),
          invoice_type: "sale_invoice",
          order_id: order.order_id,
          customer_id: order.customer_id || null,
          total_amount: parseFloat(order.total_amount),
          tax_amount: 0, // Có thể tính nếu có thuế
          discount_amount: parseFloat(order.discount_amount || 0),
          final_amount: parseFloat(order.final_amount),
          issued_date: new Date(),
          due_date: new Date(), // hoặc sau vài ngày
          status: "paid", // Vì đơn hàng đã hoàn tất
          note: "Hóa đơn bán hàng tự động phát sinh từ đơn hàng",
        };

        console.log(
          "🚀 ~ order.service: update - Dữ liệu Invoice sẽ tạo:",
          invoiceData
        );
        const invoiceResult = await InvoiceService.create(invoiceData); // ✅ Sử dụng await
        console.log(
          "🚀 ~ order.service: update - Invoice đã tạo thành công (async/await):",
          invoiceResult
        );

        // ✅ Tạo giao dịch liên kết tới invoice
        const transactionData = {
          transaction_code: `TRX-${Date.now()}`,
          type: "receipt",
          amount: invoiceResult.final_amount,
          description: `Thu tiền từ hóa đơn ${invoiceResult.invoice_code}`,
          category: "sale",
          payment_method: order.payment_method || "COD",
          related_type: "invoice",
          related_id: invoiceResult.invoice_id,
        };
        console.log(
          "🚀 ~ order.service: update - Dữ liệu Transaction sẽ tạo:",
          transactionData
        );
        const transactionResult = await TransactionService.createTransaction(
          transactionData
        ); // ✅ Sử dụng await
        console.log(
          "🚀 ~ order.service: update - Giao dịch đã tạo thành công:",
          transactionResult
        );

        return updateResult; // ✅ Trả về kết quả cập nhật ban đầu của order
      } else if (data.order_status === "Huỷ đơn") {
        console.log(
          "🚀 ~ order.service: update - Trạng thái đơn hàng là 'Huỷ đơn'. Bắt đầu giải phóng tồn kho."
        );
        await InventoryService.releaseReservedStock(orderDetails, warehouse_id); // ✅ Sử dụng await
        console.log(
          "🚀 ~ order.service: update - Giải phóng tồn kho thành công."
        );

        await TransactionService.markAsCancelled(order_id); // ✅ Sử dụng await
        console.log(
          "🚀 ~ order.service: update - Giao dịch liên quan đã được hủy thành công."
        );
        return updateResult; // ✅ Trả về kết quả
      } else {
        console.log(
          "🚀 ~ order.service: update - Trạng thái đơn hàng thay đổi nhưng không có logic xử lý cụ thể."
        );
        return updateResult; // ✅ Trả về kết quả
      }
    } catch (error) {
      console.error(
        "🚀 ~ order.service: update - Lỗi trong quá trình xử lý:",
        error
      );
      throw error; // ✅ Ném lỗi
    }
  },

  /**
   * Xóa đơn hàng.
   * @param {string} order_id - ID đơn hàng.
   * @returns {Promise<boolean>} Promise giải quyết với true nếu xóa thành công.
   */
  delete: async (order_id) => {
    // ✅ Chuyển sang async
    try {
      const result = await OrderModel.delete(order_id); // ✅ Sử dụng await
      return result;
    } catch (error) {
      console.error("🚀 ~ order.service.js: delete - Lỗi:", error);
      throw error;
    }
  },

  /**
   * Cập nhật đơn hàng và chi tiết đơn hàng.
   * @param {string} orderId - ID đơn hàng.
   * @param {Object} data - Dữ liệu cập nhật (bao gồm order và orderDetails).
   * @returns {Promise<Object>} Promise giải quyết với thông báo thành công.
   */
  updateOrderWithDetails: async (orderId, data) => {
    // ✅ Chuyển sang async
    const { order, orderDetails = [] } = data;

    console.log(
      "🚀 ~ order.service: updateOrderWithDetails - FE send Order:",
      order
    );
    console.log(
      "🚀 ~ order.service: updateOrderWithDetails - FE send OrderDetails:",
      orderDetails
    );

    if (!order || !Array.isArray(orderDetails)) {
      throw new Error("Missing 'order' or 'orderDetails'");
    }

    const validOrderData = filterValidOrderFields(order);

    const orderDetailsData = orderDetails.map((product) => ({
      ...product,
      order_id: orderId,
      warehouse_id: validOrderData.warehouse_id,
    }));

    const totals = calculateOrderTotals(orderDetailsData, validOrderData);

    const updatedOrder = {
      ...validOrderData,
      ...totals,
    };

    console.log(
      "🚀 ~ order.service: updateOrderWithDetails - This is updatedOrder:",
      updatedOrder
    );

    try {
      // ✅ Gọi OrderModel.updateOrderWithDetails (đã là async)
      const result = await OrderModel.updateOrderWithDetails(
        orderId,
        updatedOrder,
        orderDetailsData
      );
      return result;
    } catch (error) {
      console.error(
        "🚀 ~ order.service.js: updateOrderWithDetails - Lỗi:",
        error
      );
      throw error;
    }
  },
};

module.exports = OrderService;
