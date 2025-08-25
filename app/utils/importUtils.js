const { v4: uuidv4 } = require('uuid');

/**
 * Generic Import Utils - Hỗ trợ import cho customers, categories, products, suppliers
 */

class ImportUtils {
  /**
   * Parse text data thành array
   * @param {string} textData - Dữ liệu text
   * @param {string} delimiter - Ký tự phân cách
   * @returns {Array} - Array of rows
   */
  static parseTextData(textData, delimiter = '\t') {
    const lines = textData.trim().split('\n');
    if (lines.length < 2) {
      throw new Error('Dữ liệu phải có ít nhất 1 dòng header và 1 dòng dữ liệu');
    }
    return lines;
  }

  /**
   * Validate headers theo entity type
   * @param {Array} headers - Headers từ file
   * @param {string} entityType - Loại entity (customers, categories, products, suppliers)
   * @returns {Object} - Validation result
   */
  static validateHeaders(headers, entityType) {
    const configs = {
      customers: {
        required: ['customer_name', 'phone'],
        optional: ['email', 'status', 'total_expenditure', 'total_orders', 'debt'],
        all: ['customer_name', 'email', 'phone', 'status', 'total_expenditure', 'total_orders', 'debt']
      },
      categories: {
        required: ['category_name'],
        optional: ['status'],
        all: ['category_name', 'status']
      },
      products: {
        required: ['product_name', 'sku'],
        optional: ['product_desc', 'product_retail_price', 'product_note', 'product_barcode', 'is_active', 'category_id'],
        all: ['product_name', 'sku', 'product_desc', 'product_retail_price', 'product_note', 'product_barcode', 'is_active', 'category_id']
      },
      suppliers: {
        required: ['supplier_name'],
        optional: ['payable', 'contact_person', 'phone', 'email', 'address'],
        all: ['supplier_name', 'payable', 'contact_person', 'phone', 'email', 'address']
      }
    };

    const config = configs[entityType];
    if (!config) {
      throw new Error(`Entity type '${entityType}' không được hỗ trợ`);
    }

    const normalizedHeaders = headers.map(h => h.trim().toLowerCase());
    const missingRequired = config.required.filter(header => 
      !normalizedHeaders.includes(header)
    );

    if (missingRequired.length > 0) {
      throw new Error(`Thiếu các cột bắt buộc cho ${entityType}: ${missingRequired.join(', ')}`);
    }

    return {
      config,
      normalizedHeaders,
      headerMap: this.createHeaderMap(headers, normalizedHeaders)
    };
  }

  /**
   * Tạo header map
   * @param {Array} headers - Original headers
   * @param {Array} normalizedHeaders - Normalized headers
   * @returns {Object} - Header mapping
   */
  static createHeaderMap(headers, normalizedHeaders) {
    const headerMap = {};
    headers.forEach((header, index) => {
      headerMap[normalizedHeaders[index]] = index;
    });
    return headerMap;
  }

  /**
   * Extract value từ row
   * @param {Array} row - Row data
   * @param {Object} headerMap - Header mapping
   * @param {string} fieldName - Field name
   * @returns {string} - Extracted value
   */
  static extractValue(row, headerMap, fieldName) {
    const index = headerMap[fieldName];
    if (index !== undefined && row[index] !== undefined) {
      return row[index].toString().trim();
    }
    return '';
  }

  /**
   * Extract number từ row
   * @param {Array} row - Row data
   * @param {Object} headerMap - Header mapping
   * @param {string} fieldName - Field name
   * @returns {number} - Extracted number
   */
  static extractNumber(row, headerMap, fieldName) {
    const value = this.extractValue(row, headerMap, fieldName);
    if (value === '') return 0;
    
    const num = parseFloat(value.replace(/[^\d.-]/g, ''));
    return isNaN(num) ? 0 : num;
  }

