var express = require("express");
var router = express.Router();

router.get("/", function (req, res) {
  // MVP: chưa enforce auth/role, chỉ dựng trang
  res.render("admin/dashboard.ejs");
});

router.use("/subjects", require(__dirname + "/subjectmanagecontroller"));
router.use("/questions", require(__dirname + "/questionmanagecontroller"));

module.exports = router;



