/**
 * Service helper cho search và filter functionality
 * Áp dụng cho các route mới, không ảnh hưởng đến route cũ
 */

const db = require('../config/db.config');
const { buildAdvancedQuery } = require('./searchFilterUtils');
const { createResponse } = require('./response');

/**
 * Service class cho search và filter operations
 */
class SearchFilterService {
  /**
   * Thực hiện search và filter với pagination
   * @param {Object} options - Các options cho query
   * @param {string} options.baseQuery - Query cơ bản
   * @param {Object} options.searchParams - Parameters từ middleware
   * @param {Array} options.searchFields - Các trường để search
   * @param {Object} options.dateRange - Date range config
   * @param {Object} options.numericRange - Numeric range config
   * @param {string} options.tableAlias - Table alias
   * @returns {Promise<Object>} Kết quả với data và pagination
   */
  static async searchAndFilter(options) {
    const {
      baseQuery,
      searchParams,
      searchFields = [],
      dateRange = {},
      numericRange = {},
      tableAlias = ''
    } = options;

    try {
      // Build advanced query
      const queryOptions = {
        baseQuery,
        searchFields,
        searchTerm: searchParams.search,
        filters: searchParams.filters,
        dateRange,
        numericRange,
        sortBy: searchParams.sortBy,
        sortOrder: searchParams.sortOrder,
        page: searchParams.page,
        limit: searchParams.limit,
        tableAlias
      };

      const { query, params, countQuery, countParams } = buildAdvancedQuery(queryOptions);

      // Execute queries
      const [dataResults, countResults] = await Promise.all([
        db.promise().query(query, params),
        db.promise().query(countQuery, countParams)
      ]);

      const data = dataResults[0];
      const total = countResults[0][0]?.total || 0;

      return {
        data,
        total,
        page: searchParams.page,
        limit: searchParams.limit,
        totalPages: Math.ceil(total / searchParams.limit)
      };
    } catch (error) {
      //console.error('🚀 ~ SearchFilterService.searchAndFilter - Error:', error);
      throw error;
    }
  }

  /**
   * Helper method để tạo response với search/filter
   * @param {Object} res - Express response object
   * @param {Object} result - Kết quả từ searchAndFilter
   * @param {string} message - Success message
   * @returns {Object} Response object
   */
  static createSearchResponse(res, result, message = 'Data retrieved successfully') {
    return createResponse(
      res,
      200,
      true,
      result.data,
      message,
      result.total,
      result.page,
      result.limit
    );
  }
}

/**
 * Predefined search configurations cho các entity
 */
const SearchConfigs = {
  // Supplier search config
  SUPPLIER: {
    baseQuery: 'SELECT * FROM suppliers',
    searchFields: ['supplier_name', 'contact_person', 'email', 'phone'],
    dateRange: { field: 'created_at' },
    tableAlias: ''
  },

  // Customer search config
  CUSTOMER: {
    baseQuery: 'SELECT * FROM customers',
    searchFields: ['customer_name', 'email', 'phone'],
    dateRange: { field: 'created_at' },
    numericRange: { field: 'total_expenditure' },
    tableAlias: ''
  },

  // Product search config
  PRODUCT: {
    baseQuery: 'SELECT p.*, c.category_name FROM products p LEFT JOIN categories c ON p.category_id = c.category_id',
    searchFields: ['p.product_name', 'p.sku', 'p.description'],
    dateRange: { field: 'p.created_at' },
    numericRange: { field: 'p.product_retail_price' },
    tableAlias: 'p'
  },

  // Order search config
  ORDER: {
    baseQuery: 'SELECT o.*, c.customer_name FROM orders o LEFT JOIN customers c ON o.customer_id = c.customer_id',
    searchFields: ['o.order_code', 'o.note'],
    dateRange: { field: 'o.order_date' },
    numericRange: { field: 'o.final_amount' },
    tableAlias: 'o'
  },

  // Invoice search config
  INVOICE: {
    baseQuery: 'SELECT i.*, c.customer_name FROM invoices i LEFT JOIN customers c ON i.customer_id = c.customer_id',
    searchFields: ['i.invoice_code', 'i.note'],
    dateRange: { field: 'i.issued_date' },
    numericRange: { field: 'i.final_amount' },
    tableAlias: 'i'
  },

  // Transaction search config
  TRANSACTION: {
    baseQuery: 'SELECT t.*, c.customer_name, s.supplier_name FROM transactions t LEFT JOIN customers c ON t.customer_id = c.customer_id LEFT JOIN suppliers s ON t.supplier_id = s.supplier_id',
    searchFields: ['t.transaction_code', 't.description'],
    dateRange: { field: 't.created_at' },
    numericRange: { field: 't.amount' },
    tableAlias: 't'
  },

  // Purchase Order search config
  PURCHASE_ORDER: {
    baseQuery: 'SELECT po.*, s.supplier_name, w.warehouse_name FROM purchase_orders po LEFT JOIN suppliers s ON po.supplier_id = s.supplier_id LEFT JOIN warehouses w ON po.warehouse_id = w.warehouse_id',
    searchFields: ['po.po_id', 'po.note'],
    dateRange: { field: 'po.created_at' },
    numericRange: { field: 'po.total_amount' },
    tableAlias: 'po'
  },

  // Inventory search config
  INVENTORY: {
    baseQuery: 'SELECT i.*, p.product_name, p.sku, w.warehouse_name FROM inventories i LEFT JOIN products p ON i.product_id = p.product_id LEFT JOIN warehouses w ON i.warehouse_id = w.warehouse_id',
    searchFields: ['p.product_name', 'p.sku'],
    numericRange: { field: 'i.quantity' },
    tableAlias: 'i'
  }
};

/**
 * Helper functions cho từng entity
 */
const EntityHelpers = {
  /**
   * Search suppliers với filter
   */
  searchSuppliers: async (searchParams) => {
    return await SearchFilterService.searchAndFilter({
      ...SearchConfigs.SUPPLIER,
      searchParams
    });
  },

  /**
   * Search customers với filter
   */
  searchCustomers: async (searchParams) => {
    return await SearchFilterService.searchAndFilter({
      ...SearchConfigs.CUSTOMER,
      searchParams
    });
  },

  /**
   * Search products với filter
   */
  searchProducts: async (searchParams) => {
    return await SearchFilterService.searchAndFilter({
      ...SearchConfigs.PRODUCT,
      searchParams
    });
  },

  /**
   * Search orders với filter
   */
  searchOrders: async (searchParams) => {
    return await SearchFilterService.searchAndFilter({
      ...SearchConfigs.ORDER,
      searchParams
    });
  },

  /**
   * Search invoices với filter
   */
  searchInvoices: async (searchParams) => {
    return await SearchFilterService.searchAndFilter({
      ...SearchConfigs.INVOICE,
      searchParams
    });
  },

  /**
   * Search transactions với filter
   */
  searchTransactions: async (searchParams) => {
    return await SearchFilterService.searchAndFilter({
      ...SearchConfigs.TRANSACTION,
      searchParams
    });
  },

  /**
   * Search purchase orders với filter
   */
  searchPurchaseOrders: async (searchParams) => {
    return await SearchFilterService.searchAndFilter({
      ...SearchConfigs.PURCHASE_ORDER,
      searchParams
    });
  },

  /**
   * Search inventories với filter
   */
  searchInventories: async (searchParams) => {
    return await SearchFilterService.searchAndFilter({
      ...SearchConfigs.INVENTORY,
      searchParams
    });
  }
};

module.exports = {
  SearchFilterService,
  SearchConfigs,
  EntityHelpers
}; 