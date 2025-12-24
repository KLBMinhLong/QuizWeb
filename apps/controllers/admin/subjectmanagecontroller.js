var express = require("express");
var router = express.Router();
var { body, validationResult } = require("express-validator");

var SubjectService = require(global.__basedir +
  "/apps/Services/SubjectService");

// GET /admin/subjects - Hiển thị danh sách môn học
router.get("/", async function (req, res) {
  try {
    const service = new SubjectService();
    const subjects = await service.getAllSubjects();
    
    // Đọc success message từ query parameter
    let success = null;
    if (req.query.success === "created") {
      success = "Tạo môn học thành công!";
    } else if (req.query.success === "updated") {
      success = "Cập nhật môn học thành công!";
    } else if (req.query.success === "config-updated") {
      success = "Cập nhật cấu hình đề thi thành công!";
    } else if (req.query.success === "toggled") {
      success = "Thay đổi trạng thái môn học thành công!";
    } else if (req.query.success === "deleted") {
      success = "Xóa môn học thành công!";
    }
    
    res.render("admin/subjects.ejs", {
      subjects,
      error: null,
      success: success,
      user: req.user,
    });
  } catch (e) {
    console.error("Error loading subjects list:", e);
    res.status(500).send("Lỗi server khi tải danh sách môn học");
  }
});

// POST /admin/subjects/create - Tạo môn học mới
router.post("/create", body("name").notEmpty(), async function (req, res) {
  try {
    const errors = validationResult(req);
    const service = new SubjectService();
    const subjects = await service.getAllSubjects();

    if (!errors.isEmpty()) {
      return res.status(400).render("admin/subjects.ejs", {
        subjects,
        error: "Thiếu tên môn học",
        success: null,
        user: req.user,
      });
    }

    const result = await service.createSubject({
      name: req.body.name,
      description: req.body.description || "",
    });

    if (!result.ok) {
      return res.status(400).render("admin/subjects.ejs", {
        subjects,
        error: result.message,
        success: null,
        user: req.user,
      });
    }

    return res.redirect("/admin/subjects?success=created");
  } catch (e) {
    console.error("Error creating subject:", e);
    const service = new SubjectService();
    const subjects = await service.getAllSubjects();
    return res.status(500).render("admin/subjects.ejs", {
      subjects,
      error: "Lỗi server khi tạo môn học",
      success: null,
      user: req.user,
    });
  }
});

// POST /admin/subjects/:id/update - Cập nhật thông tin môn học
router.post("/:id/update", body("name").notEmpty(), async function (req, res) {
  try {
    const errors = validationResult(req);
    const service = new SubjectService();

    if (!errors.isEmpty()) {
      return res.redirect("/admin/subjects");
    }

    const result = await service.updateSubject(req.params.id, {
      name: req.body.name,
      description: req.body.description || "",
    });

    if (!result.ok) {
      const subjects = await service.getAllSubjects();
      return res.status(400).render("admin/subjects.ejs", {
        subjects,
        error: result.message,
        success: null,
        user: req.user,
      });
    }

    return res.redirect("/admin/subjects?success=updated");
  } catch (e) {
    console.error("Error updating subject:", e);
    const service = new SubjectService();
    const subjects = await service.getAllSubjects();
    return res.status(500).render("admin/subjects.ejs", {
      subjects,
      error: "Lỗi server khi cập nhật môn học",
      success: null,
      user: req.user,
    });
  }
});

// POST /admin/subjects/:id/update-config - Cập nhật cấu hình đề thi
router.post(
  "/:id/update-config",
  body("easyCount").isInt({ min: 0 }),
  body("mediumCount").isInt({ min: 0 }),
  body("hardCount").isInt({ min: 0 }),
  body("durationMinutes").isInt({ min: 1 }),
  async function (req, res) {
    try {
      const errors = validationResult(req);
      const service = new SubjectService();

      if (!errors.isEmpty()) {
        const subjects = await service.getAllSubjects();
        return res.status(400).render("admin/subjects.ejs", {
          subjects,
          error: "Dữ liệu cấu hình không hợp lệ",
          success: null,
          user: req.user,
        });
      }

      const result = await service.updateExamConfig(req.params.id, {
        easyCount: req.body.easyCount,
        mediumCount: req.body.mediumCount,
        hardCount: req.body.hardCount,
        durationMinutes: req.body.durationMinutes,
      });

      if (!result.ok) {
        const subjects = await service.getAllSubjects();
        return res.status(400).render("admin/subjects.ejs", {
          subjects,
          error: result.message,
          success: null,
          user: req.user,
        });
      }

      return res.redirect("/admin/subjects?success=config-updated");
    } catch (e) {
      console.error("Error updating exam config:", e);
      const service = new SubjectService();
      const subjects = await service.getAllSubjects();
      return res.status(500).render("admin/subjects.ejs", {
        subjects,
        error: "Lỗi server khi cập nhật cấu hình đề thi",
        success: null,
        user: req.user,
      });
    }
  }
);

// POST /admin/subjects/:id/toggle-active - Bật/tắt hiển thị môn học
router.post("/:id/toggle-active", async function (req, res) {
  try {
    const service = new SubjectService();
    const isActive = req.body.isActive === "true";

    const result = await service.toggleActive(req.params.id, isActive);

    if (!result.ok) {
      const subjects = await service.getAllSubjects();
      return res.status(400).render("admin/subjects.ejs", {
        subjects,
        error: result.message,
        success: null,
        user: req.user,
      });
    }

    return res.redirect("/admin/subjects?success=toggled");
  } catch (e) {
    console.error("Error toggling subject active status:", e);
    const service = new SubjectService();
    const subjects = await service.getAllSubjects();
    return res.status(500).render("admin/subjects.ejs", {
      subjects,
      error: "Lỗi server khi thay đổi trạng thái môn học",
      success: null,
      user: req.user,
    });
  }
});

// POST /admin/subjects/:id/delete - Xóa môn học
router.post("/:id/delete", async function (req, res) {
  try {
    const service = new SubjectService();

    const result = await service.deleteSubject(req.params.id);

    if (!result.ok) {
      const subjects = await service.getAllSubjects();
      return res.status(400).render("admin/subjects.ejs", {
        subjects,
        error: result.message,
        success: null,
        user: req.user,
      });
    }

    return res.redirect("/admin/subjects?success=deleted");
  } catch (e) {
    console.error("Error deleting subject:", e);
    const service = new SubjectService();
    const subjects = await service.getAllSubjects();
    return res.status(500).render("admin/subjects.ejs", {
      subjects,
      error: "Lỗi server khi xóa môn học",
      success: null,
      user: req.user,
    });
  }
});

module.exports = router;
