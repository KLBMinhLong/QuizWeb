var express = require("express");
var router = express.Router();

var SubjectService = require(global.__basedir + "/apps/Services/SubjectService");

router.get("/", async function (req, res) {
  try {
    const service = new SubjectService();
    const subjects = await service.getActiveSubjects();
    res.render("subjects/index.ejs", { subjects });
  } catch (e) {
    res.status(500).send("Lỗi server");
  }
});

router.get("/:slug", async function (req, res) {
  try {
    const service = new SubjectService();
    const subject = await service.getBySlug(req.params.slug);
    if (!subject) return res.status(404).send("Không tìm thấy môn học");
    res.render("subjects/detail.ejs", { subject });
  } catch (e) {
    res.status(500).send("Lỗi server");
  }
});

module.exports = router;



