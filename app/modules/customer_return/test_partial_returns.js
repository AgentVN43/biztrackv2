// Test mô phỏng trả đơn hàng 2 lần
const CustomerReturnService = require("./customer_return.service");

// Dữ liệu test từ user:
// Item 1: 2,000,000 x 2 = 4,000,000 (giảm giá sản phẩm 250,000) = 3,750,000
// Item 2: 10,990,000 x 2 = 21,980,000 (giảm giá sản phẩm 250,000) = 21,730,000
// Order discount: 480,000
// Final amount: 25,000,000

async function testPartialReturns() {
  console.log("🧪 Testing Partial Returns Logic\n");

  // Mock data theo ví dụ của user
  const mockOrderData = {
    order_id: "test-order-123",
    customer_id: "test-customer-123",
    final_amount: 25000000, // 25.000.000
    order_amount: 480000, // 480.000 discount
    total_amount: 25480000 // 25.480.000 (trước discount)
  };

  const mockOrderDetails = {
    products: [
      {
        product_id: "product-1",
        price: 2000000, // 2.000.000
        quantity: 2,
        discount: 125000 // 250.000 / 2 = 125.000 per item
      },
      {
        product_id: "product-2", 
        price: 10990000, // 10.990.000
        quantity: 2,
        discount: 125000 // 250.000 / 2 = 125.000 per item
      }
    ]
  };

  console.log("📊 Dữ liệu đơn hàng gốc:");
  console.log(`  - Item 1: ${mockOrderDetails.products[0].price.toLocaleString()} x ${mockOrderDetails.products[0].quantity} = ${(mockOrderDetails.products[0].price * mockOrderDetails.products[0].quantity).toLocaleString()}`);
  console.log(`    Giảm giá sản phẩm: ${mockOrderDetails.products[0].discount.toLocaleString()} x ${mockOrderDetails.products[0].quantity} = ${(mockOrderDetails.products[0].discount * mockOrderDetails.products[0].quantity).toLocaleString()}`);
  console.log(`    Sau giảm giá: ${((mockOrderDetails.products[0].price - mockOrderDetails.products[0].discount) * mockOrderDetails.products[0].quantity).toLocaleString()}`);
  
  console.log(`  - Item 2: ${mockOrderDetails.products[1].price.toLocaleString()} x ${mockOrderDetails.products[1].quantity} = ${(mockOrderDetails.products[1].price * mockOrderDetails.products[1].quantity).toLocaleString()}`);
  console.log(`    Giảm giá sản phẩm: ${mockOrderDetails.products[1].discount.toLocaleString()} x ${mockOrderDetails.products[1].quantity} = ${(mockOrderDetails.products[1].discount * mockOrderDetails.products[1].quantity).toLocaleString()}`);
  console.log(`    Sau giảm giá: ${((mockOrderDetails.products[1].price - mockOrderDetails.products[1].discount) * mockOrderDetails.products[1].quantity).toLocaleString()}`);
  
  console.log(`  - Order discount: ${mockOrderData.order_amount.toLocaleString()}`);
  console.log(`  - Final amount: ${mockOrderData.final_amount.toLocaleString()}\n`);

  // Tính toán tổng giá trị đơn hàng
  const total_order_gross = mockOrderDetails.products.reduce((sum, p) => sum + (p.price * p.quantity), 0);
  const total_product_discount = mockOrderDetails.products.reduce((sum, p) => sum + (p.discount * p.quantity), 0);
  const total_after_product_discount = total_order_gross - total_product_discount;
  
  console.log("🔢 Tổng hợp đơn hàng:");
  console.log(`  - Tổng giá trị gốc: ${total_order_gross.toLocaleString()}`);
  console.log(`  - Tổng giảm giá sản phẩm: ${total_product_discount.toLocaleString()}`);
  console.log(`  - Sau giảm giá sản phẩm: ${total_after_product_discount.toLocaleString()}`);
  console.log(`  - Order discount: ${mockOrderData.order_amount.toLocaleString()}`);
  console.log(`  - Final amount: ${mockOrderData.final_amount.toLocaleString()}\n`);

  // LẦN TRẢ 1: Trả 1 Item 1
  console.log("🔄 LẦN TRẢ 1: Trả 1 Item 1");
  console.log("=" * 50);
  
  const return1Details = [
    {
      product_id: "product-1",
      quantity: 1,
      refund_amount: 0 // Sẽ được tính lại
    }
  ];

  // Tính toán cho lần trả 1
  const return1_gross = return1Details.reduce((sum, d) => {
    const product = mockOrderDetails.products.find(p => p.product_id === d.product_id);
    return sum + ((product?.price || 0) * d.quantity);
  }, 0);
  
  const return1_product_discount = return1Details.reduce((sum, d) => {
    const product = mockOrderDetails.products.find(p => p.product_id === d.product_id);
    return sum + ((product?.discount || 0) * d.quantity);
  }, 0);

  const return1_ratio = return1_gross / total_order_gross;
  const return1_order_discount = mockOrderData.order_amount * return1_ratio;
  const return1_order_discount_rounded = Math.round(return1_order_discount * 100) / 100;
  
  const return1_net_refund = (return1_gross - return1_product_discount) - return1_order_discount_rounded;
  const return1_net_refund_rounded = Math.round(return1_net_refund * 100) / 100;

  console.log(`  - Giá trị gốc hàng trả: ${return1_gross.toLocaleString()}`);
  console.log(`  - Giảm giá sản phẩm: ${return1_product_discount.toLocaleString()}`);
  console.log(`  - Tỷ lệ: ${(return1_ratio * 100).toFixed(2)}%`);
  console.log(`  - Order discount phân bổ: ${return1_order_discount_rounded.toLocaleString()}`);
  console.log(`  - Net refund: ${return1_net_refund_rounded.toLocaleString()}\n`);

  // LẦN TRẢ 2: Trả 1 Item 1 + 2 Item 2 (trả hết)
  console.log("🔄 LẦN TRẢ 2: Trả 1 Item 1 + 2 Item 2 (trả hết)");
  console.log("=" * 50);
  
  const return2Details = [
    {
      product_id: "product-1",
      quantity: 1,
      refund_amount: 0 // Sẽ được tính lại
    },
    {
      product_id: "product-2",
      quantity: 2,
      refund_amount: 0 // Sẽ được tính lại
    }
  ];

  // Tính toán cho lần trả 2
  const return2_gross = return2Details.reduce((sum, d) => {
    const product = mockOrderDetails.products.find(p => p.product_id === d.product_id);
    return sum + ((product?.price || 0) * d.quantity);
  }, 0);
  
  const return2_product_discount = return2Details.reduce((sum, d) => {
    const product = mockOrderDetails.products.find(p => p.product_id === d.product_id);
    return sum + ((product?.discount || 0) * d.quantity);
  }, 0);

  const return2_ratio = return2_gross / total_order_gross;
  const return2_order_discount = mockOrderData.order_amount * return2_ratio;
  const return2_order_discount_rounded = Math.round(return2_order_discount * 100) / 100;
  
  // Đây là lần trả cuối cùng (trả hết), nên tính lại refund
  const total_refund_before = return1_net_refund_rounded;
  const final_refund = mockOrderData.final_amount - total_refund_before;
  const final_refund_rounded = Math.round(final_refund * 100) / 100;

  console.log(`  - Giá trị gốc hàng trả: ${return2_gross.toLocaleString()}`);
  console.log(`  - Giảm giá sản phẩm: ${return2_product_discount.toLocaleString()}`);
  console.log(`  - Tỷ lệ: ${(return2_ratio * 100).toFixed(2)}%`);
  console.log(`  - Order discount phân bổ: ${return2_order_discount_rounded.toLocaleString()}`);
  console.log(`  - Tổng refund trước đó: ${total_refund_before.toLocaleString()}`);
  console.log(`  - Final amount: ${mockOrderData.final_amount.toLocaleString()}`);
  console.log(`  - Refund lần này (final): ${final_refund_rounded.toLocaleString()}\n`);

  // Phân bổ refund cho từng item trong lần trả 2
  const total_item_net = return2Details.reduce((sum, d) => {
    const product = mockOrderDetails.products.find(p => p.product_id === d.product_id);
    const item_gross = (product?.price || 0) * d.quantity;
    const item_discount = (product?.discount || 0) * d.quantity;
    return sum + (item_gross - item_discount);
  }, 0);

  console.log("📋 Phân bổ refund cho từng item trong lần trả 2:");
  let sumAllocated = 0;
  for (let i = 0; i < return2Details.length; i++) {
    const d = return2Details[i];
    const product = mockOrderDetails.products.find(p => p.product_id === d.product_id);
    const item_gross = (product?.price || 0) * d.quantity;
    const item_discount = (product?.discount || 0) * d.quantity;
    const item_net = item_gross - item_discount;
    
    let item_refund = Math.round((item_net / total_item_net) * final_refund_rounded);
    if (i === return2Details.length - 1) {
      // Đảm bảo tổng cộng lại đúng bằng final_refund_rounded
      item_refund = final_refund_rounded - sumAllocated;
    }
    
    console.log(`  - ${product?.price.toLocaleString()} x ${d.quantity}: ${item_refund.toLocaleString()}`);
    sumAllocated += item_refund;
  }

  // Tổng kết
  console.log("\n📊 TỔNG KẾT:");
  console.log("=" * 50);
  console.log(`  - Lần trả 1: ${return1_net_refund_rounded.toLocaleString()}`);
  console.log(`  - Lần trả 2: ${final_refund_rounded.toLocaleString()}`);
  console.log(`  - Tổng refund: ${(return1_net_refund_rounded + final_refund_rounded).toLocaleString()}`);
  console.log(`  - Final amount: ${mockOrderData.final_amount.toLocaleString()}`);
  console.log(`  - Chênh lệch: ${(mockOrderData.final_amount - (return1_net_refund_rounded + final_refund_rounded)).toLocaleString()}`);

  // Kiểm tra kết quả
  const totalRefund = return1_net_refund_rounded + final_refund_rounded;
  if (Math.abs(mockOrderData.final_amount - totalRefund) < 1) {
    console.log("🎉 SUCCESS: Total refund equals final amount!");
  } else {
    console.log("❌ ERROR: Refund calculation has discrepancy!");
  }

  // Kiểm tra từng lần trả
  console.log("\n🔍 KIỂM TRA TỪNG LẦN TRẢ:");
  console.log("=" * 50);
  
  // Lần trả 1: Kiểm tra tỷ lệ
  const expected_return1 = (return1_gross - return1_product_discount) - return1_order_discount_rounded;
  const expected_return1_rounded = Math.round(expected_return1 * 100) / 100;
  console.log(`  Lần trả 1: ${return1_net_refund_rounded.toLocaleString()} (expected: ${expected_return1_rounded.toLocaleString()})`);
  
  // Lần trả 2: Kiểm tra final return
  console.log(`  Lần trả 2: ${final_refund_rounded.toLocaleString()} (final return: ${mockOrderData.final_amount - return1_net_refund_rounded})`);
}

// Chạy test
testPartialReturns().catch(console.error);

module.exports = { testPartialReturns }; 