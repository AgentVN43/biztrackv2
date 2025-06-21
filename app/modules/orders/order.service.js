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
const ProductEventModel = require("../product_report/product_event.model"); // Thêm import ProductEventModel
const CustomerModel = require("../customers/customer.model"); // Thêm import CustomerModel
const InventoryModel = require("../inventories/inventory.model");
const CustomerReportService = require("../customer_report/customer_report.service"); // Đảm bảo đường dẫn đúng

const { v4: uuidv4 } = require("uuid");

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

  // create: async (data) => {
  //   console.log(
  //     "🚀 ~ OrderService.create - Dữ liệu nhận được từ Controller (raw):",
  //     data
  //   );
  //   try {
  //     const {
  //       details = [],
  //       amount_paid: initialAmountPaidFromPayload = 0, // ✅ Lấy amount_paid từ payload với tên khác để tránh nhầm lẫn
  //       ...otherData // Lấy các trường còn lại (customer_id, order_date, shipping_address, payment_method, note, warehouse_id)
  //     } = data;

  //     // Tính toán các giá trị tài chính bằng hàm tiện ích
  //     const calculatedAmounts = calculateOrderTotals(details, data); // 'data' ở đây chứa cả discount_amount và shipping_fee
  //     console.log(
  //       "🚀 ~ OrderService.create - Các giá trị đã tính toán (số thực):",
  //       calculatedAmounts
  //     );

  //     // Tạo một đối tượng dữ liệu mới để truyền vào model
  //     const orderDataForModel = {
  //       ...otherData, // Các trường khác từ payload gốc
  //       // Áp dụng toFixed(2) TẠI ĐÂY, trước khi gửi đến model
  //       total_amount: calculatedAmounts.total_amount.toFixed(2),
  //       discount_amount: calculatedAmounts.discount_amount.toFixed(2),
  //       final_amount: calculatedAmounts.final_amount.toFixed(2),
  //       shipping_fee: calculatedAmounts.shipping_fee.toFixed(2),
  //       order_amount: calculatedAmounts.order_amount.toFixed(2),
  //       amount_paid: parseFloat(initialAmountPaidFromPayload).toFixed(2), // ✅ Sử dụng giá trị từ payload và định dạng
  //     };
  //     console.log(
  //       "🚀 ~ OrderService.create - Dữ liệu gửi đến OrderModel.create (đã định dạng chuỗi):",
  //       orderDataForModel
  //     );

  //     // Gọi model để tạo đơn hàng chính
  //     const createdOrder = await OrderModel.create(orderDataForModel);
  //     console.log(
  //       "🚀 ~ OrderService.create - Đơn hàng chính đã tạo thành công:",
  //       createdOrder
  //     );

  //     // Nếu có chi tiết đơn hàng, tạo các bản ghi chi tiết
  //     const createdDetails = [];
  //     if (details && details.length > 0) {
  //       await Promise.all(
  //         details.map(async (item) => {
  //           const order_detail_id = uuidv4();
  //           const detailToCreate = {
  //             order_detail_id,
  //             order_id: createdOrder.order_id,
  //             product_id: item.product_id,
  //             quantity: item.quantity,
  //             price: item.price, // Giữ nguyên giá từ payload (hoặc giá đã được xử lý trong service)
  //             discount: item.discount || 0, // Lưu KM trên từng sản phẩm nếu cần
  //           };
  //           const createdDetail = await OrderDetailModel.create(detailToCreate);
  //           createdDetails.push(createdDetail);
  //         })
  //       );
  //       console.log(
  //         "🚀 ~ order.service.js: create - Chi tiết đơn hàng đã tạo thành công."
  //       );
  //     }

  //     // Đặt chỗ tồn kho (giả định warehouse_id có trong orderDataForModel)
  //     if (orderDataForModel.warehouse_id) {
  //       await InventoryService.reserveStockFromOrderDetails(
  //         // Đảm bảo tên hàm đúng
  //         details, // Truyền details gốc (đã bao gồm quantity)
  //         orderDataForModel.warehouse_id
  //       );
  //       console.log(
  //         "🚀 ~ order.service.js: create - Đặt chỗ tồn kho thành công."
  //       );
  //     } else {
  //       console.warn(
  //         "� ~ order.service.js: create - Không có warehouse_id để đặt chỗ tồn kho."
  //       );
  //     }

  //     // Trả về đối tượng đơn hàng hoàn chỉnh bao gồm chi tiết
  //     return {
  //       ...createdOrder,
  //       order_details: createdDetails,
  //     };
  //   } catch (error) {
  //     console.error(
  //       "🚀 ~ order.service.js: create - Lỗi khi tạo đơn hàng:",
  //       error
  //     );
  //     throw error;
  //   }
  // },

  create: async (data, initiatedByUserId = null) => {
    console.log(
      "🚀 ~ OrderService.create - Dữ liệu nhận được từ Controller (raw):",
      data
    );
    try {
      const {
        details = [],
        amount_paid: initialAmountPaidFromPayload = 0,
        customer_id, // Lấy customer_id để tạo invoice
        payment_method, // Lấy payment_method để tạo transaction
        ...otherData
      } = data;

      const calculatedAmounts = calculateOrderTotals(details, data);
      console.log(
        "🚀 ~ OrderService.create - Các giá trị đã tính toán (số thực):",
        calculatedAmounts
      );

      const orderDataForModel = {
        customer_id, // ✅ Đã thêm lại customer_id vào đối tượng này
        payment_method, // ✅ Đã thêm lại payment_method vào đối tượng này
        ...otherData,
        total_amount: calculatedAmounts.total_amount.toFixed(2),
        discount_amount: calculatedAmounts.discount_amount.toFixed(2),
        final_amount: calculatedAmounts.final_amount.toFixed(2),
        shipping_fee: calculatedAmounts.shipping_fee.toFixed(2),
        order_amount: calculatedAmounts.order_amount.toFixed(2),
        amount_paid: parseFloat(initialAmountPaidFromPayload).toFixed(2), // Số tiền khách đã trả ban đầu
      };
      console.log(
        "🚀 ~ OrderService.create - Dữ liệu gửi đến OrderModel.create (đã định dạng chuỗi):",
        orderDataForModel
      );

      const createdOrder = await OrderModel.create(orderDataForModel);
      console.log(
        "🚀 ~ OrderService.create - Đơn hàng chính đã tạo thành công:",
        createdOrder
      );

      // --- Xử lý tạo Order Details (nếu chưa có trong OrderModel.create) ---
      const createdDetails = [];
      if (details && details.length > 0) {
        const { v4: uuidv4 } = require('uuid'); // Cần import
        await Promise.all(details.map(async (item) => {
          const order_detail_id = uuidv4();
          const detailToCreate = {
            order_detail_id,
            order_id: createdOrder.order_id,
            product_id: item.product_id,
            quantity: item.quantity,
            price: item.price,
            discount: item.discount || 0,
          };
          const createdDetail = await OrderDetailModel.create(detailToCreate);
          createdDetails.push(createdDetail);
        }));
        console.log(
          "🚀 ~ order.service.js: create - Chi tiết đơn hàng đã được xử lý (nếu có logic)."
        );
      }

      // --- Đặt chỗ tồn kho (nếu có warehouse_id) ---
      if (orderDataForModel.warehouse_id) {
        // Giả sử InventoryService.reserveStockFromOrderDetails là khả dụng
       await InventoryService.reserveStockFromOrderDetails(details, orderDataForModel.warehouse_id);
        console.log(
          "🚀 ~ order.service.js: create - Đặt chỗ tồn kho thành công."
        );
      } else {
        console.warn(
          "🚀 ~ order.service.js: create - Không có warehouse_id để đặt chỗ tồn kho."
        );
      }

      // --- Xử lý tạo Invoice và Transaction dựa trên amount_paid ban đầu ---
      const initialAmountPaid = parseFloat(initialAmountPaidFromPayload || 0); // Đảm bảo là số
      const finalAmount = parseFloat(createdOrder.final_amount); // Lấy final_amount từ đơn hàng đã tạo

      let invoiceResult = null;
      let transactionResult = null;

      if (initialAmountPaid > 0 || finalAmount <= 0) {
        // Tạo invoice nếu có thanh toán hoặc final_amount <= 0 (hoàn trả)
        console.log(
          "🚀 ~ order.service.js: create - initialAmountPaid > 0 hoặc final_amount <= 0. Bắt đầu tạo Invoice."
        );

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
          order_id: createdOrder.order_id,
          customer_id: customer_id || null, // Sử dụng customer_id từ data
          total_amount: parseFloat(createdOrder.total_amount),
          tax_amount: 0, // Cần tính toán nếu có thuế
          discount_amount: parseFloat(createdOrder.discount_amount || 0),
          final_amount: finalAmount,
          issued_date: new Date(),
          due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Ví dụ: Hóa đơn đến hạn sau 7 ngày
          note: "Hóa đơn bán hàng tự động phát sinh từ đơn hàng",
          amount_paid: initialAmountPaid, // ✅ Truyền amount_paid từ payload vào hóa đơn
        };

        console.log(
          "🚀 ~ order.service.js: create - Dữ liệu Invoice sẽ tạo:",
          invoiceData
        );
        invoiceResult = await InvoiceService.create(invoiceData); // InvoiceService.create sẽ tự động tính status
        console.log(
          "🚀 ~ order.service.js: create - Invoice đã tạo thành công:",
          invoiceResult
        );

        // Tạo giao dịch (Transaction) cho số tiền đã thanh toán ban đầu (nếu có)
        if (initialAmountPaid > 0) {
          const initialPaymentTransactionData = {
            transaction_code: `TRX-${Date.now()}`,
            type: "receipt", // Loại giao dịch là thu tiền
            amount: initialAmountPaid, // Số tiền thanh toán ban đầu
            description: `Thanh toán ban đầu cho hóa đơn ${invoiceResult.invoice_code} (Đơn hàng ${createdOrder.order_code})`,
            category: "sale_payment",
            payment_method: payment_method || "COD", // Lấy từ đơn hàng hoặc mặc định
            related_type: "invoice", // Liên kết với hóa đơn
            related_id: invoiceResult.invoice_id, // ID hóa đơn
            customer_id: customer_id, // ID khách hàng (quan trọng cho công nợ)
            initiated_by: initiatedByUserId,
          };
          console.log(
            "🚀 ~ order.service.js: create - Dữ liệu Transaction sẽ tạo:",
            initialPaymentTransactionData
          );
          transactionResult = await TransactionService.createTransaction(
            initialPaymentTransactionData
          );
          console.log(
            "🚀 ~ order.service.js: create - Giao dịch thanh toán ban đầu đã tạo thành công:",
            transactionResult
          );
        }
      } else {
        // initialAmountPaid = 0 và final_amount > 0
        console.log(
          "🚀 ~ order.service.js: create - initialAmountPaid = 0. Không tạo Invoice hoặc Transaction ban đầu."
        );
      }

      return {
        ...createdOrder,
        order_details: createdDetails,
        invoice_info: invoiceResult, // Trả về thông tin hóa đơn đã tạo
        transaction_info: transactionResult, // Trả về thông tin giao dịch đã tạo
      };
    } catch (error) {
      console.error(
        "🚀 ~ order.service.js: create - Lỗi khi tạo đơn hàng:",
        error
      );
      throw error;
    }
  },

  /**
   * Cập nhật đơn hàng và xử lý logic nghiệp vụ liên quan đến trạng thái.
   * @param {string} order_id - ID đơn hàng.
   * @param {Object} data - Dữ liệu cập nhật (bao gồm cả amount_paid nếu có).
   * @param {string} [initiatedByUserId=null] - ID của người dùng thực hiện thao tác.
   * @returns {Promise<Object>} Promise giải quyết với kết quả cập nhật.
   */
  update: async (order_id, data, initiatedByUserId = null) => {
    console.log("🚀 ~ order.service: update - Incoming data:", data);

    try {
      const updateResult = await OrderModel.update(order_id, data);
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
        return updateResult;
      }

      console.log(
        "🚀 ~ order.service: update - order_status đã được cung cấp, tiếp tục xử lý logic phụ."
      );

      const order = await OrderModel.readById(order_id);
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
      const customer_id = order.customer_id || null;

      let partner_name = null;
      if (customer_id) {
        const customer = await CustomerModel.getById(customer_id);
        partner_name = customer ? customer.customer_name : null;
      }

      // --- LOGIC KHI ĐƠN HÀNG CHUYỂN TRẠNG THÁI "Hoàn tất" ---
      if (data.order_status === "Hoàn tất") {
        console.log(
          "🚀 ~ order.service: update - Trạng thái đơn hàng là 'Hoàn tất'. Bắt đầu xử lý tồn kho, hóa đơn, giao dịch."
        );

        if (orderDetails.length === 0) {
          console.warn(
            "🚀 ~ order.service: update - Đơn hàng 'Hoàn tất' nhưng không có chi tiết đơn hàng (orderDetails)."
          );
        }

        // 1. Xác nhận tồn kho
        await InventoryService.confirmStockReservation(
          orderDetails,
          order.warehouse_id
        );
        console.log(
          "🚀 ~ order.service: update - Xác nhận tồn kho thành công."
        );

        // 2. Ghi nhận Product Event cho mỗi sản phẩm bán ra
        for (const item of orderDetails) {
          const current_stock_after =
            await InventoryModel.getTotalStockByProductId(item.product_id);
          await ProductEventModel.recordEvent({
            product_id: item.product_id,
            warehouse_id: warehouse_id,
            event_type: "ORDER_SOLD",
            quantity_impact: -item.quantity,
            transaction_price: item.price,
            partner_name: partner_name,
            current_stock_after: current_stock_after,
            reference_id: order.order_id,
            reference_type: "ORDER",
            description: `Sản phẩm ${
              item.product_name || item.product_id
            } được bán trong đơn hàng ${order.order_id}.`,
            initiated_by: initiatedByUserId,
          });
          console.log(
            `🚀 ~ Product Event ghi nhận: Bán ${item.quantity} của ${item.product_id}`
          );
        }

        // --- Bắt đầu logic xử lý hóa đơn và giao dịch mới khi chuyển trạng thái sang "Hoàn tất" ---
        // Lấy thông tin hóa đơn hiện tại cho đơn hàng này (nếu đã có)
        // Đây là tình huống khi đơn hàng có thể đã được tạo mà chưa có hóa đơn (amount_paid=0)
        // hoặc khi bạn muốn đảm bảo hóa đơn tồn tại khi chuyển sang 'Hoàn tất'
        let existingInvoice = await InvoiceModel.findByOrderId(order.order_id); // ✅ Đã sửa: findByOrderId

        let invoiceResult = null;
        let transactionResult = null;

        if (!existingInvoice) {
          // Nếu chưa có hóa đơn, tạo hóa đơn mới
          const generateInvoiceCode = () => {
            const date = new Date();
            const y = date.getFullYear().toString().substr(-2);
            const m = ("0" + (date.getMonth() + 1)).slice(-2);
            const d = ("0" + date.getDate()).slice(-2);
            return `INV-${y}${m}${d}-${String(
              Math.floor(1000 + Math.random() * 9000)
            ).padStart(4, "0")}`;
          };

          const initialAmountPaidFromOrder = parseFloat(order.amount_paid || 0); // Lấy amount_paid từ đơn hàng đã tạo

          const invoiceData = {
            invoice_code: generateInvoiceCode(),
            invoice_type: "sale_invoice",
            order_id: order.order_id,
            customer_id: order.customer_id || null,
            total_amount: parseFloat(order.total_amount),
            tax_amount: 0,
            discount_amount: parseFloat(order.discount_amount || 0),
            final_amount: parseFloat(order.final_amount),
            issued_date: new Date(),
            due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            note: "Hóa đơn bán hàng tự động phát sinh từ đơn hàng",
            amount_paid: initialAmountPaidFromOrder, // Số tiền đã trả ban đầu của đơn hàng
          };

          console.log(
            "🚀 ~ order.service: update - Dữ liệu Invoice sẽ tạo:",
            invoiceData
          );
          invoiceResult = await InvoiceService.create(invoiceData); // InvoiceService.create sẽ tự động tính status
          console.log(
            "🚀 ~ order.service: update - Invoice đã tạo thành công:",
            invoiceResult
          );

          // Tạo giao dịch nếu có thanh toán ban đầu cho hóa đơn mới này
          if (initialAmountPaidFromOrder > 0) {
            const initialPaymentTransactionData = {
              transaction_code: `TRX-${Date.now()}-PO-${order.order_code}`,
              type: "receipt",
              amount: initialAmountPaidFromOrder,
              description: `Thanh toán ban đầu cho hóa đơn ${invoiceResult.invoice_code} (Đơn hàng ${order.order_code})`,
              category: "sale_payment",
              payment_method: order.payment_method || "COD",
              related_type: "invoice",
              related_id: invoiceResult.invoice_id,
              customer_id: order.customer_id,
              initiated_by: initiatedByUserId,
            };
            console.log(
              "🚀 ~ order.service: update - Dữ liệu Transaction sẽ tạo:",
              initialPaymentTransactionData
            );
            transactionResult = await TransactionService.createTransaction(
              initialPaymentTransactionData
            );
            console.log(
              "🚀 ~ order.service: update - Giao dịch thanh toán ban đầu đã tạo thành công:",
              transactionResult
            );
          }
        } else {
          console.log(
            "🚀 ~ order.service: update - Hóa đơn đã tồn tại cho đơn hàng này. Không tạo mới."
          );
          invoiceResult = existingInvoice;
          // Nếu hóa đơn đã tồn tại, bạn có thể cần kiểm tra và tạo transaction nếu `order.amount_paid` khác với `invoice.amount_paid`
          // Điều này phụ thuộc vào business rule của bạn.
        }

        // Trả về kết quả cập nhật đơn hàng và các thông tin liên quan
        return {
          ...updateResult,
          invoice_info: invoiceResult,
          transaction_info: transactionResult,
        };
      }
      // --- LOGIC KHI ĐƠN HÀNG CHUYỂN TRẠNG THÁI "Huỷ đơn" ---
      else if (data.order_status === "Huỷ đơn") {
        console.log(
          "🚀 ~ order.service: update - Trạng thái đơn hàng là 'Huỷ đơn'. Bắt đầu giải phóng tồn kho."
        );
        await InventoryService.releaseReservedStock(orderDetails, warehouse_id);
        console.log(
          "🚀 ~ order.service: update - Giải phóng tồn kho thành công."
        );

        for (const item of orderDetails) {
          const current_stock_after =
            await InventoryModel.getTotalStockByProductId(item.product_id);
          await ProductEventModel.recordEvent({
            product_id: item.product_id,
            warehouse_id: warehouse_id,
            event_type: "ORDER_CANCELLED",
            quantity_impact: item.quantity,
            transaction_price: item.price,
            partner_name: partner_name,
            current_stock_after: current_stock_after,
            reference_id: order.order_id,
            reference_type: "ORDER",
            description: `Đơn hàng ${order.order_id} bị hủy - Sản phẩm ${
              item.product_name || item.product_id
            } tồn kho được giải phóng.`,
            initiated_by: initiatedByUserId,
          });
          console.log(
            `🚀 ~ Product Event ghi nhận: Hủy đơn ${item.quantity} của ${item.product_id}`
          );
        }

        // Đánh dấu giao dịch liên quan đến đơn hàng này là hủy nếu có
        await TransactionService.markAsCancelled(order_id);
        console.log(
          "🚀 ~ order.service: update - Giao dịch liên quan đã được hủy thành công."
        );
        return updateResult;
      } else {
        console.log(
          "🚀 ~ order.service: update - Trạng thái đơn hàng thay đổi nhưng không có logic xử lý cụ thể."
        );
        return updateResult;
      }
    } catch (error) {
      console.error(
        "🚀 ~ order.service: update - Lỗi trong quá trình xử lý:",
        error
      );
      throw error;
    }
  },

  /**
   * Cập nhật đơn hàng và xử lý logic nghiệp vụ liên quan đến trạng thái.
   * @param {string} order_id - ID đơn hàng.
   * @param {Object} data - Dữ liệu cập nhật (bao gồm cả amount_paid nếu có).
   * @param {string} [initiatedByUserId=null] - ID của người dùng thực hiện thao tác.
   * @returns {Promise<Object>} Promise giải quyết với kết quả cập nhật.
   */
  // update: async (order_id, data, initiatedByUserId = null) => {
  //   console.log("🚀 ~ order.service: update - Incoming data:", data);

  //   try {
  //     const updateResult = await OrderModel.update(order_id, data);
  //     if (!updateResult) {
  //       console.log(
  //         "🚀 ~ order.service: update - OrderModel.update không tìm thấy đơn hàng."
  //       );
  //       throw new Error("Đơn hàng không tồn tại");
  //     }

  //     // Nếu không có thay đổi status thì không xử lý logic phụ
  //     if (!data.order_status) {
  //       console.log(
  //         "🚀 ~ order.service: update - data.order_status không được cung cấp. Bỏ qua logic phụ."
  //       );
  //       return updateResult;
  //     }

  //     console.log(
  //       "🚀 ~ order.service: update - order_status đã được cung cấp, tiếp tục xử lý logic phụ."
  //     );

  //     const order = await OrderModel.readById(order_id);
  //     if (!order) {
  //       console.log(
  //         "🚀 ~ order.service: update - OrderModel.readById không tìm thấy đơn hàng."
  //       );
  //       throw new Error("Không thể đọc thông tin đơn hàng");
  //     }

  //     console.log(
  //       "🚀 ~ order.service: update - Thông tin đơn hàng đã đọc:",
  //       order
  //     );
  //     const orderDetails = order.order_details || [];
  //     const warehouse_id = order.warehouse_id || null;
  //     const customer_id = order.customer_id || null;

  //     let partner_name = null;
  //     if (customer_id) {
  //       const customer = await CustomerModel.getById(customer_id);
  //       partner_name = customer ? customer.customer_name : null;
  //     }

  //     // --- LOGIC KHI ĐƠN HÀNG CHUYỂN TRẠNG THÁI "Hoàn tất" ---
  //     if (data.order_status === "Hoàn tất") {
  //       console.log(
  //         "🚀 ~ order.service: update - Trạng thái đơn hàng là 'Hoàn tất'. Bắt đầu xử lý tồn kho, hóa đơn, giao dịch."
  //       );

  //       if (orderDetails.length === 0) {
  //         console.warn(
  //           "🚀 ~ order.service: update - Đơn hàng 'Hoàn tất' nhưng không có chi tiết đơn hàng (orderDetails)."
  //         );
  //       }

  //       // 1. Xác nhận tồn kho
  //       await InventoryService.confirmStockReservation(
  //         orderDetails,
  //         order.warehouse_id
  //       );
  //       console.log(
  //         "🚀 ~ order.service: update - Xác nhận tồn kho thành công."
  //       );

  //       // 2. Ghi nhận Product Event cho mỗi sản phẩm bán ra
  //       for (const item of orderDetails) {
  //         const current_stock_after =
  //           await InventoryModel.getTotalStockByProductId(item.product_id);
  //         await ProductEventModel.recordEvent({
  //           product_id: item.product_id,
  //           warehouse_id: warehouse_id,
  //           event_type: "ORDER_SOLD",
  //           quantity_impact: -item.quantity,
  //           transaction_price: item.price,
  //           partner_name: partner_name,
  //           current_stock_after: current_stock_after,
  //           reference_id: order.order_id,
  //           reference_type: "ORDER",
  //           description: `Sản phẩm ${
  //             item.product_name || item.product_id
  //           } được bán trong đơn hàng ${order.order_id}.`,
  //           initiated_by: initiatedByUserId,
  //         });
  //         console.log(
  //           `🚀 ~ Product Event ghi nhận: Bán ${item.quantity} của ${item.product_id}`
  //         );
  //       }

  //       // --- Bắt đầu logic xử lý hóa đơn và giao dịch mới khi chuyển trạng thái sang "Hoàn tất" ---
  //       // Lấy thông tin hóa đơn hiện tại cho đơn hàng này (nếu đã có)
  //       // Đây là tình huống khi đơn hàng có thể đã được tạo mà chưa có hóa đơn (amount_paid=0)
  //       // hoặc khi bạn muốn đảm bảo hóa đơn tồn tại khi chuyển sang 'Hoàn tất'
  //       let existingInvoice = await InvoiceModel.findById(order.order_id); // Cần InvoiceModel.findByOrderId

  //       let invoiceResult = null;
  //       let transactionResult = null;

  //       if (!existingInvoice) {
  //         // Nếu chưa có hóa đơn, tạo hóa đơn mới
  //         const generateInvoiceCode = () => {
  //           const date = new Date();
  //           const y = date.getFullYear().toString().substr(-2);
  //           const m = ("0" + (date.getMonth() + 1)).slice(-2);
  //           const d = ("0" + date.getDate()).slice(-2);
  //           return `INV-${y}${m}${d}-${String(
  //             Math.floor(1000 + Math.random() * 9000)
  //           ).padStart(4, "0")}`;
  //         };

  //         const initialAmountPaidFromOrder = parseFloat(order.amount_paid || 0); // Lấy amount_paid từ đơn hàng đã tạo

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
  //           due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  //           note: "Hóa đơn bán hàng tự động phát sinh từ đơn hàng",
  //           amount_paid: initialAmountPaidFromOrder, // Số tiền đã trả ban đầu của đơn hàng
  //         };

  //         console.log(
  //           "🚀 ~ order.service: update - Dữ liệu Invoice sẽ tạo:",
  //           invoiceData
  //         );
  //         invoiceResult = await InvoiceService.create(invoiceData); // InvoiceService.create sẽ tự động tính status
  //         console.log(
  //           "🚀 ~ order.service: update - Invoice đã tạo thành công:",
  //           invoiceResult
  //         );

  //         // Tạo giao dịch nếu có thanh toán ban đầu cho hóa đơn mới này
  //         if (initialAmountPaidFromOrder > 0) {
  //           const initialPaymentTransactionData = {
  //             transaction_code: `TRX-${Date.now()}-PO-${order.order_code}`,
  //             type: "receipt",
  //             amount: initialAmountPaidFromOrder,
  //             description: `Thanh toán ban đầu cho hóa đơn ${invoiceResult.invoice_code} (Đơn hàng ${order.order_code})`,
  //             category: "sale_payment",
  //             payment_method: order.payment_method || "COD",
  //             related_type: "invoice",
  //             related_id: invoiceResult.invoice_id,
  //             customer_id: order.customer_id,
  //             initiated_by: initiatedByUserId,
  //           };
  //           console.log(
  //             "🚀 ~ order.service: update - Dữ liệu Transaction sẽ tạo:",
  //             initialPaymentTransactionData
  //           );
  //           transactionResult = await TransactionService.createTransaction(
  //             initialPaymentTransactionData
  //           );
  //           console.log(
  //             "🚀 ~ order.service: update - Giao dịch thanh toán ban đầu đã tạo thành công:",
  //             transactionResult
  //           );
  //         }
  //       } else {
  //         console.log(
  //           "🚀 ~ order.service: update - Hóa đơn đã tồn tại cho đơn hàng này. Không tạo mới."
  //         );
  //         invoiceResult = existingInvoice;
  //         // Nếu hóa đơn đã tồn tại, bạn có thể cần kiểm tra và tạo transaction nếu `order.amount_paid` khác với `invoice.amount_paid`
  //         // Điều này phụ thuộc vào business rule của bạn.
  //       }

  //       // Trả về kết quả cập nhật đơn hàng và các thông tin liên quan
  //       return {
  //         ...updateResult,
  //         invoice_info: invoiceResult,
  //         transaction_info: transactionResult,
  //       };
  //     }
  //     // --- LOGIC KHI ĐƠN HÀNG CHUYỂN TRẠNG THÁI "Huỷ đơn" ---
  //     else if (data.order_status === "Huỷ đơn") {
  //       console.log(
  //         "🚀 ~ order.service: update - Trạng thái đơn hàng là 'Huỷ đơn'. Bắt đầu giải phóng tồn kho."
  //       );
  //       await InventoryService.releaseReservedStock(orderDetails, warehouse_id);
  //       console.log(
  //         "🚀 ~ order.service: update - Giải phóng tồn kho thành công."
  //       );

  //       for (const item of orderDetails) {
  //         const current_stock_after =
  //           await InventoryModel.getTotalStockByProductId(item.product_id);
  //         await ProductEventModel.recordEvent({
  //           product_id: item.product_id,
  //           warehouse_id: warehouse_id,
  //           event_type: "ORDER_CANCELLED",
  //           quantity_impact: item.quantity,
  //           transaction_price: item.price,
  //           partner_name: partner_name,
  //           current_stock_after: current_stock_after,
  //           reference_id: order.order_id,
  //           reference_type: "ORDER",
  //           description: `Đơn hàng ${order.order_id} bị hủy - Sản phẩm ${
  //             item.product_name || item.product_id
  //           } tồn kho được giải phóng.`,
  //           initiated_by: initiatedByUserId,
  //         });
  //         console.log(
  //           `🚀 ~ Product Event ghi nhận: Hủy đơn ${item.quantity} của ${item.product_id}`
  //         );
  //       }

  //       // Đánh dấu giao dịch liên quan đến đơn hàng này là hủy nếu có
  //       await TransactionService.markAsCancelled(order_id);
  //       console.log(
  //         "🚀 ~ order.service: update - Giao dịch liên quan đã được hủy thành công."
  //       );
  //       return updateResult;
  //     } else {
  //       console.log(
  //         "🚀 ~ order.service: update - Trạng thái đơn hàng thay đổi nhưng không có logic xử lý cụ thể."
  //       );
  //       return updateResult;
  //     }
  //   } catch (error) {
  //     console.error(
  //       "🚀 ~ order.service: update - Lỗi trong quá trình xử lý:",
  //       error
  //     );
  //     throw error;
  //   }
  // },

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
  // update: async (order_id, data, initiatedByUserId = null) => {
  //   console.log("🚀 ~ order.service: update - Incoming data:", data);

  //   try {
  //     const updateResult = await OrderModel.update(order_id, data);
  //     if (!updateResult) {
  //       console.log(
  //         "🚀 ~ order.service: update - OrderModel.update không tìm thấy đơn hàng."
  //       );
  //       throw new Error("Đơn hàng không tồn tại");
  //     }

  //     if (!data.order_status) {
  //       console.log(
  //         "🚀 ~ order.service: update - data.order_status không được cung cấp. Bỏ qua logic phụ."
  //       );
  //       return updateResult;
  //     }

  //     console.log(
  //       "🚀 ~ order.service: update - order_status đã được cung cấp, tiếp tục xử lý logic phụ."
  //     );

  //     const order = await OrderModel.readById(order_id);
  //     if (!order) {
  //       console.log(
  //         "🚀 ~ order.service: update - OrderModel.readById không tìm thấy đơn hàng."
  //       );
  //       throw new Error("Không thể đọc thông tin đơn hàng");
  //     }

  //     console.log(
  //       "🚀 ~ order.service: update - Thông tin đơn hàng đã đọc:",
  //       order
  //     );
  //     const orderDetails = order.order_details || [];
  //     const warehouse_id = order.warehouse_id || null;
  //     const customer_id = order.customer_id || null;

  //     let partner_name = null;
  //     if (customer_id) {
  //       const customer = await CustomerModel.getById(customer_id);
  //       partner_name = customer ? customer.customer_name : null;
  //     }

  //     if (data.order_status === "Hoàn tất") {
  //       console.log(
  //         "🚀 ~ order.service: update - Trạng thái đơn hàng là 'Hoàn tất'. Bắt đầu xử lý tồn kho, hóa đơn, giao dịch."
  //       );

  //       if (orderDetails.length === 0) {
  //         console.warn(
  //           "🚀 ~ order.service: update - Đơn hàng 'Hoàn tất' nhưng không có chi tiết đơn hàng (orderDetails)."
  //         );
  //       }

  //       // ✅ Gọi InventoryService.confirmStockReservation (đã là async)
  //       await InventoryService.confirmStockReservation(
  //         orderDetails,
  //         order.warehouse_id
  //       );
  //       console.log(
  //         "🚀 ~ order.service: update - Xác nhận tồn kho thành công."
  //       );

  //       // ✅ Ghi nhận sự kiện Product Event cho mỗi sản phẩm trong đơn hàng
  //       for (const item of orderDetails) {
  //         const current_stock_after =
  //           await InventoryModel.getTotalStockByProductId(item.product_id);
  //         await ProductEventModel.recordEvent({
  //           product_id: item.product_id,
  //           warehouse_id: warehouse_id,
  //           event_type: "ORDER_SOLD",
  //           quantity_impact: -item.quantity, // Số lượng âm vì là bán hàng
  //           transaction_price: item.price, // Giả sử price có trong orderDetails item
  //           partner_name: partner_name,
  //           current_stock_after: current_stock_after,
  //           reference_id: order.order_id,
  //           reference_type: "ORDER",
  //           description: `Sản phẩm ${
  //             item.product_name || item.product_id
  //           } được bán trong đơn hàng ${order.order_id}.`,
  //           initiated_by: initiatedByUserId,
  //         });
  //         console.log(
  //           `🚀 ~ Product Event ghi nhận: Bán ${item.quantity} của ${item.product_id}`
  //         );
  //       }

  //       // ✅ Tự động sinh invoice_code
  //       const generateInvoiceCode = () => {
  //         const date = new Date();
  //         const y = date.getFullYear().toString().substr(-2);
  //         const m = ("0" + (date.getMonth() + 1)).slice(-2);
  //         const d = ("0" + date.getDate()).slice(-2);
  //         return `INV-${y}${m}${d}-${String(
  //           Math.floor(1000 + Math.random() * 9000)
  //         ).padStart(4, "0")}`;
  //       };

  //       const invoiceData = {
  //         invoice_code: generateInvoiceCode(),
  //         invoice_type: "sale_invoice",
  //         order_id: order.order_id,
  //         customer_id: order.customer_id || null,
  //         total_amount: parseFloat(order.total_amount),
  //         tax_amount: 0, // Có thể tính nếu có thuế
  //         discount_amount: parseFloat(order.discount_amount || 0),
  //         final_amount: parseFloat(order.final_amount),
  //         issued_date: new Date(),
  //         due_date: new Date(), // hoặc sau vài ngày
  //         amount_paid: parseFloat(order.amount_paid || 0),
  //         status: "paid", // Vì đơn hàng đã hoàn tất
  //         note: "Hóa đơn bán hàng tự động phát sinh từ đơn hàng",
  //       };

  //       console.log(
  //         "🚀 ~ order.service: update - Dữ liệu Invoice sẽ tạo:",
  //         invoiceData
  //       );
  //       const invoiceResult = await InvoiceService.create(invoiceData);
  //       console.log(
  //         "🚀 ~ order.service: update - Invoice đã tạo thành công (async/await):",
  //         invoiceResult
  //       );

  //       // ✅ Tạo giao dịch liên kết tới invoice
  //       const transactionData = {
  //         transaction_code: `TRX-${Date.now()}`,
  //         type: "receipt",
  //         amount: invoiceResult.final_amount,
  //         description: `Thu tiền từ hóa đơn ${invoiceResult.invoice_code}`,
  //         category: "sale",
  //         payment_method: order.payment_method || "COD",
  //         related_type: "invoice",
  //         related_id: invoiceResult.invoice_id,
  //       };
  //       console.log(
  //         "🚀 ~ order.service: update - Dữ liệu Transaction sẽ tạo:",
  //         transactionData
  //       );
  //       const transactionResult = await TransactionService.createTransaction(
  //         transactionData
  //       );
  //       console.log(
  //         "🚀 ~ order.service: update - Giao dịch đã tạo thành công:",
  //         transactionResult
  //       );

  //       return updateResult;
  //     } else if (data.order_status === "Huỷ đơn") {
  //       console.log(
  //         "🚀 ~ order.service: update - Trạng thái đơn hàng là 'Huỷ đơn'. Bắt đầu giải phóng tồn kho."
  //       );
  //       await InventoryService.releaseReservedStock(orderDetails, warehouse_id);
  //       console.log(
  //         "🚀 ~ order.service: update - Giải phóng tồn kho thành công."
  //       );

  //       // ✅ Ghi nhận sự kiện Product Event cho mỗi sản phẩm khi hủy đơn
  //       for (const item of orderDetails) {
  //         const current_stock_after =
  //           await InventoryModel.getTotalStockByProductId(item.product_id);
  //         await ProductEventModel.recordEvent({
  //           product_id: item.product_id,
  //           warehouse_id: warehouse_id,
  //           event_type: "ORDER_CANCELLED", // hoặc 'RETURN_TO_STOCK_FROM_CANCELLATION'
  //           quantity_impact: item.quantity, // Số lượng dương vì được trả về kho
  //           transaction_price: item.price, // Giá gốc của giao dịch
  //           partner_name: partner_name,
  //           current_stock_after: current_stock_after,
  //           reference_id: order.order_id,
  //           reference_type: "ORDER",
  //           description: `Đơn hàng ${order.order_id} bị hủy - Sản phẩm ${
  //             item.product_name || item.product_id
  //           } tồn kho được giải phóng.`,
  //           initiated_by: initiatedByUserId,
  //         });
  //         console.log(
  //           `🚀 ~ Product Event ghi nhận: Hủy đơn ${item.quantity} của ${item.product_id}`
  //         );
  //       }

  //       // await TransactionService.markAsCancelled(order_id);
  //       // console.log(
  //       //   "🚀 ~ order.service: update - Giao dịch liên quan đã được hủy thành công."
  //       // );
  //       return updateResult;
  //     } else {
  //       console.log(
  //         "🚀 ~ order.service: update - Trạng thái đơn hàng thay đổi nhưng không có logic xử lý cụ thể."
  //       );
  //       return updateResult;
  //     }
  //   } catch (error) {
  //     console.error(
  //       "🚀 ~ order.service: update - Lỗi trong quá trình xử lý:",
  //       error
  //     );
  //     throw error;
  //   }
  // },

  // update: async (order_id, data, initiatedByUserId = null) => {
  //   console.log("🚀 ~ order.service: update - Incoming data:", data);

  //   try {
  //     const updateResult = await OrderModel.update(order_id, data);
  //     if (!updateResult) {
  //       console.log(
  //         "🚀 ~ order.service: update - OrderModel.update không tìm thấy đơn hàng."
  //       );
  //       throw new Error("Đơn hàng không tồn tại");
  //     }

  //     if (!data.order_status) {
  //       console.log(
  //         "🚀 ~ order.service: update - data.order_status không được cung cấp. Bỏ qua logic phụ."
  //       );
  //       return updateResult;
  //     }

  //     console.log(
  //       "🚀 ~ order.service: update - order_status đã được cung cấp, tiếp tục xử lý logic phụ."
  //     );

  //     const order = await OrderModel.readById(order_id);
  //     if (!order) {
  //       console.log(
  //         "🚀 ~ order.service: update - OrderModel.readById không tìm thấy đơn hàng."
  //       );
  //       throw new Error("Không thể đọc thông tin đơn hàng");
  //     }

  //     console.log(
  //       "🚀 ~ order.service: update - Thông tin đơn hàng đã đọc:",
  //       order
  //     );
  //     const orderDetails = order.order_details || [];
  //     const warehouse_id = order.warehouse_id || null;
  //     const customer_id = order.customer_id || null;

  //     let partner_name = null;
  //     if (customer_id) {
  //       const customer = await CustomerModel.getById(customer_id);
  //       partner_name = customer ? customer.customer_name : null;
  //     }

  //     if (data.order_status === "Hoàn tất") {
  //       console.log(
  //         "🚀 ~ order.service: update - Trạng thái đơn hàng là 'Hoàn tất'. Bắt đầu xử lý tồn kho, hóa đơn, giao dịch."
  //       );

  //       if (orderDetails.length === 0) {
  //         console.warn(
  //           "� ~ order.service: update - Đơn hàng 'Hoàn tất' nhưng không có chi tiết đơn hàng (orderDetails)."
  //         );
  //       }

  //       // ✅ Gọi InventoryService.confirmStockReservation (đã là async)
  //       await InventoryService.confirmStockReservation(
  //         orderDetails,
  //         order.warehouse_id
  //       );
  //       console.log(
  //         "🚀 ~ order.service: update - Xác nhận tồn kho thành công."
  //       );

  //       // ✅ Ghi nhận sự kiện Product Event cho mỗi sản phẩm trong đơn hàng
  //       for (const item of orderDetails) {
  //         const current_stock_after =
  //           await InventoryModel.getTotalStockByProductId(item.product_id);
  //         await ProductEventModel.recordEvent({
  //           product_id: item.product_id,
  //           warehouse_id: warehouse_id,
  //           event_type: "ORDER_SOLD",
  //           quantity_impact: -item.quantity, // Số lượng âm vì là bán hàng
  //           transaction_price: item.price, // Giả sử price có trong orderDetails item
  //           partner_name: partner_name,
  //           current_stock_after: current_stock_after,
  //           reference_id: order.order_id,
  //           reference_type: "ORDER",
  //           description: `Sản phẩm ${
  //             item.product_name || item.product_id
  //           } được bán trong đơn hàng ${order.order_id}.`,
  //           initiated_by: initiatedByUserId,
  //         });
  //         console.log(
  //           `🚀 ~ Product Event ghi nhận: Bán ${item.quantity} của ${item.product_id}`
  //         );
  //       }

  //       // ✅ Tự động sinh invoice_code
  //       const generateInvoiceCode = () => {
  //         const date = new Date();
  //         const y = date.getFullYear().toString().substr(-2);
  //         const m = ("0" + (date.getMonth() + 1)).slice(-2);
  //         const d = ("0" + date.getDate()).slice(-2);
  //         return `INV-${y}${m}${d}-${String(
  //           Math.floor(1000 + Math.random() * 9000)
  //         ).padStart(4, "0")}`;
  //       };

  //       const invoiceData = {
  //         invoice_code: generateInvoiceCode(),
  //         invoice_type: "sale_invoice",
  //         order_id: order.order_id,
  //         customer_id: order.customer_id || null,
  //         total_amount: parseFloat(order.total_amount),
  //         tax_amount: 0, // Cần tính toán nếu có thuế
  //         discount_amount: parseFloat(order.discount_amount || 0),
  //         final_amount: parseFloat(order.final_amount),
  //         issued_date: new Date(),
  //         due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Hóa đơn đến hạn sau 7 ngày
  //         amount_paid: parseFloat(order.amount_paid || 0), // ✅ LẤY amount_paid TỪ ĐƠN HÀNG
  //         note: "Hóa đơn bán hàng tự động phát sinh từ đơn hàng",
  //       };

  //       console.log(
  //         "🚀 ~ order.service: update - Dữ liệu Invoice sẽ tạo:",
  //         invoiceData
  //       );
  //       const invoiceResult = await InvoiceService.create(invoiceData); // InvoiceModel.create sẽ tự xác định status
  //       console.log(
  //         "🚀 ~ order.service: update - Invoice đã tạo thành công (async/await):",
  //         invoiceResult
  //       );

  //       // ✅ TẠO GIAO DỊCH CHỈ KHI CÓ SỐ TIỀN THANH TOÁN BAN ĐẦU KHÁC 0
  //       if (parseFloat(order.amount_paid) > 0) {
  //         // Đảm bảo chỉ tạo transaction nếu amount_paid > 0
  //         const transactionData = {
  //           transaction_code: `TRX-${Date.now()}`,
  //           type: "receipt", // Loại giao dịch là thu tiền
  //           amount: parseFloat(order.amount_paid), // Số tiền của transaction là amount_paid của đơn hàng
  //           description: `Thanh toán ban đầu cho hóa đơn ${invoiceResult.invoice_code} (Đơn hàng ${order.order_code})`,
  //           category: "sale_payment",
  //           payment_method: order.payment_method || "COD",
  //           customer_id: order.customer_id,
  //           related_type: "invoice",
  //           related_id: invoiceResult.invoice_id,
  //           initiated_by: initiatedByUserId,
  //         };
  //         console.log(
  //           "🚀 ~ order.service: update - Dữ liệu Transaction sẽ tạo:",
  //           transactionData
  //         );
  //         const transactionResult = await TransactionService.createTransaction(
  //           transactionData
  //         );
  //         console.log(
  //           "🚀 ~ order.service: update - Giao dịch đã tạo thành công:",
  //           transactionResult
  //         );
  //       } else {
  //         console.log(
  //           "🚀 ~ order.service: update - Đơn hàng chưa có thanh toán ban đầu. Không tạo giao dịch."
  //         );
  //       }

  //       return updateResult;
  //     } else if (data.order_status === "Huỷ đơn") {
  //       console.log(
  //         "🚀 ~ order.service: update - Trạng thái đơn hàng là 'Huỷ đơn'. Bắt đầu giải phóng tồn kho."
  //       );
  //       await InventoryService.releaseReservedStock(orderDetails, warehouse_id);
  //       console.log(
  //         "🚀 ~ order.service: update - Giải phóng tồn kho thành công."
  //       );

  //       // ✅ Ghi nhận sự kiện Product Event cho mỗi sản phẩm khi hủy đơn
  //       for (const item of orderDetails) {
  //         const current_stock_after =
  //           await InventoryModel.getTotalStockByProductId(item.product_id);
  //         await ProductEventModel.recordEvent({
  //           product_id: item.product_id,
  //           warehouse_id: warehouse_id,
  //           event_type: "ORDER_CANCELLED", // hoặc 'RETURN_TO_STOCK_FROM_CANCELLATION'
  //           quantity_impact: item.quantity, // Số lượng dương vì được trả về kho
  //           transaction_price: item.price, // Giá gốc của giao dịch
  //           partner_name: partner_name,
  //           current_stock_after: current_stock_after,
  //           reference_id: order.order_id,
  //           reference_type: "ORDER",
  //           description: `Đơn hàng ${order.order_id} bị hủy - Sản phẩm ${
  //             item.product_name || item.product_id
  //           } tồn kho được giải phóng.`,
  //           initiated_by: initiatedByUserId,
  //         });
  //         console.log(
  //           `🚀 ~ Product Event ghi nhận: Hủy đơn ${item.quantity} của ${item.product_id}`
  //         );
  //       }

  //       await TransactionService.markAsCancelled(order_id);
  //       console.log(
  //         "🚀 ~ order.service: update - Giao dịch liên quan đã được hủy thành công."
  //       );
  //       return updateResult;
  //     } else {
  //       console.log(
  //         "🚀 ~ order.service: update - Trạng thái đơn hàng thay đổi nhưng không có logic xử lý cụ thể."
  //       );
  //       return updateResult;
  //     }
  //   } catch (error) {
  //     console.error(
  //       "🚀 ~ order.service: update - Lỗi trong quá trình xử lý:",
  //       error
  //     );
  //     throw error;
  //   }
  // },

  update: async (order_id, data, initiatedByUserId = null) => {
    console.log("🚀 ~ order.service: update - Incoming data:", data);

    try {
      const updateResult = await OrderModel.update(order_id, data);
      if (!updateResult) {
        console.log(
          "🚀 ~ order.service: update - OrderModel.update không tìm thấy đơn hàng."
        );
        throw new Error("Đơn hàng không tồn tại");
      }

      // Chỉ chạy logic phụ nếu order_status được cung cấp trong dữ liệu cập nhật
      if (!data.order_status) {
        console.log(
          "🚀 ~ order.service: update - data.order_status không được cung cấp. Bỏ qua logic phụ."
        );
        return updateResult;
      }

      console.log(
        "🚀 ~ order.service: update - order_status đã được cung cấp, tiếp tục xử lý logic phụ."
      );

      const order = await OrderModel.readById(order_id);
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
      const customer_id = order.customer_id || null;

      let partner_name = null;
      if (customer_id) {
        const customer = await CustomerModel.getById(customer_id);
        partner_name = customer ? customer.customer_name : null;
      }

      if (data.order_status === "Hoàn tất") {
        console.log(
          "🚀 ~ order.service: update - Trạng thái đơn hàng là 'Hoàn tất'. Bắt đầu xử lý tồn kho, hóa đơn, giao dịch và báo cáo khách hàng."
        );

        if (orderDetails.length === 0) {
          console.warn(
            "🚀 ~ order.service: update - Đơn hàng 'Hoàn tất' nhưng không có chi tiết đơn hàng (orderDetails)."
          );
        }

        // 1. Xác nhận tồn kho
        await InventoryService.confirmStockReservation(
          orderDetails,
          order.warehouse_id
        );
        console.log(
          "🚀 ~ order.service: update - Xác nhận tồn kho thành công."
        );

        // 2. Ghi nhận Product Event
        for (const item of orderDetails) {
          const current_stock_after =
            await InventoryModel.getTotalStockByProductId(item.product_id);
          await ProductEventModel.recordEvent({
            product_id: item.product_id,
            warehouse_id: warehouse_id,
            event_type: "ORDER_SOLD",
            quantity_impact: -item.quantity,
            transaction_price: item.price,
            partner_name: partner_name,
            current_stock_after: current_stock_after,
            reference_id: order.order_id,
            reference_type: "ORDER",
            description: `Sản phẩm ${
              item.product_name || item.product_id
            } được bán trong đơn hàng ${order.order_id}.`,
            initiated_by: initiatedByUserId,
          });
          console.log(
            `🚀 ~ Product Event ghi nhận: Bán ${item.quantity} của ${item.product_id}`
          );
        }

        // 3. Tạo Invoice
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
          tax_amount: 0,
          discount_amount: parseFloat(order.discount_amount || 0),
          final_amount: parseFloat(order.final_amount),
          issued_date: new Date(),
          due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          amount_paid: parseFloat(order.amount_paid || 0),
          note: "Hóa đơn bán hàng tự động phát sinh từ đơn hàng",
        };

        console.log(
          "🚀 ~ order.service: update - Dữ liệu Invoice sẽ tạo:",
          invoiceData
        );
        const invoiceResult = await InvoiceService.create(invoiceData);
        console.log(
          "🚀 ~ order.service: update - Invoice đã tạo thành công (async/await):",
          invoiceResult
        );

        // 4. Tạo Transaction (nếu có amount_paid ban đầu > 0)
        if (parseFloat(order.amount_paid) > 0) {
          const transactionData = {
            transaction_code: `TRX-${Date.now()}`,
            type: "receipt",
            amount: parseFloat(order.amount_paid),
            description: `Thanh toán ban đầu cho hóa đơn ${invoiceResult.invoice_code} (Đơn hàng ${order.order_code})`,
            category: "sale_payment",
            payment_method: order.payment_method || "COD",
            customer_id: order.customer_id,
            related_type: "invoice",
            related_id: invoiceResult.invoice_id,
            initiated_by: initiatedByUserId,
          };
          console.log(
            "🚀 ~ order.service: update - Dữ liệu Transaction sẽ tạo:",
            transactionData
          );
          const transactionResult = await TransactionService.createTransaction(
            transactionData
          );
          console.log(
            "🚀 ~ order.service: update - Giao dịch đã tạo thành công:",
            transactionResult
          );
        } else {
          console.log(
            "🚀 ~ order.service: update - Đơn hàng chưa có thanh toán ban đầu. Không tạo giao dịch."
          );
        }

        // 5. Cập nhật các trường báo cáo cho khách hàng trong bảng 'customers'
        let customerReportUpdates = {};
        if (customer_id) {
          console.log(
            `🚀 ~ order.service: update - Cập nhật báo cáo cho khách hàng ${customer_id}`
          );

          // Lấy tổng số đơn hàng và tổng chi tiêu mới nhất của khách hàng
          const customerOverview =
            await CustomerReportService.getTotalOrdersAndExpenditure(
              customer_id
            );
          const newTotalOrders = customerOverview.total_orders;
          const newTotalExpenditure = parseFloat(
            customerOverview.total_expenditure || 0
          );

          // Xác định trạng thái khách hàng dựa trên newTotalOrders
          let newCustomerStatus;
          if (newTotalOrders < 10) {
            newCustomerStatus = "khách hàng mới";
          } else if (newTotalOrders <= 20) {
            newCustomerStatus = "khách hàng thân thiết";
          } else if (newTotalOrders < 50) {
            newCustomerStatus = "khách hàng thường xuyên";
          } else {
            newCustomerStatus = "khách hàng VIP";
          }

          // Tạo đối tượng dữ liệu để cập nhật CustomerModel
          const updatedCustomerData = {
            total_expenditure: newTotalExpenditure,
            status: newCustomerStatus,
            total_orders: newTotalOrders,
          };

          // Cập nhật thông tin khách hàng vào DB
          await CustomerModel.update(customer_id, updatedCustomerData);
          console.log(
            `🚀 ~ order.service: update - Đã cập nhật Customer Report (total_orders, total_expenditure, status) cho khách hàng ${customer_id}`
          );

          // // Lấy danh sách các hóa đơn chưa thanh toán hoặc còn nợ
          // const unpaidInvoicesList =
          //   await CustomerReportService.getUnpaidOrPartiallyPaidInvoices(
          //     customer_id
          //   );
          // console.log(
          //   `🚀 ~ order.service: update - Danh sách hóa đơn chưa thanh toán/còn nợ của khách hàng:`,
          //   unpaidInvoicesList
          // );

          // // Gộp các thông tin báo cáo vào customerReportUpdates
          // customerReportUpdates = {
          //   total_orders: newTotalOrders,
          //   total_expenditure: newTotalExpenditure,
          //   customer_status: newCustomerStatus,
          //   unpaid_invoices_list: unpaidInvoicesList, // Trả về danh sách này
          // };
        } else {
          console.warn(
            "🚀 ~ order.service: update - Không có customer_id để cập nhật báo cáo khách hàng."
          );
        }

        // Trả về kết quả cập nhật đơn hàng và kèm theo thông tin báo cáo khách hàng
        return {
          ...updateResult, // Kết quả cập nhật của chính đơn hàng
          customer_report_data: customerReportUpdates, // Dữ liệu báo cáo khách hàng
        };
      } else if (data.order_status === "Huỷ đơn") {
        console.log(
          "🚀 ~ order.service: update - Trạng thái đơn hàng là 'Huỷ đơn'. Bắt đầu giải phóng tồn kho."
        );
        await InventoryService.releaseReservedStock(orderDetails, warehouse_id);
        console.log(
          "🚀 ~ order.service: update - Giải phóng tồn kho thành công."
        );

        for (const item of orderDetails) {
          const current_stock_after =
            await InventoryModel.getTotalStockByProductId(item.product_id);
          await ProductEventModel.recordEvent({
            product_id: item.product_id,
            warehouse_id: warehouse_id,
            event_type: "ORDER_CANCELLED",
            quantity_impact: item.quantity,
            transaction_price: item.price,
            partner_name: partner_name,
            current_stock_after: current_stock_after,
            reference_id: order.order_id,
            reference_type: "ORDER",
            description: `Đơn hàng ${order.order_id} bị hủy - Sản phẩm ${
              item.product_name || item.product_id
            } tồn kho được giải phóng.`,
            initiated_by: initiatedByUserId,
          });
          console.log(
            `🚀 ~ Product Event ghi nhận: Hủy đơn ${item.quantity} của ${item.product_id}`
          );
        }

        await TransactionService.markAsCancelled(order_id);
        console.log(
          "🚀 ~ order.service: update - Giao dịch liên quan đã được hủy thành công."
        );
        return updateResult;
      } else {
        console.log(
          "🚀 ~ order.service: update - Trạng thái đơn hàng thay đổi nhưng không có logic xử lý cụ thể."
        );
        return updateResult;
      }
    } catch (error) {
      console.error(
        "🚀 ~ order.service: update - Lỗi trong quá trình xử lý:",
        error
      );
      throw error;
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

  getTotalByStatus: async (filters = {}) => {
    try {
      const results = await OrderModel.getTotalByStatus(filters);
      return results;
    } catch (error) {
      console.error("Service - getTotalByStatus:", error.message);
      throw error;
    }
  },
};

module.exports = OrderService;
