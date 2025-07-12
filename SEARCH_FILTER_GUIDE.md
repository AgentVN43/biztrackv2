# 🔍 Search & Filter Functionality Guide

## 📋 Tổng quan

Hệ thống search và filter được thiết kế để áp dụng cho các **route mới** mà không ảnh hưởng đến các route cũ. Bao gồm:

- **Search**: Tìm kiếm text trên nhiều trường
- **Filter**: Lọc theo giá trị cụ thể
- **Date Range**: Lọc theo khoảng thời gian
- **Numeric Range**: Lọc theo khoảng số
- **Sort**: Sắp xếp theo trường
- **Pagination**: Phân trang

## 🏗️ Cấu trúc Files

```
app/utils/
├── searchFilterUtils.js      # Core utility functions
├── searchFilterService.js    # Service helper classes
└── response.js              # Response utilities

app/middlewares/
└── searchFilter.middleware.js # Middleware cho validation

app/modules/{entity}/
├── {entity}.routes.js        # Routes (thêm route mới)
└── {entity}.controller.js    # Controller (thêm method mới)
```

## 🚀 Cách sử dụng

### 1. Tạo Route mới với Search/Filter

```javascript
// app/modules/suppliers/supplier.routes.js
const { supplierSearchFilter } = require('../../middlewares/searchFilter.middleware');

// Route cũ (không thay đổi)
router.get('/', supplierController.getAllSuppliers);

// Route mới với search/filter
router.get('/search/filter', supplierSearchFilter, supplierController.searchSuppliersWithFilter);
```

### 2. Thêm Controller Method

```javascript
// app/modules/suppliers/supplier.controller.js
const { EntityHelpers, SearchFilterService } = require('../../utils/searchFilterService');

const SupplierController = {
  // Methods cũ (không thay đổi)
  
  // Method mới
  searchSuppliersWithFilter: async (req, res, next) => {
    try {
      const searchParams = req.searchParams; // Từ middleware
      const result = await EntityHelpers.searchSuppliers(searchParams);
      
      SearchFilterService.createSearchResponse(
        res, 
        result, 
        "Suppliers retrieved successfully with search and filter."
      );
    } catch (error) {
      next(error);
    }
  },
};
```

## 📡 API Endpoints

### Supplier Search/Filter
```
GET /api/v1/suppliers/search/filter?search=abc&page=1&limit=10&sortBy=supplier_name&sortOrder=ASC&email=test@example.com
```

### Query Parameters

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `search` | string | Tìm kiếm text trên các trường được phép | `search=abc` |
| `page` | number | Trang hiện tại (bắt đầu từ 1) | `page=1` |
| `limit` | number | Số items mỗi trang (max 100) | `limit=10` |
| `sortBy` | string | Trường để sắp xếp | `sortBy=supplier_name` |
| `sortOrder` | string | Thứ tự sắp xếp (ASC/DESC) | `sortOrder=ASC` |
| `{field}` | any | Filter theo trường cụ thể | `email=test@example.com` |

### Response Format

```json
{
  "success": true,
  "data": [
    {
      "supplier_id": "uuid",
      "supplier_name": "ABC Company",
      "contact_person": "John Doe",
      "email": "john@abc.com",
      "phone": "123456789",
      "address": "123 Main St",
      "created_at": "2024-01-01T00:00:00.000Z",
      "updated_at": "2024-01-01T00:00:00.000Z"
    }
  ],
  "message": "Suppliers retrieved successfully with search and filter.",
  "pagination": {
    "total": 50,
    "currentPage": 1,
    "pageSize": 10,
    "totalPages": 5
  }
}
```

## 🔧 Cấu hình cho Entity khác

### 1. Tạo Middleware mới

```javascript
// app/middlewares/searchFilter.middleware.js
const customerSearchFilter = searchFilterMiddleware(
  ['customer_name', 'email', 'phone'], // Search fields
  ['customer_name', 'created_at', 'total_expenditure'], // Sort fields
  {
    customer_name: true,
    email: true,
    phone: true,
    status: true
  } // Allowed filters
);
```

### 2. Thêm Search Config

