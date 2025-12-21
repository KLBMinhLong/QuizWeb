var express = require("express");
var router = express.Router();
var { body, validationResult } = require("express-validator");

var SubjectService = require(global.__basedir +
  "/apps/Services/SubjectService");

// GET /admin/subjects - Hiển thị danh sách môn học
router.get("/", async function (req, res) {
  const service = new SubjectService();
  const subjects = await service.getAllSubjects();
  res.render("admin/subjects.ejs", {
    subjects,
    error: null,
    success: null,
    user: req.user,
  });
});

// POST /admin/subjects/create - Tạo môn học mới
router.post("/create", body("name").notEmpty(), async function (req, res) {
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

  return res.redirect("/admin/subjects");
});

// POST /admin/subjects/:id/update - Cập nhật thông tin môn học
router.post("/:id/update", body("name").notEmpty(), async function (req, res) {
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

  return res.redirect("/admin/subjects");
});

// POST /admin/subjects/:id/update-config - Cập nhật cấu hình đề thi
router.post(
  "/:id/update-config",
  body("easyCount").isInt({ min: 0 }),
  body("mediumCount").isInt({ min: 0 }),
  body("hardCount").isInt({ min: 0 }),
  body("durationMinutes").isInt({ min: 1 }),
  async function (req, res) {
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

    return res.redirect("/admin/subjects");
  }
);

// POST /admin/subjects/:id/toggle-active - Bật/tắt hiển thị môn học
router.post("/:id/toggle-active", async function (req, res) {
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

  return res.redirect("/admin/subjects");
});

// POST /admin/subjects/:id/delete - Xóa môn học
router.post("/:id/delete", async function (req, res) {
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

  return res.redirect("/admin/subjects");
});

module.exports = router;
