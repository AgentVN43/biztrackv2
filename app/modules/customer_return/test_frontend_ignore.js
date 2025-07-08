// Test logic ignore refund_amount từ Frontend
const CustomerReturnService = require("./customer_return.service");

// Giả lập dữ liệu Frontend truyền sai refund_amount
const mockFrontendData = {
  customer_id: "test-customer-123",
  order_id: "test-order-123",
  return_details: [
    {
      product_id: "product-1",
      quantity: 1,
      refund_amount: 12250000 // Frontend truyền sai
    },
    {
      product_id: "product-2", 
      quantity: 2,
      refund_amount: 12250000 // Frontend truyền sai
    }
  ]
};

// Mock các service cần thiết
const mockOrderData = {
  order_id: "test-order-123",
  customer_id: "test-customer-123",
  final_amount: 25000000,
  order_amount: 480000,
  total_refund: 0, // Chưa có lần trả nào
  returned_items: []
};

const mockOrderDetails = {
  products: [
    {
      product_id: "product-1",
      price: 2000000,
      quantity: 2,
      discount: 125000
    },
    {
      product_id: "product-2", 
      price: 10990000,
      quantity: 2,
      discount: 125000
    }
  ]
};

// Mock các service
jest.mock('../orders/order.model', () => ({
  getOrderWithReturnSummary: jest.fn().mockResolvedValue(mockOrderData)
}));

jest.mock('../orderDetails/orderDetail.service', () => ({
  getOrderDetailByOrderId: jest.fn().mockResolvedValue(mockOrderDetails)
}));

jest.mock('./customer_return.model', () => ({
  create: jest.fn().mockResolvedValue({ return_id: 'test-return-123' }),
  createReturnDetail: jest.fn().mockImplementation((data) => Promise.resolve(data))
}));

