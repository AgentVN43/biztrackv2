// Debug dữ liệu Frontend truyền về
const CustomerReturnService = require("./customer_return.service");

// Giả lập dữ liệu Frontend có thể truyền về
const mockFrontendData = {
  customer_id: "test-customer-123",
  order_id: "test-order-123",
  return_details: [
    {
      product_id: "product-1",
      quantity: 1,
      refund_amount: 12250000 // Frontend có thể truyền sai giá trị này
    },
    {
      product_id: "product-2", 
      quantity: 2,
      refund_amount: 12250000 // Frontend có thể truyền sai giá trị này
    }
  ]
};

// Dữ liệu thực tế của order
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

async function debugFrontendData() {
  console.log("🔍 Debug Frontend Data\n");

  console.log("📊 Dữ liệu Frontend truyền về:");
  console.log(JSON.stringify(mockFrontendData, null, 2));
  console.log();

  console.log("📊 Dữ liệu thực tế của order:");
  console.log(JSON.stringify(mockOrderData, null, 2));
  console.log();

  console.log("📊 Chi tiết sản phẩm thực tế:");
  console.log(JSON.stringify(mockOrderDetails, null, 2));
  console.log();

  // Kiểm tra vấn đề có thể xảy ra
  console.log("🚨 CÁC VẤN ĐỀ CÓ THỂ XẢY RA:");
  console.log("=" * 50);

  // 1. Frontend truyền refund_amount sai
  console.log("1. Frontend truyền refund_amount sai:");
  const totalFrontendRefund = mockFrontendData.return_details.reduce((sum, d) => sum + (d.refund_amount || 0), 0);
  console.log(`   - Tổng refund Frontend truyền: ${totalFrontendRefund.toLocaleString()}`);
  console.log(`   - Final amount thực tế: ${mockOrderData.final_amount.toLocaleString()}`);
  console.log(`   - Chênh lệch: ${(mockOrderData.final_amount - totalFrontendRefund).toLocaleString()}`);
  console.log();

  // 2. Kiểm tra từng item
  console.log("2. Kiểm tra từng item:");
  mockFrontendData.return_details.forEach((detail, index) => {
    const product = mockOrderDetails.products.find(p => p.product_id === detail.product_id);
    if (product) {
      const actualGross = product.price * detail.quantity;
      const actualDiscount = product.discount * detail.quantity;
      const actualNet = actualGross - actualDiscount;
      
      console.log(`   Item ${index + 1} (${detail.product_id}):`);
      console.log(`     - Quantity: ${detail.quantity}`);
      console.log(`     - Frontend refund_amount: ${detail.refund_amount.toLocaleString()}`);
      console.log(`     - Thực tế gross: ${actualGross.toLocaleString()}`);
      console.log(`     - Thực tế discount: ${actualDiscount.toLocaleString()}`);
      console.log(`     - Thực tế net: ${actualNet.toLocaleString()}`);
      console.log(`     - Chênh lệch: ${(detail.refund_amount - actualNet).toLocaleString()}`);
      console.log();
    }
  });

  // 3. Tính toán theo logic Backend
  console.log("3. Tính toán theo logic Backend:");
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
  console.log(`   - Tổng refund Frontend: ${totalFrontendRefund.toLocaleString()}`);
  console.log(`   - Chênh lệch: ${(net_refund_rounded - totalFrontendRefund).toLocaleString()}`);
  console.log();

  // 4. Kiểm tra logic final return
  console.log("4. Kiểm tra logic final return:");
  console.log("=" * 50);
  
  // Giả sử đây là lần trả cuối cùng
  const total_refund_before = 0; // Giả sử chưa có lần trả nào trước đó
  const final_refund = mockOrderData.final_amount - total_refund_before;
  const final_refund_rounded = Math.round(final_refund * 100) / 100;
  
  console.log(`   - Total refund before: ${total_refund_before.toLocaleString()}`);
  console.log(`   - Final amount: ${mockOrderData.final_amount.toLocaleString()}`);
  console.log(`   - Final refund: ${final_refund_rounded.toLocaleString()}`);
  console.log(`   - Frontend total: ${totalFrontendRefund.toLocaleString()}`);
  console.log(`   - Chênh lệch: ${(final_refund_rounded - totalFrontendRefund).toLocaleString()}`);
  console.log();

  // 5. Đề xuất sửa lỗi
  console.log("5. ĐỀ XUẤT SỬA LỖI:");
  console.log("=" * 50);
  
  if (Math.abs(final_refund_rounded - totalFrontendRefund) > 1) {
    console.log("❌ VẤN ĐỀ: Frontend truyền sai refund_amount!");
    console.log("✅ GIẢI PHÁP:");
    console.log("   1. Backend sẽ IGNORE refund_amount từ Frontend");
    console.log("   2. Backend sẽ tự tính lại refund_amount dựa trên:");
    console.log("      - Giá gốc từ order");
    console.log("      - Discount sản phẩm từ order");
    console.log("      - Phân bổ order discount theo tỷ lệ");
    console.log("      - Logic final return nếu cần");
    console.log();
    console.log("   3. Frontend chỉ cần truyền:");
    console.log("      - product_id");
    console.log("      - quantity");
    console.log("      - KHÔNG cần truyền refund_amount");
  } else {
    console.log("✅ Dữ liệu Frontend đúng!");
  }
}

// Chạy debug
debugFrontendData().catch(console.error);

module.exports = { debugFrontendData }; 