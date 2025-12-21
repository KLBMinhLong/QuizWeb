var express = require("express");
var router = express.Router();
var { body, validationResult } = require("express-validator");

var AuthService = require(global.__basedir + "/apps/Services/AuthService");

router.get("/login", function (req, res) {
  const success = req.query.registered === 'true' ? 'Đăng ký thành công! Vui lòng đăng nhập.' : null;
  res.render("auth/login.ejs", { error: null, success });
});

router.post(
  "/login",
  [
    body("username").notEmpty().withMessage("Tên đăng nhập không được để trống"),
    body("password").notEmpty().withMessage("Mật khẩu không được để trống"),
  ],
  async function (req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).render("auth/login.ejs", { error: "Thiếu dữ liệu đăng nhập", success: null });
    }

    try {
      const service = new AuthService();
      const result = await service.login(req.body.username, req.body.password);
      if (!result.ok) {
        return res.status(401).render("auth/login.ejs", { error: result.message, success: null });
      }
      // MVP: lưu token trong cookie
      res.cookie("token", result.token, { httpOnly: true });
      return res.redirect("/");
    } catch (e) {
      console.error("Login error:", e);
      return res.status(500).render("auth/login.ejs", { error: "Lỗi server", success: null });
    }
  }
);

router.get("/register", function (req, res) {
  res.render("auth/register.ejs", { error: null, success: null });
});

router.post(
  "/register",
  [
    body("username")
      .notEmpty().withMessage("Tên đăng nhập không được để trống")
      .isLength({ min: 3, max: 50 }).withMessage("Tên đăng nhập phải từ 3-50 ký tự")
      .matches(/^[a-zA-Z0-9_]+$/).withMessage("Tên đăng nhập chỉ chứa chữ, số và dấu gạch dưới"),
    body("email")
      .notEmpty().withMessage("Email không được để trống")
      .isEmail().withMessage("Email không hợp lệ")
      .normalizeEmail(),
    body("password")
      .notEmpty().withMessage("Mật khẩu không được để trống")
      .isLength({ min: 6, max: 100 }).withMessage("Mật khẩu phải từ 6-100 ký tự")
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage("Mật khẩu phải có ít nhất 1 chữ hoa, 1 chữ thường và 1 số"),
  ],
  async function (req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMsg = errors.array().map(e => e.msg).join(", ");
      return res.status(400).render("auth/register.ejs", { error: errorMsg || "Dữ liệu không hợp lệ", success: null });
    }

    try {
      const service = new AuthService();
      const result = await service.register(req.body.username, req.body.email, req.body.password);
      if (!result.ok) {
        return res.status(400).render("auth/register.ejs", { error: result.message, success: null });
      }
      return res.redirect("/auth/login?registered=true");
    } catch (e) {
      console.error("Register error:", e);
      return res.status(500).render("auth/register.ejs", { error: "Lỗi server", success: null });
    }
  }
);

router.get("/logout", function (req, res) {
  res.clearCookie("token");
  res.redirect("/");
});

module.exports = router;



