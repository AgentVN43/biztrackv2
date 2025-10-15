const PermissionService = require("./permission.service");
const { createResponse } = require("../../utils/response");
const { processDateFilters } = require("../../utils/dateUtils");
const { permissions } = require("../../utils/constants/permission");

exports.getAllPermissions = async (req, res, next) => {
  const { page = 1, limit = 100, search } = req.query;
  const parsedPage = parseInt(page);
  const parsedLimit = parseInt(limit);
  const skip = (parsedPage - 1) * parsedLimit;
  const { effectiveStartDate, effectiveEndDate } = processDateFilters(
    req.query
  );

  try {
    const filters = {
      search,
      startDate: effectiveStartDate,
      endDate: effectiveEndDate,
    };

    const { permissions, total } = await PermissionService.getAllPermissions(
      skip,
      parsedLimit,
      filters
    );
    console.log("🚀 ~ permissions:", permissions);
    return createResponse(
      res,
      200,
      true,
      permissions,
      null,
      total,
      parsedPage,
      parsedLimit
    );
  } catch (err) {
    next(err);
  }
};
// exports.getAllPermissions = (req, res, next) => {
//   createResponse(res, 200, true, permissions);
// };

exports.getPermissionById = async (req, res, next) => {
  const id = req.params.id;
  try {
    const permission = await PermissionService.getPermissionById(id);
    if (!permission) {
      return createResponse(res, 404, false, null, "Permission not found");
    }
    createResponse(res, 200, true, permission);
  } catch (err) {
    next(err);
  }
};

exports.createPermission = async (req, res, next) => {
  try {
    const result = await PermissionService.createPermission(req.body);
    createResponse(
      res,
      201,
      true,
      { permission_id: result.permission_id },
      "Permission created successfully"
    );
  } catch (err) {
    if (err.message.includes("đã tồn tại")) {
      return createResponse(res, 400, false, null, err.message);
    }
    next(err);
  }
};

exports.updatePermission = async (req, res, next) => {
  const id = req.params.id;
  try {
    const result = await PermissionService.updatePermission(id, req.body);
    if (result.affectedRows === 0) {
      return createResponse(
        res,
        404,
        false,
        null,
        "Permission not found or no changes made"
      );
    }
    createResponse(res, 200, true, null, "Permission updated successfully");
  } catch (err) {
    if (err.message.includes("đã tồn tại")) {
      return createResponse(res, 400, false, null, err.message);
    }
    next(err);
  }
};

exports.deletePermission = async (req, res, next) => {
  const id = req.params.id;
  try {
    const result = await PermissionService.deletePermission(id);
    if (result.affectedRows === 0) {
      return createResponse(res, 404, false, null, "Permission not found");
    }
    createResponse(res, 200, true, null, "Permission deleted successfully");
  } catch (err) {
    next(err);
  }
};

exports.getPermissionsByRole = async (req, res, next) => {
  const roleId = req.params.roleId;
  try {
    const permissions = await PermissionService.getPermissionsByRole(roleId);
    createResponse(res, 200, true, permissions);
  } catch (err) {
    next(err);
  }
};

exports.assignPermissionToRole = async (req, res, next) => {
  const { roleId, permissionId } = req.params;
  try {
    const result = await PermissionService.assignPermissionToRole(
      roleId,
      permissionId
    );
    createResponse(
      res,
      200,
      true,
      null,
      "Permission assigned to role successfully"
    );
  } catch (err) {
    if (err.message.includes("không tồn tại")) {
      return createResponse(res, 404, false, null, err.message);
    }
    next(err);
  }
};

exports.removePermissionFromRole = async (req, res, next) => {
  const { roleId, permissionId } = req.params;
  try {
    const result = await PermissionService.removePermissionFromRole(
      roleId,
      permissionId
    );
    if (result.affectedRows === 0) {
      return createResponse(
        res,
        404,
        false,
        null,
        "Permission assignment not found"
      );
    }
    createResponse(
      res,
      200,
      true,
      null,
      "Permission removed from role successfully"
    );
  } catch (err) {
    next(err);
  }
};

exports.getUserPermissions = async (req, res, next) => {
  const userId = req.params.userId;
  try {
    const permissions = await PermissionService.getUserPermissions(userId);
    createResponse(res, 200, true, permissions);
  } catch (err) {
    next(err);
  }
};

exports.checkUserPermission = async (req, res, next) => {
  const { userId, permissionCode } = req.params;
  try {
    const hasPermission = await PermissionService.checkUserPermission(
      userId,
      permissionCode
    );
    createResponse(res, 200, true, { hasPermission });
  } catch (err) {
    next(err);
  }
};

exports.assignMultiplePermissionsToRole = async (req, res, next) => {
  const { roleId } = req.params;
  console.log("🚀 ~ roleId:", roleId);
  const { permissionIds } = req.body;

  try {
    if (!permissionIds || !Array.isArray(permissionIds)) {
      return createResponse(
        res,
        400,
        false,
        null,
        "Permission IDs array is required"
      );
    }

    await PermissionService.assignMultiplePermissionsToRole(
      roleId,
      permissionIds
    );
    createResponse(
      res,
      200,
      true,
      null,
      "Permissions assigned to role successfully"
    );
  } catch (err) {
    if (err.message.includes("không tồn tại")) {
      return createResponse(res, 404, false, null, err.message);
    }
    next(err);
  }
};

exports.removeMultiplePermissionsFromRole = async (req, res, next) => {
  const { roleId } = req.params;
  const { permissionIds } = req.body;

  try {
    if (!permissionIds || !Array.isArray(permissionIds)) {
      return createResponse(
        res,
        400,
        false,
        null,
        "Permission IDs array is required"
      );
    }

    const result = await PermissionService.removeMultiplePermissionsFromRole(
      roleId,
      permissionIds
    );
    createResponse(
      res,
      200,
      true,
      null,
      "Permissions removed from role successfully"
    );
  } catch (err) {
    next(err);
  }
};
