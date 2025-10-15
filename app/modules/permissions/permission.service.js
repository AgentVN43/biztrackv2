const PermissionModel = require("./permission.model");

const PermissionService = {
  /**
   * Lấy tất cả quyền có phân trang.
   * @param {number} skip - Số lượng bản ghi bỏ qua (offset).
   * @param {number} limit - Số lượng bản ghi cần lấy (limit).
   * @param {Object} filters - Bộ lọc tìm kiếm.
   * @returns {Promise<{permissions: Array<Object>, total: number}>} Promise giải quyết với danh sách quyền và tổng số lượng.
   */
  getAllPermissions: async (skip, limit, filters = {}) => {
    try {
      const { permissions, total } = await PermissionModel.getAllPermissions(
        skip,
        limit,
        filters
      );
      console.log("🚀 ~ permissions:", permissions);
      return { permissions, total };
    } catch (error) {
      throw error;
    }
  },

  /**
   * Lấy quyền theo ID.
   * @param {string} id - ID quyền.
   * @returns {Promise<Object|null>} Promise giải quyết với đối tượng quyền hoặc null nếu không tìm thấy.
   */
  getPermissionById: async (id) => {
    try {
      const permission = await PermissionModel.getPermissionById(id);
      return permission;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Lấy quyền theo permission_code.
   * @param {string} permissionCode - Permission code.
   * @returns {Promise<Object|null>} Promise giải quyết với đối tượng quyền hoặc null nếu không tìm thấy.
   */
  getPermissionByCode: async (permissionCode) => {
    try {
      const permission = await PermissionModel.getPermissionByCode(
        permissionCode
      );
      return permission;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Tạo quyền mới.
   * @param {Object} permissionData - Dữ liệu quyền.
   * @returns {Promise<Object>} Promise giải quyết với kết quả tạo quyền.
   */
  createPermission: async (permissionData) => {
    try {
      // Kiểm tra permission_code trùng lặp
      if (permissionData.permission_code) {
        const codeExists = await PermissionModel.checkPermissionCodeExists(
          permissionData.permission_code
        );
        if (codeExists) {
          throw new Error(
            `Permission code "${permissionData.permission_code}" đã tồn tại. Vui lòng chọn code khác.`
          );
        }
      }

      // Thêm logic nghiệp vụ nếu cần (ví dụ: validation, format data...)
      const result = await PermissionModel.createPermission(permissionData);
      return result;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Cập nhật quyền.
   * @param {string} id - ID quyền.
   * @param {Object} permissionData - Dữ liệu cập nhật quyền.
   * @returns {Promise<Object>} Promise giải quyết với kết quả cập nhật.
   */
  updatePermission: async (id, permissionData) => {
    try {
      // Kiểm tra permission_code trùng lặp (loại trừ quyền hiện tại)
      if (permissionData.permission_code) {
        const codeExists = await PermissionModel.checkPermissionCodeExists(
          permissionData.permission_code,
          id
        );
        if (codeExists) {
          throw new Error(
            `Permission code "${permissionData.permission_code}" đã tồn tại. Vui lòng chọn code khác.`
          );
        }
      }

      // Thêm logic nghiệp vụ nếu cần
      const result = await PermissionModel.updatePermission(id, permissionData);
      return result;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Xóa quyền.
   * @param {string} id - ID quyền.
   * @returns {Promise<Object>} Promise giải quyết với kết quả xóa.
   */
  deletePermission: async (id) => {
    try {
      // Thêm logic nghiệp vụ nếu cần (ví dụ: kiểm tra quyền có đang được sử dụng không)
      const result = await PermissionModel.deletePermission(id);
      return result;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Lấy quyền của một role.
   * @param {string} roleId - ID role.
   * @returns {Promise<Array<Object>>} Promise giải quyết với danh sách quyền của role.
   */
  getPermissionsByRole: async (roleId) => {
    try {
      const permissions = await PermissionModel.getPermissionsByRole(roleId);
      return permissions;
    } catch (error) {
      throw error;
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
      // Kiểm tra role và permission có tồn tại không
      const roleExists = await PermissionModel.getPermissionById(roleId); // Cần import role model để kiểm tra
      const permissionExists = await PermissionModel.getPermissionById(
        permissionId
      );

      if (!permissionExists) {
        throw new Error("Permission không tồn tại");
      }

      const result = await PermissionModel.assignPermissionToRole(
        roleId,
        permissionId
      );
      return result;
    } catch (error) {
      throw error;
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
      const result = await PermissionModel.removePermissionFromRole(
        roleId,
        permissionId
      );
      return result;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Lấy tất cả quyền của user thông qua role.
   * @param {string} userId - ID user.
   * @returns {Promise<Array<Object>>} Promise giải quyết với danh sách quyền của user.
   */
  getUserPermissions: async (userId) => {
    try {
      const permissions = await PermissionModel.getUserPermissions(userId);
      return permissions;
    } catch (error) {
      throw error;
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
      const hasPermission = await PermissionModel.checkUserPermission(
        userId,
        permissionCode
      );
      return hasPermission;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Gán nhiều quyền cho role.
   * @param {string} roleId - ID role.
   * @param {Array<string>} permissionIds - Danh sách ID permissions.
   * @returns {Promise<Object>} Promise giải quyết với kết quả gán quyền.
   */
  assignMultiplePermissionsToRole: async (roleId, permissionIds) => {
    try {
      // Lấy danh sách permission hiện tại của role
      const currentPermissions = await PermissionModel.getPermissionsByRole(
        roleId
      );
      const currentIds = currentPermissions?.permissions.map((p) =>
        String(p.permission_id)
      );

      // Lấy danh sách permission_id hợp lệ từ bảng permissions
      // const [validPermissions] = await db.query(
      //   "SELECT permission_id FROM permissions WHERE permission_id IN (?)",
      //   [permissionIds]
      // );
      // const validIds = validPermissions.map((p) => String(p.permission_id));

      const validIds = await PermissionModel.getValidPermissionIds(
        permissionIds
      );
      console.log("🚀 ~ validIds:", validIds);
      // Tìm permission cần xóa (có trong current nhưng không có trong mới)
      const toRemove = currentIds.filter((id) => !validIds.includes(id));
      // Tìm permission cần thêm (có trong mới nhưng không có trong current)
      const toAdd = validIds.filter((id) => !currentIds.includes(id));

      // Xóa những permission không còn
      for (const permissionId of toRemove) {
        await PermissionModel.removePermissionFromRole(roleId, permissionId);
      }
      // Thêm những permission mới
      for (const permissionId of toAdd) {
        await PermissionModel.assignPermissionToRole(roleId, permissionId);
      }

      // Nếu có permissionIds không hợp lệ, trả về thông báo
      const invalidIds = permissionIds.filter((id) => !validIds.includes(id));
      return {
        success: true,
        added: toAdd,
        removed: toRemove,
        invalid: invalidIds,
        message: invalidIds.length
          ? `Các permission_id sau không tồn tại: ${invalidIds.join(", ")}`
          : undefined,
      };
    } catch (error) {
      throw error;
    }
  },

  /**
   * Hủy gán nhiều quyền cho role.
   * @param {string} roleId - ID role.
   * @param {Array<string>} permissionIds - Danh sách ID permissions.
   * @returns {Promise<Object>} Promise giải quyết với kết quả hủy gán quyền.
   */
  removeMultiplePermissionsFromRole: async (roleId, permissionIds) => {
    try {
      const results = [];
      for (const permissionId of permissionIds) {
        const result = await PermissionModel.removePermissionFromRole(
          roleId,
          permissionId
        );
        results.push(result);
      }
      return { success: true, results };
    } catch (error) {
      throw error;
    }
  },
};

module.exports = PermissionService;
