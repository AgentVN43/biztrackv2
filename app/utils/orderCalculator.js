export function calculateOrderTotals(orderDetails, orderData = {}) {
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
    const totalDiscountAmount = orderDiscountAmount + calculatedDiscountProductAmount;
    const shippingFee = parseFloat(orderData.shipping_fee) || 0;

    const finalAmount =
        calculatedTotalAmount - totalDiscountAmount + shippingFee;

    return {
        total_amount: calculatedTotalAmount,
        discount_amount: totalDiscountAmount,
        final_amount: finalAmount,
        shipping_fee: shippingFee,
        order_amount: orderDiscountAmount
    };
}