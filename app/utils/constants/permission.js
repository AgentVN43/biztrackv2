const permissions = {
  order: {
    name: "Đơn hàng",
    permissions: [
      {
        name: "Tạo đơn hàng",
        code: "order.create",
        permission_id: "order.create",
      },
      { name: "Xem đơn hàng", code: "order.read", permission_id: "order.read" },
      {
        name: "Xem chi tiết đơn hàng",
        code: "order.readById",
        permission_id: "order.readById",
      },
      {
        name: "Cập nhật đơn hàng",
        code: "order.update",
        permission_id: "order.update",
      },
      {
        name: "Xóa đơn hàng",
        code: "order.delete",
        permission_id: "order.delete",
      },
      {
        name: "Trả đơn hàng",
        code: "order.return",
        permission_id: "order.return",
      },
      {
        name: "Xem đơn trả hàng",
        code: "order.readReturn",
        permission_id: "order.readReturn",
      },
      {
        name: "Xem chi tiết đơn trả hàng",
        code: "order.readReturnById",
        permission_id: "order.readReturnById",
      },
      {
        name: "Xem lịch sử thanh toán",
        code: "order.getOrderTransactionLedger",
        permission_id: "order.getOrderTransactionLedger",
      },
      {
        name: "Xem lịch sử trả hàng",
        code: "order.getReturns",
        permission_id: "order.getReturns",
      },
    ],
  },
  customer: {
    name: "Khách hàng",
    permissions: [
      {
        name: "Import dữ liệu",
        code: "customer.importFromText",
        permission_id: "customer.importFromText",
      },
      {
        name: "Tạo khách hàng",
        code: "customer.create",
        permission_id: "customer.create",
      },
      {
        name: "Xem danh sách khách hàng",
        code: "customer.read",
        permission_id: "customer.read",
      },
      {
        name: "Xem chi tiết khách hàng",
        code: "customer.readById",
        permission_id: "customer.readById",
      },
      {
        name: "Cập nhật khách hàng",
        code: "customer.update",
        permission_id: "customer.update",
      },
      {
        name: "Xóa khách hàng",
        code: "customer.delete",
        permission_id: "customer.delete",
      },
      {
        name: "Lịch sử bán trả",
        code: "customer.getCustomerOrderHistory",
        permission_id: "customer.getCustomerOrderHistory",
      },
      {
        name: "Công nợ khách hàng",
        code: "customer.getCustomerTransactionLedger",
        permission_id: "customer.getCustomerTransactionLedger",
      },
      {
        name: "Thanh toán công nợ khách hàng",
        code: "customer.recordBulkPayment",
        permission_id: "customer.recordBulkPayment",
      },
    ],
  },
  product: {
    name: "Sản phẩm",
    permissions: [
      {
        name: "Tạo sản phẩm",
        code: "product.create",
        permission_id: "product.create",
      },
      {
        name: "Xem sản phẩm",
        code: "product.read",
        permission_id: "product.read",
      },
      {
        name: "Cập nhật sản phẩm",
        code: "product.update",
        permission_id: "product.update",
      },
      {
        name: "Xóa sản phẩm",
        code: "product.delete",
        permission_id: "product.delete",
      },
    ],
  },
  category: {
    name: "Danh mục sản phẩm",
    permissions: [
      {
        name: "Tạo danh mục sản phẩm",
        code: "category.create",
        permission_id: "category.create",
      },
      {
        name: "Xem danh mục sản phẩm",
        code: "category.read",
        permission_id: "category.read",
      },
      {
        name: "Cập nhật danh mục sản phẩm",
        code: "category.update",
        permission_id: "category.update",
      },
      {
        name: "Xóa danh mục sản phẩm",
        code: "category.delete",
        permission_id: "category.delete",
      },
    ],
  },
  purchase_order: {
    name: "Đơn nhập hàng",
    permissions: [
      {
        name: "Tạo đơn nhập hàng",
        code: "purchase.create",
        permission_id: "purchase.create",
      },
      {
        name: "Xem đơn nhập hàng",
        code: "purchase.read",
        permission_id: "purchase.read",
      },
      {
        name: "Xem chi tiết đơn nhập hàng",
        code: "purchase.readById",
        permission_id: "purchase.readById",
      },
      {
        name: "Cập nhật đơn nhập hàng",
        code: "purchase.update",
        permission_id: "purchase.update",
      },
      {
        name: "Xóa đơn nhập hàng",
        code: "purchase.delete",
        permission_id: "purchase.delete",
      },
      {
        name: "Trả đơn nhập hàng",
        code: "purchase.return",
        permission_id: "purchase.return",
      },
      {
        name: "Xem đơn trả hàng nhập",
        code: "purchase.readReturn",
        permission_id: "purchase.readReturn",
      },
      {
        name: "Xem chi tiết đơn trả hàng nhập",
        code: "purchase.readReturnById",
        permission_id: "purchase.readReturnById",
      },
    ],
  },
  supplier: {
    name: "Nhà cung cấp",
    permissions: [
      {
        name: "Import dữ liệu",
        code: "supplier.importFromText",
        permission_id: "supplier.importFromText",
      },
      {
        name: "Tạo nhà cung cấp",
        code: "supplier.create",
        permission_id: "supplier.create",
      },
      {
        name: "Xem nhà cung cấp",
        code: "supplier.read",
        permission_id: "supplier.read",
      },
      {
        name: "Xem chi tiết nhà cung cấp",
        code: "supplier.readById",
        permission_id: "supplier.readById",
      },
      {
        name: "Cập nhật nhà cung cấp",
        code: "supplier.update",
        permission_id: "supplier.update",
      },
      {
        name: "Xóa nhà cung cấp",
        code: "supplier.delete",
        permission_id: "supplier.delete",
      },
      {
        name: "Lịch sử nhập trả",
        code: "supplier.getSupplierPOHistory",
        permission_id: "supplier.getSupplierPOHistory",
      },
      {
        name: "Công nợ nhà cung cấp",
        code: "supplier.getSupplierTransactionLedger",
        permission_id: "supplier.getSupplierTransactionLedger",
      },
      {
        name: "Thanh toán công nợ nhà cung cấp",
        code: "supplier.recordBulkPayment",
        permission_id: "supplier.recordBulkPayment",
      },
    ],
  },
  warehouse: {
    name: "Kho hàng",
    permissions: [
      {
        name: "Tạo kho",
        code: "warehouse.create",
        permission_id: "warehouse.create",
      },
      {
        name: "Xem kho",
        code: "warehouse.read",
        permission_id: "warehouse.read",
      },
      {
        name: "Cập nhật kho",
        code: "warehouse.update",
        permission_id: "warehouse.update",
      },
      {
        name: "Xóa kho",
        code: "warehouse.delete",
        permission_id: "warehouse.delete",
      },
    ],
  },
  inventory: {
    name: "Tồn kho",
    permissions: [
      {
        name: "Xem tồn kho",
        code: "inventory.read",
        permission_id: "inventory.read",
      },
      {
        name: "Xem chi tiết tồn kho",
        code: "inventory.readById",
        permission_id: "inventory.readById",
      },
      {
        name: "Thẻ kho",
        code: "inventory.getStockLedger",
        permission_id: "inventory.getStockLedger",
      },
      {
        name: "Tăng tồn kho",
        code: "inventory.stockIncrease",
        permission_id: "inventory.stockIncrease",
      },
      {
        name: "Giảm tồn kho",
        code: "inventory.stockDecrease",
        permission_id: "inventory.stockDecrease",
      },
    ],
  },
  cashbook: {
    name: "Sổ quỹ",
    permissions: [
      {
        name: "Tạo phiếu chi",
        code: "cashbook.createPayment",
        permission_id: "cashbook.createPayment",
      },
      {
        name: "Tạo phiếu thu",
        code: "cashbook.createReceipt",
        permission_id: "cashbook.createReceipt",
      },
      {
        name: "Xem giao dịch",
        code: "cashbook.read",
        permission_id: "cashbook.read",
      },
      {
        name: "Xem chi tiết giao dịch",
        code: "cashbook.readById",
        permission_id: "cashbook.readById",
      },
      {
        name: "Cập nhật giao dịch",
        code: "cashbook.update",
        permission_id: "cashbook.update",
      },
      {
        name: "Xóa giao dịch",
        code: "cashbook.delete",
        permission_id: "cashbook.delete",
      },
    ],
  },
  product_report: {
    name: "Báo cáo sản phẩm",
    permissions: [
      {
        name: "Xem lịch sử sản phẩm",
        code: "product_report.getProductHistory",
        permission_id: "product_report.getProductHistory",
      },
      {
        name: "Xem lịch sử sản phẩm theo kho",
        code: "product_report.getProductHistoryByProductAndWarehouse",
        permission_id: "product_report.getProductHistoryByProductAndWarehouse",
      },
    ],
  },
  payments: {
    name: "Thanh toán",
    permissions: [
      {
        name: "Tạo thanh toán",
        code: "payments.createPayment",
        permission_id: "payments.createPayment",
      },
      {
        name: "Xem thanh toán",
        code: "payments.getAllPayments",
        permission_id: "payments.getAllPayments",
      },
      {
        name: "Xem chi tiết thanh toán",
        code: "payments.getPaymentById",
        permission_id: "payments.getPaymentById",
      },
      {
        name: "Cập nhật thanh toán",
        code: "payments.updatePayment",
        permission_id: "payments.updatePayment",
      },
      {
        name: "Xóa thanh toán",
        code: "payments.deletePayment",
        permission_id: "payments.deletePayment",
      },
      {
        name: "Xem thanh toán theo PO",
        code: "payments.getPaymentsByPO",
        permission_id: "payments.getPaymentsByPO",
      },
    ],
  },
  invoice: {
    name: "Hóa đơn",
    permissions: [
      {
        name: "Xem hóa đơn",
        code: "invoice.getAllInvoices",
        permission_id: "invoice.getAllInvoices",
      },
      {
        name: "Xem hóa đơn đã thanh toán",
        code: "invoice.getPaidInvoices",
        permission_id: "invoice.getPaidInvoices",
      },
      {
        name: "Xem hóa đơn chưa thanh toán",
        code: "invoice.getUnPaidInvoices",
        permission_id: "invoice.getUnPaidInvoices",
      },
      {
        name: "Xem hóa đơn theo mã",
        code: "invoice.getInvoiceByInvoiceCode",
        permission_id: "invoice.getInvoiceByInvoiceCode",
      },
      {
        name: "Tạo hóa đơn",
        code: "invoice.createInvoice",
        permission_id: "invoice.createInvoice",
      },
      {
        name: "Cập nhật hóa đơn",
        code: "invoice.updateInvoice",
        permission_id: "invoice.updateInvoice",
      },
      {
        name: "Xóa hóa đơn",
        code: "invoice.deleteInvoice",
        permission_id: "invoice.deleteInvoice",
      },
      {
        name: "Ghi nhận thanh toán hóa đơn",
        code: "invoice.recordInvoicePayment",
        permission_id: "invoice.recordInvoicePayment",
      },
      {
        name: "Ghi nhận thanh toán hàng loạt",
        code: "invoice.recordBulkPayment",
        permission_id: "invoice.recordBulkPayment",
      },
      {
        name: "Xem tất cả thanh toán",
        code: "invoice.getAllPayments",
        permission_id: "invoice.getAllPayments",
      },
    ],
  },
  orderDetails: {
    name: "Chi tiết đơn hàng",
    permissions: [
      {
        name: "Tạo chi tiết đơn hàng",
        code: "orderDetails.create",
        permission_id: "orderDetails.create",
      },
      {
        name: "Xem chi tiết đơn hàng",
        code: "orderDetails.read",
        permission_id: "orderDetails.read",
      },
      {
        name: "Xem chi tiết theo ID",
        code: "orderDetails.readById",
        permission_id: "orderDetails.readById",
      },
      {
        name: "Xem chi tiết theo đơn hàng",
        code: "orderDetails.getOrderDetailByOrderId",
        permission_id: "orderDetails.getOrderDetailByOrderId",
      },
      {
        name: "Cập nhật chi tiết đơn hàng",
        code: "orderDetails.update",
        permission_id: "orderDetails.update",
      },
      {
        name: "Xóa chi tiết đơn hàng",
        code: "orderDetails.delete",
        permission_id: "orderDetails.delete",
      },
      {
        name: "Xem tổng hợp trả hàng",
        code: "orderDetails.getOrderWithReturnSummary",
        permission_id: "orderDetails.getOrderWithReturnSummary",
      },
    ],
  },
  customer_report: {
    name: "Báo cáo khách hàng",
    permissions: [
      {
        name: "Xem tổng quan khách hàng",
        code: "customer_report.getCustomerOverview",
        permission_id: "customer_report.getCustomerOverview",
      },
      {
        name: "Xem lịch sử trả hàng",
        code: "customer_report.getCustomerSalesReturnHistory",
        permission_id: "customer_report.getCustomerSalesReturnHistory",
      },
      {
        name: "Xem lịch sử đơn hàng",
        code: "customer_report.getCustomerOrderHistory",
        permission_id: "customer_report.getCustomerOrderHistory",
      },
      {
        name: "Xem công nợ phải thu",
        code: "customer_report.getCustomerReceivables",
        permission_id: "customer_report.getCustomerReceivables",
      },
      {
        name: "Xem giao dịch khách hàng",
        code: "customer_report.getCustomerTransactions",
        permission_id: "customer_report.getCustomerTransactions",
      },
      {
        name: "Xem ledger tài chính",
        code: "customer_report.getCustomerFinancialLedger",
        permission_id: "customer_report.getCustomerFinancialLedger",
      },
      {
        name: "Xem ledger giao dịch",
        code: "customer_report.getCustomerTransactionLedger",
        permission_id: "customer_report.getCustomerTransactionLedger",
      },
      {
        name: "Tạo giao dịch khách hàng",
        code: "customer_report.createCustomerTransaction",
        permission_id: "customer_report.createCustomerTransaction",
      },
    ],
  },
  supplier_report: {
    name: "Báo cáo nhà cung cấp",
    permissions: [
      {
        name: "Xem ledger giao dịch",
        code: "supplier_report.getSupplierTransactionLedger",
        permission_id: "supplier_report.getSupplierTransactionLedger",
      },
      {
        name: "Xem lịch sử PO",
        code: "supplier_report.getSupplierOrderHistory",
        permission_id: "supplier_report.getSupplierOrderHistory",
      },
      {
        name: "Xem công nợ phải trả",
        code: "supplier_report.getSupplierPayable",
        permission_id: "supplier_report.getSupplierPayable",
      },
      {
        name: "Tạo giao dịch nhà cung cấp",
        code: "supplier_report.createSupplierTransaction",
        permission_id: "supplier_report.createSupplierTransaction",
      },
    ],
  },
  customer_return: {
    name: "Đơn trả hàng khách",
    permissions: [
      {
        name: "Tạo đơn trả hàng",
        code: "customer_return.createReturn",
        permission_id: "customer_return.createReturn",
      },
      {
        name: "Xem đơn trả hàng",
        code: "customer_return.getReturns",
        permission_id: "customer_return.getReturns",
      },
      {
        name: "Xem thống kê trả hàng",
        code: "customer_return.getReturnStatistics",
        permission_id: "customer_return.getReturnStatistics",
      },
      {
        name: "Xem báo cáo trả hàng",
        code: "customer_return.getReturnReport",
        permission_id: "customer_return.getReturnReport",
      },
      {
        name: "Xem chi tiết trả hàng",
        code: "customer_return.getReturnById",
        permission_id: "customer_return.getReturnById",
      },
      {
        name: "Cập nhật trả hàng",
        code: "customer_return.updateReturn",
        permission_id: "customer_return.updateReturn",
      },
      {
        name: "Xóa trả hàng",
        code: "customer_return.deleteReturn",
        permission_id: "customer_return.deleteReturn",
      },
      {
        name: "Xử lý trả hàng",
        code: "customer_return.processReturn",
        permission_id: "customer_return.processReturn",
      },
      {
        name: "Duyệt trả hàng",
        code: "customer_return.approveReturn",
        permission_id: "customer_return.approveReturn",
      },
      {
        name: "Từ chối trả hàng",
        code: "customer_return.rejectReturn",
        permission_id: "customer_return.rejectReturn",
      },
      {
        name: "Tính tiền hoàn trả",
        code: "customer_return.calculateRefund",
        permission_id: "customer_return.calculateRefund",
      },
      {
        name: "Kiểm tra khả năng trả hàng",
        code: "customer_return.checkOrderEligibility",
        permission_id: "customer_return.checkOrderEligibility",
      },
      {
        name: "Xem trả hàng theo khách hàng",
        code: "customer_return.getReturnsByCustomer",
        permission_id: "customer_return.getReturnsByCustomer",
      },
      {
        name: "Xem trả hàng theo đơn hàng",
        code: "customer_return.getReturnsByOrder",
        permission_id: "customer_return.getReturnsByOrder",
      },
      {
        name: "Cập nhật số tiền hoàn trả cho item",
        code: "customer_return.updateRefundAmount",
        permission_id: "customer_return.updateRefundAmount",
      },
    ],
  },
  supplier_return: {
    name: "Đơn trả hàng NCC",
    permissions: [
      {
        name: "Tạo đơn trả hàng",
        code: "supplier_return.createReturn",
        permission_id: "supplier_return.createReturn",
      },
      {
        name: "Xem đơn trả hàng",
        code: "supplier_return.getReturns",
        permission_id: "supplier_return.getReturns",
      },
      {
        name: "Xem chi tiết trả hàng",
        code: "supplier_return.getReturnById",
        permission_id: "supplier_return.getReturnById",
      },
      {
        name: "Cập nhật trả hàng",
        code: "supplier_return.updateReturn",
        permission_id: "supplier_return.updateReturn",
      },
      {
        name: "Xóa trả hàng",
        code: "supplier_return.deleteReturn",
        permission_id: "supplier_return.deleteReturn",
      },
      {
        name: "Duyệt trả hàng",
        code: "supplier_return.approveReturn",
        permission_id: "supplier_return.approveReturn",
      },
      {
        name: "Xem trả hàng theo NCC",
        code: "supplier_return.getReturnBySupplierId",
        permission_id: "supplier_return.getReturnBySupplierId",
      },
      {
        name: "Xem trả hàng theo trạng thái",
        code: "supplier_return.getReturnByStatus",
        permission_id: "supplier_return.getReturnByStatus",
      },
      {
        name: "Xem công nợ trả hàng",
        code: "supplier_return.getPayableReturns",
        permission_id: "supplier_return.getPayableReturns",
      },
      {
        name: "Xem công nợ trả hàng theo NCC",
        code: "supplier_return.getPayableReturnsBySupplier",
        permission_id: "supplier_return.getPayableReturnsBySupplier",
      },
    ],
  },
  analysis: {
    name: "Phân tích/Báo cáo tổng hợp",
    permissions: [
      {
        name: "Xem hóa đơn theo filter",
        code: "analysis.getInvoicesWithFilters",
        permission_id: "analysis.getInvoicesWithFilters",
      },
      {
        name: "Xem dashboard tiền",
        code: "analysis.getOutstandingDebt",
        permission_id: "analysis.getOutstandingDebt",
      },
      {
        name: "Xem khách hàng mới trong tháng",
        code: "analysis.getNewCustomersInCurrentMonth",
        permission_id: "analysis.getNewCustomersInCurrentMonth",
      },
      {
        name: "Xem tổng khách hàng",
        code: "analysis.getTotalCustomers",
        permission_id: "analysis.getTotalCustomers",
      },
      {
        name: "Xem sản phẩm mới trong tháng",
        code: "analysis.getNewProductsInCurrentMonth",
        permission_id: "analysis.getNewProductsInCurrentMonth",
      },
      {
        name: "Xem tổng sản phẩm",
        code: "analysis.getTotalProducts",
        permission_id: "analysis.getTotalProducts",
      },
      {
        name: "Xem doanh thu",
        code: "analysis.getRevenueByTimePeriod",
        permission_id: "analysis.getRevenueByTimePeriod",
      },
      {
        name: "Xem mua hàng tổng hợp",
        code: "analysis.getPurchaseSummary",
        permission_id: "analysis.getPurchaseSummary",
      },
      {
        name: "Xem tồn kho hiện tại",
        code: "analysis.getInventoryCurrent",
        permission_id: "analysis.getInventoryCurrent",
      },
      {
        name: "Xem công nợ phải thu",
        code: "analysis.getReceivableOrders",
        permission_id: "analysis.getReceivableOrders",
      },
      {
        name: "Xem công nợ phải trả",
        code: "analysis.getPayablePurchaseOrders",
        permission_id: "analysis.getPayablePurchaseOrders",
      },
      {
        name: "Xem quản lý tài chính",
        code: "analysis.getFinanceManagementByPeriod",
        permission_id: "analysis.getFinanceManagementByPeriod",
      },
      {
        name: "Xem quản lý tài chính chi tiết",
        code: "analysis.getDetailedFinanceManagementByPeriod",
        permission_id: "analysis.getDetailedFinanceManagementByPeriod",
      },
      {
        name: "Xem top khách hàng",
        code: "analysis.getTopCustomers",
        permission_id: "analysis.getTopCustomers",
      },
      {
        name: "Xem top sản phẩm bán chạy",
        code: "analysis.getTopSellingProducts",
        permission_id: "analysis.getTopSellingProducts",
      },
      {
        name: "Xem top NCC nhập nhiều",
        code: "analysis.getTopPurchasingSuppliers",
        permission_id: "analysis.getTopPurchasingSuppliers",
      },
      {
        name: "Xem doanh thu theo danh mục",
        code: "analysis.getRevenueByCategory",
        permission_id: "analysis.getRevenueByCategory",
      },
    ],
  },
  search: {
    name: "Tìm kiếm",
    permissions: [
      {
        name: "Tìm đơn hàng theo SĐT",
        code: "search.searchOrdersByPhone",
        permission_id: "search.searchOrdersByPhone",
      },
      {
        name: "Tìm đơn hàng theo tên KH",
        code: "search.searchOrdersByCustomerName",
        permission_id: "search.searchOrdersByCustomerName",
      },
      {
        name: "Tìm đơn hàng tự động",
        code: "search.searchOrdersAuto",
        permission_id: "search.searchOrdersAuto",
      },
      {
        name: "Tìm sản phẩm theo tên",
        code: "search.searchProductsByName",
        permission_id: "search.searchProductsByName",
      },
      {
        name: "Tìm sản phẩm theo SKU",
        code: "search.searchProductsBySku",
        permission_id: "search.searchProductsBySku",
      },
      {
        name: "Tìm sản phẩm tự động",
        code: "search.searchProductsAuto",
        permission_id: "search.searchProductsAuto",
      },
      {
        name: "Tìm khách hàng theo SĐT",
        code: "search.searchCustomerByPhone",
        permission_id: "search.searchCustomerByPhone",
      },
      {
        name: "Tìm khách hàng theo tên",
        code: "search.searchCustomerByName",
        permission_id: "search.searchCustomerByName",
      },
      {
        name: "Tìm khách hàng tự động",
        code: "search.searchCustomerAuto",
        permission_id: "search.searchCustomerAuto",
      },
      {
        name: "Tìm danh mục theo tên",
        code: "search.searchCategoryByName",
        permission_id: "search.searchCategoryByName",
      },
      {
        name: "Tìm kho theo tên",
        code: "search.searchWarehouseByName",
        permission_id: "search.searchWarehouseByName",
      },
      {
        name: "Tìm tồn kho",
        code: "search.searchInventory",
        permission_id: "search.searchInventory",
      },
      {
        name: "Tìm NCC theo SĐT",
        code: "search.searchSupplierByPhone",
        permission_id: "search.searchSupplierByPhone",
      },
      {
        name: "Tìm NCC theo tên",
        code: "search.searchSupplierByName",
        permission_id: "search.searchSupplierByName",
      },
      {
        name: "Tìm NCC tự động",
        code: "search.searchSupplierAuto",
        permission_id: "search.searchSupplierAuto",
      },
    ],
  },
};
module.exports = { permissions };
