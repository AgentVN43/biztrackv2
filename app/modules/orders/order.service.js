const db = require("../../config/db.config"); // Import trực tiếp db instance
const OrderModel = require("./order.model");
const InventoryService = require("../inventories/inventory.service");
const TransactionService = require("../transactions/transaction.service");
const InvoiceService = require("../invoice/invoice.service");
const OrderDetailModel = require("../orderDetails/orderDetail.model");
const ProductEventModel = require("../product_report/product_event.model");
const CustomerModel = require("../customers/customer.model");
const InventoryModel = require("../inventories/inventory.model");
const CustomerReportService = require("../customer_report/customer_report.service");
const InvoiceModel = require("../invoice/invoice.model");
const CustomerService = require("../customers/customer.service");
const TransactionModel = require("../transactions/transaction.model"); // Để tính công nợ
const { calculateRefund } = require("../../utils/refundUtils");

const { v4: uuidv4 } = require("uuid");

// Hàm tính toán tổng tiền đơn hàng
// function calculateOrderTotals(orderDetails, orderData = {}) {
//   let calculatedTotalAmount = 0;
//   let calculatedDiscountProductAmount = 0;

//   const validDetails = Array.isArray(orderDetails) ? orderDetails : [];

//   validDetails.forEach((detail) => {
//     const price = parseFloat(detail.price) || 0;
//     const quantity = parseInt(detail.quantity) || 0;
//     const discount = parseFloat(detail.discount) || 0;

//     calculatedTotalAmount += price * quantity;
//     calculatedDiscountProductAmount += discount; //* quantity;
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

