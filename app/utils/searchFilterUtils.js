/**
 * Utility functions cho search và filter functionality
 * Áp dụng cho các route mới, không ảnh hưởng đến route cũ
 */

/**
 * Tạo SQL WHERE clause cho search text
 * @param {Array} searchFields - Các trường cần search
 * @param {string} searchTerm - Từ khóa tìm kiếm
 * @param {string} tableAlias - Alias của bảng (optional)
 * @returns {Object} { whereClause, params }
 */
const buildSearchClause = (searchFields, searchTerm, tableAlias = '') => {
  if (!searchTerm || !searchFields || searchFields.length === 0) {
    return { whereClause: '', params: [] };
  }

  const alias = tableAlias ? `${tableAlias}.` : '';
  const conditions = searchFields.map(field => 
    `${alias}${field} LIKE ?`
  );
  
  const whereClause = `(${conditions.join(' OR ')})`;
  const params = searchFields.map(() => `%${searchTerm}%`);
  
  return { whereClause, params };
};

/**
 * Tạo SQL WHERE clause cho filter theo trường cụ thể
 * @param {Object} filters - Object chứa các filter { field: value }
 * @param {string} tableAlias - Alias của bảng (optional)
 * @returns {Object} { whereClause, params }
 */
const buildFilterClause = (filters, tableAlias = '') => {
  if (!filters || Object.keys(filters).length === 0) {
    return { whereClause: '', params: [] };
  }

  const alias = tableAlias ? `${tableAlias}.` : '';
  const conditions = [];
  const params = [];

  Object.entries(filters).forEach(([field, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      if (Array.isArray(value)) {
        // Handle IN clause for arrays
        const placeholders = value.map(() => '?').join(', ');
        conditions.push(`${alias}${field} IN (${placeholders})`);
        params.push(...value);
      } else {
        // Handle exact match
        conditions.push(`${alias}${field} = ?`);
        params.push(value);
      }
    }
  });

  const whereClause = conditions.length > 0 ? conditions.join(' AND ') : '';
  return { whereClause, params };
};

/**
 * Tạo SQL WHERE clause cho date range filter
 * @param {string} dateField - Tên trường date
 * @param {string} startDate - Ngày bắt đầu (YYYY-MM-DD)
 * @param {string} endDate - Ngày kết thúc (YYYY-MM-DD)
 * @param {string} tableAlias - Alias của bảng (optional)
 * @returns {Object} { whereClause, params }
 */
const buildDateRangeClause = (dateField, startDate, endDate, tableAlias = '') => {
  if (!startDate && !endDate) {
    return { whereClause: '', params: [] };
  }

  const alias = tableAlias ? `${tableAlias}.` : '';
  const conditions = [];
  const params = [];

  if (startDate) {
    conditions.push(`${alias}${dateField} >= ?`);
    params.push(startDate);
  }

  if (endDate) {
    conditions.push(`${alias}${dateField} <= ?`);
    params.push(endDate + ' 23:59:59'); // Include end of day
  }

  const whereClause = conditions.join(' AND ');
  return { whereClause, params };
};

/**
 * Tạo SQL WHERE clause cho numeric range filter
 * @param {string} field - Tên trường số
 * @param {number} min - Giá trị tối thiểu
 * @param {number} max - Giá trị tối đa
 * @param {string} tableAlias - Alias của bảng (optional)
 * @returns {Object} { whereClause, params }
 */
const buildNumericRangeClause = (field, min, max, tableAlias = '') => {
  if ((min === undefined || min === null) && (max === undefined || max === null)) {
    return { whereClause: '', params: [] };
  }

  const alias = tableAlias ? `${tableAlias}.` : '';
  const conditions = [];
  const params = [];

  if (min !== undefined && min !== null) {
    conditions.push(`${alias}${field} >= ?`);
    params.push(min);
  }

  if (max !== undefined && max !== null) {
    conditions.push(`${alias}${field} <= ?`);
    params.push(max);
  }

  const whereClause = conditions.join(' AND ');
  return { whereClause, params };
};

/**
 * Kết hợp nhiều WHERE clauses
 * @param {Array} clauses - Array các clause objects { whereClause, params }
 * @param {string} operator - Operator để kết hợp (AND/OR)
 * @returns {Object} { whereClause, params }
 */
const combineWhereClauses = (clauses, operator = 'AND') => {
  const validClauses = clauses.filter(clause => clause.whereClause);
  
  if (validClauses.length === 0) {
    return { whereClause: '', params: [] };
  }

  if (validClauses.length === 1) {
    return validClauses[0];
  }

  const whereClause = validClauses.map(clause => `(${clause.whereClause})`).join(` ${operator} `);
  const params = validClauses.flatMap(clause => clause.params);

  return { whereClause, params };
};

/**
 * Tạo ORDER BY clause
 * @param {string} sortBy - Trường để sort
 * @param {string} sortOrder - ASC hoặc DESC
 * @param {string} tableAlias - Alias của bảng (optional)
 * @returns {string} ORDER BY clause
 */
const buildOrderByClause = (sortBy, sortOrder = 'ASC', tableAlias = '') => {
  if (!sortBy) return '';
  
  const alias = tableAlias ? `${tableAlias}.` : '';
  const order = sortOrder.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
  
  return `ORDER BY ${alias}${sortBy} ${order}`;
};

/**
 * Tạo LIMIT và OFFSET cho pagination
 * @param {number} page - Trang hiện tại (bắt đầu từ 1)
 * @param {number} limit - Số items mỗi trang
 * @returns {string} LIMIT OFFSET clause
 */
