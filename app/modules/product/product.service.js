const ProductModel = require("../../modules/product/product.model"); // Import ProductModel

const ProductService = {
  /**
   * Lấy tất cả sản phẩm có phân trang.
   * @param {number} skip - Số lượng bản ghi bỏ qua (offset).
   * @param {number} limit - Số lượng bản ghi cần lấy (limit).
   * @returns {Promise<{products: Array<Object>, total: number}>} Promise giải quyết với danh sách sản phẩm và tổng số lượng.
   */
  getAllProducts: async (skip, limit, filters = {}) => {
    try {
      const { products, total } = await ProductModel.getAllProducts(
        skip,
        limit,
        filters
      );
      return { products, total };
    } catch (error) {
      console.error("🚀 ~ product.service.js: getAllProducts - Lỗi:", error);
      throw error; // Ném lỗi để controller xử lý
    }
  },

  /**
   * Lấy sản phẩm theo ID.
   * @param {string} id - ID sản phẩm.
   * @returns {Promise<Object|null>} Promise giải quyết với đối tượng sản phẩm hoặc null nếu không tìm thấy.
   */
  getProductById: async (id) => {
    try {
      const product = await ProductModel.getProductById(id);
      return product;
    } catch (error) {
      console.error("🚀 ~ product.service.js: getProductById - Lỗi:", error);
      throw error;
    }
  },

  /**
   * Tạo sản phẩm mới.
   * @param {Object} productData - Dữ liệu sản phẩm.
   * @returns {Promise<Object>} Promise giải quyết với kết quả tạo sản phẩm.
   */
  createProduct: async (productData) => {
    try {
      // Thêm logic nghiệp vụ nếu cần (ví dụ: kiểm tra trùng lặp SKU, xử lý ảnh...)
      const result = await ProductModel.createProduct(productData);
      return result;
    } catch (error) {
      console.error("🚀 ~ product.service.js: createProduct - Lỗi:", error);
      throw error;
    }
  },

  /**
   * Cập nhật sản phẩm.
   * @param {string} id - ID sản phẩm.
   * @param {Object} productData - Dữ liệu cập nhật sản phẩm.
   * @returns {Promise<Object>} Promise giải quyết với kết quả cập nhật.
   */
  updateProduct: async (id, productData) => {
    try {
      // Thêm logic nghiệp vụ nếu cần
      const result = await ProductModel.updateProduct(id, productData);
      return result;
    } catch (error) {
      console.error("🚀 ~ product.service.js: updateProduct - Lỗi:", error);
      throw error;
    }
  },

  /**
   * Xóa sản phẩm.
   * @param {string} id - ID sản phẩm.
   * @returns {Promise<Object>} Promise giải quyết với kết quả xóa.
   */
  deleteProduct: async (id) => {
    try {
      // Thêm logic nghiệp vụ nếu cần (ví dụ: kiểm tra sản phẩm có đang được sử dụng không)
      const result = await ProductModel.deleteProduct(id);
      return result;
    } catch (error) {
      console.error("🚀 ~ product.service.js: deleteProduct - Lỗi:", error);
      throw error;
    }
  },

  /**
   * Cập nhật các trường tồn kho của sản phẩm.
   * @param {string} product_id - ID sản phẩm.
   * @param {number} stockChange - Thay đổi tổng số lượng tồn kho.
   * @param {number} reservedChange - Thay đổi tồn kho đặt trước.
   * @param {number} availableChange - Thay đổi tồn kho khả dụng.
   * @returns {Promise<Object>} Promise giải quyết với kết quả cập nhật.
   */
  updateStockFields: async (
    product_id,
    stockChange,
    reservedChange,
    availableChange
  ) => {
    try {
      const result = await ProductModel.updateStockFields(
        product_id,
        stockChange,
        reservedChange,
        availableChange
      );
      return result;
    } catch (error) {
      console.error("🚀 ~ product.service.js: updateStockFields - Lỗi:", error);
      throw error;
    }
  },
};

module.exports = ProductService;
