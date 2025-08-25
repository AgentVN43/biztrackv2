const ImportUtils = require("../utils/importUtils");
const db = require("../config/db.config");
const TransactionService = require("../modules/transactions/transaction.service");

/**
 * Generic Import Service - Hỗ trợ import cho tất cả entity types
 */
class ImportService {
  /**
   * Import data từ text cho bất kỳ entity type nào
   * @param {string} textData - Dữ liệu text
   * @param {string} entityType - Loại entity (customers, categories, products, suppliers)
   * @param {string} delimiter - Ký tự phân cách
   * @param {boolean} validateOnly - Chỉ validate, không insert
   * @returns {Object} - Kết quả import
   */
  static async importFromText(
    textData,
    entityType,
    delimiter = "\t",
    validateOnly = false
  ) {
    try {
      // Validate entity type
      const supportedTypes = this.getSupportedEntityTypes();
      if (!supportedTypes.includes(entityType)) {
        throw new Error(`Entity type '${entityType}' không được hỗ trợ`);
      }

      // Parse text data
      const lines = ImportUtils.parseTextData(textData, delimiter);
      const headers = lines[0].split(delimiter);
      const dataRows = lines.slice(1);

      // Validate headers
      const headerValidation = ImportUtils.validateHeaders(headers, entityType);
      const { headerMap } = headerValidation;

      // Process data rows
      const validData = [];
      const errors = [];
      const summary = {
        total: dataRows.length,
        valid: 0,
        invalid: 0,
        skipped: 0,
      };

      for (let i = 0; i < dataRows.length; i++) {
        const line = dataRows[i].trim();
        if (!line) {
          summary.skipped++;
          continue;
        }

        const values = line.split(delimiter);
        const rowData = {};
        const rowErrors = [];

        // Extract data theo header map
        headerValidation.config.all.forEach((field) => {
          rowData[field] = ImportUtils.extractValue(values, headerMap, field);
        });

        // Validate row data
        const validationErrors = ImportUtils.validateRowData(
          rowData,
          entityType,
          i + 2
        );
        rowErrors.push(...validationErrors);

        // Check for duplicates (chỉ khi không phải validateOnly)
        if (!validateOnly) {
          const duplicateErrors = await this.checkDuplicates(
            rowData,
            entityType
          );
          rowErrors.push(...duplicateErrors);
        }

        // Add to results
        if (rowErrors.length > 0) {
          errors.push({
            row: i + 2,
            errors: rowErrors,
            data: rowData,
          });
          summary.invalid++;
        } else {
          // Transform data for database
          const transformedData = ImportUtils.transformRowData(
            rowData,
            entityType
          );
          validData.push(transformedData);
          summary.valid++;
        }
      }

      // Insert valid data to database (chỉ khi không phải validateOnly)
      let insertedCount = 0;
      let insertedCustomers = [];
      let insertedSuppliers = [];
      if (validData.length > 0 && !validateOnly) {
        try {
          insertedCount = await this.bulkInsert(validData, entityType);
          // Nếu là customers, lưu lại danh sách customer_id và debt để tạo transaction opening_balance
          if (entityType === "customers") {
            insertedCustomers = validData.map((c) => ({
              customer_id: c.customer_id,
              customer_name: c.customer_name,
              phone: c.phone,
              debt: c.debt || 0,
            }));
            console.log("insertedCustomers:", insertedCustomers);
          }
          // Nếu là suppliers, lưu lại supplier_id và payable (nếu header có)
          if (entityType === "suppliers") {
            const headerMap = headerValidation.headerMap;
            insertedSuppliers = lines.slice(1).map((row, idx) => {
              const values = row.split(delimiter);
              const supplier_name = ImportUtils.extractValue(values, headerMap, 'supplier_name');
              if (!supplier_name) return null;
              return {
                supplier_name,
                contact_person: ImportUtils.extractValue(values, headerMap, 'contact_person') || null,
                phone: ImportUtils.extractValue(values, headerMap, 'phone') || null,
                email: ImportUtils.extractValue(values, headerMap, 'email') || null,
                address: ImportUtils.extractValue(values, headerMap, 'address') || null,
                payable: ImportUtils.extractNumber(values, headerMap, 'payable') || 0
              };
            }).filter(Boolean);
          }
        } catch (dbError) {
          //console.error(`🚀 ~ ImportService.importFromText - Database insert failed for ${entityType}:`, dbError);
          throw new Error(`Lỗi lưu dữ liệu: ${dbError.message}`);
        }
      }
      // Sau khi insert customers, tạo invoice opening_balance nếu có debt
      if (
        entityType === "customers" &&
        !validateOnly &&
        insertedCustomers.length > 0
      ) {
        for (const customer of insertedCustomers) {
          const debt = Number(customer.debt || 0);
          if (debt !== 0) {
            const InvoiceService = require("../modules/invoice/invoice.service");
            const invoiceData = {
              invoice_code: `MIG-OB-${
                customer.phone || customer.customer_name
              }`,
              invoice_type: debt > 0 ? "debit_note" : "credit_note",
              customer_id: customer.customer_id,
              total_amount: Math.abs(debt),
              tax_amount: 0,
              discount_amount: 0,
              final_amount: Math.abs(debt),
              issued_date: new Date(),
              due_date: new Date(),
              status: "pending",
              note: `Công nợ đầu kỳ khi chuyển hệ thống: ${
                debt > 0 ? "Nợ" : "Được hoàn"
              } ${Math.abs(debt).toLocaleString("vi-VN")}đ`,
            };
            await InvoiceService.create(invoiceData);
          }
        }
      }

      // Sau khi insert suppliers, tạo purchase_invoice mở đầu kỳ nếu có payable > 0
      if (
        entityType === "suppliers" &&
        !validateOnly &&
        insertedSuppliers.length > 0
      ) {
        try {
          const dbConn = require('../config/db.config');
          const InvoiceService = require("../modules/invoice/invoice.service");
          // Map supplier_name -> supplier_id vừa insert
          const [rows] = await dbConn.promise().query(`SELECT supplier_id, supplier_name FROM suppliers`);
          const nameToId = new Map(rows.map(r => [r.supplier_name, r.supplier_id]));
          for (const s of insertedSuppliers) {
            const amount = Number(s.payable || 0);
            if (!(amount > 0)) continue; // Chỉ tạo hóa đơn cho payable dương
            const supplier_id = nameToId.get(s.supplier_name);
            if (!supplier_id) continue;
            const absAmount = Math.abs(amount);
            const invoiceData = {
              invoice_code: `MIG-OB-SUP-${s.supplier_name}`,
              invoice_type: amount > 0 ? "debit_note" : "credit_note",
              supplier_id,
              total_amount: absAmount,
              tax_amount: 0,
              discount_amount: 0,
              final_amount: absAmount,
              issued_date: new Date(),
              due_date: new Date(),
              status: "pending",
              note: `Công nợ đầu kỳ (supplier) ${amount > 0 ? 'Nợ' : 'Được ghi có'} ${absAmount.toLocaleString('vi-VN')}đ`
            };
            await InvoiceService.create(invoiceData);
          }
        } catch (e) {
          //console.error('Opening payable import error:', e);
        }
      }

      // Sau khi insert customers, tạo transaction opening_balance nếu có debt
      // if (entityType === 'customers' && !validateOnly && insertedCustomers.length > 0) {
      //   for (const customer of insertedCustomers) {
      //     const debt = Number(customer.debt || 0);
      //     if (debt !== 0) {
      //       await TransactionService.createTransaction({
      //         transaction_code: `MIG-OB-${customer.phone || customer.customer_name}`,
      //         type: 'adjustment',
      //         amount: debt,
      //         customer_id: customer.customer_id,
      //         description: 'Công nợ đầu kỳ khi chuyển hệ thống'
      //       });
      //     }
      //   }
      // }

      return {
        summary: {
          ...summary,
          inserted: insertedCount,
          validateOnly: validateOnly,
          entityType: entityType,
        },
        validData,
        errors,
      };
    } catch (error) {
      throw new Error(`Lỗi import dữ liệu cho ${entityType}: ${error.message}`);
    }
  }

