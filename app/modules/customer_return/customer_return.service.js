const CustomerReturn = require("./customer_return.model");
const InvoiceModel = require("../invoice/invoice.model");
const Order = require("../orders/order.model");
const CustomerModel = require("../customers/customer.model");
const Inventory = require("../inventories/inventory.model");
const Transaction = require("../transactions/transaction.model");
const ProductEventModel = require("../product_report/product_event.model");

const CustomerReportService = require("../customer_report/customer_report.service");
const db = require("../../config/db.config");
const OrderDetailService = require("../orderDetails/orderDetail.service");
const { calculateRefund } = require("../../utils/refundUtils");
const { generateTransactionCode } = require("../../utils/transactionUtils");
const TransactionService = require("../transactions/transaction.service");

// Hàm tạo transaction code

const CustomerReturnService = {
  // Tạo đơn trả hàng hoàn chỉnh với chi tiết
  createReturnWithDetails: async (returnData, returnDetails) => {
    try {
      // Nếu có order_id, lấy thông tin sản phẩm và giá từ order gốc
      let productPriceMap = {};
      let productDiscountMap = {};
      let orderInfo = null;
      let orderDetails = null;
      if (returnData.order_id) {
        orderDetails = await OrderDetailService.getOrderDetailByOrderId(
          returnData.order_id
        );
        if (orderDetails && Array.isArray(orderDetails.products)) {
          for (const p of orderDetails.products) {
            productPriceMap[p.product_id] = p.price;
            productDiscountMap[p.product_id] = p.discount || 0;
          }
        }
        // Lấy thông tin order để kiểm tra amount_paid
        const OrderModel = require("../orders/order.service");
        orderInfo = await OrderModel.getOrderWithReturnSummary(
          returnData.order_id
        );
      }

      // Tạo chi tiết trả hàng, tự động tính refund_amount dựa trên order gốc, KHÔNG lấy từ request body
      // //console.log(
      //   "⚠️ Lưu ý: refund_amount từ Frontend sẽ bị ignore, Backend sẽ tự tính lại!"
      // );

      const detailsResults = await Promise.all(
        returnDetails.map(async (detail) => {
          let price = productPriceMap[detail.product_id] || 0;
          let discount = productDiscountMap[detail.product_id] || 0;
          let quantity = detail.quantity || 0;

          // Giá trị gốc hàng trả lại
          let item_gross = price * quantity;
          // Discount sản phẩm cho hàng trả lại
          let item_discount = discount * quantity;
          // Số tiền hoàn trả tạm thời (chưa trừ order-level discount)
          let refund_amount = item_gross - item_discount;

          // Log để debug
          if (detail.refund_amount && detail.refund_amount !== refund_amount) {
            // //console.log(
            //   `🔄 Ignore refund_amount từ Frontend cho ${detail.product_id}:`
            // );
            //console.log(
            //   `  - Frontend gửi: ${detail.refund_amount.toLocaleString()}`
            // );
            //console.log(`  - Backend tính: ${refund_amount.toLocaleString()}`);
            //console.log(
            //   `  - Chênh lệch: ${(
            //     detail.refund_amount - refund_amount
            //   ).toLocaleString()}`
            // );
          }

          return {
            ...detail,
            refund_amount, // luôn tính lại, không lấy từ request body
            _item_gross: item_gross,
            _item_discount: item_discount,
            _price_from_order: price,
            _discount_from_order: discount,
          };
        })
      );

      // Sử dụng calculateRefund từ utils để tính tổng hoàn trả thực tế
      const total_refund = calculateRefund({
        order: orderInfo || returnData,
        returnDetails: detailsResults,
        productPriceMap,
        productDiscountMap,
      });

      // Tổng giá trị gốc đơn hàng (chưa trừ discount sản phẩm)
      let total_order_gross = 0;
      if (orderDetails && Array.isArray(orderDetails.products)) {
        total_order_gross = orderDetails.products.reduce(
          (sum, p) => sum + p.price * (p.quantity || 0),
          0
        );
      }
      // Tổng giá trị gốc hàng trả lại (chưa trừ discount sản phẩm)
      let total_return_gross = detailsResults.reduce(
        (sum, d) => sum + (d._item_gross || 0),
        0
      );
      // Tổng discount sản phẩm cho hàng trả lại
      let total_return_product_discount = detailsResults.reduce(
        (sum, d) => sum + (d._item_discount || 0),
        0
      );

      // Phân bổ order-level discount theo tỷ lệ giá trị và làm tròn 2 chữ số
      let order_level_discount = Number(
        orderInfo?.order_amount || orderInfo?.discount_amount || 0
      );
      let allocated_order_discount = 0;

      if (
        order_level_discount > 0 &&
        total_order_gross > 0 &&
        total_return_gross > 0
      ) {
        // Tính tỷ lệ giá trị hàng trả so với tổng đơn hàng
        const return_ratio = total_return_gross / total_order_gross;

        // Phân bổ discount theo tỷ lệ
        allocated_order_discount = order_level_discount * return_ratio;

        // Làm tròn 2 chữ số thập phân
        allocated_order_discount =
          Math.round(allocated_order_discount * 100) / 100;

        //console.log(`📊 Phân bổ discount cho return:`);
        //console.log(
        //   `  - Tổng giá trị đơn hàng: ${total_order_gross.toLocaleString()}`
        // );
        //console.log(
        //   `  - Tổng giá trị hàng trả: ${total_return_gross.toLocaleString()}`
        // );
        //console.log(`  - Tỷ lệ: ${(return_ratio * 100).toFixed(2)}%`);
        //console.log(
        //   `  - Order discount: ${order_level_discount.toLocaleString()}`
        // );
        //console.log(
        //   `  - Discount được phân bổ: ${allocated_order_discount.toLocaleString()}`
        // );
      }

      // Tổng hoàn trả thực tế cho lần này (làm tròn 2 chữ số)
      let net_refund_this_time =
        total_return_gross -
        total_return_product_discount -
        allocated_order_discount;
      net_refund_this_time = Math.round(net_refund_this_time * 100) / 100;
      if (net_refund_this_time < 0) net_refund_this_time = 0;

      // Nếu có order_id, kiểm tra tổng refund không vượt quá số tiền hợp lệ
      if (orderInfo) {
        const total_refund_before = orderInfo.total_refund || 0;
        const amount_paid = Number(orderInfo.amount_paid || 0);
        const final_amount = Number(orderInfo.final_amount || 0);
        if (amount_paid === 0) {
          // Không cần kiểm tra gì thêm
        } else if (amount_paid > 0 && amount_paid < final_amount) {
          if (total_refund_before + net_refund_this_time > final_amount) {
            throw new Error(
              `Tổng số tiền hoàn trả vượt quá giá trị đơn hàng (${final_amount.toLocaleString()}đ)!`
            );
          }
        } else {
          let max_refundable = amount_paid;
          if (amount_paid >= final_amount) {
            max_refundable = final_amount;
          }
          // Làm tròn khi so sánh để tránh lỗi số lẻ
          const totalRefundSoFar =
            // Math.round((total_refund_before + net_refund_this_time) * 100) /
            // 100;
            Math.round(total_refund_before + net_refund_this_time);
          const maxRefundableRounded = Math.round(max_refundable);
          if (totalRefundSoFar > maxRefundableRounded) {
            throw new Error(
              "Tổng số tiền hoàn trả vượt quá số tiền khách đã thanh toán!"
            );
          }
        }
      }

      // Kiểm tra nếu là lần trả cuối cùng (từng sản phẩm đều trả đủ số lượng đã mua)
      let isFinalReturn = true;
      let returnedQuantityMap = {};
      if (orderDetails && Array.isArray(orderDetails.products)) {
        // Tạo map: product_id => quantity đã mua
        const orderProductMap = {};
        for (const p of orderDetails.products) {
          orderProductMap[p.product_id] = p.quantity || 0;
        }

        // Tạo map: product_id => quantity đã trả trước đó
        returnedQuantityMap = {};
        if (orderInfo && Array.isArray(orderInfo.returned_items)) {
          for (const item of orderInfo.returned_items) {
            returnedQuantityMap[item.product_id] =
              (returnedQuantityMap[item.product_id] || 0) +
              (item.quantity || 0);
          }
        }

        // Cộng thêm số lượng trả trong lần này
        for (const d of detailsResults) {
          returnedQuantityMap[d.product_id] =
            (returnedQuantityMap[d.product_id] || 0) + (d.quantity || 0);
        }

        // Kiểm tra từng sản phẩm
        for (const product_id in orderProductMap) {
          if (
            (returnedQuantityMap[product_id] || 0) < orderProductMap[product_id]
          ) {
            isFinalReturn = false;
            break;
          }
        }
      }

      let total_refund_final = net_refund_this_time;
      if (isFinalReturn && orderInfo) {
        // Lần trả cuối cùng: hoàn nốt số còn lại để tổng = final_amount
        const total_refund_before = orderInfo.total_refund || 0;
        const final_amount = Number(orderInfo.final_amount || 0);
        total_refund_final = final_amount - total_refund_before;
        if (total_refund_final < 0) total_refund_final = 0;
        // Làm tròn xuống 2 chữ số thập phân
        total_refund_final = Math.floor(total_refund_final * 100) / 100;

        //console.log(`🎯 Lần trả cuối cùng:`);
        //console.log(
        //   `  - Tổng refund trước đó: ${total_refund_before.toLocaleString()}`
        // );
        //console.log(`  - Final amount: ${final_amount.toLocaleString()}`);
        //console.log(
        //   `  - Refund lần này: ${total_refund_final.toLocaleString()}`
        // );
        //console.log(
        //   `  - Tổng refund sau lần này: ${(
        //     total_refund_before + total_refund_final
        //   ).toLocaleString()}`
        // );

        // Phân bổ lại refund_amount cho từng item theo tỷ lệ giá trị (sau discount sản phẩm)
        // Sử dụng logic đơn giản như calculateRefund để tránh sai số làm tròn
        const total_item_net = detailsResults.reduce(
          (sum, d) => sum + (d._item_gross - d._item_discount),
          0
        );
        if (total_item_net > 0) {
          let sumAllocated = 0;
          for (let i = 0; i < detailsResults.length; i++) {
            const d = detailsResults[i];
            let item_net = d._item_gross - d._item_discount;

            let item_refund = 0;
            if (i === detailsResults.length - 1) {
              // Item cuối cùng: bù sai số làm tròn để tổng cộng đúng bằng total_refund_final
              item_refund = total_refund_final - sumAllocated;
            } else {
              // Các item khác: tính theo tỷ lệ (không làm tròn ngay)
              item_refund = (item_net / total_item_net) * total_refund_final;
            }

            // Làm tròn 2 chữ số thập phân
            item_refund = Math.round(item_refund * 100) / 100;
            if (item_refund < 0) item_refund = 0;

            detailsResults[i].refund_amount = item_refund;
            sumAllocated += item_refund;
          }

          //console.log(
          //   `📋 Phân bổ lại refund_amount cho từng item (logic chuẩn):`
          // );
          detailsResults.forEach((d, index) => {
            //console.log(
            //   `  - Item ${index + 1}: ${d.refund_amount.toLocaleString()}`
            // );
          });
        }
      } else {
        // Các lần trả trước: làm tròn 2 chữ số (logic chuẩn)
        total_refund_final = Math.floor(total_refund_final * 100) / 100;

        // Phân bổ refund cho từng item theo tỷ lệ (không phải lần cuối)
        const total_item_net = detailsResults.reduce(
          (sum, d) => sum + (d._item_gross - d._item_discount),
          0
        );
        if (total_item_net > 0) {
          let sumAllocated = 0;
          for (let i = 0; i < detailsResults.length; i++) {
            const d = detailsResults[i];
            let item_net = d._item_gross - d._item_discount;

            let item_refund = 0;
            if (i === detailsResults.length - 1) {
              // Item cuối cùng: bù sai số làm tròn
              item_refund = total_refund_final - sumAllocated;
            } else {
              // Các item khác: tính theo tỷ lệ
              item_refund = (item_net / total_item_net) * total_refund_final;
            }

            // Làm tròn 2 chữ số thập phân
            item_refund = Math.round(item_refund * 100) / 100;
            if (item_refund < 0) item_refund = 0;

            detailsResults[i].refund_amount = item_refund;
            sumAllocated += item_refund;
          }

          //console.log(
          //   `📋 Phân bổ refund_amount cho từng item (lần trả thường):`
          // );
          detailsResults.forEach((d, index) => {
            //console.log(
            //   `  - Item ${index + 1}: ${d.refund_amount.toLocaleString()}`
            // );
          });
        }
      }

      // Đảm bảo tổng hoàn trả không vượt quá final_amount
      if (orderInfo) {
        const final_amount = Number(orderInfo.final_amount || 0);
        if (total_refund_final > final_amount)
          total_refund_final = final_amount;
      }

      // Tạo đơn trả hàng
      const returnResult = await CustomerReturn.create(returnData);
      // Lưu chi tiết trả hàng, loại bỏ các trường tạm trước khi lưu và trả về
      const detailsSaved = await Promise.all(
        detailsResults.map((detail) =>
          CustomerReturn.createReturnDetail({
            ...detail,
            return_id: returnResult.return_id,
            // Xóa các trường tạm
            _item_gross: undefined,
            _item_discount: undefined,
            _price_from_order: undefined,
            _discount_from_order: undefined,
          })
        )
      );

      return {
        ...returnResult,
        details: detailsSaved.map((d) => {
          const {
            _item_gross,
            _item_discount,
            _price_from_order,
            _discount_from_order,
            ...rest
          } = d;
          return rest;
        }),
        total_refund: Number(total_refund_final),
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

          // ✅ Lấy tồn kho sau khi cập nhật để ghi nhận vào product event
          const currentInventory = await Inventory.findByProductAndWarehouse(
            detail.product_id,
            warehouse_id
          );
          const current_stock_after = currentInventory ? currentInventory.quantity : 0;

          // Ghi lại lịch sử điều chỉnh tồn kho
          await Inventory.recordAdjustment({
            product_id: detail.product_id,
            warehouse_id: warehouse_id,
            quantity_changed: detail.quantity,
            adjustment_type: "return",
            reason: `Customer return - ${returnInfo.return_id}`,
            adjusted_by: null,
          });

          await ProductEventModel.recordEvent({
            product_id: detail.product_id,
            warehouse_id: warehouse_id,
            event_type: "RETURN_FROM_CUSTOMER",
            quantity_impact: detail.quantity, // Số lượng trả về (dương)
            transaction_price: detail.refund_amount / detail.quantity, // Giá hoàn trả trên mỗi đơn vị
            partner_name:
              returnInfo.customer_name || `Customer ${returnInfo.customer_id}`,
            current_stock_after: current_stock_after, // ✅ Tồn kho thực tế sau khi trả hàng
            reference_id: return_id,
            reference_type: "RETURN_FROM_CUSTOMER",
            description: `Customer return - ${returnInfo.return_id}`,
            initiated_by: processed_by,
          });

          //console.log(`✅ Đã ghi nhận sự kiện trả hàng cho sản phẩm ${detail.product_id}, tồn kho sau: ${current_stock_after}`);
        }
      }

      // Tính lại tổng refund đúng chuẩn (giống như khi tạo đơn trả hàng)
      let productPriceMap = {};
      let productDiscountMap = {};
      let total_order_gross = 0;
      let orderInfo = null;
      let orderDetails = null;
      if (returnInfo.order_id) {
        const Order = require("../orders/order.model");
        orderInfo = await Order.readById(returnInfo.order_id);
        const OrderDetailService = require("../orderDetails/orderDetail.service");
        orderDetails = await OrderDetailService.getOrderDetailByOrderId(
          returnInfo.order_id
        );
        if (orderDetails && Array.isArray(orderDetails.products)) {
          for (const p of orderDetails.products) {
            productPriceMap[p.product_id] = p.price;
            productDiscountMap[p.product_id] = p.discount || 0;
          }
          total_order_gross = orderDetails.products.reduce(
            (sum, p) => sum + p.price * (p.quantity || 0),
            0
          );
        }
      }
      // Tổng giá trị gốc hàng trả lại (chưa trừ discount sản phẩm)
      let total_return_gross = returnDetails.reduce(
        (sum, d) =>
          sum + (productPriceMap[d.product_id] || 0) * (d.quantity || 0),
        0
      );
      // Tổng discount sản phẩm cho hàng trả lại
      let total_return_product_discount = returnDetails.reduce(
        (sum, d) =>
          sum + (productDiscountMap[d.product_id] || 0) * (d.quantity || 0),
        0
      );
      // Phân bổ order-level discount theo tỷ lệ giá trị và làm tròn 2 chữ số
      let order_level_discount = Number(
        orderInfo?.order_amount || orderInfo?.discount_amount || 0
      );
      let allocated_order_discount = 0;

      if (
        order_level_discount > 0 &&
        total_order_gross > 0 &&
        total_return_gross > 0
      ) {
        // Tính tỷ lệ giá trị hàng trả so với tổng đơn hàng
        const return_ratio = total_return_gross / total_order_gross;

        // Phân bổ discount theo tỷ lệ
        allocated_order_discount = order_level_discount * return_ratio;

        // Làm tròn 2 chữ số thập phân
        allocated_order_discount =
          Math.round(allocated_order_discount * 100) / 100;

        //console.log(`📊 ProcessReturn - Phân bổ discount:`);
        //console.log(`  - Tỷ lệ: ${(return_ratio * 100).toFixed(2)}%`);
        // //console.log(
        //   `  - Discount được phân bổ: ${allocated_order_discount.toLocaleString()}`
        // );
      }

      // Tổng hoàn trả thực tế (làm tròn 2 chữ số)
      let total_refund =
        total_return_gross -
        total_return_product_discount -
        allocated_order_discount;
      total_refund = Math.round(total_refund * 100) / 100;
      if (total_refund < 0) total_refund = 0;

      // Nếu có hoàn tiền, tạo transaction ledger đúng số tiền thực tế
      if (total_refund > 0) {
        await TransactionService.createTransaction({
          transaction_code: generateTransactionCode(),
          type: "refund",
          amount: total_refund,
          description: `Refund for return - ${returnInfo.return_id}`,
          category: "customer_refund",
          payment_method: "cash",
          customer_id: returnInfo.customer_id,
          related_type: "other",
          related_id: return_id,
          initiated_by: null,
          order_id: returnInfo.order_id,
        });
      }

      // ✅ LUÔN cập nhật debt của khách hàng sau khi process return_order
      // (dù có hoàn tiền hay không, vì có thể ảnh hưởng đến công nợ từ các đơn hàng liên quan)
      try {
        //console.log(
        //   `🔄 Đang cập nhật debt cho customer_id: ${returnInfo.customer_id}`
        // );
        const newDebt = await CustomerModel.calculateDebt(
          returnInfo.customer_id
        );
        //console.log(`📊 Debt mới được tính: ${newDebt}`);
        await CustomerModel.update(returnInfo.customer_id, { debt: newDebt });
        //console.log(
        //   `✅ Đã cập nhật debt thành công cho customer_id: ${returnInfo.customer_id}`
        // );

        // Log thêm thông tin về debt âm nếu có
        if (newDebt < 0) {
          //console.log(`💰 Khách hàng có debt âm (${newDebt}), cần hoàn tiền!`);
        }
      } catch (debtError) {
        //console.error(`❌ Lỗi khi cập nhật debt:`, debtError);
        // Không throw error để không ảnh hưởng đến việc process return_order
      }

      // ✅ Cập nhật total_expenditure và total_orders sau khi process return_order
      try {
        console.log(
          `🔄 Đang cập nhật total_expenditure và total_orders cho customer_id: ${returnInfo.customer_id}`
        );

        // Lấy thông tin cập nhật từ CustomerReportService
        const customerOverview =
          await CustomerReportService.getTotalOrdersAndExpenditure(
            returnInfo.customer_id
          );

        const newTotalOrders = customerOverview.total_orders;
        const newTotalExpenditure = parseFloat(
          customerOverview.total_expenditure || 0
        );

        //console.log(`📊 Total orders mới: ${newTotalOrders}`);
        //console.log(`📊 Total expenditure mới: ${newTotalExpenditure}`);

        // Cập nhật customer với thông tin mới
        await CustomerModel.update(returnInfo.customer_id, {
          total_expenditure: newTotalExpenditure,
          total_orders: newTotalOrders,
        });

        console.log(
          `✅ Đã cập nhật total_expenditure và total_orders thành công cho customer_id: ${returnInfo.customer_id}`
        );
      } catch (reportError) {
        console.error(
          `❌ Lỗi khi cập nhật total_expenditure và total_orders:`,
          reportError
        );
        // Không throw error để không ảnh hưởng đến việc process return_order
      }

      // ✅ Cập nhật status invoice sau khi process return (để đảm bảo tính toán chính xác)
      try {
        if (returnInfo.order_id) {
          // console.log(
          //   `🔍 ProcessReturn - Updating invoice status for order ${returnInfo.order_id}`
          // );

          // Tìm invoice liên quan và cập nhật status với refund
          const invoice = await InvoiceModel.findByOrderId(returnInfo.order_id);
          if (invoice && invoice.invoice_id) {
            await InvoiceModel.updateStatus(invoice.invoice_id, null, {
              includeRefund: true,
              order_id: returnInfo.order_id,
            });
            console.log(
              `✅ ProcessReturn - Updated invoice ${invoice.invoice_code} status with refund`
            );
          }
        }
      } catch (invoiceError) {
        //console.error(`❌ Lỗi khi cập nhật status invoice:`, invoiceError);
        // Không throw error để không ảnh hưởng đến việc process return_order
      }

      // Cập nhật trạng thái đơn trả hàng
      await CustomerReturn.updateStatus(return_id, "completed");

      return {
        return_id,
        status: "completed",
        message: "Return order processed successfully",
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
        note: rejection_reason,
      });

      // ✅ Bổ sung: Ghi nhận sự kiện từ chối đơn trả hàng
      try {
        const returnDetails = await CustomerReturn.getReturnDetails(return_id);
        if (Array.isArray(returnDetails)) {
          for (const detail of returnDetails) {
            // Lấy warehouse_id từ order
            let warehouse_id = null;
            if (returnInfo.order_id) {
              const order = await Order.readById(returnInfo.order_id);
              warehouse_id = order?.warehouse_id;
            }

            // Lấy tồn kho hiện tại
            let current_stock_after = null;
            if (warehouse_id) {
              const currentInventory = await Inventory.findByProductAndWarehouse(
                detail.product_id,
                warehouse_id
              );
              current_stock_after = currentInventory ? currentInventory.quantity : 0;
            }

            await ProductEventModel.recordEvent({
              product_id: detail.product_id,
              warehouse_id: warehouse_id,
              event_type: 'RETURN_REJECTED',
              quantity_impact: 0, // Không thay đổi số lượng khi từ chối
              transaction_price: null,
              partner_name: returnInfo.customer_name || `Customer ${returnInfo.customer_id}`,
              current_stock_after: current_stock_after,
              reference_id: return_id,
              reference_type: 'CUSTOMER_RETURN',
              description: `Return rejected - ${rejection_reason}`,
              initiated_by: null
            });
          }
          //console.log(`✅ Đã ghi nhận sự kiện từ chối đơn trả hàng ${return_id}`);
        }
      } catch (eventError) {
        //console.error('❌ Lỗi ghi nhận sự kiện từ chối đơn trả hàng:', eventError);
        // Không throw error để không ảnh hưởng đến việc reject return
      }

      return {
        return_id,
        status: "rejected",
        message: "Return order rejected",
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

      // ✅ Bổ sung: Ghi nhận sự kiện phê duyệt đơn trả hàng
      try {
        const returnDetails = await CustomerReturn.getReturnDetails(return_id);
        if (Array.isArray(returnDetails)) {
          for (const detail of returnDetails) {
            // Lấy warehouse_id từ order
            let warehouse_id = null;
            if (returnInfo.order_id) {
              const order = await Order.readById(returnInfo.order_id);
              warehouse_id = order?.warehouse_id;
            }

            // Lấy tồn kho hiện tại
            let current_stock_after = null;
            if (warehouse_id) {
              const currentInventory = await Inventory.findByProductAndWarehouse(
                detail.product_id,
                warehouse_id
              );
              current_stock_after = currentInventory ? currentInventory.quantity : 0;
            }

            // await ProductEventModel.recordEvent({
            //   product_id: detail.product_id,
            //   warehouse_id: warehouse_id,
            //   event_type: 'RETURN_APPROVED',
            //   quantity_impact: 0, // Không thay đổi số lượng khi phê duyệt
            //   transaction_price: null,
            //   partner_name: returnInfo.customer_name || `Customer ${returnInfo.customer_id}`,
            //   current_stock_after: current_stock_after,
            //   reference_id: return_id,
            //   reference_type: 'CUSTOMER_RETURN',
            //   description: `Return approved - ${return_id}`,
            //   initiated_by: null
            // });
          }
          //console.log(`✅ Đã ghi nhận sự kiện phê duyệt đơn trả hàng ${return_id}`);
        }
      } catch (eventError) {
        //console.error('❌ Lỗi ghi nhận sự kiện phê duyệt đơn trả hàng:', eventError);
        // Không throw error để không ảnh hưởng đến việc approve return
      }

      // Lý do: KHÔNG cập nhật amount_paid khi hoàn trả (refund), chỉ cập nhật status nếu cần.
      // Nếu cần cập nhật status hóa đơn, hãy dùng hàm riêng chỉ update status, ví dụ:
      // await InvoiceModel.updateStatus(invoice.invoice_id, "partial_paid"); // hoặc "paid", tùy logic

      const invoice = await InvoiceModel.findByOrderId(returnInfo.order_id);
      //console.log("🚀 ~ approveReturn: ~ invoice:", invoice);

      let returnDetails = await CustomerReturn.getReturnDetails(return_id);
      if (!Array.isArray(returnDetails)) returnDetails = [];
      const total_refund = returnDetails.reduce(
        (sum, d) => sum + (Number(d.refund_amount) || 0),
        0
      );

      // ✅ Sau khi duyệt trả hàng, cập nhật lại status hóa đơn có tính đến refund
      if (invoice && invoice.invoice_id) {
        // Sử dụng tính năng refund mới để tính toán status chính xác
        await InvoiceModel.updateStatus(invoice.invoice_id, null, {
          includeRefund: true,
          order_id: returnInfo.order_id,
        });
      }

      // ✅ Cập nhật debt ngay sau khi approve return
      try {
        // //console.log(
        //   `🔄 ApproveReturn - Đang cập nhật debt cho customer_id: ${returnInfo.customer_id}`
        // );
        const newDebt = await CustomerModel.calculateDebt(
          returnInfo.customer_id
        );
        //console.log(`📊 ApproveReturn - Debt mới được tính: ${newDebt}`);
        await CustomerModel.update(returnInfo.customer_id, { debt: newDebt });
        //console.log(`✅ ApproveReturn - Đã cập nhật debt thành công`);

        if (newDebt < 0) {
          console.log(
            `💰 ApproveReturn - Khách hàng có debt âm (${newDebt}), cần hoàn tiền!`
          );
        }
      } catch (debtError) {
        //console.error(`❌ ApproveReturn - Lỗi khi cập nhật debt:`, debtError);
        // Không throw error để không ảnh hưởng đến việc approve return
      }

      // Sau khi approve, tự động process toàn bộ nghiệp vụ
      const processResult = await CustomerReturnService.processReturn(
        return_id,
        null
      ); // null: hệ thống xử lý
      return {
        return_id,
        status: "completed",
        message: "Return order approved and processed successfully",
        processResult,
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

      // Đảm bảo refund_amount là number
      returnDetails.forEach((d) => {
        if (typeof d.refund_amount === 'string') {
          d.refund_amount = parseFloat(d.refund_amount);
        }
        d.item_return_price = (d.refund_amount || 0) / (d.quantity || 0);
      });
      return {
        ...returnInfo,
        details: returnDetails,
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
        CustomerReturn.count(filters),
      ]);

      // Tính đúng total_refund cho từng đơn trả hàng
      for (const ret of returns) {
        let details = await CustomerReturn.getReturnDetails(ret.return_id);
        if (!Array.isArray(details)) details = [];
        // Lấy order gốc để lấy giá, discount sản phẩm, order-level discount
        let orderInfo = null;
        let orderDetails = null;
        let productPriceMap = {};
        let productDiscountMap = {};
        let orderProductMap = {};
        let total_order_gross = 0;
        if (ret.order_id) {
          const Order = require("../orders/order.model");
          orderInfo = await Order.readById(ret.order_id);
          const OrderDetailService = require("../orderDetails/orderDetail.service");
          orderDetails = await OrderDetailService.getOrderDetailByOrderId(
            ret.order_id
          );
          if (orderDetails && Array.isArray(orderDetails.products)) {
            for (const p of orderDetails.products) {
              productPriceMap[p.product_id] = p.price;
              productDiscountMap[p.product_id] = p.discount || 0;
              orderProductMap[p.product_id] = p.quantity || 0;
            }
            total_order_gross = orderDetails.products.reduce(
              (sum, p) => sum + p.price * (p.quantity || 0),
              0
            );
          }
        }
        // Tính tổng quantity đã trả cho order này
        let returnedQuantityMap = {};
        for (const pid in orderProductMap) returnedQuantityMap[pid] = 0;
        // Lấy tất cả return của order này (đã approved/completed)
        let allReturns = [];
        if (ret.order_id) {
          const [returnRows] = await db
            .promise()
            .query(
              `SELECT * FROM return_orders WHERE order_id = ? AND status IN ('approved', 'completed') ORDER BY created_at ASC, return_id ASC`,
              [ret.order_id]
            );
          allReturns = returnRows || [];
        }
        // Cập nhật returnedQuantityMap cho đến từng lần trả
        let isFullyReturned = false;
        for (let i = 0; i < allReturns.length; i++) {
          const r = allReturns[i];
          const rDetails = await CustomerReturn.getReturnDetails(r.return_id);
          for (const d of rDetails) {
            returnedQuantityMap[d.product_id] =
              (returnedQuantityMap[d.product_id] || 0) + (d.quantity || 0);
          }
        }
        // Kiểm tra đã trả hết đơn hay chưa
        isFullyReturned = true;
        for (const pid in orderProductMap) {
          if ((returnedQuantityMap[pid] || 0) < orderProductMap[pid]) {
            isFullyReturned = false;
            break;
          }
        }
        // Tính refund cho chính lần trả này
        const refundThisReturn =
          require("../../utils/refundUtils").calculateRefund({
            order: orderInfo,
            returnDetails: details,
            productPriceMap,
            productDiscountMap,
          });
        // Nếu là lần trả cuối cùng (trả hết hàng) và là lần trả cuối cùng theo thứ tự
        if (
          isFullyReturned &&
          orderInfo &&
          allReturns.length > 0 &&
          allReturns[allReturns.length - 1].return_id === ret.return_id
        ) {
          // Lần trả cuối cùng: hoàn nốt số còn lại để tổng = final_amount
          // Tính tổng refund các lần trước (trừ lần này)
          let totalRefundBefore = 0;
          for (let i = 0; i < allReturns.length - 1; i++) {
            const rDetails = await CustomerReturn.getReturnDetails(
              allReturns[i].return_id
            );
            const refund = require("../../utils/refundUtils").calculateRefund({
              order: orderInfo,
              returnDetails: rDetails,
              productPriceMap,
              productDiscountMap,
            });
            totalRefundBefore += Math.round(refund * 100) / 100;
          }
          ret.total_refund =
            Number(orderInfo.final_amount || 0) - totalRefundBefore;
          ret.total_refund = Math.round(ret.total_refund * 100) / 100;
          if (ret.total_refund < 0) ret.total_refund = 0;
        } else {
          // Các lần trả trước: chỉ lấy số tiền hoàn của lần trả này
          ret.total_refund = Math.round(refundThisReturn * 100) / 100;
        }
      }

      return {
        returns,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
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
      const returnRate =
        statistics.total_returns > 0
          ? (
              (statistics.total_returns / (statistics.total_returns + 1000)) *
              100
            ).toFixed(2) // Giả sử có 1000 đơn hàng
          : 0;

      return {
        ...statistics,
        return_rate: returnRate,
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
          reason: "Can only return from completed orders",
        };
      }
      // Kiểm tra thời gian trả hàng (ví dụ: trong vòng 30 ngày)
      const orderDate = new Date(order.order_date);
      const currentDate = new Date();
      const daysDiff = (currentDate - orderDate) / (1000 * 60 * 60 * 24);
      if (daysDiff > 30) {
        return {
          eligible: false,
          reason: "Return period expired (30 days)",
        };
      }
      // Lấy chi tiết đơn hàng
      const orderDetails = await OrderDetailService.getOrderDetailByOrderId(
        order_id
      );
      if (
        !orderDetails ||
        !orderDetails.products ||
        orderDetails.products.length === 0
      ) {
        return {
          eligible: false,
          reason: "Order has no items to return",
        };
      }
      // Lấy tất cả các đơn trả hàng đã tạo cho order này
      const existingReturns = await CustomerReturn.getByOrder(order_id);
      // Tính tổng quantity đã trả cho từng product_id
      const returnedQuantities = {};
      for (const ret of existingReturns) {
        const details = await CustomerReturn.getReturnDetails(ret.return_id);
        for (const detail of details) {
          returnedQuantities[detail.product_id] =
            (returnedQuantities[detail.product_id] || 0) + detail.quantity;
        }
      }
      // Bổ sung: trả về thông tin từng sản phẩm về số lượng đã trả, còn lại, số lần tối đa có thể trả
      const productsWithReturnInfo = orderDetails.products.map((product) => {
        const returned_quantity = returnedQuantities[product.product_id] || 0;
        const can_return_quantity = product.quantity - returned_quantity;
        const { price, ...rest } = product;
        return {
          ...rest,
          product_retail_price: price,
          returned_quantity,
          can_return_quantity,
          max_return_times: can_return_quantity,
        };
      });
      // Kiểm tra còn item nào có thể trả không
      const canReturnAny = productsWithReturnInfo.some(
        (product) => product.can_return_quantity > 0
      );
      if (!canReturnAny) {
        return {
          eligible: false,
          reason: "All items in this order have already been returned",
          products: productsWithReturnInfo,
        };
      }
      return {
        eligible: true,
        order: order,
        products: productsWithReturnInfo,
      };
    } catch (error) {
      throw error;
    }
  },

  // Tính toán số tiền hoàn trả
  calculateRefundAmount: async (return_id) => {
    try {
      // Lấy chi tiết trả hàng
      const returnDetails = await CustomerReturn.getReturnDetails(return_id);
      if (!returnDetails || returnDetails.length === 0) return 0;

      // Lấy order_id từ returnDetails hoặc returnOrder
      const returnOrder = await CustomerReturn.getById(return_id);
      const order_id = returnOrder?.order_id;
      let productPriceMap = {};
      let productDiscountMap = {};
      let orderInfo = null;

      if (order_id) {
        // Lấy chi tiết order gốc
        orderInfo = await Order.readById(order_id);
        const orderDetails = await OrderDetailService.getOrderDetailByOrderId(order_id);
        if (orderDetails && Array.isArray(orderDetails.products)) {
          for (const p of orderDetails.products) {
            productPriceMap[p.product_id] = p.price;
            productDiscountMap[p.product_id] = p.discount || 0;
          }
        }
      }

      // Tính lại số tiền hoàn trả thực tế
      const totalRefund = calculateRefund({
        order: orderInfo || returnOrder,
        returnDetails,
        productPriceMap,
        productDiscountMap,
      });

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
        created_at_to: dateTo,
      };

      const returns = await CustomerReturn.getAll(filters);
      const statistics = await CustomerReturn.getStatistics(filters);

      // Nhóm theo trạng thái
      const statusGroups = {};
      returns.forEach((ret) => {
        const status = ret.status || "unknown";
        if (!statusGroups[status]) {
          statusGroups[status] = {
            count: 0,
            total_refund: 0,
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
          to: dateTo,
        },
      };
    } catch (error) {
      throw error;
    }
  },
};

module.exports = CustomerReturnService;
