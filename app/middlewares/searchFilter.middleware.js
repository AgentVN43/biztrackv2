/**
 * Middleware cho search và filter functionality
 * Áp dụng cho các route mới, không ảnh hưởng đến route cũ
 */

const { parseQueryParams, validateSearchParams } = require('../utils/searchFilterUtils');

/**
 * Middleware để parse và validate search parameters
 * @param {Array} allowedSearchFields - Các trường được phép search
 * @param {Array} allowedSortFields - Các trường được phép sort
 * @param {Object} allowedFilters - Các filter được phép
 * @returns {Function} Express middleware function
 */
const searchFilterMiddleware = (allowedSearchFields = [], allowedSortFields = [], allowedFilters = {}) => {
  return (req, res, next) => {
    try {
      // Parse query parameters
      const params = parseQueryParams(req);
      
      // Validate parameters
      const validatedParams = validateSearchParams(
        params, 
        allowedSearchFields, 
        allowedSortFields, 
        allowedFilters
      );
      
      // Attach to request object
      req.searchParams = validatedParams;
      
      next();
    } catch (error) {
      console.error('🚀 ~ searchFilterMiddleware - Error:', error);
      return res.status(400).json({
        success: false,
        message: 'Invalid search parameters',
        error: error.message
      });
    }
  };
};

/**
 * Middleware cho supplier search/filter
 */
const supplierSearchFilter = searchFilterMiddleware(
  ['supplier_name', 'contact_person', 'email', 'phone'], // Allowed search fields
  ['supplier_name', 'created_at', 'updated_at'], // Allowed sort fields
  {
    supplier_name: true,
    contact_person: true,
    email: true,
    phone: true
  } // Allowed filters
);

/**
 * Middleware cho customer search/filter
 */
const customerSearchFilter = searchFilterMiddleware(
  ['customer_name', 'email', 'phone'], // Allowed search fields
  ['customer_name', 'created_at', 'updated_at', 'total_expenditure'], // Allowed sort fields
  {
    customer_name: true,
    email: true,
    phone: true,
    status: true
  } // Allowed filters
);

/**
 * Middleware cho product search/filter
 */
const productSearchFilter = searchFilterMiddleware(
  ['product_name', 'sku', 'description'], // Allowed search fields
  ['product_name', 'product_retail_price', 'created_at', 'updated_at'], // Allowed sort fields
  {
    product_name: true,
    sku: true,
    category_id: true,
    status: true
  } // Allowed filters
);

/**
 * Middleware cho order search/filter
 */
const orderSearchFilter = searchFilterMiddleware(
  ['order_code', 'note'], // Allowed search fields
  ['order_date', 'created_at', 'final_amount', 'order_status'], // Allowed sort fields
  {
    order_code: true,
    order_status: true,
    payment_method: true,
    customer_id: true
  } // Allowed filters
);

/**
 * Middleware cho invoice search/filter
 */
const invoiceSearchFilter = searchFilterMiddleware(
  ['invoice_code', 'note'], // Allowed search fields
  ['issued_date', 'created_at', 'final_amount', 'status'], // Allowed sort fields
  {
    invoice_code: true,
    invoice_type: true,
    status: true,
    customer_id: true
  } // Allowed filters
);

/**
 * Middleware cho transaction search/filter
 */
const transactionSearchFilter = searchFilterMiddleware(
  ['transaction_code', 'description'], // Allowed search fields
  ['created_at', 'amount', 'type'], // Allowed sort fields
  {
    transaction_code: true,
    type: true,
    category: true,
    payment_method: true,
    customer_id: true,
    supplier_id: true
  } // Allowed filters
);

/**
 * Middleware cho purchase order search/filter
 */
const purchaseOrderSearchFilter = searchFilterMiddleware(
  ['po_id', 'note'], // Allowed search fields
  ['created_at', 'total_amount', 'status'], // Allowed sort fields
  {
    po_id: true,
    status: true,
    supplier_id: true,
    warehouse_id: true
  } // Allowed filters
);

/**
 * Middleware cho inventory search/filter
 */
const inventorySearchFilter = searchFilterMiddleware(
  ['product_name', 'sku'], // Allowed search fields
  ['quantity', 'available_stock', 'created_at'], // Allowed sort fields
  {
    product_id: true,
    warehouse_id: true,
    quantity: true
  } // Allowed filters
);

module.exports = {
  searchFilterMiddleware,
  supplierSearchFilter,
  customerSearchFilter,
  productSearchFilter,
  orderSearchFilter,
  invoiceSearchFilter,
  transactionSearchFilter,
  purchaseOrderSearchFilter,
  inventorySearchFilter
}; 