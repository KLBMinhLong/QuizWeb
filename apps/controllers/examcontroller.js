var express = require("express");
var router = express.Router();

var ExamService = require(global.__basedir + "/apps/Services/ExamService");
var SubjectService = require(global.__basedir + "/apps/Services/SubjectService");

// Trang chọn môn để bắt đầu
router.get("/start/:subjectSlug", async function (req, res) {
  try {
    const subjectService = new SubjectService();
    const subject = await subjectService.getBySlug(req.params.subjectSlug);
    if (!subject) return res.status(404).send("Không tìm thấy môn");
    res.render("exam/start.ejs", { subject });
  } catch (e) {
    res.status(500).send("Lỗi server");
  }
});

// Generate đề (MVP: chưa yêu cầu login bắt buộc; giai đoạn 2 sẽ enforce)
router.post("/generate", async function (req, res) {
  try {
    const { subjectId } = req.body;
    const service = new ExamService();
    const exam = await service.generateExam(subjectId);
    if (!exam.ok) return res.status(400).send(exam.message);
    res.render("exam/take.ejs", { subjectId, questions: exam.questions, durationMinutes: exam.durationMinutes });
  } catch (e) {
    res.status(500).send("Lỗi server");
  }
});

// Submit bài (MVP: chấm điểm đơn giản)
router.post("/submit", async function (req, res) {
  try {
    const service = new ExamService();
    const result = await service.submitExam(req.body);
    if (!result.ok) return res.status(400).send(result.message);
    res.render("exam/result.ejs", { result });
  } catch (e) {
    res.status(500).send("Lỗi server");
  }
});

module.exports = router;