  /**
   * Check duplicates cho entity
   * @param {Object} rowData - Row data
   * @param {string} entityType - Entity type
   * @returns {Array} - Array of error messages
   */
  static async checkDuplicates(rowData, entityType) {
    const errors = [];
    const config = ImportUtils.getEntityConfig(entityType);

    if (!config || !config.uniqueFields) {
      return errors;
    }

    for (const field of config.uniqueFields) {
      if (rowData[field]) {
        try {
          const exists = await this.checkFieldExists(
            entityType,
            field,
            rowData[field]
          );
          if (exists) {
            errors.push(
              `${field} '${rowData[field]}' đã tồn tại trong hệ thống`
            );
          }
        } catch (error) {
          //console.warn(`⚠️ Duplicate check skipped for ${field}:`, error.message);
        }
      }
    }

    return errors;
  }

  /**
   * Check if field value exists in database
   * @param {string} entityType - Entity type
   * @param {string} field - Field name
   * @param {string} value - Field value
   * @returns {boolean} - True if exists
   */
  static async checkFieldExists(entityType, field, value) {
    const config = ImportUtils.getEntityConfig(entityType);
    if (!config) return false;

    try {
      const query = `SELECT COUNT(*) as count FROM ${config.tableName} WHERE ${field} = ?`;
      const [results] = await db.promise().query(query, [value]);
      return results[0].count > 0;
    } catch (error) {
      //console.error(`Error checking field exists:`, error);
      return false;
    }
  }

  /**
   * Bulk insert data
   * @param {Array} data - Array of data objects
   * @param {string} entityType - Entity type
   * @returns {number} - Number of inserted records
   */
  static async bulkInsert(data, entityType) {
    if (!data || data.length === 0) {
      return 0;
    }

    const config = ImportUtils.getEntityConfig(entityType);
    if (!config) {
      throw new Error(`Config không tồn tại cho entity type: ${entityType}`);
    }

    // Get fields from first data object
    const fields = Object.keys(data[0]);
    const placeholders = data
      .map(() => `(${fields.map(() => "?").join(", ")})`)
      .join(", ");

    // Flatten data array
    const values = data.flatMap((item) => fields.map((field) => item[field]));

    const query = `
      INSERT INTO ${config.tableName} (${fields.join(", ")}) 
      VALUES ${placeholders}
    `;

    try {
      const [result] = await db.promise().query(query, values);
      return result.affectedRows;
    } catch (error) {
      //console.error(`Bulk insert error for ${entityType}:`, error);
      throw error;
    }
  }

  /**
   * Tạo template cho entity type
   * @param {string} entityType - Entity type
   * @returns {string} - Template string
   */
  static async createTemplate(entityType) {
    return ImportUtils.createTemplate(entityType);
  }

  /**
   * Get supported entity types
   * @returns {Array} - Array of supported entity types
   */
  static getSupportedEntityTypes() {
    return ImportUtils.getSupportedEntityTypes();
  }

  /**
   * Get entity config
   * @param {string} entityType - Entity type
   * @returns {Object} - Entity configuration
   */
  static getEntityConfig(entityType) {
    return ImportUtils.getEntityConfig(entityType);
  }
}

module.exports = ImportService; 
