const express = require("express");
const router = express.Router();
const roleController = require("./role.controller");

// Role CRUD routes
router.get("/", roleController.getAllRoles);
router.get("/:id", roleController.getRoleById);
router.post("/", roleController.createRole);
router.put("/:id", roleController.updateRole);
router.delete("/:id", roleController.deleteRole);

// Role management routes
router.get("/:id/users", roleController.getUsersByRole);
router.get("/:id/users/count", roleController.countUsersByRole);
router.get("/active/list", roleController.getActiveRoles);
router.put("/:id/status", roleController.updateRoleStatus);
router.get("/statistics/overview", roleController.getRoleStatistics);

router.post(
  "/create-with-permissions",
  roleController.createRoleWithPermissions
);

router.put(
  "/:roleId/update-with-permissions",
  roleController.updateRoleWithPermissions
);

module.exports = router;
