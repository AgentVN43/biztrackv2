const db = require("../../config/db.config").promise(); // Đảm bảo bạn đang dùng promise()
const { v4: uuidv4 } = require("uuid");

const ProductModel = {
  /**
   * Lấy tất cả sản phẩm có phân trang.
   * @param {number} skip - Số lượng bản ghi bỏ qua (offset).
   * @param {number} limit - Số lượng bản ghi cần lấy (limit).
   * @returns {Promise<{products: Array<Object>, total: number}>} Promise giải quyết với danh sách sản phẩm và tổng số lượng.
   */
  // getAllProducts: async (skip, limit) => {
  //   try {
  //     const sql = `
  //       SELECT
  //         p.product_id, p.product_name, p.product_desc, p.product_image,
  //         p.product_retail_price, p.product_note, p.product_barcode,
  //         p.sku, p.is_active, p.category_id, c.category_name
  //       FROM products p
  //       LEFT JOIN categories c ON p.category_id = c.category_id
  //       LIMIT ?, ?
  //     `;
  //     const [products] = await db.query(sql, [skip, limit]); // Truyền skip, limit đúng thứ tự cho OFFSET, LIMIT

  //     const countSql = `SELECT COUNT(*) AS total FROM products`;
  //     const [countResult] = await db.query(countSql);
  //     const total = countResult[0].total;

  //     return { products, total };
  //   } catch (err) {
  //     console.error("🚀 ~ product.model.js: getAllProducts - Error:", err);
  //     throw err;
  //   }
  // },

  getAllProducts: async (skip, limit, filters = {}) => {
    const selectClause = `
        SELECT
            p.product_id, p.product_name, p.product_desc, p.product_image,
            p.product_retail_price, p.product_note, p.product_barcode,
            p.sku, p.is_active, p.category_id, c.category_name, p.created_at
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.category_id
    `;

    let whereClause = "";
    const whereParams = [];

    if (filters.startDate && filters.endDate) {
      whereClause += ` AND DATE(p.created_at) BETWEEN DATE(?) AND DATE(?)`;
      whereParams.push(filters.startDate);
      whereParams.push(filters.endDate);
    } else if (filters.startDate) {
      whereClause += ` AND DATE(p.created_at) >= DATE(?)`;
      whereParams.push(filters.startDate);
    } else if (filters.endDate) {
      whereClause += ` AND DATE(p.created_at) <= DATE(?)`;
      whereParams.push(filters.endDate);
    }

    const finalWhereClause = whereClause
      ? `WHERE ${whereClause.substring(5)}`
      : "";
    const limitClause = `LIMIT ?, ?`;
    const limitParams = [skip, limit];

    const sql = `
        ${selectClause}
        ${finalWhereClause}
        ${limitClause}
    `;
    const queryParams = [...whereParams, ...limitParams];

    const countSql = `
        SELECT COUNT(*) AS total
        FROM products p
        ${finalWhereClause}
    `;
    const countParams = [...whereParams];

    try {
      console.log("SQL Query:", sql);
      console.log("Query Params:", queryParams);
      const [products] = await db.query(sql, queryParams);

      console.log("Count SQL:", countSql);
      console.log("Count Params:", countParams);
      const [countResult] = await db.query(countSql, countParams);
      const total = countResult[0].total;

      return { products, total };
    } catch (err) {
      console.error("🚀 ~ product.model.js: getAllProducts - Error:", err);
      throw err;
    }
  },

  /**
   * Lấy sản phẩm theo ID.
   * @param {string} id - ID sản phẩm.
   * @returns {Promise<Object|null>} Promise giải quyết với đối tượng sản phẩm hoặc null nếu không tìm thấy.
   */
  getProductById: async (id) => {
    try {
      const sql = `
        SELECT
          p.product_id, p.product_name, p.product_desc, p.product_image,
          p.product_retail_price, p.product_note, p.product_barcode,
          p.sku, p.is_active, p.category_id, c.category_name
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.category_id
        WHERE p.product_id = ?
      `;
      const [results] = await db.query(sql, [id]);
      return results.length ? results[0] : null;
    } catch (err) {
      console.error("🚀 ~ product.model.js: getProductById - Error:", err);
      throw err;
    }
  },

  /**
   * Tạo sản phẩm mới.
   * @param {Object} productData - Dữ liệu sản phẩm.
   * @returns {Promise<Object>} Promise giải quyết với kết quả tạo sản phẩm (bao gồm product_id).
   */
  createProduct: async (productData) => {
    const {
      product_name,
      product_desc,
      product_image,
      product_retail_price,
      product_note,
      product_barcode,
      sku,
      is_active,
      category_id,
    } = productData;

    try {
      // Kiểm tra category_id có tồn tại không
      const [categoryResults] = await db.query(
        "SELECT category_id FROM categories WHERE category_id = ?",
        [category_id]
      );
      if (categoryResults.length === 0) {
        throw new Error("Invalid category_id: Category does not exist");
      }

      const product_id = uuidv4(); // Tạo UUID cho product_id

      const sql = `
        INSERT INTO products (
          product_id, product_name, product_desc, product_image,
          product_retail_price, product_note, product_barcode,
          sku, is_active, category_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      const values = [
        product_id,
        product_name,
        product_desc,
        product_image,
        product_retail_price,
        product_note,
        product_barcode,
        sku,
        is_active,
        category_id,
      ];

      const [results] = await db.query(sql, values);
      return { product_id, affectedRows: results.affectedRows };
    } catch (err) {
      console.error("🚀 ~ product.model.js: createProduct - Error:", err);
      throw err;
    }
  },

  /**
   * Cập nhật sản phẩm.
   * @param {string} id - ID sản phẩm.
   * @param {Object} productData - Dữ liệu cập nhật sản phẩm.
   * @returns {Promise<Object>} Promise giải quyết với kết quả cập nhật.
   */
  updateProduct: async (id, productData) => {
    const {
      product_name,
      product_desc,
      product_image,
      product_retail_price,
      product_note,
      product_barcode,
      sku,
      is_active,
      category_id,
    } = productData;

    try {
      // Kiểm tra category_id có tồn tại không
      const [categoryResults] = await db.query(
        "SELECT category_id FROM categories WHERE category_id = ?",
        [category_id]
      );
      if (categoryResults.length === 0) {
        throw new Error("Invalid category_id: Category does not exist");
      }

      const sql = `
        UPDATE products SET
          product_name = ?, product_desc = ?, product_image = ?,
          product_retail_price = ?, product_note = ?, product_barcode = ?,
          sku = ?, is_active = ?, category_id = ?
        WHERE product_id = ?
      `;
      const values = [
        product_name,
        product_desc,
        product_image,
        product_retail_price,
        product_note,
        product_barcode,
        sku,
        is_active,
        category_id,
        id,
      ];

      const [results] = await db.query(sql, values);
      return results;
    } catch (err) {
      console.error("🚀 ~ product.model.js: updateProduct - Error:", err);
      throw err;
    }
  },

  /**
   * Xóa sản phẩm.
   * @param {string} id - ID sản phẩm.
   * @returns {Promise<Object>} Promise giải quyết với kết quả xóa.
   */
  deleteProduct: async (id) => {
    try {
      const sql = "DELETE FROM products WHERE product_id = ?";
      const [results] = await db.query(sql, [id]);
      return results;
    } catch (err) {
      console.error("🚀 ~ product.model.js: deleteProduct - Error:", err);
      throw err;
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
      const sql = `
        UPDATE products
        SET
          stock = stock + ?,
          reserved_stock = reserved_stock + ?,
          available_stock = available_stock + ?
        WHERE product_id = ?
      `;
      const [result] = await db.query(sql, [
        stockChange,
        reservedChange,
        availableChange,
        product_id,
      ]);
      return result;
    } catch (err) {
      console.error("🚀 ~ product.model.js: updateStockFields - Error:", err);
      throw err;
    }
  },
};

module.exports = ProductModel;
