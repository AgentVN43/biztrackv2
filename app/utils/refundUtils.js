/**
 * Tính toán số tiền refund thực tế cho một lần trả hàng.
 * @param {Object} params
 * @param {Object} params.order - Thông tin đơn hàng gốc (có order_amount, final_amount, ...).
 * @param {Array} params.returnDetails - Danh sách sản phẩm trả hàng (có product_id, price, discount, quantity...).
 * @param {Object} [params.productPriceMap] - Map product_id => price (nếu cần override).
 * @param {Object} [params.productDiscountMap] - Map product_id => discount (nếu cần override).
 * @returns {number} Số tiền refund đã làm tròn 2 số lẻ.
 */
function calculateRefund({ order, returnDetails, productPriceMap = {}, productDiscountMap = {} }) {
  if (!order || !Array.isArray(returnDetails)) return 0;

  // Lấy giá và discount từ order nếu có
  let total_return_gross = 0;
  let total_return_product_discount = 0;

  returnDetails.forEach((d) => {
    const price = productPriceMap[d.product_id] !== undefined ? productPriceMap[d.product_id] : (d.price || 0);
    const discount = productDiscountMap[d.product_id] !== undefined ? productDiscountMap[d.product_id] : (d.discount || 0);
    const quantity = d.quantity || 0;
    total_return_gross += price * quantity;
    total_return_product_discount += discount * quantity;
  });

  // Phân bổ order-level discount theo tỷ lệ giá trị
  let order_level_discount = Number(order.order_amount || order.discount_amount || 0);
  let total_order_gross = Number(order.total_amount || 0);
  let allocated_order_discount = 0;
  if (order_level_discount > 0 && total_order_gross > 0 && total_return_gross > 0) {
    const return_ratio = total_return_gross / total_order_gross;
    allocated_order_discount = order_level_discount * return_ratio;
    allocated_order_discount = Math.round(allocated_order_discount * 100) / 100;
  }

  // Tổng hoàn trả thực tế (làm tròn 2 chữ số)
  let total_refund = total_return_gross - total_return_product_discount - allocated_order_discount;
  total_refund = Math.round(total_refund * 100) / 100;
  if (total_refund < 0) total_refund = 0;
  return total_refund;
}

module.exports = { calculateRefund }; 