  /**
   * Validate data theo entity type
   * @param {Object} rowData - Row data object
   * @param {string} entityType - Entity type
   * @param {number} rowNumber - Row number for error reporting
   * @returns {Array} - Array of errors
   */
  static validateRowData(rowData, entityType, rowNumber) {
    const errors = [];

    // Common validations
    if (rowData.email && rowData.email !== '') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(rowData.email)) {
        errors.push('Email không đúng định dạng');
      }
    }

    if (rowData.phone && rowData.phone !== '') {
      const phoneRegex = /^[0-9+\-\s()]+$/;
      if (!phoneRegex.test(rowData.phone)) {
        errors.push('Số điện thoại chỉ được chứa số, dấu +, -, (), và khoảng trắng');
      }
    }

    // Entity-specific validations
    switch (entityType) {
      case 'customers':
        if (!rowData.customer_name) {
          errors.push('Tên khách hàng không được để trống');
        }
        if (!rowData.phone) {
          errors.push('Số điện thoại không được để trống');
        }
        if (rowData.total_expenditure < 0) {
          errors.push('Tổng chi tiêu không được âm');
        }
        if (rowData.total_orders < 0) {
          errors.push('Tổng đơn hàng không được âm');
        }
        if (rowData.debt < 0) {
          errors.push('Công nợ không được âm');
        }
        break;

      case 'categories':
        if (!rowData.category_name) {
          errors.push('Tên danh mục không được để trống');
        }
        if (rowData.status && !['active', 'inactive'].includes(rowData.status)) {
          errors.push('Status phải là active hoặc inactive');
        }
        break;

      case 'products':
        if (!rowData.product_name) {
          errors.push('Tên sản phẩm không được để trống');
        }
        if (!rowData.sku) {
          errors.push('SKU không được để trống');
        }
        if (rowData.product_retail_price < 0) {
          errors.push('Giá bán lẻ không được âm');
        }
        if (rowData.is_active !== undefined && ![0, 1, '0', '1', true, false].includes(rowData.is_active)) {
          errors.push('is_active phải là 0, 1, true hoặc false');
        }
        break;

      case 'suppliers':
        if (!rowData.supplier_name) {
          errors.push('Tên nhà cung cấp không được để trống');
        }
        break;
    }

    return errors;
  }

  /**
   * Transform row data thành database format
   * @param {Object} rowData - Raw row data
   * @param {string} entityType - Entity type
   * @returns {Object} - Transformed data
   */
  static transformRowData(rowData, entityType) {
    const baseData = {
      created_at: new Date(),
      updated_at: new Date()
    };

    switch (entityType) {
      case 'customers':
        return {
          customer_id: uuidv4(),
          customer_name: rowData.customer_name,
          email: rowData.email || null,
          phone: rowData.phone,
          status: rowData.status || 'active',
          total_expenditure: parseFloat(rowData.total_expenditure) || 0,
          total_orders: parseInt(rowData.total_orders) || 0,
          debt: parseFloat(rowData.debt) || 0,
          ...baseData
        };

      case 'categories':
        return {
          category_id: uuidv4(),
          category_name: rowData.category_name,
          status: rowData.status || 'active'
        };

      case 'products':
        return {
          product_id: uuidv4(),
          sku: rowData.sku,
          product_name: rowData.product_name,
          product_desc: rowData.product_desc || null,
          product_image: rowData.product_image || null,
          product_retail_price: parseFloat(rowData.product_retail_price) || 0,
          product_note: rowData.product_note || null,
          product_barcode: rowData.product_barcode || null,
          is_active: this.parseBoolean(rowData.is_active, true),
          category_id: rowData.category_id || null,
          ...baseData
        };

      case 'suppliers':
        return {
          supplier_id: uuidv4(),
          supplier_name: rowData.supplier_name,
          contact_person: rowData.contact_person || null,
          phone: rowData.phone || null,
          email: rowData.email || null,
          address: rowData.address || null,
          ...baseData
        };

      default:
        throw new Error(`Entity type '${entityType}' không được hỗ trợ`);
    }
  }

  /**
   * Parse boolean value
   * @param {any} value - Value to parse
   * @param {boolean} defaultValue - Default value
   * @returns {boolean} - Parsed boolean
   */
  static parseBoolean(value, defaultValue = false) {
    if (value === undefined || value === null || value === '') {
      return defaultValue;
    }
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') {
      const lower = value.toLowerCase();
      if (['true', '1', 'yes', 'on'].includes(lower)) return true;
      if (['false', '0', 'no', 'off'].includes(lower)) return false;
    }
    if (typeof value === 'number') return value !== 0;
    return defaultValue;
  }

  /**
   * Tạo template cho entity type
   * @param {string} entityType - Entity type
   * @returns {string} - Template string
   */
  static createTemplate(entityType) {
    const templates = {
      customers: `customer_name\temail\tphone\tstatus\ttotal_expenditure\ttotal_orders\tdebt
Nguyễn Văn A\tnguyenvana@email.com\t0123456789\tactive\t1000000\t5\t0
Trần Thị B\ttranthib@email.com\t0987654321\tactive\t2000000\t3\t500000
Lê Văn C\tlevanc@email.com\t0369852147\tactive\t1500000\t2\t0

Hướng dẫn:
- Copy dữ liệu từ Excel và paste vào đây
- Các cột bắt buộc: customer_name, phone
- Các cột tùy chọn: email, status, total_expenditure, total_orders, debt
- Sử dụng Tab (\\t) làm ký tự phân cách
- Dòng trống sẽ được bỏ qua`,

      categories: `category_name\tstatus
Điện tử\tactive
Thời trang\tactive
Sách vở\tactive
Thực phẩm\tactive

Hướng dẫn:
- Copy dữ liệu từ Excel và paste vào đây
- Các cột bắt buộc: category_name
- Các cột tùy chọn: status (active/inactive)
- Sử dụng Tab (\\t) làm ký tự phân cách
- Dòng trống sẽ được bỏ qua`,

      products: `product_name\tsku\tproduct_desc\tproduct_retail_price\tproduct_note\tproduct_barcode\tis_active\tcategory_id
iPhone 15\tIPH-15-001\tĐiện thoại Apple mới nhất\t25000000\tHàng chính hãng\t1234567890123\t1\tcategory-uuid-here
MacBook Pro\tMBP-14-001\tLaptop cao cấp\t45000000\tMáy tính xách tay\t9876543210987\t1\tcategory-uuid-here
Samsung Galaxy\tSGL-24-001\tĐiện thoại Android\t18000000\tHàng nhập khẩu\t4567891234567\t1\tcategory-uuid-here

Hướng dẫn:
- Copy dữ liệu từ Excel và paste vào đây
- Các cột bắt buộc: product_name, sku
- Các cột tùy chọn: product_desc, product_retail_price, product_note, product_barcode, is_active, category_id
- Sử dụng Tab (\\t) làm ký tự phân cách
- is_active: 1 (active) hoặc 0 (inactive)
- category_id: UUID của category (có thể để trống)
- Dòng trống sẽ được bỏ qua`,

      suppliers: `supplier_name	payable	contact_person	phone	email	address
Công ty ABC	1000000	Nguyễn Văn A	0123456789	abc@company.com	123 Đường ABC, Quận 1, TP.HCM
Công ty XYZ	0	Trần Thị B	0987654321	xyz@company.com	456 Đường XYZ, Quận 2, TP.HCM
Công ty DEF	-500000	Lê Văn C	0369852147	def@company.com	789 Đường DEF, Quận 3, TP.HCM

Hướng dẫn:
- Copy dữ liệu từ Excel và paste vào đây
- Các cột bắt buộc: supplier_name
- Các cột tùy chọn: payable, contact_person, phone, email, address
- payable: số tiền công nợ đầu kỳ (dương: phải trả, âm: NCC nợ lại)
- Sử dụng Tab (\\t) làm ký tự phân cách
- Dòng trống sẽ được bỏ qua`
    };

    return templates[entityType] || 'Template không tồn tại cho entity type này';
  }

  /**
   * Get supported entity types
   * @returns {Array} - Array of supported entity types
   */
  static getSupportedEntityTypes() {
    return ['customers', 'categories', 'products', 'suppliers'];
  }

  /**
   * Get entity config
   * @param {string} entityType - Entity type
   * @returns {Object} - Entity configuration
   */
  static getEntityConfig(entityType) {
    const configs = {
      customers: {
        tableName: 'customers',
        primaryKey: 'customer_id',
        uniqueFields: ['phone'],
        displayName: 'Khách Hàng'
      },
      categories: {
        tableName: 'categories',
        primaryKey: 'category_id',
        uniqueFields: ['category_name'],
        displayName: 'Danh Mục'
      },
      products: {
        tableName: 'products',
        primaryKey: 'product_id',
        uniqueFields: ['sku'],
        displayName: 'Sản Phẩm'
      },
      suppliers: {
        tableName: 'suppliers',
        primaryKey: 'supplier_id',
        uniqueFields: ['supplier_name'],
        displayName: 'Nhà Cung Cấp'
      }
    };

    return configs[entityType];
  }
}

module.exports = ImportUtils; 