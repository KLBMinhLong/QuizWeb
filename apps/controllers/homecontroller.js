var express = require("express");
var router = express.Router();
var { optionalAuth } = require(global.__basedir + "/apps/Util/VerifyToken");

router.get("/", optionalAuth, function (req, res) {
  res.render("home.ejs", { title: "OnThiTracNghiem", user: req.user || null });
});

module.exports = router;



