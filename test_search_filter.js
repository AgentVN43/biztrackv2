/**
 * Test file để demo search/filter functionality
 * Chạy với: node test_search_filter.js
 */

const { buildAdvancedQuery, parseQueryParams, validateSearchParams } = require('./app/utils/searchFilterUtils');

console.log('🔍 Testing Search & Filter Functionality\n');

// Test 1: Parse Query Parameters
console.log('📋 Test 1: Parse Query Parameters');
const mockReq = {
  query: {
    search: 'ABC Company',
    page: '2',
    limit: '15',
    sortBy: 'supplier_name',
    sortOrder: 'DESC',
    email: 'test@example.com',
    phone: '123456789'
  }
};

const parsedParams = parseQueryParams(mockReq);
console.log('Parsed params:', JSON.stringify(parsedParams, null, 2));
console.log('');

// Test 2: Validate Parameters
console.log('📋 Test 2: Validate Parameters');
const allowedSearchFields = ['supplier_name', 'contact_person', 'email', 'phone'];
const allowedSortFields = ['supplier_name', 'created_at', 'updated_at'];
const allowedFilters = {
  supplier_name: true,
  contact_person: true,
  email: true,
  phone: true
};

const validatedParams = validateSearchParams(
  parsedParams,
  allowedSearchFields,
  allowedSortFields,
  allowedFilters
);
console.log('Validated params:', JSON.stringify(validatedParams, null, 2));
console.log('');

// Test 3: Build Advanced Query
console.log('📋 Test 3: Build Advanced Query');
const queryOptions = {
  baseQuery: 'SELECT * FROM suppliers',
  searchFields: ['supplier_name', 'contact_person', 'email', 'phone'],
  searchTerm: 'ABC Company',
  filters: {
    email: 'test@example.com',
    phone: '123456789'
  },
  dateRange: {
    field: 'created_at',
    startDate: '2024-01-01',
    endDate: '2024-12-31'
  },
  sortBy: 'supplier_name',
  sortOrder: 'DESC',
  page: 2,
  limit: 15,
  tableAlias: ''
};

const { query, params, countQuery, countParams } = buildAdvancedQuery(queryOptions);

console.log('Generated Query:');
console.log(query);
console.log('');
console.log('Query Parameters:', params);
console.log('');
console.log('Count Query:');
console.log(countQuery);
console.log('');
console.log('Count Parameters:', countParams);
console.log('');

// Test 4: Different Scenarios
console.log('📋 Test 4: Different Scenarios');

// Scenario 1: Only search
const scenario1 = buildAdvancedQuery({
  baseQuery: 'SELECT * FROM suppliers',
  searchFields: ['supplier_name'],
  searchTerm: 'ABC',
  page: 1,
  limit: 10
});
console.log('Scenario 1 - Only search:');
console.log(scenario1.query);
console.log('');

// Scenario 2: Only filter
const scenario2 = buildAdvancedQuery({
  baseQuery: 'SELECT * FROM suppliers',
  filters: { email: 'test@example.com' },
  page: 1,
  limit: 10
});
console.log('Scenario 2 - Only filter:');
console.log(scenario2.query);
console.log('');

// Scenario 3: Date range
const scenario3 = buildAdvancedQuery({
  baseQuery: 'SELECT * FROM suppliers',
  dateRange: {
    field: 'created_at',
    startDate: '2024-01-01',
    endDate: '2024-12-31'
  },
  page: 1,
  limit: 10
});
console.log('Scenario 3 - Date range:');
console.log(scenario3.query);
console.log('');

// Scenario 4: Numeric range
const scenario4 = buildAdvancedQuery({
  baseQuery: 'SELECT * FROM products',
  numericRange: {
    field: 'product_retail_price',
    min: 1000,
    max: 5000
  },
  page: 1,
  limit: 10,
  tableAlias: 'p'
});
console.log('Scenario 4 - Numeric range:');
console.log(scenario4.query);
console.log('');

// Test 5: Complex JOIN Query
console.log('📋 Test 5: Complex JOIN Query');
const complexQuery = buildAdvancedQuery({
  baseQuery: 'SELECT p.*, c.category_name FROM products p LEFT JOIN categories c ON p.category_id = c.category_id',
  searchFields: ['p.product_name', 'p.sku'],
  searchTerm: 'iPhone',
  filters: { 'p.category_id': 'cat-123' },
  numericRange: {
    field: 'p.product_retail_price',
    min: 1000,
    max: 5000
  },
  sortBy: 'p.product_retail_price',
  sortOrder: 'DESC',
  page: 1,
  limit: 20,
  tableAlias: 'p'
});

console.log('Complex JOIN Query:');
console.log(complexQuery.query);
console.log('');
console.log('Complex Query Parameters:', complexQuery.params);
console.log('');

console.log('✅ All tests completed successfully!');
console.log('');
console.log('🚀 To test with real API:');
console.log('GET /api/v1/suppliers/search/filter?search=ABC&page=1&limit=10&sortBy=supplier_name&sortOrder=ASC'); 