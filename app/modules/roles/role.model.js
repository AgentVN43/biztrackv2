const db = require("../../config/db.config").promise();
const { v4: uuidv4 } = require("uuid");

const RoleModel = {
  /**
   * Lấy tất cả vai trò có phân trang.
   * @param {number} skip - Số lượng bản ghi bỏ qua (offset).
   * @param {number} limit - Số lượng bản ghi cần lấy (limit).
   * @param {Object} filters - Bộ lọc tìm kiếm.
   * @returns {Promise<{roles: Array<Object>, total: number}>} Promise giải quyết với danh sách vai trò và tổng số lượng.
   */
  getAllRoles: async (skip, limit, filters = {}) => {
    const selectClause = `
        SELECT
            r.role_id, r.role_name, r.role_description,
            r.created_at, r.updated_at,
            COUNT(u.user_id) as user_count
        FROM roles r
        LEFT JOIN users u ON r.role_id = u.role_id
    `;

    let whereClause = "";
    const whereParams = [];

    // Filter by search term
    if (filters.search) {
      whereClause += ` AND (r.role_name LIKE ? OR r.role_description LIKE ?)`;
      const searchTerm = `%${filters.search}%`;
      whereParams.push(searchTerm, searchTerm);
    }

    // Filter by date range
    if (filters.startDate && filters.endDate) {
      whereClause += ` AND DATE(r.created_at) BETWEEN DATE(?) AND DATE(?)`;
      whereParams.push(filters.startDate);
      whereParams.push(filters.endDate);
    } else if (filters.startDate) {
      whereClause += ` AND DATE(r.created_at) >= DATE(?)`;
      whereParams.push(filters.startDate);
    } else if (filters.endDate) {
      whereClause += ` AND DATE(r.created_at) <= DATE(?)`;
      whereParams.push(filters.endDate);
    }

    const finalWhereClause = whereClause
      ? `WHERE ${whereClause.substring(5)}`
      : "";
    const groupClause = `GROUP BY r.role_id, r.role_name, r.role_description, r.created_at, r.updated_at`;
    const orderClause = `ORDER BY r.created_at DESC`;
    const limitClause = `LIMIT ?, ?`;
    const limitParams = [skip, limit];

    const sql = `
        ${selectClause}
        ${finalWhereClause}
        ${groupClause}
        ${orderClause}
        ${limitClause}
    `;
    const queryParams = [...whereParams, ...limitParams];

    const countSql = `
        SELECT COUNT(DISTINCT r.role_id) AS total
        FROM roles r
        ${finalWhereClause}
    `;
    const countParams = [...whereParams];

    try {
      const [roles] = await db.query(sql, queryParams);
      const [countResult] = await db.query(countSql, countParams);
      const total = countResult[0].total;

      return { roles, total };
    } catch (err) {
      throw err;
    }
  },

  /**
   * Lấy vai trò theo ID.
   * @param {string} id - ID vai trò.
   * @returns {Promise<Object|null>} Promise giải quyết với đối tượng vai trò hoặc null nếu không tìm thấy.
   */
  getRoleById: async (id) => {
    try {
      const sql = `
        SELECT
          role_id, role_name, role_description, is_active, created_at, updated_at
        FROM roles
        WHERE role_id = ?
      `;
      const [results] = await db.query(sql, [id]);
      return results.length ? results[0] : null;
    } catch (err) {
      throw err;
    }
  },

  /**
   * Lấy vai trò theo tên.
   * @param {string} roleName - Tên vai trò.
   * @returns {Promise<Object|null>} Promise giải quyết với đối tượng vai trò hoặc null nếu không tìm thấy.
   */
  getRoleByName: async (roleName) => {
    try {
      const sql = `
        SELECT
          role_id, role_name, role_description, is_active, created_at, updated_at
        FROM roles
        WHERE role_name = ?
      `;
      const [results] = await db.query(sql, [roleName]);
      return results.length ? results[0] : null;
    } catch (err) {
      throw err;
    }
  },

  /**
   * Tạo vai trò mới.
   * @param {Object} roleData - Dữ liệu vai trò.
   * @returns {Promise<Object>} Promise giải quyết với kết quả tạo vai trò (bao gồm role_id).
   */
  createRole: async (roleData) => {
    const { role_name, role_description } = roleData;

    try {
      const role_id = uuidv4();

      const sql = `
        INSERT INTO roles (
          role_id, role_name, role_description
        ) VALUES (?, ?, ?)
      `;
      const values = [role_id, role_name, role_description];

      await db.query(sql, values);
      return { role_id, role_name, role_description };
    } catch (err) {
      throw err;
    }
  },

  /**
   * Cập nhật vai trò.
   * @param {string} id - ID vai trò.
   * @param {Object} roleData - Dữ liệu cập nhật vai trò.
   * @returns {Promise<Object>} Promise giải quyết với kết quả cập nhật.
   */
  updateRole: async (id, roleData) => {
    const { role_name, role_description } = roleData;

    try {
      const sql = `
        UPDATE roles SET
          role_name = ?, role_description = ?, updated_at = NOW()
        WHERE role_id = ?
      `;
      const values = [role_name, role_description, id];

      const [results] = await db.query(sql, values);
      return results;
    } catch (err) {
      throw err;
    }
  },

  /**
   * Xóa vai trò.
   * @param {string} id - ID vai trò.
   * @returns {Promise<Object>} Promise giải quyết với kết quả xóa.
   */
  deleteRole: async (id) => {
    try {
      const sql = "DELETE FROM roles WHERE role_id = ?";
      const [results] = await db.query(sql, [id]);
      return results;
    } catch (err) {
      throw err;
    }
  },

  /**
   * Kiểm tra tên vai trò đã tồn tại chưa.
   * @param {string} roleName - Tên vai trò cần kiểm tra.
   * @param {string} excludeRoleId - ID vai trò cần loại trừ (dùng cho update).
   * @returns {Promise<boolean>} Promise giải quyết với true nếu tên vai trò đã tồn tại, false nếu chưa.
   */
  checkRoleNameExists: async (roleName, excludeRoleId = null) => {
    try {
      let sql = "SELECT COUNT(*) as count FROM roles WHERE role_name = ?";
      let params = [roleName];

      if (excludeRoleId) {
        sql += " AND role_id != ?";
        params.push(excludeRoleId);
      }

      const [results] = await db.query(sql, params);
      return results[0].count > 0;
    } catch (err) {
      throw err;
    }
  },

  /**
   * Lấy danh sách người dùng thuộc vai trò.
   * @param {string} roleId - ID vai trò.
   * @returns {Promise<Array<Object>>} Promise giải quyết với danh sách người dùng.
   */
  getUsersByRole: async (roleId) => {
    try {
      const sql = `
        SELECT
          u.user_id, u.username, u.email, u.full_name, u.phone,
          u.is_active, u.created_at
        FROM users u
        WHERE u.role_id = ?
        ORDER BY u.created_at DESC
      `;
      const [results] = await db.query(sql, [roleId]);
      return results;
    } catch (err) {
      throw err;
    }
  },

  /**
   * Đếm số lượng người dùng thuộc vai trò.
   * @param {string} roleId - ID vai trò.
   * @returns {Promise<number>} Promise giải quyết với số lượng người dùng.
   */
  countUsersByRole: async (roleId) => {
    try {
      const sql = `
        SELECT COUNT(*) as count
        FROM users
        WHERE role_id = ?
      `;
      const [results] = await db.query(sql, [roleId]);
      return results[0].count;
    } catch (err) {
      throw err;
    }
  },

  /**
   * Lấy tất cả vai trò đang hoạt động.
   * @returns {Promise<Array<Object>>} Promise giải quyết với danh sách vai trò đang hoạt động.
   */
  getActiveRoles: async () => {
    try {
      const sql = `
        SELECT
          role_id, role_name, role_description
        FROM roles
        WHERE is_active = 1
        ORDER BY role_name
      `;
      const [results] = await db.query(sql);
      return results;
    } catch (err) {
      throw err;
    }
  },

  /**
   * Cập nhật trạng thái hoạt động của vai trò.
   * @param {string} roleId - ID vai trò.
   * @param {boolean} isActive - Trạng thái hoạt động.
   * @returns {Promise<Object>} Promise giải quyết với kết quả cập nhật.
   */
  updateRoleStatus: async (roleId, isActive) => {
    try {
      const sql = `
        UPDATE roles SET
          is_active = ?, updated_at = NOW()
        WHERE role_id = ?
      `;
      const [results] = await db.query(sql, [isActive ? 1 : 0, roleId]);
      return results;
    } catch (err) {
      throw err;
    }
  },
};

module.exports = RoleModel;
