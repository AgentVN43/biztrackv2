const CustomerReturn = require("./customer_return.model");
const InvoiceModel = require("../invoice/invoice.model");
const Order = require("../orders/order.model");
const CustomerModel = require("../customers/customer.model");
const Inventory = require("../inventories/inventory.model");
const Transaction = require("../transactions/transaction.model");
const CustomerReportService = require("../customer_report/customer_report.service");
const db = require("../../config/db.config");
const OrderDetailService = require("../orderDetails/orderDetail.service");

// Hàm tạo transaction code
const generateTransactionCode = () => {
  const prefix = "TXN";
  const today = new Date();
  const dateStr = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, "0")}${String(today.getDate()).padStart(2, "0")}`;
  const timeStr = `${String(today.getHours()).padStart(2, "0")}${String(today.getMinutes()).padStart(2, "0")}${String(today.getSeconds()).padStart(2, "0")}`;
  const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase();

  return `${prefix}-${dateStr}-${timeStr}-${randomStr}`;
};

const CustomerReturnService = {
  // Tạo đơn trả hàng hoàn chỉnh với chi tiết
  createReturnWithDetails: async (returnData, returnDetails) => {
    try {
      // Nếu có order_id, lấy thông tin sản phẩm và giá từ order gốc
      let productPriceMap = {};
      let orderInfo = null;
      if (returnData.order_id) {
        const orderDetails = await OrderDetailService.getOrderDetailByOrderId(returnData.order_id);
        if (orderDetails && Array.isArray(orderDetails.products)) {
          for (const p of orderDetails.products) {
            productPriceMap[p.product_id] = p.price;
          }
        }
        // Lấy thông tin order để kiểm tra amount_paid
        const OrderModel = require('../orders/order.model');
        orderInfo = await OrderModel.getOrderWithReturnSummary(returnData.order_id);
      }

      // Tạo chi tiết trả hàng, tự động tính refund_amount nếu chưa có hoặc ép lại cho đúng
      const detailsPromises = returnDetails.map(detail => {
        let refund_amount = detail.refund_amount;
        if (detail.product_id && productPriceMap[detail.product_id] !== undefined) {
          refund_amount = productPriceMap[detail.product_id] * (detail.quantity || 0);
        }
        return {
          ...detail,
          refund_amount
        };
      });
      const detailsResults = await Promise.all(detailsPromises.map(async d => d));

      // Tính tổng số lượng trả lại lần này
      const total_return_quantity = detailsResults.reduce((sum, d) => sum + (d.quantity || 0), 0);

      // Nếu có order_id, lấy tổng quantity và order_amount từ order gốc
      let total_order_quantity = 0;
      let order_amount = 0;
      let final_amount = 0;
      if (orderInfo) {
        // Lấy tổng quantity của order gốc
        const orderDetails = await OrderDetailService.getOrderDetailByOrderId(returnData.order_id);
        if (orderDetails && Array.isArray(orderDetails.products)) {
          total_order_quantity = orderDetails.products.reduce((sum, p) => sum + (p.quantity || 0), 0);
        }
        order_amount = Number(orderInfo.order_amount || 0);
        final_amount = Number(orderInfo.final_amount || 0);
      }

      // Tính tổng số tiền hoàn trả cho lần này (trước khi phân bổ giảm giá trên đơn)
      let total_refund_this_time = 0;
      if (Array.isArray(detailsResults)) {
        total_refund_this_time = detailsResults.reduce((sum, d) => sum + (d.refund_amount || 0), 0);
      }

      // Phân bổ giảm giá trên đơn cho lần trả này
      let allocated_order_discount = 0;
      if (order_amount > 0 && total_order_quantity > 0 && total_return_quantity > 0) {
        allocated_order_discount = order_amount * (total_return_quantity / total_order_quantity);
      }

      // Tổng hoàn trả thực tế cho lần này
      let net_refund_this_time = total_refund_this_time - allocated_order_discount;
      if (net_refund_this_time < 0) net_refund_this_time = 0;

      // Nếu có order_id, kiểm tra tổng refund không vượt quá số tiền hợp lệ
      if (orderInfo) {
        const total_refund_before = orderInfo.total_refund || 0;
        const amount_paid = Number(orderInfo.amount_paid || 0);
        // Nếu khách chưa thanh toán (amount_paid = 0), cho phép trả hàng để giảm công nợ
        if (amount_paid === 0) {
          // Không cần kiểm tra gì thêm
        } else if (amount_paid > 0 && amount_paid < final_amount) {
          if ((total_refund_before + net_refund_this_time) > final_amount) {
            throw new Error(`Tổng số tiền hoàn trả vượt quá giá trị đơn hàng (${final_amount.toLocaleString()}đ)!`);
          }
        } else {
          let max_refundable = amount_paid;
          if (amount_paid >= final_amount) {
            max_refundable = final_amount;
          }
          // Làm tròn khi so sánh để tránh lỗi số lẻ
          const totalRefundSoFar = Math.round((total_refund_before + net_refund_this_time) * 100) / 100;
          const maxRefundableRounded = Math.round(max_refundable * 100) / 100;
          if (totalRefundSoFar > maxRefundableRounded) {
            throw new Error('Tổng số tiền hoàn trả vượt quá số tiền khách đã thanh toán!');
          }
        }
      }

      // Tạo đơn trả hàng
      const returnResult = await CustomerReturn.create(returnData);
      // Lưu chi tiết trả hàng
      const detailsSaved = await Promise.all(detailsResults.map(detail => CustomerReturn.createReturnDetail({
        ...detail,
        return_id: returnResult.return_id
      })));

      // Sau khi tạo xong chi tiết, tính lại total_refund (theo đúng logic mới)
      let total_refund = net_refund_this_time;

      return {
        ...returnResult,
        details: detailsSaved,
        total_refund: Number(total_refund)
      };
    } catch (error) {
      throw error;
    }
  },

  // Cập nhật đơn trả hàng
  updateReturn: async (return_id, updateData) => {
    try {
      return await CustomerReturn.update(return_id, updateData);
    } catch (error) {
      throw error;
    }
  },

  // Xóa đơn trả hàng
  deleteReturn: async (return_id) => {
    try {
      return await CustomerReturn.delete(return_id);
    } catch (error) {
      throw error;
    }
  },

  // Lấy đơn trả hàng theo khách hàng
  getReturnsByCustomer: async (customer_id, pagination = {}) => {
    try {
      return await CustomerReturn.getByCustomer(customer_id, pagination);
    } catch (error) {
      throw error;
    }
  },

  // Lấy đơn trả hàng theo đơn hàng
  getReturnsByOrder: async (order_id) => {
    try {
      return await CustomerReturn.getByOrder(order_id);
    } catch (error) {
      throw error;
    }
  },

  // Xử lý đơn trả hàng (cập nhật inventory và tạo transaction)
  processReturn: async (return_id, processed_by) => {
    try {
      // Lấy thông tin đơn trả hàng
      const returnInfo = await CustomerReturn.getById(return_id);
      if (!returnInfo) {
        throw new Error("Return order not found");
      }

      if (returnInfo.status === "completed") {
        throw new Error("Return order already processed");
      }

      // Lấy chi tiết trả hàng
      const returnDetails = await CustomerReturn.getReturnDetails(return_id);

      // Cập nhật inventory (thêm hàng trả về kho)
      for (const detail of returnDetails) {
        // Cần xác định warehouse_id từ order hoặc po
        let warehouse_id = null;
        if (returnInfo.order_id) {
          const order = await Order.readById(returnInfo.order_id);
          warehouse_id = order?.warehouse_id;
        }

        if (warehouse_id) {
          // Tăng số lượng tồn kho khi nhận hàng trả
          await Inventory.updateQuantitySimple(
            detail.product_id,
            warehouse_id,
            detail.quantity
          );

          // Ghi lại lịch sử điều chỉnh tồn kho
          await Inventory.recordAdjustment({
            product_id: detail.product_id,
            warehouse_id: warehouse_id,
            quantity_changed: detail.quantity,
            adjustment_type: "return",
            reason: `Customer return - ${returnInfo.return_id}`,
            adjusted_by: null
          });
        }
      }

      // Tính tổng số tiền hoàn trả
      const totalRefundAmount = returnDetails.reduce((sum, detail) => {
        return sum + (detail.refund_amount || 0);
      }, 0);

      // Nếu có hoàn tiền, tạo transaction
      // if (totalRefundAmount > 0) {
      //   await Transaction.createTransaction({
      //     transaction_code: generateTransactionCode(),
      //     type: "refund",
      //     amount: totalRefundAmount,
      //     description: `Refund for return - ${returnInfo.return_id}`,
      //     category: "customer_refund",
      //     payment_method: "cash",
      //     customer_id: returnInfo.customer_id,
      //     related_type: "other",
      //     related_id: return_id,
      //     initiated_by: null
      //   });
      // }

      // ✅ LUÔN cập nhật debt của khách hàng sau khi process return_order
      // (dù có hoàn tiền hay không, vì có thể ảnh hưởng đến công nợ từ các đơn hàng liên quan)
      try {
        console.log(`🔄 Đang cập nhật debt cho customer_id: ${returnInfo.customer_id}`);
        const newDebt = await CustomerModel.calculateDebt(returnInfo.customer_id);
        console.log(`📊 Debt mới được tính: ${newDebt}`);
        await CustomerModel.update(returnInfo.customer_id, { debt: newDebt });
        console.log(`✅ Đã cập nhật debt thành công cho customer_id: ${returnInfo.customer_id}`);
      } catch (debtError) {
        console.error(`❌ Lỗi khi cập nhật debt:`, debtError);
        // Không throw error để không ảnh hưởng đến việc process return_order
      }

      // ✅ Cập nhật total_expenditure và total_orders sau khi process return_order
      try {
        console.log(`🔄 Đang cập nhật total_expenditure và total_orders cho customer_id: ${returnInfo.customer_id}`);
        
        // Lấy thông tin cập nhật từ CustomerReportService
        const customerOverview = await CustomerReportService.getTotalOrdersAndExpenditure(returnInfo.customer_id);
        
        const newTotalOrders = customerOverview.total_orders;
        const newTotalExpenditure = parseFloat(customerOverview.total_expenditure || 0);
        
        console.log(`📊 Total orders mới: ${newTotalOrders}`);
        console.log(`📊 Total expenditure mới: ${newTotalExpenditure}`);
        
        // Cập nhật customer với thông tin mới
        await CustomerModel.update(returnInfo.customer_id, {
          total_expenditure: newTotalExpenditure,
          total_orders: newTotalOrders
        });
        
        console.log(`✅ Đã cập nhật total_expenditure và total_orders thành công cho customer_id: ${returnInfo.customer_id}`);
      } catch (reportError) {
        console.error(`❌ Lỗi khi cập nhật total_expenditure và total_orders:`, reportError);
        // Không throw error để không ảnh hưởng đến việc process return_order
      }
      
      // Cập nhật trạng thái đơn trả hàng
      await CustomerReturn.updateStatus(return_id, "completed");

      return {
        return_id,
        status: "completed",
        message: "Return order processed successfully"
      };
    } catch (error) {
      throw error;
    }
  },

  // Từ chối đơn trả hàng
  rejectReturn: async (return_id, rejection_reason) => {
    try {
      const returnInfo = await CustomerReturn.getById(return_id);
      if (!returnInfo) {
        throw new Error("Return order not found");
      }

      if (returnInfo.status === "completed") {
        throw new Error("Cannot reject already processed return order");
      }

      // Cập nhật trạng thái và lý do từ chối
      await CustomerReturn.update(return_id, {
        status: "rejected",
        note: rejection_reason
      });

      return {
        return_id,
        status: "rejected",
        message: "Return order rejected"
      };
    } catch (error) {
      throw error;
    }
  },

  // Phê duyệt đơn trả hàng
  approveReturn: async (return_id) => {
    try {
      const returnInfo = await CustomerReturn.getById(return_id);
      if (!returnInfo) {
        throw new Error("Return order not found");
      }
      if (returnInfo.status !== "pending") {
        throw new Error("Can only approve pending return orders");
      }
      // Cập nhật trạng thái
      await CustomerReturn.updateStatus(return_id, "approved");

      // Cập nhật amout_paid của hóa đơn
      const invoice = await InvoiceModel.findByOrderId(returnInfo.order_id)
      console.log("🚀 ~ approveReturn: ~ invoice:", invoice)

      let returnDetails = await CustomerReturn.getReturnDetails(return_id);
      if (!Array.isArray(returnDetails)) returnDetails = [];
      const total_refund = returnDetails.reduce((sum, d) => sum + (Number(d.refund_amount) || 0), 0);

      await InvoiceModel.updateAmountPaidAndStatus(invoice.invoice_id, total_refund);

      // Sau khi approve, tự động process toàn bộ nghiệp vụ
      const processResult = await CustomerReturnService.processReturn(return_id, null); // null: hệ thống xử lý
      return {
        return_id,
        status: "completed",
        message: "Return order approved and processed successfully",
        processResult
      };
    } catch (error) {
      throw error;
    }
  },

  // Lấy đơn trả hàng với chi tiết đầy đủ
  getReturnWithDetails: async (return_id) => {
    try {
      const returnInfo = await CustomerReturn.getById(return_id);
      if (!returnInfo) {
        throw new Error("Return order not found");
      }

      const returnDetails = await CustomerReturn.getReturnDetails(return_id);

      return {
        ...returnInfo,
        details: returnDetails
      };
    } catch (error) {
      throw error;
    }
  },

  // Lấy danh sách đơn trả hàng với pagination
  getReturnsWithPagination: async (filters = {}, page = 1, limit = 10) => {
    try {
      const offset = (page - 1) * limit;
      const pagination = { limit, offset };

      const [returns, total] = await Promise.all([
        CustomerReturn.getAll(filters, pagination),
        CustomerReturn.count(filters)
      ]);

      // Bổ sung: Tính tổng tiền hoàn cho từng đơn trả hàng (chuẩn: trừ discount trên đơn theo tỷ lệ)
      for (const ret of returns) {
        let details = await CustomerReturn.getReturnDetails(ret.return_id);
        if (!Array.isArray(details)) details = [];
        // Tổng giá trị sản phẩm trả lại (đã trừ discount trên sản phẩm)
        let totalProductRefund = details.reduce((sum, d) => sum + (Number(d.refund_amount) || 0), 0);

        // Lấy order gốc để lấy order_amount và tổng quantity
        let orderInfo = null;
        let orderLevelDiscountAllocated = 0;
        if (ret.order_id) {
          // Lấy order_amount và tổng quantity
          const Order = require('../orders/order.model');
          orderInfo = await Order.readById(ret.order_id);
          if (orderInfo) {
            const order_amount = Number(orderInfo.order_amount || 0);
            const OrderDetailService = require('../orderDetails/orderDetail.service');
            const orderDetails = await OrderDetailService.getOrderDetailByOrderId(ret.order_id);
            const totalOrderQuantity = orderDetails.products.reduce((sum, p) => sum + (p.quantity || 0), 0);
            const totalReturnQuantity = details.reduce((sum, d) => sum + (d.quantity || 0), 0);
            // Phân bổ giảm giá trên đơn cho số lượng trả lại
            orderLevelDiscountAllocated = order_amount * (totalReturnQuantity / totalOrderQuantity);
          }
        }
        // Tổng hoàn trả thực tế
        ret.total_refund = totalProductRefund - orderLevelDiscountAllocated;
        if (ret.total_refund < 0) ret.total_refund = 0;
      }

      return {
        returns,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      throw error;
    }
  },

  // Lấy thống kê trả hàng
  getReturnStatistics: async (filters = {}) => {
    try {
      const statistics = await CustomerReturn.getStatistics(filters);

      // Tính tỷ lệ trả hàng
      const returnRate = statistics.total_returns > 0
        ? ((statistics.total_returns / (statistics.total_returns + 1000)) * 100).toFixed(2) // Giả sử có 1000 đơn hàng
        : 0;

      return {
        ...statistics,
        return_rate: returnRate
      };
    } catch (error) {
      throw error;
    }
  },

  // Kiểm tra khả năng trả hàng của đơn hàng
  checkOrderReturnEligibility: async (order_id) => {
    try {
      const order = await Order.readById(order_id);
      if (!order) {
        throw new Error("Order not found");
      }
      // Kiểm tra trạng thái đơn hàng
      if (order.order_status !== "Hoàn tất") {
        return {
          eligible: false,
          reason: "Can only return from completed orders"
        };
      }
      // Kiểm tra thời gian trả hàng (ví dụ: trong vòng 30 ngày)
      const orderDate = new Date(order.order_date);
      const currentDate = new Date();
      const daysDiff = (currentDate - orderDate) / (1000 * 60 * 60 * 24);
      if (daysDiff > 30) {
        return {
          eligible: false,
          reason: "Return period expired (30 days)"
        };
      }
      // Lấy chi tiết đơn hàng
      const orderDetails = await OrderDetailService.getOrderDetailByOrderId(order_id);
      if (!orderDetails || !orderDetails.products || orderDetails.products.length === 0) {
        return {
          eligible: false,
          reason: "Order has no items to return"
        };
      }
      // Lấy tất cả các đơn trả hàng đã tạo cho order này
      const existingReturns = await CustomerReturn.getByOrder(order_id);
      // Tính tổng quantity đã trả cho từng product_id
      const returnedQuantities = {};
      for (const ret of existingReturns) {
        const details = await CustomerReturn.getReturnDetails(ret.return_id);
        for (const detail of details) {
          returnedQuantities[detail.product_id] = (returnedQuantities[detail.product_id] || 0) + detail.quantity;
        }
      }
      // Bổ sung: trả về thông tin từng sản phẩm về số lượng đã trả, còn lại, số lần tối đa có thể trả
      const productsWithReturnInfo = orderDetails.products.map(product => {
        const returned_quantity = returnedQuantities[product.product_id] || 0;
        const can_return_quantity = product.quantity - returned_quantity;
        const { price, ...rest } = product;
        return {
          ...rest,
          product_retail_price: price,
          returned_quantity,
          can_return_quantity,
          max_return_times: can_return_quantity
        };
      });
      // Kiểm tra còn item nào có thể trả không
      const canReturnAny = productsWithReturnInfo.some(product => product.can_return_quantity > 0);
      if (!canReturnAny) {
        return {
          eligible: false,
          reason: "All items in this order have already been returned",
          products: productsWithReturnInfo
        };
      }
      return {
        eligible: true,
        order: order,
        products: productsWithReturnInfo
      };
    } catch (error) {
      throw error;
    }
  },

  // Tính toán số tiền hoàn trả
  calculateRefundAmount: async (return_id) => {
    try {
      const returnDetails = await CustomerReturn.getReturnDetails(return_id);

      let totalRefund = 0;
      for (const detail of returnDetails) {
        totalRefund += detail.refund_amount || 0;
      }

      return totalRefund;
    } catch (error) {
      throw error;
    }
  },

  // Cập nhật số tiền hoàn trả cho item
  updateRefundAmount: async (return_item_id, refund_amount) => {
    try {
      const query = `
        UPDATE return_order_items 
        SET refund_amount = ?
        WHERE return_item_id = ?
      `;

      return new Promise((resolve, reject) => {
        db.query(query, [refund_amount, return_item_id], (error, results) => {
          if (error) {
            return reject(error);
          }
          resolve({ return_item_id, refund_amount });
        });
      });
    } catch (error) {
      throw error;
    }
  },

  // Lấy báo cáo trả hàng theo thời gian
  getReturnReport: async (dateFrom, dateTo) => {
    try {
      const filters = {
        created_at_from: dateFrom,
        created_at_to: dateTo
      };

      const returns = await CustomerReturn.getAll(filters);
      const statistics = await CustomerReturn.getStatistics(filters);

      // Nhóm theo trạng thái
      const statusGroups = {};
      returns.forEach(ret => {
        const status = ret.status || "unknown";
        if (!statusGroups[status]) {
          statusGroups[status] = {
            count: 0,
            total_refund: 0
          };
        }
        statusGroups[status].count++;

        // Tính tổng refund từ details
        if (ret.details) {
          const totalRefund = ret.details.reduce((sum, detail) => {
            return sum + (detail.refund_amount || 0);
          }, 0);
          statusGroups[status].total_refund += totalRefund;
        }
      });

      return {
        returns,
        statistics,
        statusGroups,
        period: {
          from: dateFrom,
          to: dateTo
        }
      };
    } catch (error) {
      throw error;
    }
  }
};

module.exports = CustomerReturnService; 