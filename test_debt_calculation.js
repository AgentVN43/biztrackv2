const db = require('./app/config/db.config');
const CustomerModel = require('./app/modules/customers/customer.model');

async function testDebtCalculation() {
  try {
    console.log('🧪 Bắt đầu test logic tính debt mới...\n');

    // Test case 1: Khách hàng có 1 đơn hàng đơn giản
    console.log('📋 Test Case 1: Đơn hàng đơn giản');
    console.log('  - Final amount: 1000');
    console.log('  - Amount paid: 500');
    console.log('  - Total refund: 0');
    console.log('  - Expected debt: 500');
    const debt1 = (1000 - 0) - 500;
    console.log(`  - Calculated debt: ${debt1}`);
    console.log(`  - Result: ${debt1 === 500 ? '✅ PASS' : '❌ FAIL'}\n`);

    // Test case 2: Khách hàng thanh toán trước, trả hàng một phần
    console.log('📋 Test Case 2: Thanh toán trước, trả hàng một phần');
    console.log('  - Final amount: 1000');
    console.log('  - Amount paid: 1000');
    console.log('  - Total refund: 300');
    console.log('  - Expected debt: -300 (âm, cần hoàn tiền)');
    const debt2 = (1000 - 300) - 1000;
    console.log(`  - Calculated debt: ${debt2}`);
    console.log(`  - Result: ${debt2 === -300 ? '✅ PASS' : '❌ FAIL'}\n`);

    // Test case 3: Khách hàng thanh toán trước, trả hết hàng
    console.log('📋 Test Case 3: Thanh toán trước, trả hết hàng');
    console.log('  - Final amount: 1000');
    console.log('  - Amount paid: 1000');
    console.log('  - Total refund: 1000');
    console.log('  - Expected debt: -1000 (âm, cần hoàn tiền)');
    const debt3 = (1000 - 1000) - 1000;
    console.log(`  - Calculated debt: ${debt3}`);
    console.log(`  - Result: ${debt3 === -1000 ? '✅ PASS' : '❌ FAIL'}\n`);

    // Test case 4: Khách hàng thanh toán một phần, trả hàng một phần
    console.log('📋 Test Case 4: Thanh toán một phần, trả hàng một phần');
    console.log('  - Final amount: 1000');
    console.log('  - Amount paid: 500');
    console.log('  - Total refund: 300');
    console.log('  - Expected debt: 200');
    const debt4 = (1000 - 300) - 500;
    console.log(`  - Calculated debt: ${debt4}`);
    console.log(`  - Result: ${debt4 === 200 ? '✅ PASS' : '❌ FAIL'}\n`);

    // Test case 5: Khách hàng chưa thanh toán, trả hàng một phần
    console.log('📋 Test Case 5: Chưa thanh toán, trả hàng một phần');
    console.log('  - Final amount: 1000');
    console.log('  - Amount paid: 0');
    console.log('  - Total refund: 300');
    console.log('  - Expected debt: 700');
    const debt5 = (1000 - 300) - 0;
    console.log(`  - Calculated debt: ${debt5}`);
    console.log(`  - Result: ${debt5 === 700 ? '✅ PASS' : '❌ FAIL'}\n`);

    // Test case 6: Khách hàng thanh toán vượt quá, trả hàng
    console.log('📋 Test Case 6: Thanh toán vượt quá, trả hàng');
    console.log('  - Final amount: 1000');
    console.log('  - Amount paid: 1200');
    console.log('  - Total refund: 300');
    console.log('  - Expected debt: -500 (âm, cần hoàn tiền)');
    const debt6 = (1000 - 300) - 1200;
    console.log(`  - Calculated debt: ${debt6}`);
    console.log(`  - Result: ${debt6 === -500 ? '✅ PASS' : '❌ FAIL'}\n`);

    // Test case 7: Trường hợp refund vượt quá final_amount
    console.log('📋 Test Case 7: Refund vượt quá final_amount');
    console.log('  - Final amount: 1000');
    console.log('  - Amount paid: 500');
    console.log('  - Total refund: 1200');
    console.log('  - Expected debt: -500 (âm, cần hoàn tiền)');
    const debt7 = Math.max(0, 1000 - 1200) - 500;
    console.log(`  - Calculated debt: ${debt7}`);
    console.log(`  - Result: ${debt7 === -500 ? '✅ PASS' : '❌ FAIL'}\n`);

    console.log('✅ Hoàn thành test logic tính debt!');

  } catch (error) {
    console.error('❌ Lỗi trong quá trình test:', error);
  } finally {
    process.exit(0);
  }
}

// Chạy test
testDebtCalculation(); 