```javascript
// app/utils/searchFilterService.js
const SearchConfigs = {
  CUSTOMER: {
    baseQuery: 'SELECT * FROM customers',
    searchFields: ['customer_name', 'email', 'phone'],
    dateRange: { field: 'created_at' },
    numericRange: { field: 'total_expenditure' },
    tableAlias: ''
  }
};

const EntityHelpers = {
  searchCustomers: async (searchParams) => {
    return await SearchFilterService.searchAndFilter({
      ...SearchConfigs.CUSTOMER,
      searchParams
    });
  }
};
```

### 3. Thêm Route và Controller

```javascript
// app/modules/customers/customer.routes.js
router.get('/search/filter', customerSearchFilter, customerController.searchCustomersWithFilter);

// app/modules/customers/customer.controller.js
searchCustomersWithFilter: async (req, res, next) => {
  const result = await EntityHelpers.searchCustomers(req.searchParams);
  SearchFilterService.createSearchResponse(res, result, "Customers retrieved successfully.");
}
```

## 🛡️ Security & Validation

### Allowed Fields Validation
- Chỉ các trường được định nghĩa trong middleware mới được phép search/filter
- Tự động sanitize và validate input
- Ngăn chặn SQL injection

### Pagination Limits
- `page`: Tối thiểu 1
- `limit`: Tối thiểu 1, tối đa 100
- Tự động điều chỉnh nếu vượt quá giới hạn

### Sort Validation
- Chỉ cho phép sort theo các trường được định nghĩa
- Tự động fallback về trường đầu tiên nếu không hợp lệ

## 📝 Ví dụ sử dụng

### Search đơn giản
```
GET /api/v1/suppliers/search/filter?search=ABC
```

### Filter theo email
```
GET /api/v1/suppliers/search/filter?email=test@example.com
```

### Kết hợp search và filter
```
GET /api/v1/suppliers/search/filter?search=ABC&email=test@example.com&page=1&limit=20
```

### Sort và pagination
```
GET /api/v1/suppliers/search/filter?sortBy=supplier_name&sortOrder=DESC&page=2&limit=15
```

### Date range (nếu được cấu hình)
```
GET /api/v1/suppliers/search/filter?startDate=2024-01-01&endDate=2024-12-31
```

### Numeric range (nếu được cấu hình)
```
GET /api/v1/suppliers/search/filter?minAmount=1000&maxAmount=5000
```

## ⚠️ Lưu ý quan trọng

1. **Không ảnh hưởng route cũ**: Các route hiện tại vẫn hoạt động bình thường
2. **Route mới**: Chỉ áp dụng cho route có pattern `/search/filter`
3. **Validation**: Tất cả input đều được validate và sanitize
4. **Performance**: Sử dụng prepared statements để tránh SQL injection
5. **Pagination**: Luôn trả về thông tin pagination đầy đủ

## 🔄 Migration Guide

### Từ Route cũ sang Route mới

**Trước:**
```javascript
// Route cũ - chỉ lấy tất cả
router.get('/', supplierController.getAllSuppliers);
```

**Sau:**
```javascript
// Giữ nguyên route cũ
router.get('/', supplierController.getAllSuppliers);

// Thêm route mới với search/filter
router.get('/search/filter', supplierSearchFilter, supplierController.searchSuppliersWithFilter);
```

### Frontend Migration

**Trước:**
```javascript
// Chỉ lấy tất cả
const response = await fetch('/api/v1/suppliers');
```

**Sau:**
```javascript
// Với search/filter
const params = new URLSearchParams({
  search: 'ABC',
  page: 1,
  limit: 10,
  sortBy: 'supplier_name',
  sortOrder: 'ASC'
});
const response = await fetch(`/api/v1/suppliers/search/filter?${params}`);
```

## 🐛 Troubleshooting

### Lỗi thường gặp

1. **"Invalid search parameters"**
   - Kiểm tra query parameters có đúng format không
   - Đảm bảo các trường filter được phép

2. **"Field not allowed"**
   - Kiểm tra cấu hình allowed fields trong middleware
   - Đảm bảo field name đúng case

3. **"SQL Error"**
   - Kiểm tra baseQuery có đúng syntax không
   - Đảm bảo table alias được cấu hình đúng

### Debug

```javascript
// Thêm log trong controller
console.log('🔍 Search params:', req.searchParams);
console.log('🔍 Query:', query);
console.log('🔍 Params:', params);
``` 