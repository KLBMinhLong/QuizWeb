var express = require("express");
var router = express.Router();
var { body, validationResult } = require("express-validator");

var SubjectService = require(global.__basedir + "/apps/Services/SubjectService");

router.get("/", async function (req, res) {
  const service = new SubjectService();
  const subjects = await service.getAllSubjects();
  res.render("admin/subjects.ejs", { subjects, error: null, user: req.user });
});

router.post(
  "/create",
  body("name").notEmpty(),
  async function (req, res) {
    const errors = validationResult(req);
    const service = new SubjectService();
    const subjects = await service.getAllSubjects();
    if (!errors.isEmpty()) {
      return res
        .status(400)
        .render("admin/subjects.ejs", { subjects, error: "Thiếu tên môn học", user: req.user });
    }

    const result = await service.createSubject({
      name: req.body.name,
      description: req.body.description || "",
    });
    if (!result.ok) {
      return res.status(400).render("admin/subjects.ejs", { subjects, error: result.message, user: req.user });
    }
    return res.redirect("/admin/subjects");
  }
);

module.exports = router;