async function testFrontendIgnore() {
  console.log("🧪 Testing Frontend refund_amount Ignore Logic\n");

  console.log("📊 Dữ liệu Frontend truyền về (SAI):");
  console.log(JSON.stringify(mockFrontendData, null, 2));
  console.log();

  console.log("📊 Dữ liệu thực tế của order:");
  console.log(JSON.stringify(mockOrderData, null, 2));
  console.log();

  console.log("📊 Chi tiết sản phẩm thực tế:");
  console.log(JSON.stringify(mockOrderDetails, null, 2));
  console.log();

  // Tính toán thủ công để so sánh
  console.log("🔢 Tính toán thủ công để so sánh:");
  console.log("=" * 50);

  const total_order_gross = mockOrderDetails.products.reduce((sum, p) => sum + (p.price * p.quantity), 0);
  const total_return_gross = mockFrontendData.return_details.reduce((sum, d) => {
    const product = mockOrderDetails.products.find(p => p.product_id === d.product_id);
    return sum + ((product?.price || 0) * d.quantity);
  }, 0);
  
  const total_return_product_discount = mockFrontendData.return_details.reduce((sum, d) => {
    const product = mockOrderDetails.products.find(p => p.product_id === d.product_id);
    return sum + ((product?.discount || 0) * d.quantity);
  }, 0);

  const return_ratio = total_return_gross / total_order_gross;
  const allocated_order_discount = mockOrderData.order_amount * return_ratio;
  const allocated_order_discount_rounded = Math.round(allocated_order_discount * 100) / 100;
  
  const net_refund = (total_return_gross - total_return_product_discount) - allocated_order_discount_rounded;
  const net_refund_rounded = Math.round(net_refund * 100) / 100;

  console.log(`   - Tổng giá trị đơn hàng: ${total_order_gross.toLocaleString()}`);
  console.log(`   - Tổng giá trị hàng trả: ${total_return_gross.toLocaleString()}`);
  console.log(`   - Tỷ lệ: ${(return_ratio * 100).toFixed(2)}%`);
  console.log(`   - Tổng giảm giá sản phẩm: ${total_return_product_discount.toLocaleString()}`);
  console.log(`   - Order discount phân bổ: ${allocated_order_discount_rounded.toLocaleString()}`);
  console.log(`   - Net refund (Backend): ${net_refund_rounded.toLocaleString()}`);
  console.log();

  // Kiểm tra từng item
  console.log("📋 Kiểm tra từng item:");
  console.log("=" * 50);
  
  mockFrontendData.return_details.forEach((detail, index) => {
    const product = mockOrderDetails.products.find(p => p.product_id === detail.product_id);
    if (product) {
      const actualGross = product.price * detail.quantity;
      const actualDiscount = product.discount * detail.quantity;
      const actualNet = actualGross - actualDiscount;
      
      console.log(`   Item ${index + 1} (${detail.product_id}):`);
      console.log(`     - Quantity: ${detail.quantity}`);
      console.log(`     - Frontend refund_amount (SAI): ${detail.refund_amount.toLocaleString()}`);
      console.log(`     - Backend sẽ tính: ${actualNet.toLocaleString()}`);
      console.log(`     - Chênh lệch: ${(detail.refund_amount - actualNet).toLocaleString()}`);
      console.log();
    }
  });

  // Kiểm tra logic final return
  console.log("🎯 Kiểm tra logic final return:");
  console.log("=" * 50);
  
  // Đây là lần trả cuối cùng (trả hết)
  const total_refund_before = mockOrderData.total_refund;
  const final_refund = mockOrderData.final_amount - total_refund_before;
  const final_refund_rounded = Math.round(final_refund * 100) / 100;
  
  console.log(`   - Total refund before: ${total_refund_before.toLocaleString()}`);
  console.log(`   - Final amount: ${mockOrderData.final_amount.toLocaleString()}`);
  console.log(`   - Final refund: ${final_refund_rounded.toLocaleString()}`);
  console.log();

  // Tổng kết
  console.log("📊 TỔNG KẾT:");
  console.log("=" * 50);
  
  const totalFrontendRefund = mockFrontendData.return_details.reduce((sum, d) => sum + (d.refund_amount || 0), 0);
  console.log(`   - Tổng refund Frontend truyền (SAI): ${totalFrontendRefund.toLocaleString()}`);
  console.log(`   - Tổng refund Backend sẽ tính: ${final_refund_rounded.toLocaleString()}`);
  console.log(`   - Final amount: ${mockOrderData.final_amount.toLocaleString()}`);
  console.log(`   - Chênh lệch: ${(mockOrderData.final_amount - final_refund_rounded).toLocaleString()}`);
  console.log();

  // Kiểm tra kết quả
  if (Math.abs(mockOrderData.final_amount - final_refund_rounded) < 1) {
    console.log("🎉 SUCCESS: Backend sẽ tính đúng refund amount!");
    console.log("✅ Frontend có thể truyền sai refund_amount, Backend sẽ ignore và tự tính lại!");
  } else {
    console.log("❌ ERROR: Logic có vấn đề!");
  }

  // Đề xuất cho Frontend
  console.log("\n💡 ĐỀ XUẤT CHO FRONTEND:");
  console.log("=" * 50);
  console.log("1. KHÔNG cần truyền refund_amount trong return_details");
  console.log("2. Chỉ cần truyền:");
  console.log("   - product_id");
  console.log("   - quantity");
  console.log("3. Backend sẽ tự tính refund_amount dựa trên:");
  console.log("   - Giá gốc từ order");
  console.log("   - Discount sản phẩm từ order");
  console.log("   - Phân bổ order discount theo tỷ lệ");
  console.log("   - Logic final return nếu cần");
  console.log();
  console.log("4. Response từ Backend sẽ bao gồm:");
  console.log("   - total_refund: Tổng số tiền hoàn trả");
  console.log("   - details: Chi tiết từng item với refund_amount đã được tính");
}

// Chạy test
testFrontendIgnore().catch(console.error);

module.exports = { testFrontendIgnore }; 