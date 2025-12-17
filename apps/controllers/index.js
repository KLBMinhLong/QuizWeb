var express = require("express");
var router = express.Router();

router.use("/", require(__dirname + "/homecontroller"));
router.use("/auth", require(__dirname + "/authcontroller"));
router.use("/subjects", require(__dirname + "/subjectcontroller"));
router.use("/exam", require(__dirname + "/examcontroller"));
router.use("/admin", require(__dirname + "/admin/admincontroller"));

module.exports = router;



