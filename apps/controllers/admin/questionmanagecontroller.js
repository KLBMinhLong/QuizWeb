var express = require("express");
var router = express.Router();

router.get("/", function (req, res) {
  res.render("admin/questions.ejs", { message: "MVP: quản lý câu hỏi sẽ làm tiếp (CRUD + Import)" });
});

module.exports = router;



