const db = require("../../config/db.config").promise();
const { v4: uuidv4 } = require("uuid");

const PermissionModel = {
  /**
   * Lấy danh sách permission_id hợp lệ từ bảng permissions.
   * @param {Array<string>} permissionIds - Danh sách ID cần kiểm tra.
   * @returns {Promise<Array<string>>} Danh sách permission_id hợp lệ.
   */
  getValidPermissionIds: async (permissionIds) => {
    console.log("🚀 ~ permissionIds:", permissionIds);
    try {
      const [rows] = await db.query(
        "SELECT permission_id FROM permissions WHERE permission_id IN (?)",
        [permissionIds]
      );
      return rows.map((p) => String(p.permission_id));
    } catch (err) {
      throw err;
    }
  },
  /**
   * Lấy tất cả quyền có phân trang.
   * @param {number} skip - Số lượng bản ghi bỏ qua (offset).
   * @param {number} limit - Số lượng bản ghi cần lấy (limit).
   * @param {Object} filters - Bộ lọc tìm kiếm.
   * @returns {Promise<{permissions: Array<Object>, total: number}>} Promise giải quyết với danh sách quyền và tổng số lượng.
   */
  getAllPermissions: async (skip, limit, filters = {}) => {
    const selectClause = `
      SELECT
          p.permission_id,
          p.permission_name,
          p.permission_code,
          p.group_code,
          p.group_name,
          p.description,
          p.created_at,
          p.updated_at
      FROM permissions p
  `;

    let whereClause = "";
    const whereParams = [];

    // --- Bộ lọc ---
    // if (filters.search) {
    //   whereClause += ` AND (p.permission_name LIKE ? OR p.permission_code LIKE ? OR p.description LIKE ?)`;
    //   const searchTerm = `%${filters.search}%`;
    //   whereParams.push(searchTerm, searchTerm, searchTerm);
    // }

    // if (filters.startDate && filters.endDate) {
    //   whereClause += ` AND DATE(p.created_at) BETWEEN DATE(?) AND DATE(?)`;
    //   whereParams.push(filters.startDate, filters.endDate);
    // } else if (filters.startDate) {
    //   whereClause += ` AND DATE(p.created_at) >= DATE(?)`;
    //   whereParams.push(filters.startDate);
    // } else if (filters.endDate) {
    //   whereClause += ` AND DATE(p.created_at) <= DATE(?)`;
    //   whereParams.push(filters.endDate);
    // }

    const finalWhereClause = whereClause
      ? `WHERE ${whereClause.substring(5)}`
      : "";

    const limitClause = `LIMIT ?, ?`;
    const limitParams = [skip, limit];

    const sql = `
      ${selectClause}
      ${finalWhereClause}
      ORDER BY p.group_code, p.created_at DESC
      ${limitClause}
  `;

    const queryParams = [...whereParams, ...limitParams];

    const countSql = `
      SELECT COUNT(*) AS total
      FROM permissions p
      ${finalWhereClause}
  `;
    const countParams = [...whereParams];

    try {
      // 1️⃣ Lấy dữ liệu
      const [permissions] = await db.query(sql, queryParams);

      // 2️⃣ Lấy tổng record
      const [countResult] = await db.query(countSql, countParams);
      const total = countResult[0]?.total || 0;

      // 3️⃣ Gom nhóm theo group_code
      const grouped = permissions.reduce((acc, p) => {
        if (!acc[p.group_code]) {
          acc[p.group_code] = {
            group_code: p.group_code,
            group_name: p.group_name,
            permissions: [],
          };
        }
        acc[p.group_code].permissions.push({
          permission_id: p.permission_id,
          permission_name: p.permission_name,
          permission_code: p.permission_code,
          description: p.description,
          created_at: p.created_at,
          updated_at: p.updated_at,
        });
        return acc;
      }, {});
      return {
        permissions: Object.values(grouped), // convert object -> array
        total,
      };
    } catch (err) {
      console.error("Error fetching permissions:", err);
      throw err;
    }
  },

  /**
   * Lấy quyền theo ID.
   * @param {string} id - ID quyền.
   * @returns {Promise<Object|null>} Promise giải quyết với đối tượng quyền hoặc null nếu không tìm thấy.
   */
  getPermissionById: async (id) => {
    try {
      const sql = `
        SELECT
          permission_id, permission_name, permission_code, description,
          is_active, created_at, updated_at
        FROM permissions
        WHERE permission_id = ?
      `;
      const [results] = await db.query(sql, [id]);
      return results.length ? results[0] : null;
    } catch (err) {
      throw err;
    }
  },

  /**
   * Lấy quyền theo permission_code.
   * @param {string} permissionCode - Permission code.
   * @returns {Promise<Object|null>} Promise giải quyết với đối tượng quyền hoặc null nếu không tìm thấy.
   */
  getPermissionByCode: async (permissionCode) => {
    try {
      const sql = `
        SELECT
          permission_id, permission_name, permission_code, description,
          is_active, created_at, updated_at
        FROM permissions
        WHERE permission_code = ?
      `;
      const [results] = await db.query(sql, [permissionCode]);
      return results.length ? results[0] : null;
    } catch (err) {
      throw err;
    }
  },

  /**
   * Tạo quyền mới.
   * @param {Object} permissionData - Dữ liệu quyền.
   * @returns {Promise<Object>} Promise giải quyết với kết quả tạo quyền (bao gồm permission_id).
   */
  createPermission: async (permissionData) => {
    const { permission_name, permission_code, description, is_active } =
      permissionData;

    try {
      const permission_id = uuidv4();

      const sql = `
        INSERT INTO permissions (
          permission_id, permission_name, permission_code, description, is_active
        ) VALUES (?, ?, ?, ?, ?)
      `;
      const values = [
        permission_id,
        permission_name,
        permission_code,
        description,
        is_active,
      ];

      const [results] = await db.query(sql, values);
      return { permission_id, affectedRows: results.affectedRows };
    } catch (err) {
      throw err;
    }
  },

  /**
   * Cập nhật quyền.
   * @param {string} id - ID quyền.
   * @param {Object} permissionData - Dữ liệu cập nhật quyền.
   * @returns {Promise<Object>} Promise giải quyết với kết quả cập nhật.
   */
  updatePermission: async (id, permissionData) => {
    const { permission_name, permission_code, description, is_active } =
      permissionData;

    try {
      const sql = `
        UPDATE permissions SET
          permission_name = ?, permission_code = ?, description = ?,
          is_active = ?, updated_at = NOW()
        WHERE permission_id = ?
      `;
      const values = [
        permission_name,
        permission_code,
        description,
        is_active,
        id,
      ];

      const [results] = await db.query(sql, values);
      return results;
    } catch (err) {
      throw err;
    }
  },

  /**
   * Xóa quyền.
   * @param {string} id - ID quyền.
   * @returns {Promise<Object>} Promise giải quyết với kết quả xóa.
   */
  deletePermission: async (id) => {
    try {
      const sql = "DELETE FROM permissions WHERE permission_id = ?";
      const [results] = await db.query(sql, [id]);
      return results;
    } catch (err) {
      throw err;
    }
  },

  /**
   * Kiểm tra permission_code đã tồn tại chưa.
   * @param {string} permissionCode - Permission code cần kiểm tra.
   * @param {string} excludePermissionId - ID quyền cần loại trừ (dùng cho update).
   * @returns {Promise<boolean>} Promise giải quyết với true nếu permission_code đã tồn tại, false nếu chưa.
   */
  checkPermissionCodeExists: async (
    permissionCode,
    excludePermissionId = null
  ) => {
    try {
      let sql =
        "SELECT COUNT(*) as count FROM permissions WHERE permission_code = ?";
      let params = [permissionCode];

      if (excludePermissionId) {
        sql += " AND permission_id != ?";
        params.push(excludePermissionId);
      }

      const [results] = await db.query(sql, params);
      return results[0].count > 0;
    } catch (err) {
      throw err;
    }
  },

  /**
   * Lấy quyền của một role.
   * @param {string} roleId - ID role.
   * @returns {Promise<Array<Object>>} Promise giải quyết với danh sách quyền của role.
   */
  getPermissionsByRole: async (roleId) => {
    try {
      const sql = `
        SELECT
          p.permission_id, p.permission_name, p.permission_code, p.group_code, p.group_name, p.description
        FROM permissions p
        INNER JOIN role_permissions rp ON p.permission_id = rp.permission_id
        WHERE rp.role_id = ? 
        ORDER BY p.permission_name
      `;

      const sqlRole = `
        SELECT
          role_id, role_name, role_description
        FROM roles
        WHERE role_id = ?
      `;
      const [results] = await db.query(sql, [roleId]);
      const [resultsRole] = await db.query(sqlRole, [roleId]);
      return { ...resultsRole[0], permissions: results };
    } catch (err) {
      throw err;
    }
  },

  /**
   * Gán quyền cho role.
   * @param {string} roleId - ID role.
   * @param {string} permissionId - ID permission.
   * @returns {Promise<Object>} Promise giải quyết với kết quả gán quyền.
   */
  assignPermissionToRole: async (roleId, permissionId) => {
    try {
      const sql = `
        INSERT INTO role_permissions (role_id, permission_id)
        VALUES (?, ?)
        ON DUPLICATE KEY UPDATE role_id = role_id
      `;
      const [results] = await db.query(sql, [roleId, permissionId]);
      return results;
    } catch (err) {
      throw err;
    }
  },

  /**
   * Hủy gán quyền cho role.
   * @param {string} roleId - ID role.
   * @param {string} permissionId - ID permission.
   * @returns {Promise<Object>} Promise giải quyết với kết quả hủy gán quyền.
   */
  removePermissionFromRole: async (roleId, permissionId) => {
    try {
      const sql = `
        DELETE FROM role_permissions
        WHERE role_id = ? AND permission_id = ?
      `;
      const [results] = await db.query(sql, [roleId, permissionId]);
      return results;
    } catch (err) {
      throw err;
    }
  },

  /**
   * Lấy tất cả quyền của user thông qua role.
   * @param {string} userId - ID user.
   * @returns {Promise<Array<Object>>} Promise giải quyết với danh sách quyền của user.
   */
  getUserPermissions: async (userId) => {
    try {
      const sql = `
        SELECT DISTINCT
          p.permission_id, p.permission_name, p.permission_code, p.description
        FROM permissions p
        INNER JOIN role_permissions rp ON p.permission_id = rp.permission_id
        INNER JOIN users u ON rp.role_id = u.role_id
        WHERE u.user_id = ? AND p.is_active = 1 AND u.is_active = 1
        ORDER BY p.permission_name
      `;
      const [results] = await db.query(sql, [userId]);
      return results;
    } catch (err) {
      throw err;
    }
  },

  /**
   * Kiểm tra user có quyền cụ thể không.
   * @param {string} userId - ID user.
   * @param {string} permissionCode - Permission code cần kiểm tra.
   * @returns {Promise<boolean>} Promise giải quyết với true nếu user có quyền, false nếu không.
   */
  checkUserPermission: async (userId, permissionCode) => {
    try {
      const sql = `
        SELECT COUNT(*) as count
        FROM permissions p
        INNER JOIN role_permissions rp ON p.permission_id = rp.permission_id
        INNER JOIN users u ON rp.role_id = u.role_id
        WHERE u.user_id = ? AND p.permission_code = ? AND p.is_active = 1 AND u.is_active = 1
      `;
      const [results] = await db.query(sql, [userId, permissionCode]);
      return results[0].count > 0;
    } catch (err) {
      throw err;
    }
  },
};

module.exports = PermissionModel;
