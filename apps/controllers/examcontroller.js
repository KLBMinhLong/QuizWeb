var express = require("express");
var router = express.Router();
var { optionalAuth, hasPermission } = require(global.__basedir +
  "/apps/Util/VerifyToken");

var ExamService = require(global.__basedir + "/apps/Services/ExamService");
var SubjectService = require(global.__basedir +
  "/apps/Services/SubjectService");

// Trang chọn môn để bắt đầu
router.get("/start/:subjectSlug", optionalAuth, async function (req, res) {
  try {
    const subjectService = new SubjectService();
    const subject = await subjectService.getBySlugWithStats(
      req.params.subjectSlug
    );
    if (!subject) return res.status(404).send("Không tìm thấy môn");

    // Chỉ cho xem subjects active (trừ khi là admin)
    if (!subject.isActive && (!req.user || req.user.role !== "admin")) {
      return res.status(404).send("Không tìm thấy môn học");
    }

    res.render("exam/start.ejs", { subject, user: req.user || null });
  } catch (e) {
    res.status(500).send("Lỗi server");
  }
});

// Generate đề (US-40: tạo attempt snapshot + check permission exams.read/exams.take)
router.post("/generate", optionalAuth, async function (req, res) {
  try {
    const { subjectId } = req.body;

    const user = req.user || null;

    // Permission: cần exams.read hoặc exams.take (US-40)
    const canRead = hasPermission(user, "exams.read");
    const canTake = hasPermission(user, "exams.take");

    if (!canRead && !canTake) {
      if (!user) {
        return res.status(401).redirect("/auth/login");
      }
      return res.status(403).send("Bạn không có quyền tạo đề thi");
    }

    const service = new ExamService();
    const exam = await service.generateExam(subjectId, user);
    if (!exam.ok) return res.status(400).send(exam.message);

    // Load subject info để hiển thị breadcrumb (US-41)
    const subjectService = new SubjectService();
    const subject = await subjectService.getById(subjectId);

    res.render("exam/take.ejs", {
      subjectId,
      subject: subject || { _id: subjectId, name: "Môn học", slug: "" },
      questions: exam.questions,
      durationMinutes: exam.durationMinutes,
      attemptId: exam.attemptId,
      hasShortage: exam.hasShortage,
      shortages: exam.shortages,
      user,
    });
  } catch (e) {
    res.status(500).send("Lỗi server");
  }
});

// Submit bài (US-42: chấm điểm server-side theo snapshot)
router.post("/submit", optionalAuth, async function (req, res) {
  try {
    const user = req.user || null;

    // Permission: cần exams.take (US-42)
    const canTake = hasPermission(user, "exams.take");
    if (!canTake) {
      if (!user) {
        return res.status(401).redirect("/auth/login");
      }
      return res.status(403).send("Bạn không có quyền nộp bài thi");
    }

    const service = new ExamService();
    const result = await service.submitExam(req.body, user);
    if (!result.ok) return res.status(400).send(result.message);
    res.render("exam/result.ejs", { result, user: req.user || null });
  } catch (e) {
    console.error("Error submitting exam:", e);
    res.status(500).send("Lỗi server");
  }
});

module.exports = router;
