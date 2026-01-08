var express = require("express");
var router = express.Router();
var { optionalAuth, requireAuth, hasPermission } = require(global.__basedir +
  "/apps/Util/VerifyToken");

var ExamService = require(global.__basedir + "/apps/Services/ExamService");
var SubjectService = require(global.__basedir +
  "/apps/Services/SubjectService");

router.get("/start/:subjectSlug", optionalAuth, async function (req, res) {
  try {
    const subjectService = new SubjectService();
    const subject = await subjectService.getBySlugWithStats(
      req.params.subjectSlug
    );
    if (!subject) return res.status(404).send("Không tìm thấy môn");

    if (!subject.isActive && (!req.user || req.user.role !== "admin")) {
      return res.status(404).send("Không tìm thấy môn học");
    }

    res.render("exam/start.ejs", { subject, user: req.user || null });
  } catch (e) {
    res.status(500).send("Lỗi server");
  }
});

router.post("/generate", optionalAuth, async function (req, res) {
  try {
    const { subjectId } = req.body;
    const user = req.user || null;

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

    const subjectService = new SubjectService();
    const subject = await subjectService.getById(subjectId);

    res.render("exam/take.ejs", {
      subjectId,
      subject: subject || { _id: subjectId, name: "Môn học", slug: "" },
      questions: exam.questions,
      durationMinutes: exam.durationMinutes,
      remainingSeconds: exam.remainingSeconds,
      endTime: exam.endTime,
      serverTime: exam.serverTime,
      userAnswers: exam.userAnswers || {},
      isResume: exam.isResume || false,
      attemptId: exam.attemptId,
      hasShortage: exam.hasShortage,
      shortages: exam.shortages,
      user,
    });
  } catch (e) {
    res.status(500).send("Lỗi server");
  }
});

router.post("/submit", optionalAuth, async function (req, res) {
  try {
    const user = req.user || null;

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

router.post("/save-progress", optionalAuth, async function (req, res) {
  try {
    const user = req.user || null;
    const { attemptId, answers } = req.body;

    if (!hasPermission(user, "exams.take")) {
      return res.status(403).json({ ok: false, message: "Unauthorized" });
    }

    const service = new ExamService();
    const result = await service.saveProgress(attemptId, user, answers);
    res.json(result);
  } catch (e) {
    console.error("Error saving progress:", e);
    res.status(500).json({ ok: false, message: "Server error" });
  }
});

router.get("/history", requireAuth, async function (req, res) {
  try {
    const user = req.user;

    const canRead = hasPermission(user, "exams.read");
    if (!canRead) {
      return res.status(403).send("Bạn không có quyền xem lịch sử thi");
    }

    const subjectFilter = req.query.subject || '';
    const dateFrom = req.query.dateFrom || '';
    const dateTo = req.query.dateTo || '';

    const page = parseInt(req.query.page) || 1;
    const limit = 20;

    const service = new ExamService();
    const result = await service.getAttemptHistory(user, {
      limit: 1000,
    });

    if (!result.ok) {
      return res.status(400).send(result.message);
    }

    const subjectService = new SubjectService();
    const allSubjects = await subjectService.getAllSubjects();

    let filteredAttempts = result.attempts || [];
    
    if (subjectFilter) {
      filteredAttempts = filteredAttempts.filter(a => 
        a.subject && String(a.subject._id) === subjectFilter
      );
    }
    
    if (dateFrom) {
      const fromDate = new Date(dateFrom);
      fromDate.setHours(0, 0, 0, 0);
      filteredAttempts = filteredAttempts.filter(a => 
        new Date(a.startedAt) >= fromDate
      );
    }
    if (dateTo) {
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59, 999);
      filteredAttempts = filteredAttempts.filter(a => 
        new Date(a.startedAt) <= toDate
      );
    }

    const totalItems = filteredAttempts.length;
    const totalPages = Math.ceil(totalItems / limit);
    const currentPage = Math.max(1, Math.min(page, totalPages || 1));
    const startIndex = (currentPage - 1) * limit;
    const attempts = filteredAttempts.slice(startIndex, startIndex + limit);

    let baseUrl = '/exam/history?';
    if (subjectFilter) baseUrl += `subject=${subjectFilter}&`;
    if (dateFrom) baseUrl += `dateFrom=${dateFrom}&`;
    if (dateTo) baseUrl += `dateTo=${dateTo}&`;
    baseUrl = baseUrl.replace(/[&?]$/, '');

    res.render("exam/history.ejs", {
      attempts: attempts,
      isAdminOrModerator: result.isAdminOrModerator,
      subjects: allSubjects || [],
      subjectFilter,
      dateFrom,
      dateTo,
      currentPage: currentPage,
      totalPages: totalPages,
      totalItems: totalItems,
      itemsPerPage: limit,
      baseUrl: baseUrl || '/exam/history',
      user,
    });
  } catch (e) {
    console.error("Error loading exam history:", e);
    res.status(500).send("Lỗi server");
  }
});

router.get("/attempt/:id", requireAuth, async function (req, res) {
  try {
    const user = req.user;
    const attemptId = req.params.id;

    const canRead = hasPermission(user, "exams.read");
    if (!canRead) {
      return res.status(403).send("Bạn không có quyền xem chi tiết attempt");
    }

    const service = new ExamService();
    const result = await service.getAttemptDetail(attemptId, user);

    if (!result.ok) {
      return res.status(400).send(result.message);
    }

    res.render("exam/attempt-detail.ejs", {
      attempt: result.attempt,
      subject: result.subject,
      questionDetails: result.questionDetails,
      user,
    });
  } catch (e) {
    console.error("Error loading attempt detail:", e);
    res.status(500).send("Lỗi server");
  }
});

module.exports = router;
