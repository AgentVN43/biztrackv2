const ImportService = require('../services/importService');
const { createResponse, errorResponse } = require('../utils/response');

/**
 * Generic Import Controller - Hỗ trợ import cho tất cả entity types
 */
class ImportController {
  /**
   * Import data từ text
   * POST /api/v1/import/:entityType
   */
  static async importFromText(req, res) {
    try {
      const { entityType } = req.params;
      const { textData, delimiter = '\t', validateOnly = false } = req.body;

      // Validate entity type
      if (!(await ImportService.getSupportedEntityTypes()).includes(entityType)) {
        return errorResponse(res, `Entity type '${entityType}' không được hỗ trợ`, 400);
      }

      // Validate input
      if (!textData || typeof textData !== 'string') {
        return errorResponse(res, 'Dữ liệu text không hợp lệ', 400);
      }

      console.log('🚀 ~ ImportController.importFromText - Processing:', {
        entityType,
        textDataLength: textData.length,
        delimiter,
        validateOnly
      });

      // Process import
      const result = await ImportService.importFromText(textData, entityType, delimiter, validateOnly);
      
      const entityConfig = await ImportService.getEntityConfig(entityType);
      const message = validateOnly 
        ? `Validation hoàn thành cho ${entityConfig.displayName}: ${result.summary.valid} records hợp lệ, ${result.summary.invalid} lỗi`
        : `Import thành công cho ${entityConfig.displayName}: ${result.summary.valid} records, ${result.summary.invalid} lỗi`;
      
      return createResponse(res, 200, true, result, message);

    } catch (error) {
      console.error('🚀 ~ ImportController.importFromText - Error:', error);
      return errorResponse(res, error.message || 'Lỗi import dữ liệu', 500);
    }
  }

  /**
   * Download template cho entity type
   * GET /api/v1/import/:entityType/template
   */
  static async downloadTemplate(req, res) {
    try {
      const { entityType } = req.params;

      // Validate entity type
      if (!(await ImportService.getSupportedEntityTypes()).includes(entityType)) {
        return errorResponse(res, `Entity type '${entityType}' không được hỗ trợ`, 400);
      }

      const template = await ImportService.createTemplate(entityType);
      const entityConfig = await ImportService.getEntityConfig(entityType);
      
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${entityType}-import-template.txt"`);
      res.send(template);
      
    } catch (error) {
      console.error('🚀 ~ ImportController.downloadTemplate - Error:', error);
      return errorResponse(res, 'Lỗi tạo template', 500);
    }
  }

  /**
   * Get supported entity types
   * GET /api/v1/import/entity-types
   */
  static async getEntityTypes(req, res) {
    try {
      const entityTypes = await ImportService.getSupportedEntityTypes();
      const entityConfigs = await Promise.all(entityTypes.map(async (type) => {
        const config = await ImportService.getEntityConfig(type);
        return {
          type,
          displayName: config.displayName,
          tableName: config.tableName,
          requiredFields: ImportController.getRequiredFields(type),
          optionalFields: ImportController.getOptionalFields(type)
        };
      }));
      return createResponse(res, 200, true, entityConfigs, 'Danh sách entity types được hỗ trợ');
    } catch (error) {
      console.error('🚀 ~ ImportController.getEntityTypes - Error:', error);
      return errorResponse(res, 'Lỗi lấy danh sách entity types', 500);
    }
  }

  /**
   * Get entity config
   * GET /api/v1/import/:entityType/config
   */
  static async getEntityConfig(req, res) {
    try {
      const { entityType } = req.params;

      // Validate entity type
      if (!(await ImportService.getSupportedEntityTypes()).includes(entityType)) {
        return errorResponse(res, `Entity type '${entityType}' không được hỗ trợ`, 400);
      }

      const config = await ImportService.getEntityConfig(entityType);
      const requiredFields = ImportController.getRequiredFields(entityType);
      const optionalFields = ImportController.getOptionalFields(entityType);

      const fullConfig = {
        ...config,
        requiredFields,
        optionalFields,
        allFields: [...requiredFields, ...optionalFields]
      };

      return createResponse(res, 200, true, fullConfig, `Config cho ${config.displayName}`);
      
    } catch (error) {
      console.error('🚀 ~ ImportController.getEntityConfig - Error:', error);
      return errorResponse(res, 'Lỗi lấy entity config', 500);
    }
  }

  /**
   * Helper: Get required fields for entity type
   */
  static getRequiredFields(entityType) {
    const fieldConfigs = {
      customers: ['customer_name', 'phone'],
      categories: ['category_name'],
      products: ['product_name', 'sku'],
      suppliers: ['supplier_name']
    };
    return fieldConfigs[entityType] || [];
  }

  /**
   * Helper: Get optional fields for entity type
   */
  static getOptionalFields(entityType) {
    const fieldConfigs = {
      customers: ['email', 'status', 'total_expenditure', 'total_orders', 'debt'],
      categories: ['status'],
      products: ['product_desc', 'product_retail_price', 'product_note', 'product_barcode', 'is_active', 'category_id'],
      suppliers: ['contact_person', 'phone', 'email', 'address']
    };
    return fieldConfigs[entityType] || [];
  }
}

module.exports = ImportController; 