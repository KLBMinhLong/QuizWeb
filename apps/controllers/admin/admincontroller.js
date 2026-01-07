var express = require("express");
var router = express.Router();
var { requireAuth, requireAdmin } = require(global.__basedir + "/apps/Util/VerifyToken");

// Import Services for stats
var SubjectService = require(global.__basedir + "/apps/Services/SubjectService");
var QuestionService = require(global.__basedir + "/apps/Services/QuestionService");
var UserService = require(global.__basedir + "/apps/Services/UserService");
var RoleService = require(global.__basedir + "/apps/Services/RoleService");

// Apply requireAuth và requireAdmin cho tất cả routes trong /admin
// Lưu ý: Các controller con có thể thêm requirePermission cho fine-grained control
// (xem US-12, US-13 để biết permissions chi tiết cho từng route)
router.use(requireAuth);
router.use(requireAdmin);

router.get("/", async function (req, res) {
  try {
    // Gather stats for dashboard using Services
    const subjectService = new SubjectService();
    const questionService = new QuestionService();
    const userService = new UserService();
    const roleService = new RoleService();

    const [subjects, questions, users, roles] = await Promise.all([
      subjectService.getAllSubjects(),
      questionService.getQuestions(),
      userService.getUsers(),
      roleService.getAllRoles()
    ]);

    const stats = {
      subjects: subjects ? subjects.length : 0,
      questions: questions ? questions.length : 0,
      users: users ? users.length : 0,
      roles: roles ? roles.length : 0
    };

    res.render("admin/dashboard.ejs", { user: req.user, stats });
  } catch (error) {
    console.error('Error loading admin dashboard:', error);
    res.render("admin/dashboard.ejs", { user: req.user, stats: {}, error: 'Lỗi khi tải thống kê' });
  }
});

router.use("/subjects", require(__dirname + "/subjectmanagecontroller"));
router.use("/questions", require(__dirname + "/questionmanagecontroller"));
router.use("/roles", require(__dirname + "/rolemanagecontroller"));
router.use("/users", require(__dirname + "/usermanagecontroller"));

module.exports = router;



