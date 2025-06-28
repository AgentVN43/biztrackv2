/**
 * Test API sổ cái giao dịch khách hàng
 * 
 * Sử dụng: node test_transaction_ledger.js
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api'; // Thay đổi port nếu cần
const CUSTOMER_ID = 'your-customer-id'; // Thay đổi ID khách hàng thực tế

async function testTransactionLedger() {
  try {
    console.log('🧪 Testing Transaction Ledger API...');
    console.log(`📋 Customer ID: ${CUSTOMER_ID}`);
    
    const response = await axios.get(`${BASE_URL}/customers/${CUSTOMER_ID}/transaction-ledger`);
    
    console.log('✅ API Response:');
    console.log('Status:', response.status);
    console.log('Success:', response.data.success);
    console.log('Message:', response.data.message);
    
    if (response.data.success && response.data.data) {
      console.log('\n📊 Transaction Ledger Data:');
      console.log('Total transactions:', response.data.data.length);
      
      // Hiển thị dữ liệu dạng bảng
      console.log('\n┌─────────────────┬─────────────────┬─────────────────┬─────────────────┬─────────────────┐');
      console.log('│ Mã giao dịch    │ Ngày giao dịch  │ Loại            │ Giá trị         │ Dư nợ           │');
      console.log('├─────────────────┼─────────────────┼─────────────────┼─────────────────┼─────────────────┤');
      
      response.data.data.forEach((transaction, index) => {
        const code = (transaction.ma_giao_dich || '').padEnd(15);
        const date = (transaction.ngay_giao_dich || '').padEnd(15);
        const type = (transaction.loai || '').padEnd(15);
        const amount = (transaction.gia_tri || '').padEnd(15);
        const balance = (transaction.du_no || '').padEnd(15);
        
        console.log(`│ ${code} │ ${date} │ ${type} │ ${amount} │ ${balance} │`);
        
        if (index < response.data.data.length - 1) {
          console.log('├─────────────────┼─────────────────┼─────────────────┼─────────────────┼─────────────────┤');
        }
      });
      
      console.log('└─────────────────┴─────────────────┴─────────────────┴─────────────────┴─────────────────┘');
      
      // Hiển thị thông tin chi tiết
      console.log('\n📋 Detailed Information:');
      response.data.data.forEach((transaction, index) => {
        console.log(`\n${index + 1}. ${transaction.ma_giao_dich}`);
        console.log(`   Mô tả: ${transaction.mo_ta}`);
        console.log(`   Order ID: ${transaction.order_id || 'N/A'}`);
        console.log(`   Invoice ID: ${transaction.invoice_id || 'N/A'}`);
        console.log(`   Transaction ID: ${transaction.transaction_id || 'N/A'}`);
        console.log(`   Status: ${transaction.status || 'N/A'}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error testing Transaction Ledger API:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  }
}

// Chạy test
testTransactionLedger(); 