function calculateOrderTotals(orderDetails, orderData = {}) {
  let calculatedGrossProductAmount = 0;
  let calculatedProductLevelDiscountSum = 0;

  const validDetails = Array.isArray(orderDetails) ? orderDetails : [];

  validDetails.forEach((detail) => {
    const price = parseFloat(detail.price) || 0;
    const quantity = parseInt(detail.quantity) || 0;
    const discount = parseFloat(detail.discount || 0);

    calculatedGrossProductAmount += price * quantity;
    calculatedProductLevelDiscountSum += discount; //* quantity;
  });

  const orderLevelDiscountAmount = parseFloat(orderData.order_amount || 0);
  const taxAmount = parseFloat(orderData.tax_amount || 0); // ✅ Đã sửa lỗi: Đảm bảo tax_amount luôn là số
  const shippingFee = parseFloat(orderData.shipping_fee || 0);

  const totalCombinedDiscount =
    calculatedProductLevelDiscountSum + orderLevelDiscountAmount;

  // final_amount = gross - product_discount - order_discount + tax + shipping_fee
  const finalAmount =
    calculatedGrossProductAmount -
    calculatedProductLevelDiscountSum -
    orderLevelDiscountAmount +
    taxAmount +
    shippingFee;

  return {
    total_amount: calculatedGrossProductAmount, // Tổng giá trị sản phẩm gốc
    tax_amount: taxAmount,
    discount_amount: totalCombinedDiscount, // Tổng tất cả khuyến mãi (trên sản phẩm + trên đơn)
    final_amount: finalAmount,
    shipping_fee: shippingFee,
    order_amount: orderLevelDiscountAmount, // order_amount theo định nghĩa cũ của bạn (Tổng giá trị sản phẩm gốc)
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
    "amount_paid", // ✅ Thêm amount_paid vào danh sách fields được phép cập nhật
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

// ✅ Hàm tự động đồng bộ debt cho customer
const autoSyncCustomerDebt = async (customer_id) => {
  try {
    if (!customer_id) return;
    
    //console.log(`🔄 Tự động đồng bộ debt cho customer ${customer_id}...`);
    
    await CustomerModel.updateDebt(customer_id, 0, true);
    
    //console.log(`✅ Đã tự động đồng bộ debt cho customer ${customer_id}`);
  } catch (error) {
    //console.error(`❌ Lỗi khi tự động đồng bộ debt cho customer ${customer_id}:`, error);
    // Không throw error để không ảnh hưởng đến workflow chính
  }
};

const OrderService = {
  /**
   * Tạo đơn hàng mới.
   * @param {Object} data - Dữ liệu đơn hàng.
   * @returns {Promise<Object>} Promise giải quyết với đơn hàng đã tạo.
   */
  create: async (data) => {
    // //console.log(
    //   "🚀 ~ OrderService.create - Dữ liệu nhận được từ Controller (raw):",
    //   data
    // );
    try {
      const {
        details = [],
        amount_paid: initialAmountPaidFromPayload = 0,
        ...otherData
      } = data;

      const calculatedAmounts = calculateOrderTotals(details, data);
      // //console.log(
      //   "🚀 ~ OrderService.create - Các giá trị đã tính toán (số thực):",
      //   calculatedAmounts
      // );

      const orderDataForModel = {
        ...otherData,
        total_amount: calculatedAmounts.total_amount.toFixed(2),
        tax_amount: calculatedAmounts.tax_amount.toFixed(2), // Thêm tax_amount
        discount_amount: calculatedAmounts.discount_amount.toFixed(2),
        final_amount: calculatedAmounts.final_amount.toFixed(2),
        shipping_fee: calculatedAmounts.shipping_fee.toFixed(2),
        order_amount: calculatedAmounts.order_amount.toFixed(2),
        amount_paid: parseFloat(initialAmountPaidFromPayload).toFixed(2), // Lưu amount_paid vào order
      };
      // //console.log(
      //   "🚀 ~ OrderService.create - Dữ liệu gửi đến OrderModel.create (đã định dạng chuỗi):",
      //   orderDataForModel
      // );

      // 1. Tạo đơn hàng chính
      const createdOrder = await OrderModel.create(orderDataForModel);
      //console.log(
      //   "🚀 ~ OrderService.create - Đơn hàng chính đã tạo thành công:",
      //   createdOrder
      // );

      // ✅ Sau khi tạo đơn hàng thành công, tự động đồng bộ debt cho khách hàng
      if (createdOrder && createdOrder.customer_id) {
        await autoSyncCustomerDebt(createdOrder.customer_id);
      }

      // 2. Tạo các bản ghi chi tiết đơn hàng
      const createdDetails = [];
      if (details && details.length > 0) {
        await Promise.all(
          details.map(async (item) => {
            const order_detail_id = uuidv4();
            const detailToCreate = {
              order_detail_id,
              order_id: createdOrder.order_id,
              product_id: item.product_id,
              product_name: item.product_name, // Nếu có
              sku: item.sku, // Nếu có
              quantity: item.quantity,
              price: item.price,
              discount: item.discount || 0,
              cost_price: item.cost_price || 0, // Thêm cost_price nếu có
            };
            const createdDetail = await OrderDetailModel.create(detailToCreate);
            createdDetails.push(createdDetail);
          })
        );
        console.log(
          "🚀 ~ order.service.js: create - Chi tiết đơn hàng đã tạo thành công."
        );
      }

      // 3. Đặt chỗ tồn kho (thực hiện đặt chỗ ngay khi tạo đơn)
      if (orderDataForModel.warehouse_id) {
        await InventoryService.reserveStockFromOrderDetails(
          details,
          orderDataForModel.warehouse_id
        );
        console.log(
          "🚀 ~ order.service.js: create - Đặt chỗ tồn kho thành công."
        );
      } else {
        console.warn(
          "🚀 ~ order.service.js: create - Không có warehouse_id để đặt chỗ tồn kho."
        );
      }

      // ✅ KHÔNG TẠO HÓA ĐƠN Ở ĐÂY. Hóa đơn sẽ được tạo khi đơn hàng Hoàn tất.
      console.log(
        "🚀 ~ OrderService.create - KHÔNG tạo hóa đơn tại bước tạo đơn hàng. Hóa đơn sẽ được tạo khi đơn hàng được hoàn tất."
      );

      return {
        ...createdOrder,
        order_details: createdDetails,
        // Không trả về invoice ở đây vì nó chưa được tạo
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
   * @param {Object} data - Dữ liệu cập nhật.
   * @returns {Promise<Object>} Promise giải quyết với kết quả cập nhật.
   */

  // update: async (order_id, data, initiatedByUserId = null) => {
  //   //console.log("🚀 ~ order.service: update - Incoming data:", data);

  //   try {
  //     const updateResult = await OrderModel.update(order_id, data);
  //     if (!updateResult) {
  //       //console.log(
  //         "🚀 ~ order.service: update - OrderModel.update không tìm thấy đơn hàng."
  //       );
  //       throw new Error("Đơn hàng không tồn tại");
  //     }

  //     if (!data.order_status) {
  //       //console.log(
  //         "🚀 ~ order.service: update - data.order_status không được cung cấp. Bỏ qua logic phụ."
  //       );
  //       return updateResult;
  //     }

  //     //console.log(
  //       "🚀 ~ order.service: update - order_status đã được cung cấp, tiếp tục xử lý logic phụ."
  //     );

  //     const order = await OrderModel.readById(order_id);
  //     if (!order) {
  //       //console.log(
  //         "🚀 ~ order.service: update - OrderModel.readById không tìm thấy đơn hàng."
  //       );
  //       throw new Error("Không thể đọc thông tin đơn hàng");
  //     }

  //     //console.log(
  //       "🚀 ~ order.service: update - Thông tin đơn hàng đã đọc:",
  //       order
  //     );
  //     const orderDetails = order.order_details || [];
  //     const warehouse_id = order.warehouse_id || null;
  //     const customer_id = order.customer_id || null;
  //     const initialAmountPaidFromOrder = parseFloat(order.amount_paid || 0); // Lấy số tiền đã thanh toán từ đơn hàng

  //     let partner_name = null;
  //     if (customer_id) {
  //       const customer = await CustomerModel.getById(customer_id);
  //       partner_name = customer ? customer.customer_name : null;
  //     }

  //     if (data.order_status === "Hoàn tất") {
  //       //console.log(
  //         "🚀 ~ order.service: update - Trạng thái đơn hàng là 'Hoàn tất'. Bắt đầu xử lý tồn kho, hóa đơn, giao dịch."
  //       );

  //       if (orderDetails.length === 0) {
  //         //console.warn(
  //           "🚀 ~ order.service: update - Đơn hàng 'Hoàn tất' nhưng không có chi tiết đơn hàng (orderDetails)."
  //         );
  //       }

  //       await InventoryService.confirmStockReservation(
  //         orderDetails,
  //         order.warehouse_id
  //       );
  //       //console.log(
  //         "🚀 ~ order.service: update - Xác nhận tồn kho thành công."
  //       );

  //       for (const item of orderDetails) {
  //         // const current_stock_after =
  //         //   await InventoryModel.getTotalStockByProductId(item.product_id); // Tồn kho tổng toàn hệ thống
  //         const inventoryAtWarehouse =
  //           await InventoryModel.findByProductAndWarehouse(
  //             item.product_id,
  //             warehouse_id
  //           );
  //         const current_stock_after_at_warehouse = inventoryAtWarehouse
  //           ? inventoryAtWarehouse.quantity
  //           : 0;

  //         await ProductEventModel.recordEvent({
  //           product_id: item.product_id,
  //           warehouse_id: warehouse_id,
  //           event_type: "ORDER_SOLD",
  //           quantity_impact: -item.quantity,
  //           transaction_price: item.price,
  //           partner_name: partner_name,
  //           current_stock_after: current_stock_after_at_warehouse,
  //           reference_id: order.order_id,
  //           reference_type: "ORDER",
  //           description: `Sản phẩm ${
  //             item.product_name || item.product_id
  //           } được bán trong đơn hàng ${order.order_id}.`,
  //           initiated_by: initiatedByUserId,
  //         });
  //         //console.log(
  //           `🚀 ~ Product Event ghi nhận: Bán ${item.quantity} của ${item.product_id}`
  //         );
  //       }

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
  //         tax_amount: 0,
  //         discount_amount: parseFloat(order.discount_amount || 0),
  //         final_amount: parseFloat(order.final_amount),
  //         issued_date: new Date(),
  //         due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Due in 7 days, example
  //         note: "Hóa đơn bán hàng tự động phát sinh từ đơn hàng",
  //         amount_paid: parseFloat(createdOrder.amount_paid || 0), // ✅ Truyền amount_paid từ đơn hàng
  //       };

  //       //console.log(
  //         "🚀 ~ OrderService.create - Dữ liệu Invoice sẽ tạo:",
  //         invoiceData
  //       );
  //       const invoiceResult = await InvoiceService.create(invoiceData); // InvoiceService.create sẽ tự động xử lý amount_paid và status
  //       //console.log(
  //         "🚀 ~ OrderService.create - Invoice đã tạo thành công:",
  //         invoiceResult
  //       );

  //       // KHÔNG CẦN TẠO TRANSACTION Ở ĐÂY, vì InvoiceModel.create đã thiết lập amount_paid và status.
  //       // Các thanh toán bổ sung sau này sẽ dùng InvoiceService.recordPayment.

  //       return {
  //         ...createdOrder,
  //         order_details: createdDetails,
  //         invoice: invoiceResult, // Trả về cả thông tin hóa đơn đã tạo
  //       };
  //     } else if (data.order_status === "Huỷ đơn") {
  //       //console.log(
  //         "🚀 ~ order.service: update - Trạng thái đơn hàng là 'Huỷ đơn'. Bắt đầu giải phóng tồn kho."
  //       );
  //       await InventoryService.releaseReservedStock(orderDetails, warehouse_id);
  //       //console.log(
  //         "🚀 ~ order.service: update - Giải phóng tồn kho thành công."
  //       );

  //       for (const item of orderDetails) {
  //         // const current_stock_after =
  //         //    await InventoryModel.getTotalStockByProductId(item.product_id); // Tồn kho tổng toàn hệ thống
  //         const inventoryAtWarehouse =
  //           await InventoryModel.findByProductAndWarehouse(
  //             item.product_id,
  //             warehouse_id
  //           );
  //         const current_stock_after_at_warehouse = inventoryAtWarehouse
  //           ? inventoryAtWarehouse.quantity
  //           : 0;

  //         await ProductEventModel.recordEvent({
  //           product_id: item.product_id,
  //           warehouse_id: warehouse_id,
  //           event_type: "ORDER_CANCELLED",
  //           quantity_impact: item.quantity,
  //           transaction_price: item.price,
  //           partner_name: partner_name,
  //           current_stock_after: current_stock_after_at_warehouse,
  //           reference_id: order.order_id,
  //           reference_type: "ORDER",
  //           description: `Đơn hàng ${order.order_id} bị hủy - Sản phẩm ${
  //             item.product_name || item.product_id
  //           } tồn kho được giải phóng.`,
  //           initiated_by: initiatedByUserId,
  //         });
  //         //console.log(
  //           `🚀 ~ Product Event ghi nhận: Hủy đơn ${item.quantity} của ${item.product_id}`
  //         );
  //       }

  //       await TransactionService.markAsCancelled(order_id);
  //       //console.log(
  //         "🚀 ~ order.service: update - Giao dịch liên quan đã được hủy thành công."
  //       );
  //       return updateResult;
  //     } else {
  //       //console.log(
  //         "🚀 ~ order.service: update - Trạng thái đơn hàng thay đổi nhưng không có logic xử lý cụ thể."
  //       );
  //       return updateResult;
  //     }
  //   } catch (error) {
  //     //console.error(
  //       "🚀 ~ order.service: update - Lỗi trong quá trình xử lý:",
  //       error
  //     );
  //     throw error;
  //   }
  // },

  /**
   * Cập nhật đơn hàng và xử lý logic nghiệp vụ liên quan đến trạng thái.
   * Bao gồm cập nhật báo cáo khách hàng khi trạng thái là "Hoàn tất".
   * Đây là điểm DUY NHẤT để tạo hóa đơn cho đơn hàng bán hàng.
   *
   * @param {string} order_id - ID đơn hàng.
   * @param {Object} data - Dữ liệu cập nhật.
   * @param {string} [initiatedByUserId=null] - ID của người dùng thực hiện thao tác.
   * @returns {Promise<Object>} Promise giải quyết với kết quả cập nhật và báo cáo khách hàng.
   */
  update: async (order_id, data, initiatedByUserId = null) => {
    console.log(
      "🚀 ~ order.service: update - Dữ liệu nhận được từ Controller:",
      data
    );

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

        // 1. Xác nhận tồn kho (chuyển reserved_stock thành actual quantity sold)
        await InventoryService.confirmStockReservation(
          orderDetails,
          order.warehouse_id
        );
        console.log(
          "🚀 ~ order.service: update - Xác nhận tồn kho thành công."
        );

        // 2. Ghi nhận Product Event (giảm tồn kho tại kho cụ thể)
        for (const item of orderDetails) {
          const inventoryAtWarehouse =
            await InventoryModel.findByProductAndWarehouse(
              item.product_id,
              warehouse_id
            );
          const current_stock_after_at_warehouse = inventoryAtWarehouse
            ? inventoryAtWarehouse.quantity
            : 0;

          await ProductEventModel.recordEvent({
            product_id: item.product_id,
            warehouse_id: warehouse_id,
            event_type: "ORDER_SOLD",
            quantity_impact: -item.quantity, // Số âm vì giảm tồn kho
            transaction_price: item.price,
            partner_name: partner_name,
            current_stock_after: current_stock_after_at_warehouse,
            reference_id: order.order_id,
            reference_type: "ORDER",
            description: `Sản phẩm ${
              item.product_name || item.product_id
            } được bán trong đơn hàng ${order.order_code}.`,
            initiated_by: initiatedByUserId,
          });
          console.log(
            `🚀 ~ Product Event ghi nhận: Bán ${item.quantity} của ${item.product_id} tại kho ${warehouse_id}. Tồn cuối tại kho: ${current_stock_after_at_warehouse}`
          );
        }

        // 3. TẠO HÓA ĐƠN VÀ GIAO DỊCH BAN ĐẦU (NẾU CHƯA CÓ)
        // Đây là điểm DUY NHẤT để tạo hóa đơn cho một đơn hàng bán hàng.
        const existingInvoice = await InvoiceService.findByOrderId(
          order.order_id
        );
        let createdInvoice = existingInvoice;
        if (!existingInvoice) {
          console.log(
            "🚀 ~ order.service: update - Bắt đầu tạo hóa đơn và giao dịch ban đầu cho đơn hàng hoàn tất."
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
            order_id: order.order_id,
            customer_id: order.customer_id || null,
            total_amount: parseFloat(order.total_amount),
            tax_amount: parseFloat(order.tax_amount || 0), // Lấy từ order
            discount_amount: parseFloat(order.discount_amount || 0),
            final_amount: parseFloat(order.final_amount),
            issued_date: new Date(),
            due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Ví dụ: Hóa đơn đến hạn sau 7 ngày
            note: `Hóa đơn bán hàng tự động phát sinh từ đơn hàng ${order.order_code}.`,
            amount_paid: parseFloat(order.amount_paid || 0), // ✅ Lấy amount_paid từ ĐƠN HÀNG GỐC
          };

          // //console.log(
          //   "🚀 ~ order.service: update - Dữ liệu Invoice sẽ tạo:",
          //   invoiceData
          // );
          // InvoiceService.create sẽ gọi InvoiceModel.create với amount_paid đã cung cấp
          createdInvoice = await InvoiceService.create(invoiceData);
          // //console.log(
          //   "🚀 ~ order.service: update - Invoice đã tạo thành công:",
          //   createdInvoice
          // );
        } else {
          console.log(
            `🚀 ~ order.service: update - Hóa đơn cho đơn hàng ${order.order_code} (ID: ${order.order_id}) đã tồn tại (mã: ${existingInvoice.invoice_code}). Bỏ qua việc tạo lại.`
          );
        }

        // 4. TẠO TRANSACTION CHO amount_paid NẾU CÓ (và chưa có transaction nào)
        if (parseFloat(order.amount_paid || 0) > 0) {
          // Kiểm tra đã có transaction advance_payment/partial_paid cho order này chưa
          const existingTransactions =
            await TransactionModel.getTransactionsByOrderId(order.order_id);
          const hasAdvancePayment = existingTransactions.some(
            (t) => t.type === "advance_payment" || t.type === "partial_paid"
          );
          if (!hasAdvancePayment) {
            await TransactionService.createTransaction({
              transaction_code: `TTDH-${order.order_code}`,
              order_id: order.order_id,
              invoice_id: createdInvoice ? createdInvoice.invoice_id : null,
              customer_id: order.customer_id,
              type: 'receipt',
              amount: parseFloat(order.amount_paid),
              status: 'completed',
              note: `Thanh toán trước chuyển thành thanh toán hóa đơn ${createdInvoice ? createdInvoice.invoice_code : ''}`,
              created_by: initiatedByUserId || null,
            });
            console.log(
              "🚀 ~ order.service: update - Đã tạo transaction advance_payment cho amount_paid ban đầu của order."
            );
          }
        }

        // 4. Cập nhật các trường báo cáo cho khách hàng trong bảng 'customers'
        let customerReportUpdates = {};
        if (customer_id) {
          console.log(
            `🚀 ~ order.service: update - Cập nhật báo cáo cho khách hàng ${customer_id}`
          );

          // Giả sử CustomerReportService.getTotalOrdersAndExpenditure lấy dữ liệu từ các đơn hàng đã 'Hoàn tất' hoặc có invoice.
          const customerOverview =
            await CustomerReportService.getTotalOrdersAndExpenditure(
              customer_id
            );
          const newTotalOrders = customerOverview.total_orders;
          const newTotalExpenditure = parseFloat(
            customerOverview.total_expenditure || 0
          );

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

          const updatedCustomerData = {
            total_expenditure: newTotalExpenditure,
            status: newCustomerStatus,
            total_orders: newTotalOrders,
          };

          await CustomerModel.update(customer_id, updatedCustomerData);
          // console.log(
          //   `🚀 ~ order.service: update - Đã cập nhật Customer Report (total_orders, total_expenditure, status) cho khách hàng ${customer_id}`
          // );

          const unpaidInvoicesList =
            await CustomerReportService.getUnpaidOrPartiallyPaidInvoices(
              customer_id
            );
          console.log(
            `🚀 ~ order.service: update - Danh sách hóa đơn chưa thanh toán/còn nợ của khách hàng:`,
            unpaidInvoicesList
          );

          customerReportUpdates = {
            total_orders: newTotalOrders,
            total_expenditure: newTotalExpenditure,
            customer_status: newCustomerStatus,
            unpaid_invoices_list: unpaidInvoicesList,
          };
        } else {
          console.warn(
            "🚀 ~ order.service: update - Không có customer_id để cập nhật báo cáo khách hàng."
          );
        }

        return {
          ...updateResult,
          customer_report_data: customerReportUpdates,
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
          const inventoryAtWarehouse =
            await InventoryModel.findByProductAndWarehouse(
              item.product_id,
              warehouse_id
            );
          const current_stock_after_at_warehouse = inventoryAtWarehouse
            ? inventoryAtWarehouse.quantity
            : 0;

          await ProductEventModel.recordEvent({
            product_id: item.product_id,
            warehouse_id: warehouse_id,
            event_type: "ORDER_CANCELLED",
            quantity_impact: item.quantity, // Số dương vì trả về kho
            transaction_price: item.price,
            partner_name: partner_name,
            current_stock_after: current_stock_after_at_warehouse,
            reference_id: order.order_id,
            reference_type: "ORDER",
            description: `Đơn hàng ${order.order_code} bị hủy - Sản phẩm ${
              item.product_name || item.product_id
            } tồn kho được giải phóng.`,
            initiated_by: initiatedByUserId,
          });
          // //console.log(
          //   `🚀 ~ Product Event ghi nhận: Hủy đơn ${item.quantity} của ${item.product_id} tại kho ${warehouse_id}. Tồn cuối tại kho: ${current_stock_after_at_warehouse}`
          // );
        }

        await TransactionService.markAsCancelled(order.order_id);
        console.log(
          "🚀 ~ order.service: update - Giao dịch liên quan đã được hủy thành công."
        );

        // ✅ HỦY HÓA ĐƠN LIÊN QUAN NẾU CÓ
        const invoiceToDelete = await InvoiceService.findByOrderId(
          order.order_id
        );
        if (invoiceToDelete) {
          console.log(
            `🚀 ~ order.service: update - Tìm thấy hóa đơn liên quan ${invoiceToDelete.invoice_code}. Đang hủy hóa đơn.`
          );
          // Cập nhật trạng thái hóa đơn thành 'cancelled'
          await InvoiceModel.updateStatus(
            invoiceToDelete.invoice_id,
            "cancelled"
          );
          console.log(
            `🚀 ~ order.service: update - Đã hủy hóa đơn ${invoiceToDelete.invoice_code} liên quan đến đơn hàng bị hủy.`
          );
        }

        // ✅ CẬP NHẬT LẠI DEBT KHI ĐƠN HÀNG BỊ HỦY
        if (order.customer_id) {
          console.log(
            `🚀 ~ order.service: update - Cập nhật lại debt cho khách hàng ${order.customer_id} sau khi hủy đơn hàng.`
          );
          await autoSyncCustomerDebt(order.customer_id);
          
          // Lấy thông tin customer sau khi sync để log
          const updatedCustomer = await CustomerModel.getById(order.customer_id);
          console.log(
            `🚀 ~ order.service: update - Đã cập nhật debt mới cho khách hàng ${order.customer_id}: ${updatedCustomer.debt}`
          );
        }

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

  read: async (page = 1, limit = 10, filters = {}) => {
    // Hàm này giờ nhận page và limit với giá trị mặc định
    const skip = (page - 1) * limit;
    try {
      // Gọi Model và nhận cả dữ liệu và tổng số lượng
      const { data, total } = await OrderModel.read(skip, limit, filters);
      return { data, total }; // Trả về cả hai
    } catch (error) {
      //console.error("🚀 ~ order.service.js: read - Lỗi:", error);
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
      //console.error("🚀 ~ order.service.js: readById - Lỗi:", error);
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
      //console.error("🚀 ~ order.service.js: delete - Lỗi:", error);
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
    const { order, orderDetails = [] } = data;

    // //console.log(
    //   "🚀 ~ order.service: updateOrderWithDetails - FE send Order:",
    //   order
    // );
    // //console.log(
    //   "🚀 ~ order.service: updateOrderWithDetails - FE send OrderDetails:",
    //   orderDetails
    // );
    // //console.log(
    //   "🚀 ~ order.service: updateOrderWithDetails - amount_paid từ client:",
    //   order?.amount_paid
    // );

    if (!order || !Array.isArray(orderDetails)) {
      throw new Error("Missing 'order' or 'orderDetails'");
    }

    const validOrderData = filterValidOrderFields(order);
    // //console.log(
    //   "🚀 ~ order.service: updateOrderWithDetails - validOrderData sau khi filter:",
    //   validOrderData
    // );
    // //console.log(
    //   "🚀 ~ order.service: updateOrderWithDetails - amount_paid trong validOrderData:",
    //   validOrderData.amount_paid
    // );

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

    // //console.log(
    //   "🚀 ~ order.service: updateOrderWithDetails - This is updatedOrder:",
    //   updatedOrder
    // );
    // //console.log(
    //   "🚀 ~ order.service: updateOrderWithDetails - amount_paid trong updatedOrder:",
    //   updatedOrder.amount_paid
    // );

    try {
      // ✅ Gọi OrderModel.updateOrderWithDetails (đã là async)
      const result = await OrderModel.updateOrderWithDetails(
        orderId,
        updatedOrder,
        orderDetailsData
      );

      // ✅ Đồng bộ amount_paid với invoices nếu có cập nhật
      if (updatedOrder.amount_paid !== undefined) {
        console.log(
          "🚀 ~ order.service: updateOrderWithDetails - Đồng bộ amount_paid với invoices..."
        );
        try {
          await OrderModel.syncAmountPaidWithInvoices(
            orderId,
            updatedOrder.amount_paid
          );
          console.log(
            "🚀 ~ order.service: updateOrderWithDetails - Đồng bộ amount_paid thành công"
          );
        } catch (syncError) {
          console.warn(
            "🚀 ~ order.service: updateOrderWithDetails - Lỗi đồng bộ amount_paid với invoices:",
            syncError.message
          );
          // Không throw error vì đây không phải lỗi nghiêm trọng
        }
      }

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
      //console.error("Service - getTotalByStatus:", error.message);
      throw error;
    }
  },

  getOrderTransactionLedger: async (order_id) => {
    try {
      // 1. Lấy thông tin đơn hàng
      const order = await OrderModel.readById(order_id);
      // 2. Lấy tất cả hóa đơn của đơn hàng
      const invoicesSql = `
        SELECT 
          invoice_id,
          invoice_code,
          order_id,
          final_amount,
          amount_paid,
          status,
          issued_date,
          created_at,
          updated_at
        FROM invoices 
        WHERE customer_id = ?
        ORDER BY created_at ASC
      `;
      const [invoices] = await db.promise().query(invoicesSql, [order_id]);

      // 3. Lấy tất cả giao dịch thanh toán
      const transactions = await TransactionModel.getTransactionsByOrderId(
        order_id
      );

      // 4. Tạo danh sách giao dịch theo thứ tự thời gian
      const allTransactions = [];

      // Xử lý  đơn hàng
      // BỎ QUA ĐƠN HÀNG BỊ HỦY
      if (order.order_status === "Huỷ đơn") return;
      const orderDate = new Date(order.created_at);
      const orderAdvanceAmount = parseFloat(order.amount_paid) || 0;

      // if (orderAdvanceAmount > 0) {
      //   // dùng > 0.0001 để tránh lỗi số thực
      //   allTransactions.push({
      //     transaction_code: `TTDH-${order.order_code}`,
      //     transaction_date: new Date(orderDate.getTime() + 1000),
      //     type: "partial_paid",
      //     amount: orderAdvanceAmount,
      //     description: `Thanh toán trước cho đơn hàng ${order.order_code}`,
      //     order_id: order.order_id,
      //     invoice_id: null,
      //     transaction_id: null,
      //     order_code: order.order_code,
      //     status: "completed",
      //   });
      // }

      // Thêm các giao dịch thanh toán riêng lẻ (không liên quan đến đơn hàng cụ thể)
      transactions.forEach((transaction) => {
        // Kiểm tra xem giao dịch này có liên quan đến order nào không
        let isCancelled = false;

        // Kiểm tra thông qua invoice
        if (transaction.related_type === "invoice") {
          const relatedInvoice = invoices.find(
            (inv) => inv.invoice_id === transaction.related_id
          );
          if (relatedInvoice) {
            if (relatedInvoice.status === "cancelled") {
              isCancelled = true;
            }
          }
        }
        // BỎ QUA TRANSACTION LIÊN QUAN ĐẾN ĐƠN HÀNG/HÓA ĐƠN BỊ HỦY
        if (isCancelled) return;
        // Thêm tất cả giao dịch thanh toán (bao gồm cả manual payments)
        // Nhưng đánh dấu rõ ràng loại thanh toán
        allTransactions.push({
          transaction_code: transaction.transaction_code,
          transaction_date: new Date(transaction.created_at),
          type: transaction.type,
          amount: parseFloat(transaction.amount),
          description:
            transaction.description ||
            `Thanh toán ${transaction.transaction_code}`,
          order_id:
            transaction.related_type === "order"
              ? transaction.related_id
              : null,
          invoice_id:
            transaction.related_type === "invoice"
              ? transaction.related_id
              : null,
          transaction_id: transaction.transaction_id,
          status: "completed",
          payment_method: transaction.payment_method,
          is_manual_payment: true, // Đánh dấu đây là thanh toán manual
        });
      });

      // 5. Sắp xếp theo thời gian (từ mới đến cũ)
      allTransactions.sort((a, b) => b.transaction_date - a.transaction_date);

      // Debug: In ra thứ tự giao dịch
      // console.log("🔍 Debug - Thứ tự giao dịch sau khi sắp xếp (mới đến cũ):");
      allTransactions.forEach((t, index) => {
        // console.log(
        //   `${index + 1}. ${t.transaction_code} | ${t.transaction_date} | ${
        //     t.type
        //   } | ${t.amount}`
        // );
      });

      // Lọc bỏ transaction có type === 'refund' khỏi allTransactions trước khi mapping
      const allTransactionsNoRefund = allTransactions.filter(
        (txn) => txn.type !== "refund"
      );

      // 6. Tính toán dư nợ theo logic sổ cái (từ cũ đến mới để tính đúng)
      // Đảo ngược lại để tính từ cũ đến mới
      const reversedTransactions = [...allTransactionsNoRefund].reverse();
      let runningBalance = 0;
      const calculatedBalances = [];

      // Tính dư nợ từ cũ đến mới
      reversedTransactions.forEach((transaction, index) => {
        if (transaction.type === "pending") {
          runningBalance += transaction.amount;
        } else if (
          transaction.type === "partial_paid" ||
          transaction.type === "payment" ||
          transaction.type === "receipt"
        ) {
          runningBalance -= transaction.amount;
        } else if (transaction.type === "return") {
          runningBalance -= transaction.amount;
        } else {
          // Log các type lạ để debug
          // //console.warn(
          //   "⚠️ Transaction type lạ:",
          //   transaction.type,
          //   transaction
          // );
        }
        calculatedBalances.push(runningBalance);
      });

      // Đảo ngược lại để hiển thị từ mới đến cũ
      calculatedBalances.reverse();

      const result = allTransactionsNoRefund.map((transaction, index) => {
        // Debug: In ra từng bước tính dư nợ
        // //console.log(
        //   `💰 ${index + 1}. ${transaction.transaction_code} | ${
        //     transaction.type
        //   } | ${transaction.amount} | Dư nợ: ${calculatedBalances[index]}`
        // );

        // Format dữ liệu trả về
        return {
          transaction_code: transaction.transaction_code,
          transaction_date: transaction.transaction_date,
          type: transaction.type,
          amount: transaction.amount,
          mo_ta: transaction.description,
          order_id: transaction.order_id,
          invoice_id: transaction.invoice_id,
          transaction_id: transaction.transaction_id,
          order_code: transaction.order_code,
          status: transaction.status,
          payment_method: transaction.payment_method || null,
          la_thanh_toan_manual: transaction.is_manual_payment || false,
        };
      });

      // Lọc lại theo loai === 'refund' để đảm bảo tuyệt đối
      const filteredTransactions = result.filter(
        (txn) => txn.type !== "refund"
      );
      // Sắp xếp lại theo thời gian (mới nhất lên trên)
      filteredTransactions.sort(
        (a, b) => new Date(b.transaction_date) - new Date(a.transaction_date)
      );
      return filteredTransactions;
    } catch (error) {
      console.error(
        "🚀 ~ CustomerReportService: getCustomerTransactionLedger - Lỗi:",
        error
      );
      throw error;
    }
  },

  getOrderWithReturnSummary: async (order_id) => {
    const [orderRows] = await new Promise((resolve, reject) => {
      db.query(
        "SELECT * FROM orders WHERE order_id = ?",
        [order_id],
        (err, rows) => {
          if (err) return reject(err);
          resolve([rows]);
        }
      );
    });
    if (!orderRows || !orderRows[0]) return null;
    const order = orderRows[0];

    // Lấy chi tiết trả hàng (nếu cần tính lại refund chi tiết)
    const [returnRows] = await new Promise((resolve, reject) => {
      db.query(
        `SELECT ro.return_id FROM return_orders ro WHERE ro.order_id = ? AND ro.status IN ('approved', 'completed')`,
        [order_id],
        (err, rows) => {
          if (err) return reject(err);
          resolve([rows]);
        }
      );
    });

    // Lấy orderDetails để map giá/discount sản phẩm
    const [orderDetailRows] = await new Promise((resolve, reject) => {
      db.query(
        `SELECT * FROM order_details WHERE order_id = ?`,
        [order_id],
        (err, rows) => {
          if (err) return reject(err);
          resolve([rows]);
        }
      );
    });
    let productPriceMap = {};
    let productDiscountMap = {};
    let orderProductMap = {};
    if (orderDetailRows && Array.isArray(orderDetailRows)) {
      for (const p of orderDetailRows) {
        productPriceMap[p.product_id] = p.price;
        productDiscountMap[p.product_id] = p.discount || 0;
        orderProductMap[p.product_id] = p.quantity || 0;
      }
    }

    // Tính refund từng lần trả, xác định lần trả cuối cùng
    let totalRefund = 0;
    let returnedQuantityMap = {};
    for (const pid in orderProductMap) returnedQuantityMap[pid] = 0;
    let lastRefund = 0;
    for (let i = 0; i < returnRows.length; i++) {
      const ret = returnRows[i];
      // Lấy chi tiết trả hàng cho từng lần trả
      const [returnDetailRows] = await new Promise((resolve, reject) => {
        db.query(
          `SELECT * FROM return_order_items WHERE return_id = ?`,
          [ret.return_id],
          (err, rows) => {
            if (err) return reject(err);
            resolve([rows]);
          }
        );
      });
      // Cộng dồn quantity đã trả
      for (const d of returnDetailRows) {
        returnedQuantityMap[d.product_id] =
          (returnedQuantityMap[d.product_id] || 0) + (d.quantity || 0);
      }
      // Kiểm tra nếu là lần trả cuối cùng (tất cả sản phẩm đã trả đủ quantity đã mua)
      let isFinalReturn = true;
      for (const pid in orderProductMap) {
        if ((returnedQuantityMap[pid] || 0) < orderProductMap[pid]) {
          isFinalReturn = false;
          break;
        }
      }
      let refundThisTime = 0;
      if (isFinalReturn && i === returnRows.length - 1) {
        refundThisTime = Number(order.final_amount || 0) - totalRefund;
        if (refundThisTime < 0) refundThisTime = 0;
        lastRefund = refundThisTime;
      } else {
        refundThisTime = require("../../utils/refundUtils").calculateRefund({
          order,
          returnDetails: returnDetailRows,
          productPriceMap,
          productDiscountMap,
        });
        lastRefund = refundThisTime;
      }
      refundThisTime = Math.round(refundThisTime * 100) / 100;
      totalRefund += refundThisTime;
    }
    // Kiểm tra đã trả hết đơn hay chưa
    let isFullyReturned = true;
    for (const pid in orderProductMap) {
      if ((returnedQuantityMap[pid] || 0) < orderProductMap[pid]) {
        isFullyReturned = false;
        break;
      }
    }
    let total_refund = isFullyReturned
      ? Number(order.final_amount || 0)
      : totalRefund;
    // Lấy ledger từ getOrderTransactionLedger
    const ledger = await OrderService.getOrderTransactionLedger(order_id);
    if (!ledger) {
      return {
        ...order,
        total_refund: 0,
        remaining_value: 0,
        amoutPayment: 0,
        ledger: [],
        note: "Đơn hàng đã bị huỷ, không có lịch sử giao dịch.",
      };
    }
    const amoutPayment = ledger
      .filter((t) => t.type === "receipt" || t.type === "partial_paid")
      .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

    const final_amount = Number(order.final_amount || 0);
    const remaining_value = final_amount - total_refund - amoutPayment;
    return {
      ...order,
      total_refund,
      remaining_value: Math.round(remaining_value * 100) / 100,
      amoutPayment: Math.round(amoutPayment * 100) / 100,
      ledger,
    };
  },
};

module.exports = OrderService;
