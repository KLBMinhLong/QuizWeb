var express = require("express");
var router = express.Router();
var { body, validationResult } = require("express-validator");
var { requirePermission } = require(global.__basedir + "/apps/Util/VerifyToken");

var RoleService = require(global.__basedir + "/apps/Services/RoleService");

router.get("/", requirePermission("roles.read"), async function (req, res) {
  try {
    const service = new RoleService();
    const roles = await service.getAllRoles();
    const success = req.query.success || null;
    res.render("admin/roles.ejs", { roles, error: null, success, user: req.user });
  } catch (e) {
    console.error("Error loading roles:", e);
    res.status(500).render("admin/roles.ejs", { 
      roles: [], 
      error: "Lỗi server khi tải danh sách roles", 
      success: null,
      user: req.user 
    });
  }
});

router.post(
  "/create",
  requirePermission("roles.write"),
  [
    body("name")
      .notEmpty().withMessage("Tên role không được để trống")
      .isLength({ min: 2, max: 50 }).withMessage("Tên role phải từ 2-50 ký tự")
      .matches(/^[a-zA-Z0-9_]+$/).withMessage("Tên role chỉ chứa chữ, số và dấu gạch dưới"),
    body("description").optional().isLength({ max: 500 }).withMessage("Mô tả không quá 500 ký tự"),
  ],
  async function (req, res) {
    const errors = validationResult(req);
    const service = new RoleService();
    
    if (!errors.isEmpty()) {
      const errorMsg = errors.array().map(e => e.msg).join(", ");
      const roles = await service.getAllRoles();
      return res.status(400).render("admin/roles.ejs", { 
        roles, 
        error: errorMsg, 
        success: null,
        user: req.user 
      });
    }

    try {
      const result = await service.createRole({
        name: req.body.name,
        description: req.body.description || "",
      });

      if (!result.ok) {
        const roles = await service.getAllRoles();
        return res.status(400).render("admin/roles.ejs", { 
          roles, 
          error: result.message, 
          success: null,
          user: req.user 
        });
      }

      return res.redirect("/admin/roles?success=created");
    } catch (e) {
      console.error("Error creating role:", e);
      const roles = await service.getAllRoles();
      return res.status(500).render("admin/roles.ejs", { 
        roles, 
        error: "Lỗi server khi tạo role", 
        success: null,
        user: req.user 
      });
    }
  }
);

router.post(
  "/:id/update",
  requirePermission("roles.write"),
  [
    body("name")
      .notEmpty().withMessage("Tên role không được để trống")
      .isLength({ min: 2, max: 50 }).withMessage("Tên role phải từ 2-50 ký tự")
      .matches(/^[a-zA-Z0-9_]+$/).withMessage("Tên role chỉ chứa chữ, số và dấu gạch dưới"),
    body("description").optional().isLength({ max: 500 }).withMessage("Mô tả không quá 500 ký tự"),
  ],
  async function (req, res) {
    const errors = validationResult(req);
    const service = new RoleService();
    
    if (!errors.isEmpty()) {
      const errorMsg = errors.array().map(e => e.msg).join(", ");
      const roles = await service.getAllRoles();
      return res.status(400).render("admin/roles.ejs", { 
        roles, 
        error: errorMsg, 
        success: null,
        user: req.user 
      });
    }

    try {
      const result = await service.updateRole(req.params.id, {
        name: req.body.name,
        description: req.body.description || "",
      });

      if (!result.ok) {
        const roles = await service.getAllRoles();
        return res.status(400).render("admin/roles.ejs", { 
          roles, 
          error: result.message, 
          success: null,
          user: req.user 
        });
      }

      return res.redirect("/admin/roles?success=updated");
    } catch (e) {
      console.error("Error updating role:", e);
      const roles = await service.getAllRoles();
      return res.status(500).render("admin/roles.ejs", { 
        roles, 
        error: "Lỗi server khi cập nhật role", 
        success: null,
        user: req.user 
      });
    }
  }
);

router.post("/:id/delete", requirePermission("roles.delete"), async function (req, res) {
  const service = new RoleService();
  
  try {
    const result = await service.deleteRole(req.params.id);

    if (!result.ok) {
      const roles = await service.getAllRoles();
      return res.status(400).render("admin/roles.ejs", { 
        roles, 
        error: result.message, 
        success: null,
        user: req.user 
      });
    }

    return res.redirect("/admin/roles?success=deleted");
  } catch (e) {
    console.error("Error deleting role:", e);
    const roles = await service.getAllRoles();
    return res.status(500).render("admin/roles.ejs", { 
      roles, 
      error: "Lỗi server khi xoá role", 
      success: null,
      user: req.user 
    });
  }
});

router.get("/:id/claims", requirePermission("roles.read"), async function (req, res) {
  try {
    const service = new RoleService();
    const role = await service.getRoleById(req.params.id);
    if (!role) {
      return res.status(404).json({ ok: false, message: "Không tìm thấy role" });
    }
    
    const claims = await service.getRoleClaims(req.params.id);
    const availablePermissions = RoleService.getAvailablePermissions();
    
    const permissionsByCategory = {};
    availablePermissions.forEach(perm => {
      if (!permissionsByCategory[perm.category]) {
        permissionsByCategory[perm.category] = [];
      }
      permissionsByCategory[perm.category].push(perm);
    });
    
    res.json({
      ok: true,
      role: {
        id: role._id,
        name: role.name,
      },
      claims: claims,
      availablePermissions: availablePermissions,
      permissionsByCategory: permissionsByCategory,
    });
  } catch (e) {
    console.error("Error loading role claims:", e);
    res.status(500).json({ ok: false, message: "Lỗi server" });
  }
});

router.post(
  "/:id/claims/add",
  requirePermission("roles.write"),
  [
    body("claimType").notEmpty().withMessage("Claim type không được để trống"),
    body("claimValue").notEmpty().withMessage("Claim value không được để trống"),
  ],
  async function (req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        ok: false, 
        message: errors.array().map(e => e.msg).join(", ") 
      });
    }

    try {
      const service = new RoleService();
      const result = await service.addClaimToRole(
        req.params.id,
        req.body.claimType,
        req.body.claimValue
      );

      if (!result.ok) {
        return res.status(400).json({ ok: false, message: result.message });
      }

      return res.json({ ok: true, message: "Đã thêm permission thành công" });
    } catch (e) {
      console.error("Error adding claim:", e);
      return res.status(500).json({ ok: false, message: "Lỗi server" });
    }
  }
);

router.post("/:id/claims/:claimId/remove", requirePermission("roles.write"), async function (req, res) {
  try {
    const service = new RoleService();
    const result = await service.removeClaimFromRole(req.params.claimId);

    if (!result.ok) {
      return res.status(400).json({ ok: false, message: result.message });
    }

    return res.json({ ok: true, message: "Đã xóa permission thành công" });
  } catch (e) {
    console.error("Error removing claim:", e);
    return res.status(500).json({ ok: false, message: "Lỗi server" });
  }
});

module.exports = router;
