const RoleService = require("./role.service");
const { createResponse } = require("../../utils/response");
const { processDateFilters } = require("../../utils/dateUtils");
const PermissionService = require("../permissions/permission.service");

exports.getAllRoles = async (req, res, next) => {
  const { page = 1, limit = 10, search, is_active } = req.query;
  const parsedPage = parseInt(page);
  const parsedLimit = parseInt(limit);
  const skip = (parsedPage - 1) * parsedLimit;
  const { effectiveStartDate, effectiveEndDate } = processDateFilters(
    req.query
  );

  try {
    const filters = {
      search,
      is_active: is_active !== undefined ? parseInt(is_active) : undefined,
      startDate: effectiveStartDate,
      endDate: effectiveEndDate,
    };

    const { roles, total } = await RoleService.getAllRoles(
      skip,
      parsedLimit,
      filters
    );
    return createResponse(
      res,
      200,
      true,
      roles,
      null,
      total,
      parsedPage,
      parsedLimit
    );
  } catch (err) {
    next(err);
  }
};

exports.getRoleById = async (req, res, next) => {
  const id = req.params.id;
  try {
    const role = await RoleService.getRoleById(id);
    if (!role) {
      return createResponse(res, 404, false, null, "Role not found");
    }
    createResponse(res, 200, true, role);
  } catch (err) {
    next(err);
  }
};

exports.createRole = async (req, res, next) => {
  console.log("🚀 ~ req:", req.body);
  try {
    const result = await RoleService.createRole(req.body);
    createResponse(res, 201, true, result, "Role created successfully");
  } catch (err) {
    if (err.message.includes("đã tồn tại")) {
      return createResponse(res, 400, false, null, err.message);
    }
    next(err);
  }
};

exports.updateRole = async (req, res, next) => {
  const id = req.params.id;
  try {
    const result = await RoleService.updateRole(id, req.body);
    if (result.affectedRows === 0) {
      return createResponse(
        res,
        404,
        false,
        null,
        "Role not found or no changes made"
      );
    }
    createResponse(res, 200, true, null, "Role updated successfully");
  } catch (err) {
    if (err.message.includes("đã tồn tại")) {
      return createResponse(res, 400, false, null, err.message);
    }
    next(err);
  }
};

exports.deleteRole = async (req, res, next) => {
  const id = req.params.id;
  try {
    const result = await RoleService.deleteRole(id);
    if (result.affectedRows === 0) {
      return createResponse(res, 404, false, null, "Role not found");
    }
    createResponse(res, 200, true, null, "Role deleted successfully");
  } catch (err) {
    if (err.message.includes("không thể xóa")) {
      return createResponse(res, 400, false, null, err.message);
    }
    next(err);
  }
};

exports.getUsersByRole = async (req, res, next) => {
  const roleId = req.params.id;
  try {
    const users = await RoleService.getUsersByRole(roleId);
    createResponse(res, 200, true, users);
  } catch (err) {
    next(err);
  }
};

exports.countUsersByRole = async (req, res, next) => {
  const roleId = req.params.id;
  try {
    const count = await RoleService.countUsersByRole(roleId);
    createResponse(res, 200, true, { userCount: count });
  } catch (err) {
    next(err);
  }
};

exports.getActiveRoles = async (req, res, next) => {
  try {
    const roles = await RoleService.getActiveRoles();
    createResponse(res, 200, true, roles);
  } catch (err) {
    next(err);
  }
};

exports.updateRoleStatus = async (req, res, next) => {
  const id = req.params.id;
  const { is_active } = req.body;

  try {
    if (typeof is_active !== "boolean") {
      return createResponse(
        res,
        400,
        false,
        null,
        "is_active must be a boolean value"
      );
    }

    const result = await RoleService.updateRoleStatus(id, is_active);
    if (result.affectedRows === 0) {
      return createResponse(res, 404, false, null, "Role not found");
    }

    const statusText = is_active ? "activated" : "deactivated";
    createResponse(res, 200, true, null, `Role ${statusText} successfully`);
  } catch (err) {
    next(err);
  }
};

exports.getRoleStatistics = async (req, res, next) => {
  try {
    const statistics = await RoleService.getRoleStatistics();
    createResponse(res, 200, true, statistics);
  } catch (err) {
    next(err);
  }
};

exports.createRoleWithPermissions = async (req, res, next) => {
  const { role, permissionIds } = req.body;

  try {
    if (!role || typeof role !== "object") {
      return createResponse(res, 400, false, null, "Role data is required");
    }

    if (!permissionIds || !Array.isArray(permissionIds)) {
      return createResponse(
        res,
        400,
        false,
        null,
        "Permission IDs array is required"
      );
    }

    // Tạo vai trò
    const createdRole = await RoleService.createRole(role);
    console.log("🚀 ~ createdRole:", createdRole);

    // Gán quyền
    const permissionResult =
      await PermissionService.assignMultiplePermissionsToRole(
        createdRole.role_id,
        permissionIds
      );

    const message =
      permissionResult.message ||
      "Role created and permissions assigned successfully";

    createResponse(
      res,
      201,
      true,
      { role: createdRole, permissions: permissionResult },
      message
    );
  } catch (err) {
    if (err.message.includes("đã tồn tại")) {
      return createResponse(res, 400, false, null, err.message);
    }
    if (err.message.includes("không tồn tại")) {
      return createResponse(res, 404, false, null, err.message);
    }
    next(err);
  }
};

exports.updateRoleWithPermissions = async (req, res, next) => {
  const { roleId } = req.params;
  const { role, permissionIds } = req.body;

  console.log("🚀 ~ roleId:", roleId);
  console.log("🚀 ~ role:", role);
  console.log("🚀 ~ permissionIds:", permissionIds);

  try {
    if (!role || typeof role !== "object") {
      return createResponse(res, 400, false, null, "Role data is required");
    }

    if (!permissionIds || !Array.isArray(permissionIds)) {
      return createResponse(
        res,
        400,
        false,
        null,
        "Permission IDs array is required"
      );
    }

    // Cập nhật thông tin vai trò
    const updatedRole = await RoleService.updateRole(roleId, role);

    // Gán lại quyền
    const permissionResult =
      await PermissionService.assignMultiplePermissionsToRole(
        roleId,
        permissionIds
      );

    const message =
      permissionResult.message ||
      "Role updated and permissions assigned successfully";

    createResponse(
      res,
      200,
      true,
      { role: updatedRole, permissions: permissionResult },
      message
    );
  } catch (err) {
    if (err.message.includes("không tồn tại")) {
      return createResponse(res, 404, false, null, err.message);
    }
    next(err);
  }
};
