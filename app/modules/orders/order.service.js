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
    console.log(
      "🚀 ~ OrderService.create - Dữ liệu nhận được từ Controller (raw):",
      data
    );
    try {
      const {
        details = [],
        amount_paid: initialAmountPaidFromPayload = 0,
        ...otherData
      } = data;

      const calculatedAmounts = calculateOrderTotals(details, data);
      console.log(
        "🚀 ~ OrderService.create - Các giá trị đã tính toán (số thực):",
        calculatedAmounts
      );

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
      console.log(
        "🚀 ~ OrderService.create - Dữ liệu gửi đến OrderModel.create (đã định dạng chuỗi):",
        orderDataForModel
      );

      // 1. Tạo đơn hàng chính
      const createdOrder = await OrderModel.create(orderDataForModel);
      console.log(
        "🚀 ~ OrderService.create - Đơn hàng chính đã tạo thành công:",
        createdOrder
      );

      // Sau khi tạo đơn hàng thành công, tăng debt cho khách hàng
      if (createdOrder && createdOrder.customer_id) {
        const debt = await CustomerModel.calculateDebt(createdOrder.customer_id);
        await CustomerModel.update(createdOrder.customer_id, { debt });
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
  //     const initialAmountPaidFromOrder = parseFloat(order.amount_paid || 0); // Lấy số tiền đã thanh toán từ đơn hàng

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

  //       await InventoryService.confirmStockReservation(
  //         orderDetails,
  //         order.warehouse_id
  //       );
  //       console.log(
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
  //         console.log(
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

  //       console.log(
  //         "🚀 ~ OrderService.create - Dữ liệu Invoice sẽ tạo:",
  //         invoiceData
  //       );
  //       const invoiceResult = await InvoiceService.create(invoiceData); // InvoiceService.create sẽ tự động xử lý amount_paid và status
  //       console.log(
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
  //       console.log(
  //         "🚀 ~ order.service: update - Trạng thái đơn hàng là 'Huỷ đơn'. Bắt đầu giải phóng tồn kho."
  //       );
  //       await InventoryService.releaseReservedStock(orderDetails, warehouse_id);
  //       console.log(
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

          console.log(
            "🚀 ~ order.service: update - Dữ liệu Invoice sẽ tạo:",
            invoiceData
          );
          // InvoiceService.create sẽ gọi InvoiceModel.create với amount_paid đã cung cấp
          const createdInvoice = await InvoiceService.create(invoiceData);
          console.log(
            "🚀 ~ order.service: update - Invoice đã tạo thành công:",
            createdInvoice
          );

          // Tạo Transaction cho khoản thanh toán ban đầu nếu có (nếu amount_paid > 0)
          if (parseFloat(order.amount_paid) > 0) {
            console.log(
              `🚀 ~ order.service: update - Ghi nhận giao dịch thanh toán ban đầu ${order.amount_paid}.`
            );
            const transactionData = {
              transaction_code: `TRX-${Date.now()}-${String(
                Math.floor(1000 + Math.random() * 9000)
              ).padStart(4, "0")}`,
              type: "receipt", // Loại giao dịch là thu tiền
              amount: parseFloat(order.amount_paid),
              description: `Thanh toán ban đầu cho hóa đơn ${createdInvoice.invoice_code} (Đơn hàng ${order.order_code})`,
              category: "sale_payment",
              payment_method: order.payment_method || "COD",
              customer_id: order.customer_id,
              related_type: "invoice",
              related_id: createdInvoice.invoice_id, // Liên kết với hóa đơn vừa tạo
              initiated_by: initiatedByUserId,
            };
            const newTransaction = await TransactionService.createTransaction(
              transactionData
            );
            console.log(
              `🚀 ~ order.service: update - Giao dịch thanh toán ban đầu đã tạo:`,
              newTransaction
            );
          } else {
            console.log(
              "🚀 ~ order.service: update - Đơn hàng chưa có thanh toán ban đầu. Không tạo giao dịch thanh toán."
            );
          }
        } else {
          console.log(
            `🚀 ~ order.service: update - Hóa đơn cho đơn hàng ${order.order_code} (ID: ${order.order_id}) đã tồn tại (mã: ${existingInvoice.invoice_code}). Bỏ qua việc tạo lại.`
          );
          // Hóa đơn đã tồn tại, không cần tạo lại. Các giao dịch ban đầu cũng đã được xử lý.
          // Mọi khoản thanh toán bổ sung sau này sẽ được xử lý qua API recordPayment.
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
          console.log(
            `🚀 ~ order.service: update - Đã cập nhật Customer Report (total_orders, total_expenditure, status) cho khách hàng ${customer_id}`
          );

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
          console.log(
            `🚀 ~ Product Event ghi nhận: Hủy đơn ${item.quantity} của ${item.product_id} tại kho ${warehouse_id}. Tồn cuối tại kho: ${current_stock_after_at_warehouse}`
          );
        }

        await TransactionService.markAsCancelled(order.order_id);
        console.log(
          "🚀 ~ order.service: update - Giao dịch liên quan đã được hủy thành công."
        );
        // Tùy chọn: Hủy hóa đơn liên quan nếu có
        // const invoiceToDelete = await InvoiceService.findByOrderId(order.order_id);
        // if (invoiceToDelete) {
        //     await InvoiceModel.updateStatus(invoiceToDelete.invoice_id, 'cancelled'); // Giả định có hàm updateStatus trong InvoiceModel
        //     console.log(`🚀 ~ Đã hủy hóa đơn ${invoiceToDelete.invoice_code} liên quan đến đơn hàng bị hủy.`);
        // }
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
