// Test logic tính toán refund với ví dụ của user
const CustomerReturnService = require("./customer_return.service");
const { calculateRefund } = require("../../utils/refundUtils");

// Ví dụ từ user:
// Item 1: 3.750.000
// Item 2: 21.730.000
// Tổng: 25.480.000
// Order discount: 480.000

async function testRefundCalculation() {
  console.log("🧪 Testing Refund Calculation Logic\n");

  // Mock data theo ví dụ của user
  const mockOrderData = {
    order_id: "test-order-123",
    customer_id: "test-customer-123",
    final_amount: 25000000, // 25.000.000 (sau khi trừ discount)
    order_amount: 480000, // 480.000 discount
    total_amount: 25480000 // 25.480.000 (trước discount)
  };

  const mockOrderDetails = {
    products: [
      {
        product_id: "product-1",
        price: 3750000, // 3.750.000
        quantity: 1,
        discount: 0
      },
      {
        product_id: "product-2", 
        price: 21730000, // 21.730.000
        quantity: 1,
        discount: 0
      }
    ]
  };

  const mockReturnDetails = [
    {
      product_id: "product-1",
      quantity: 1,
      refund_amount: 0 // Sẽ được tính lại
    },
    {
      product_id: "product-2",
      quantity: 1, 
      refund_amount: 0 // Sẽ được tính lại
    }
  ];

  console.log("📊 Dữ liệu test:");
  console.log(`  - Item 1: ${mockOrderDetails.products[0].price.toLocaleString()}`);
  console.log(`  - Item 2: ${mockOrderDetails.products[1].price.toLocaleString()}`);
  console.log(`  - Tổng: ${mockOrderData.total_amount.toLocaleString()}`);
  console.log(`  - Order discount: ${mockOrderData.order_amount.toLocaleString()}`);
  console.log(`  - Final amount: ${mockOrderData.final_amount.toLocaleString()}\n`);

  // Tính toán theo logic mới
  const total_order_gross = mockOrderDetails.products.reduce((sum, p) => sum + (p.price * p.quantity), 0);
  const total_return_gross = mockReturnDetails.reduce((sum, d) => {
    const product = mockOrderDetails.products.find(p => p.product_id === d.product_id);
    return sum + ((product?.price || 0) * d.quantity);
  }, 0);

  console.log("🔢 Tính toán tỷ lệ:");
  console.log(`  - Tổng giá trị đơn hàng: ${total_order_gross.toLocaleString()}`);
  console.log(`  - Tổng giá trị hàng trả: ${total_return_gross.toLocaleString()}`);
  
  const return_ratio = total_return_gross / total_order_gross;
  console.log(`  - Tỷ lệ: ${(return_ratio * 100).toFixed(2)}%\n`);

  // Phân bổ discount
  const order_level_discount = mockOrderData.order_amount;
  const allocated_order_discount = order_level_discount * return_ratio;
  const allocated_order_discount_rounded = Math.round(allocated_order_discount * 100) / 100;

  console.log("💰 Phân bổ discount:");
  console.log(`  - Order discount: ${order_level_discount.toLocaleString()}`);
  console.log(`  - Discount được phân bổ: ${allocated_order_discount.toLocaleString()}`);
  console.log(`  - Discount sau làm tròn: ${allocated_order_discount_rounded.toLocaleString()}\n`);

  // Thay thế logic tính refund bằng hàm calculateRefund
  const net_refund_rounded = calculateRefund({
    order: mockOrderData,
    returnDetails: mockReturnDetails,
  });

  console.log("💸 Tính refund:");
  console.log(`  - Tổng giá trị hàng trả: ${total_return_gross.toLocaleString()}`);
  console.log(`  - Product discount: ${total_return_product_discount.toLocaleString()}`);
  console.log(`  - Order discount phân bổ: ${allocated_order_discount_rounded.toLocaleString()}`);
  console.log(`  - Net refund: ${net_refund_rounded.toLocaleString()}`);
  console.log(`  - Net refund sau làm tròn: ${net_refund_rounded.toLocaleString()}\n`);

  // Phân bổ refund cho từng item theo tỷ lệ giá trị
  const total_item_net = mockReturnDetails.reduce((sum, d) => {
    const product = mockOrderDetails.products.find(p => p.product_id === d.product_id);
    const item_gross = (product?.price || 0) * d.quantity;
    const item_discount = 0; // Giả sử không có product discount
    return sum + (item_gross - item_discount);
  }, 0);

  console.log("📋 Phân bổ refund cho từng item:");
  let sumAllocated = 0;
  for (let i = 0; i < mockReturnDetails.length; i++) {
    const d = mockReturnDetails[i];
    const product = mockOrderDetails.products.find(p => p.product_id === d.product_id);
    const item_gross = (product?.price || 0) * d.quantity;
    const item_discount = 0;
    const item_net = item_gross - item_discount;
    
    let item_refund = Math.round((item_net / total_item_net) * net_refund_rounded);
    if (i === mockReturnDetails.length - 1) {
      // Đảm bảo tổng cộng lại đúng bằng net_refund_rounded
      item_refund = net_refund_rounded - sumAllocated;
    }
    
    console.log(`  - Item ${i + 1} (${product?.price.toLocaleString()}): ${item_refund.toLocaleString()}`);
    sumAllocated += item_refund;
  }

  console.log(`\n✅ Tổng refund: ${sumAllocated.toLocaleString()}`);
  console.log(`✅ Final amount: ${mockOrderData.final_amount.toLocaleString()}`);
  console.log(`✅ Chênh lệch: ${(mockOrderData.final_amount - sumAllocated).toLocaleString()}`);

  // Kiểm tra xem có đúng bằng final_amount không
  if (Math.abs(mockOrderData.final_amount - sumAllocated) < 1) {
    console.log("🎉 SUCCESS: Refund calculation is correct!");
  } else {
    console.log("❌ ERROR: Refund calculation has discrepancy!");
  }
}

// Chạy test
testRefundCalculation().catch(console.error);

module.exports = { testRefundCalculation }; 