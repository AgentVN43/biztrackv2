const CustomerReturnService = require('./app/modules/customer_return/customer_return.service');

async function testRefundRoundingLogic() {
  try {
    console.log('=== Test Refund Rounding Logic ===');
    
    // Test data mô phỏng
    const mockReturnData = {
      customer_id: 1,
      order_id: 1,
      return_reason: "Test refund rounding",
      note: "Testing new rounding logic",
      return_details: [
        {
          product_id: 1,
          quantity: 2,
          refund_amount: 0 // Sẽ được tính lại
        },
        {
          product_id: 2,
          quantity: 1,
          refund_amount: 0 // Sẽ được tính lại
        }
      ]
    };

    console.log('\n1. Testing createReturn with new rounding logic...');
    console.log('Mock return data:', JSON.stringify(mockReturnData, null, 2));
    
    // Gọi service để test
    const result = await CustomerReturnService.createReturn(mockReturnData);
    
    console.log('\n=== Kết quả ===');
    console.log('Return ID:', result.return_id);
    console.log('Total Refund:', result.total_refund);
    console.log('\nRefund Details:');
    
    result.details.forEach((detail, index) => {
      console.log(`  - Item ${index + 1}:`);
      console.log(`    Product ID: ${detail.product_id}`);
      console.log(`    Quantity: ${detail.quantity}`);
      console.log(`    Refund Amount: ${detail.refund_amount.toLocaleString()}`);
    });
    
    // Kiểm tra tổng refund có đúng không
    const calculatedTotal = result.details.reduce((sum, d) => sum + (d.refund_amount || 0), 0);
    console.log('\n=== Validation ===');
    console.log('Service Total Refund:', result.total_refund);
    console.log('Calculated Total from Details:', calculatedTotal);
    console.log('Match:', Math.abs(result.total_refund - calculatedTotal) < 0.01);
    
  } catch (error) {
    console.error('Lỗi:', error);
  }
}

// Chạy test
testRefundRoundingLogic(); 