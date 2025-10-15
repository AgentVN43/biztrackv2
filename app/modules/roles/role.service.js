const RoleModel = require("./role.model");

const RoleService = {
  /**
   * Lấy tất cả vai trò có phân trang.
   * @param {number} skip - Số lượng bản ghi bỏ qua (offset).
   * @param {number} limit - Số lượng bản ghi cần lấy (limit).
   * @param {Object} filters - Bộ lọc tìm kiếm.
   * @returns {Promise<{roles: Array<Object>, total: number}>} Promise giải quyết với danh sách vai trò và tổng số lượng.
   */
  getAllRoles: async (skip, limit, filters = {}) => {
    try {
      const { roles, total } = await RoleModel.getAllRoles(
        skip,
        limit,
        filters
      );
      return { roles, total };
    } catch (error) {
      throw error;
    }
  },

  /**
   * Lấy vai trò theo ID.
   * @param {string} id - ID vai trò.
   * @returns {Promise<Object|null>} Promise giải quyết với đối tượng vai trò hoặc null nếu không tìm thấy.
   */
  getRoleById: async (id) => {
    try {
      const role = await RoleModel.getRoleById(id);
      return role;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Lấy vai trò theo tên.
   * @param {string} roleName - Tên vai trò.
   * @returns {Promise<Object|null>} Promise giải quyết với đối tượng vai trò hoặc null nếu không tìm thấy.
   */
  getRoleByName: async (roleName) => {
    try {
      const role = await RoleModel.getRoleByName(roleName);
      return role;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Tạo vai trò mới.
   * @param {Object} roleData - Dữ liệu vai trò.
   * @returns {Promise<Object>} Promise giải quyết với kết quả tạo vai trò.
   */
  createRole: async (roleData) => {
    try {
      // Kiểm tra tên vai trò trùng lặp
      if (roleData.role_name) {
        const nameExists = await RoleModel.checkRoleNameExists(
          roleData.role_name
        );
        if (nameExists) {
          throw new Error(
            `Tên vai trò "${roleData.role_name}" đã tồn tại. Vui lòng chọn tên khác.`
          );
        }
      }

      // Thêm logic nghiệp vụ nếu cần (ví dụ: validation, format data...)
      const result = await RoleModel.createRole(roleData);
      return result;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Cập nhật vai trò.
   * @param {string} id - ID vai trò.
   * @param {Object} roleData - Dữ liệu cập nhật vai trò.
   * @returns {Promise<Object>} Promise giải quyết với kết quả cập nhật.
   */
  updateRole: async (id, roleData) => {
    try {
      // Kiểm tra tên vai trò trùng lặp (loại trừ vai trò hiện tại)
      if (roleData.role_name) {
        const nameExists = await RoleModel.checkRoleNameExists(
          roleData.role_name,
          id
        );
        if (nameExists) {
          throw new Error(
            `Tên vai trò "${roleData.role_name}" đã tồn tại. Vui lòng chọn tên khác.`
          );
        }
      }

      // Thêm logic nghiệp vụ nếu cần
      const result = await RoleModel.updateRole(id, roleData);
      return result;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Xóa vai trò.
   * @param {string} id - ID vai trò.
   * @returns {Promise<Object>} Promise giải quyết với kết quả xóa.
   */
  deleteRole: async (id) => {
    try {
      // Kiểm tra xem vai trò có đang được sử dụng bởi người dùng không
      const userCount = await RoleModel.countUsersByRole(id);
      if (userCount > 0) {
        throw new Error(
          `Không thể xóa vai trò này vì đang có ${userCount} người dùng đang sử dụng.`
        );
      }

      const result = await RoleModel.deleteRole(id);
      return result;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Lấy danh sách người dùng thuộc vai trò.
   * @param {string} roleId - ID vai trò.
   * @returns {Promise<Array<Object>>} Promise giải quyết với danh sách người dùng.
   */
  getUsersByRole: async (roleId) => {
    try {
      const users = await RoleModel.getUsersByRole(roleId);
      return users;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Đếm số lượng người dùng thuộc vai trò.
   * @param {string} roleId - ID vai trò.
   * @returns {Promise<number>} Promise giải quyết với số lượng người dùng.
   */
  countUsersByRole: async (roleId) => {
    try {
      const count = await RoleModel.countUsersByRole(roleId);
      return count;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Lấy tất cả vai trò đang hoạt động.
   * @returns {Promise<Array<Object>>} Promise giải quyết với danh sách vai trò đang hoạt động.
   */
  getActiveRoles: async () => {
    try {
      const roles = await RoleModel.getActiveRoles();
      return roles;
    } catch (error) {
      throw error;
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
      const result = await RoleModel.updateRoleStatus(roleId, isActive);
      return result;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Lấy thống kê vai trò.
   * @returns {Promise<Object>} Promise giải quyết với thống kê vai trò.
   */
  getRoleStatistics: async () => {
    try {
      const [totalRoles, activeRoles, inactiveRoles] = await Promise.all([
        RoleModel.getAllRoles(0, 1, {}).then((result) => result.total),
        RoleModel.getAllRoles(0, 1, { is_active: 1 }).then(
          (result) => result.total
        ),
        RoleModel.getAllRoles(0, 1, { is_active: 0 }).then(
          (result) => result.total
        ),
      ]);

      return {
        totalRoles,
        activeRoles,
        inactiveRoles,
      };
    } catch (error) {
      throw error;
    }
  },
};

module.exports = RoleService;
