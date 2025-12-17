var express = require("express");
var router = express.Router();
var { body, validationResult } = require("express-validator");

var AuthService = require(global.__basedir + "/apps/Services/AuthService");

router.get("/login", function (req, res) {
  res.render("auth/login.ejs", { error: null });
});

router.post(
  "/login",
  body("username").notEmpty(),
  body("password").notEmpty(),
  async function (req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).render("auth/login.ejs", { error: "Thiếu dữ liệu đăng nhập" });
    }

    try {
      const service = new AuthService();
      const result = await service.login(req.body.username, req.body.password);
      if (!result.ok) {
        return res.status(401).render("auth/login.ejs", { error: result.message });
      }
      // MVP: lưu token trong cookie
      res.cookie("token", result.token, { httpOnly: true });
      return res.redirect("/");
    } catch (e) {
      return res.status(500).render("auth/login.ejs", { error: "Lỗi server" });
    }
  }
);

router.get("/register", function (req, res) {
  res.render("auth/register.ejs", { error: null });
});

router.post(
  "/register",
  body("username").notEmpty(),
  body("email").isEmail(),
  body("password").isLength({ min: 6 }),
  async function (req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).render("auth/register.ejs", { error: "Dữ liệu không hợp lệ" });
    }

    try {
      const service = new AuthService();
      const result = await service.register(req.body.username, req.body.email, req.body.password);
      if (!result.ok) {
        return res.status(400).render("auth/register.ejs", { error: result.message });
      }
      return res.redirect("/auth/login");
    } catch (e) {
      return res.status(500).render("auth/register.ejs", { error: "Lỗi server" });
    }
  }
);

router.get("/logout", function (req, res) {
  res.clearCookie("token");
  res.redirect("/");
});

module.exports = router;



