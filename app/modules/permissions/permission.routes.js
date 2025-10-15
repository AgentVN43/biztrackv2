const express = require("express");
const router = express.Router();
const permissionController = require("./permission.controller");

// Permission CRUD routes
router.get("/", permissionController.getAllPermissions);
// router.get("/:id", permissionController.getPermissionById);
// router.post("/", permissionController.createPermission);
// router.put("/:id", permissionController.updatePermission);
// router.delete("/:id", permissionController.deletePermission);

// Role-Permission management routes
router.get("/role/:roleId", permissionController.getPermissionsByRole);
// router.post("/role/:roleId/assign/:permissionId", permissionController.assignPermissionToRole);
// router.delete("/role/:roleId/remove/:permissionId", permissionController.removePermissionFromRole);
router.post(
  "/role/:roleId/assign-multiple",
  permissionController.assignMultiplePermissionsToRole
);
router.delete(
  "/role/:roleId/remove-multiple",
  permissionController.removeMultiplePermissionsFromRole
);

// User-Permission routes
router.get("/user/:userId", permissionController.getUserPermissions);
router.get(
  "/user/:userId/check/:permissionCode",
  permissionController.checkUserPermission
);

module.exports = router;
