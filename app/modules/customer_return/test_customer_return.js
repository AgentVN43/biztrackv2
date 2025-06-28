const CustomerReturnService = require("./customer_return.service");

// Test data
const testReturnData = {
  customer_id: "test-customer-id",
  order_id: "test-order-id",
  po_id: null,
  supplier_id: null,
  type: "customer_return",
  note: "Khách hàng phản ánh sản phẩm không hoạt động"
};

const testReturnDetails = [
  {
    product_id: "test-product-id-1",
    quantity: 2,
    refund_amount: 200000
  },
  {
    product_id: "test-product-id-2",
    quantity: 1,
    refund_amount: 150000
  }
];

// Test functions
async function testCreateReturn() {
  try {
    console.log("Testing createReturnWithDetails...");
    const result = await CustomerReturnService.createReturnWithDetails(testReturnData, testReturnDetails);
    console.log("✅ Create return successful:", result);
    return result.return_id;
  } catch (error) {
    console.error("❌ Create return failed:", error.message);
    return null;
  }
}

async function testGetReturns() {
  try {
    console.log("Testing getReturnsWithPagination...");
    const result = await CustomerReturnService.getReturnsWithPagination({}, 1, 10);
    console.log("✅ Get returns successful:", result);
    return result;
  } catch (error) {
    console.error("❌ Get returns failed:", error.message);
    return null;
  }
}

async function testGetReturnStatistics() {
  try {
    console.log("Testing getReturnStatistics...");
    const result = await CustomerReturnService.getReturnStatistics({
      created_at_from: "2024-01-01",
      created_at_to: "2024-01-31"
    });
    console.log("✅ Get statistics successful:", result);
    return result;
  } catch (error) {
    console.error("❌ Get statistics failed:", error.message);
    return null;
  }
}

async function testCheckOrderEligibility() {
  try {
    console.log("Testing checkOrderReturnEligibility...");
    const result = await CustomerReturnService.checkOrderReturnEligibility("test-order-id");
    console.log("✅ Check eligibility successful:", result);
    return result;
  } catch (error) {
    console.error("❌ Check eligibility failed:", error.message);
    return null;
  }
}

async function testCalculateRefund(return_id) {
  if (!return_id) {
    console.log("⚠️ Skipping calculate refund test - no return_id");
    return null;
  }
  
  try {
    console.log("Testing calculateRefundAmount...");
    const result = await CustomerReturnService.calculateRefundAmount(return_id);
    console.log("✅ Calculate refund successful:", result);
    return result;
  } catch (error) {
    console.error("❌ Calculate refund failed:", error.message);
    return null;
  }
}

async function testGetReturnReport() {
  try {
    console.log("Testing getReturnReport...");
    const result = await CustomerReturnService.getReturnReport("2024-01-01", "2024-01-31");
    console.log("✅ Get report successful:", result);
    return result;
  } catch (error) {
    console.error("❌ Get report failed:", error.message);
    return null;
  }
}

async function testApproveReturn(return_id) {
  if (!return_id) {
    console.log("⚠️ Skipping approve return test - no return_id");
    return null;
  }
  
  try {
    console.log("Testing approveReturn...");
    const result = await CustomerReturnService.approveReturn(return_id);
    console.log("✅ Approve return successful:", result);
    return result;
  } catch (error) {
    console.error("❌ Approve return failed:", error.message);
    return null;
  }
}

// Main test function
async function runTests() {
  console.log("🚀 Starting Customer Return Module Tests...\n");
  
  // Test 1: Create return
  const return_id = await testCreateReturn();
  
  // Test 2: Get returns
  await testGetReturns();
  
  // Test 3: Get statistics
  await testGetReturnStatistics();
  
  // Test 4: Check order eligibility
  await testCheckOrderEligibility();
  
  // Test 5: Calculate refund
  await testCalculateRefund(return_id);
  
  // Test 6: Get report
  await testGetReturnReport();
  
  // Test 7: Approve return
  await testApproveReturn(return_id);
  
  console.log("\n✅ All tests completed!");
}

// Export for use in other files
module.exports = {
  runTests,
  testCreateReturn,
  testGetReturns,
  testGetReturnStatistics,
  testCheckOrderEligibility,
  testCalculateRefund,
  testGetReturnReport,
  testApproveReturn
};

// Run tests if this file is executed directly
if (require.main === module) {
  runTests().catch(console.error);
} 