const buildPaginationClause = (page, limit) => {
  if (!page || !limit) return '';
  
  const offset = (page - 1) * limit;
  return `LIMIT ${limit} OFFSET ${offset}`;
};

/**
 * Tạo SQL query hoàn chỉnh với search, filter, sort và pagination
 * @param {Object} options - Các options cho query
 * @param {string} options.baseQuery - Query cơ bản (SELECT ... FROM ...)
 * @param {Array} options.searchFields - Các trường để search
 * @param {string} options.searchTerm - Từ khóa tìm kiếm
 * @param {Object} options.filters - Object chứa các filter
 * @param {Object} options.dateRange - { field, startDate, endDate }
 * @param {Object} options.numericRange - { field, min, max }
 * @param {string} options.sortBy - Trường để sort
 * @param {string} options.sortOrder - ASC hoặc DESC
 * @param {number} options.page - Trang hiện tại
 * @param {number} options.limit - Số items mỗi trang
 * @param {string} options.tableAlias - Alias của bảng
 * @returns {Object} { query, params, countQuery, countParams }
 */
const buildAdvancedQuery = (options) => {
  const {
    baseQuery,
    searchFields = [],
    searchTerm = '',
    filters = {},
    dateRange = {},
    numericRange = {},
    sortBy = '',
    sortOrder = 'ASC',
    page = 1,
    limit = 10,
    tableAlias = ''
  } = options;

  // Build WHERE clauses
  const clauses = [];
  
  // Search clause
  if (searchTerm && searchFields.length > 0) {
    clauses.push(buildSearchClause(searchFields, searchTerm, tableAlias));
  }
  
  // Filter clause
  if (Object.keys(filters).length > 0) {
    clauses.push(buildFilterClause(filters, tableAlias));
  }
  
  // Date range clause
  if (dateRange.field && (dateRange.startDate || dateRange.endDate)) {
    clauses.push(buildDateRangeClause(
      dateRange.field, 
      dateRange.startDate, 
      dateRange.endDate, 
      tableAlias
    ));
  }
  
  // Numeric range clause
  if (numericRange.field && (numericRange.min !== undefined || numericRange.max !== undefined)) {
    clauses.push(buildNumericRangeClause(
      numericRange.field, 
      numericRange.min, 
      numericRange.max, 
      tableAlias
    ));
  }

  // Combine all clauses
  const { whereClause, params } = combineWhereClauses(clauses);
  
  // Build complete query
  let query = baseQuery;
  if (whereClause) {
    query += ` WHERE ${whereClause}`;
  }
  
  // Add ORDER BY
  if (sortBy) {
    query += ` ${buildOrderByClause(sortBy, sortOrder, tableAlias)}`;
  }
  
  // Add pagination
  if (page && limit) {
    query += ` ${buildPaginationClause(page, limit)}`;
  }

  // Build count query for pagination
  const countQuery = baseQuery.replace(/SELECT .* FROM/, 'SELECT COUNT(*) as total FROM');
  let finalCountQuery = countQuery;
  if (whereClause) {
    finalCountQuery += ` WHERE ${whereClause}`;
  }

  return {
    query,
    params,
    countQuery: finalCountQuery,
    countParams: [...params]
  };
};

/**
 * Parse query parameters từ request
 * @param {Object} req - Express request object
 * @returns {Object} Parsed parameters
 */
const parseQueryParams = (req) => {
  const {
    search = '',
    page = 1,
    limit = 10,
    sortBy = '',
    sortOrder = 'ASC',
    ...filters
  } = req.query;

  // Remove empty filters
  const cleanFilters = {};
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      cleanFilters[key] = value;
    }
  });

  return {
    search: search.trim(),
    page: parseInt(page) || 1,
    limit: parseInt(limit) || 10,
    sortBy: sortBy.trim(),
    sortOrder: sortOrder.toUpperCase() === 'DESC' ? 'DESC' : 'ASC',
    filters: cleanFilters
  };
};

/**
 * Validate và sanitize search parameters
 * @param {Object} params - Parameters từ parseQueryParams
 * @param {Array} allowedSearchFields - Các trường được phép search
 * @param {Array} allowedSortFields - Các trường được phép sort
 * @param {Object} allowedFilters - Các filter được phép
 * @returns {Object} Validated parameters
 */
const validateSearchParams = (params, allowedSearchFields = [], allowedSortFields = [], allowedFilters = {}) => {
  const validated = { ...params };

  // Validate page and limit
  validated.page = Math.max(1, validated.page);
  validated.limit = Math.min(100, Math.max(1, validated.limit)); // Max 100 items per page

  // Validate sortBy
  if (validated.sortBy && allowedSortFields.length > 0) {
    if (!allowedSortFields.includes(validated.sortBy)) {
      validated.sortBy = allowedSortFields[0]; // Default to first allowed field
    }
  }

  // Validate filters
  const validatedFilters = {};
  Object.entries(validated.filters).forEach(([key, value]) => {
    if (allowedFilters[key]) {
      validatedFilters[key] = value;
    }
  });
  validated.filters = validatedFilters;

  return validated;
};

module.exports = {
  buildSearchClause,
  buildFilterClause,
  buildDateRangeClause,
  buildNumericRangeClause,
  combineWhereClauses,
  buildOrderByClause,
  buildPaginationClause,
  buildAdvancedQuery,
  parseQueryParams,
  validateSearchParams
}; 