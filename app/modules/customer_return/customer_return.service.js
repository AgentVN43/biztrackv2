const CustomerReturn = require("./customer_return.model");
const Order = require("../orders/order.model");
const CustomerModel = require("../customers/customer.model");
const Inventory = require("../inventories/inventory.model");
const Transaction = require("../transactions/transaction.model");
const db = require("../../config/db.config");

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
      // Tạo đơn trả hàng
      const returnResult = await CustomerReturn.create(returnData);
      
      // Tạo chi tiết trả hàng
      const detailsPromises = returnDetails.map(detail => {
        return CustomerReturn.createReturnDetail({
          ...detail,
          return_id: returnResult.return_id
        });
      });
      
      const detailsResults = await Promise.all(detailsPromises);
      
      return {
        ...returnResult,
        details: detailsResults
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
      if (totalRefundAmount > 0) {
        await Transaction.createTransaction({
          transaction_code: generateTransactionCode(),
          type: "refund",
          amount: totalRefundAmount,
          description: `Refund for return - ${returnInfo.return_id}`,
          category: "customer_refund",
          payment_method: "cash",
          customer_id: returnInfo.customer_id,
          related_type: "other",
          related_id: return_id,
          initiated_by: null
        });
        
        // Cập nhật debt của khách hàng
        const newDebt = await CustomerModel.calculateDebt(returnInfo.customer_id);
        await CustomerModel.update(returnInfo.customer_id, { debt: newDebt });
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
      
      return {
        return_id,
        status: "approved",
        message: "Return order approved"
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
      
      // Bổ sung: Tính tổng tiền hoàn cho từng đơn trả hàng
      for (const ret of returns) {
        const details = await CustomerReturn.getReturnDetails(ret.return_id);
        ret.total_refund = Number(details.reduce((sum, d) => sum + (d.refund_amount || 0), 0));
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
      
      // Kiểm tra xem đã có đơn trả hàng nào chưa
      const existingReturns = await CustomerReturn.getByOrder(order_id);
      if (existingReturns.length > 0) {
        return {
          eligible: false,
          reason: "Order already has return request"
        };
      }
      
      return {
        eligible: true,
        order: order
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