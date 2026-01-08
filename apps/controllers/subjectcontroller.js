var express = require("express");
var router = express.Router();
var { optionalAuth, requireAuth } = require(global.__basedir +
  "/apps/Util/VerifyToken");
var { body, validationResult } = require("express-validator");

var SubjectService = require(global.__basedir +
  "/apps/Services/SubjectService");
var SubjectCommentService = require(global.__basedir +
  "/apps/Services/SubjectCommentService");

router.get("/", optionalAuth, async function (req, res) {
  try {
    const service = new SubjectService();
    const subjects = await service.getActiveSubjects();
    res.render("subjects/index.ejs", { subjects, user: req.user || null });
  } catch (e) {
    res.status(500).send("Lỗi server");
  }
});

router.get("/:slug", optionalAuth, async function (req, res) {
  try {
    const service = new SubjectService();
    const subject = await service.getBySlugWithStats(req.params.slug);
    if (!subject) return res.status(404).send("Không tìm thấy môn học");

    if (!subject.isActive && (!req.user || req.user.role !== "admin")) {
      return res.status(404).send("Không tìm thấy môn học");
    }

    const commentService = new SubjectCommentService();
    const comments = await commentService.getCommentsBySubjectId(
      String(subject._id)
    );

    res.render("subjects/detail.ejs", {
      subject,
      comments,
      user: req.user || null,
      error: null,
    });
  } catch (e) {
    res.status(500).send("Lỗi server");
  }
});

router.post(
  "/:slug/comments",
  requireAuth,
  body("content").notEmpty().trim(),
  async function (req, res) {
    try {
      const errors = validationResult(req);

      const service = new SubjectService();
      const subject = await service.getBySlug(req.params.slug);
      if (!subject) return res.status(404).send("Không tìm thấy môn học");

      const commentService = new SubjectCommentService();
      const comments = await commentService.getCommentsBySubjectId(
        String(subject._id)
      );

      if (!errors.isEmpty()) {
        return res.status(400).render("subjects/detail.ejs", {
          subject,
          comments,
          user: req.user,
          error: "Nội dung bình luận không được để trống",
        });
      }

      const result = await commentService.createComment(
        String(subject._id),
        req.user.userId,
        req.user.username,
        req.body.content
      );

      if (!result.ok) {
        return res.status(400).render("subjects/detail.ejs", {
          subject,
          comments,
          user: req.user,
          error: result.message,
        });
      }

      return res.redirect(`/subjects/${req.params.slug}#comments`);
    } catch (e) {
      console.error(e);
      res.status(500).send("Lỗi server");
    }
  }
);

router.post(
  "/:slug/comments/:commentId/delete",
  requireAuth,
  async function (req, res) {
    try {
      const commentService = new SubjectCommentService();
      const result = await commentService.deleteComment(
        req.params.commentId,
        req.user.userId,
        req.user.role
      );

      if (!result.ok) {
        return res.status(400).send(result.message);
      }

      return res.redirect(`/subjects/${req.params.slug}#comments`);
    } catch (e) {
      console.error(e);
      res.status(500).send("Lỗi server");
    }
  }
);

module.exports = router;
