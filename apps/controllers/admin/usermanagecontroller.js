var express = require("express");
var router = express.Router();
var { body, validationResult } = require("express-validator");
var { requirePermission } = require(global.__basedir + "/apps/Util/VerifyToken");

var UserService = require(global.__basedir + "/apps/Services/UserService");

// GET /admin/users - Danh sách users với filter và search
// Permission: users.read (theo US-13)
router.get("/", requirePermission("users.read"), async function (req, res) {
  try {
    const service = new UserService();
    const filters = {
      trangThai: req.query.trangThai || "all",
      search: req.query.search || "",
    };
    const users = await service.getUsers(filters);
    const allRoles = await service.getAllRoles();
    const success = req.query.success || null;
    res.render("admin/users.ejs", { 
      users, 
      allRoles,
      filters,
      error: null, 
      success,
      user: req.user 
    });
  } catch (e) {
    console.error("Error loading users:", e);
    res.status(500).render("admin/users.ejs", { 
      users: [], 
      allRoles: [],
      filters: { trangThai: "all", search: "" },
      error: "Lỗi server khi tải danh sách users", 
      success: null,
      user: req.user 
    });
  }
});

// POST /admin/users/:id/block - Block user
// Permission: users.write (theo US-13)
router.post("/:id/block", requirePermission("users.write"), async function (req, res) {
  const service = new UserService();
  
  try {
    const result = await service.blockUser(req.params.id);

    if (!result.ok) {
      const users = await service.getUsers({ trangThai: "all", search: "" });
      const allRoles = await service.getAllRoles();
      return res.status(400).render("admin/users.ejs", { 
        users, 
        allRoles,
        filters: { trangThai: "all", search: "" },
        error: result.message, 
        success: null,
        user: req.user 
      });
    }

    return res.redirect("/admin/users?success=blocked");
  } catch (e) {
    console.error("Error blocking user:", e);
    const users = await service.getUsers({ trangThai: "all", search: "" });
    const allRoles = await service.getAllRoles();
    return res.status(500).render("admin/users.ejs", { 
      users, 
      allRoles,
      filters: { trangThai: "all", search: "" },
      error: "Lỗi server khi block user", 
      success: null,
      user: req.user 
    });
  }
});

// POST /admin/users/:id/unblock - Unblock user
// Permission: users.write (theo US-13)
router.post("/:id/unblock", requirePermission("users.write"), async function (req, res) {
  const service = new UserService();
  
  try {
    const result = await service.unblockUser(req.params.id);

    if (!result.ok) {
      const users = await service.getUsers({ trangThai: "all", search: "" });
      const allRoles = await service.getAllRoles();
      return res.status(400).render("admin/users.ejs", { 
        users, 
        allRoles,
        filters: { trangThai: "all", search: "" },
        error: result.message, 
        success: null,
        user: req.user 
      });
    }

    return res.redirect("/admin/users?success=unblocked");
  } catch (e) {
    console.error("Error unblocking user:", e);
    const users = await service.getUsers({ trangThai: "all", search: "" });
    const allRoles = await service.getAllRoles();
    return res.status(500).render("admin/users.ejs", { 
      users, 
      allRoles,
      filters: { trangThai: "all", search: "" },
      error: "Lỗi server khi unblock user", 
      success: null,
      user: req.user 
    });
  }
});

// POST /admin/users/:id/roles/add - Gán role cho user
// Permission: users.write (theo US-13)
router.post(
  "/:id/roles/add",
  requirePermission("users.write"),
  [body("roleId").notEmpty().withMessage("Role ID không được để trống")],
  async function (req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const service = new UserService();
      const users = await service.getUsers({ trangThai: "all", search: "" });
      const allRoles = await service.getAllRoles();
      return res.status(400).render("admin/users.ejs", { 
        users, 
        allRoles,
        filters: { trangThai: "all", search: "" },
        error: errors.array().map(e => e.msg).join(", "), 
        success: null,
        user: req.user 
      });
    }

    const service = new UserService();
    
    try {
      const result = await service.assignRoleToUser(req.params.id, req.body.roleId);

      if (!result.ok) {
        const users = await service.getUsers({ trangThai: "all", search: "" });
        const allRoles = await service.getAllRoles();
        return res.status(400).render("admin/users.ejs", { 
          users, 
          allRoles,
          filters: { trangThai: "all", search: "" },
          error: result.message, 
          success: null,
          user: req.user 
        });
      }

      return res.redirect("/admin/users?success=role_added");
    } catch (e) {
      console.error("Error assigning role:", e);
      const users = await service.getUsers({ trangThai: "all", search: "" });
      const allRoles = await service.getAllRoles();
      return res.status(500).render("admin/users.ejs", { 
        users, 
        allRoles,
        filters: { trangThai: "all", search: "" },
        error: "Lỗi server khi gán role", 
        success: null,
        user: req.user 
      });
    }
  }
);

// POST /admin/users/:id/roles/:roleId/remove - Bỏ role khỏi user
// Permission: users.write (theo US-13)
router.post("/:id/roles/:roleId/remove", requirePermission("users.write"), async function (req, res) {
  const service = new UserService();
  
  try {
    const result = await service.removeRoleFromUser(req.params.id, req.params.roleId);

    if (!result.ok) {
      const users = await service.getUsers({ trangThai: "all", search: "" });
      const allRoles = await service.getAllRoles();
      return res.status(400).render("admin/users.ejs", { 
        users, 
        allRoles,
        filters: { trangThai: "all", search: "" },
        error: result.message, 
        success: null,
        user: req.user 
      });
    }

    return res.redirect("/admin/users?success=role_removed");
  } catch (e) {
    console.error("Error removing role:", e);
    const users = await service.getUsers({ trangThai: "all", search: "" });
    const allRoles = await service.getAllRoles();
    return res.status(500).render("admin/users.ejs", { 
      users, 
      allRoles,
      filters: { trangThai: "all", search: "" },
      error: "Lỗi server khi bỏ role", 
      success: null,
      user: req.user 
    });
  }
});

module.exports = router;

