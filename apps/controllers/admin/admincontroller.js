var express = require("express");
var router = express.Router();
var { requireAuth, requireAdmin } = require(global.__basedir + "/apps/Util/VerifyToken");

// Apply requireAuth và requireAdmin cho tất cả routes trong /admin
router.use(requireAuth);
router.use(requireAdmin);

router.get("/", function (req, res) {
  res.render("admin/dashboard.ejs", { user: req.user });
});

router.use("/subjects", require(__dirname + "/subjectmanagecontroller"));
router.use("/questions", require(__dirname + "/questionmanagecontroller"));

module.exports = router;



