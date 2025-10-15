const pingRoutes = require("./ping.routes");
const authRoutes = require("./auth.routes");
const userRoutes = require("./user.routes");
const categoryRoutes = require("./category.routes");
// const productRoutes = require("./product.routes");
const productRoutes = require("../modules/product/product.routes");
const warehouseRoutes = require("../modules/warehouse/warehouse.route");
const purchaseOrderRoutes = require("../modules/purchaseOrder/purchaseOrder.routes");
const inventoriesRoutes = require("../modules/inventories/inventory.routes");
const paymentRoutes = require("../modules/payments/payments.routes");
const customerRoutes = require("../modules/customers/customer.routes");
const orderRoutes = require("../modules/orders/order.routes");
const orderDetailRoutes = require("../modules/orderDetails/orderDetail.routes");
const searchRoutes = require("../modules/search/search.routes");
const invoiceRoutes = require("../modules/invoice/invoice.routes");
const analysisRoutes = require("../modules/analysis/analysis.routes");
const transactionRoutes = require("../modules/transactions/transaction.route");
const productReportRoutes = require("../modules/product_report/product_report.routes");
const supplierRoutes = require("../modules/suppliers/supplier.routes");
const customerReportRoutes = require("../modules/customer_report/customer_report.routes");
const supplierReportRoutes = require("../modules/supplier_report/supplier_report.routes");
const customerReturnRoutes = require("../modules/customer_return/customer_return.routes");
const supplierReturnRoutes = require("../modules/supplier_return/supplier_return.routes");
const cashbookRoutes = require("../modules/cashbook/cashbook.routes");
const importRoutes = require("./import.routes");
const permissionRoutes = require("../modules/permissions/permission.routes");
const roleRoutes = require("../modules/roles/role.routes");
const { authMiddleware } = require("../middlewares/auth.middleware");

module.exports = (app) => {
  // Public routes
  app.use("/api/v1/ping", pingRoutes);
  app.use("/api/v1/auth", authRoutes);
  app.use("/api/v1/import", importRoutes);

  // app.use("/api/v1/users", userRoutes);
  // app.use("/api/v1/categories", categoryRoutes);
  // app.use("/api/v1/products", productRoutes);
  // app.use("/api/v1/product-report", productReportRoutes);
  // app.use("/api/v1/warehouses", warehouseRoutes);
  // app.use("/api/v1/purchase-orders", authMiddleware, purchaseOrderRoutes);
  // app.use("/api/v1/inventories", inventoriesRoutes);
  // app.use("/api/v1/payments", paymentRoutes);
  // app.use("/api/v1/customers", customerRoutes);
  // app.use("/api/v1/customer-report", customerReportRoutes);
  // app.use("/api/v1/orders", orderRoutes);
  // app.use("/api/v1/order-details", orderDetailRoutes);
  // app.use("/api/v1/search", searchRoutes);
  // app.use("/api/v1/invoices", invoiceRoutes);
  // app.use("/api/v1/analysis", analysisRoutes);
  // app.use("/api/v1/transactions", transactionRoutes);
  // app.use("/api/v1/suppliers", supplierRoutes);
  // app.use("/api/v1/customer-returns", customerReturnRoutes);
  // app.use("/api/v1/supplier-returns", supplierReturnRoutes);
  app.use("/api/v1/cashbook", authMiddleware, cashbookRoutes);

  // Protected routes
  app.use("/api/v1/users", authMiddleware, userRoutes);
  app.use("/api/v1/categories", authMiddleware, categoryRoutes);
  app.use("/api/v1/products", authMiddleware, productRoutes);
  app.use("/api/v1/product-report", authMiddleware, productReportRoutes);
  app.use("/api/v1/warehouses", authMiddleware, warehouseRoutes);
  app.use("/api/v1/purchase-orders", authMiddleware, purchaseOrderRoutes);
  app.use("/api/v1/inventories", authMiddleware, inventoriesRoutes);
  app.use("/api/v1/payments", authMiddleware, paymentRoutes);
  app.use("/api/v1/customers", authMiddleware, customerRoutes);
  app.use("/api/v1/customer-report", authMiddleware, customerReportRoutes);
  app.use("/api/v1/supplier-report", authMiddleware, supplierReportRoutes);
  app.use("/api/v1/orders", authMiddleware, orderRoutes);
  app.use("/api/v1/order-details", authMiddleware, orderDetailRoutes);
  app.use("/api/v1/search", authMiddleware, searchRoutes);
  app.use("/api/v1/invoices", authMiddleware, invoiceRoutes);
  app.use("/api/v1/analysis", authMiddleware, analysisRoutes);
  app.use("/api/v1/transactions", authMiddleware, transactionRoutes);
  app.use("/api/v1/suppliers", authMiddleware, supplierRoutes);
  app.use("/api/v1/customer-returns", authMiddleware, customerReturnRoutes);
  app.use("/api/v1/supplier-returns", authMiddleware, supplierReturnRoutes);
  app.use("/api/v1/permissions", permissionRoutes);
  app.use("/api/v1/roles", roleRoutes);

  // Default route for non-existent endpoints
  app.use("*", (req, res) => {
    res.status(404).json({
      success: false,
      message: "Endpoint not found",
    });
  });
};
