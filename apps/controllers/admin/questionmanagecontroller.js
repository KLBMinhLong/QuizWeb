var express = require("express");
var router = express.Router();
var multer = require("multer");
var path = require("path");
var fs = require("fs");
var QuestionService = require(global.__basedir + "/apps/Services/QuestionService");

// Cấu hình multer để lưu file tạm
var upload = multer({
  dest: path.join(__dirname, "../../../uploads/temp"),
  fileFilter: function (req, file, cb) {
    const allowedExtensions = [".xlsx", ".xls", ".csv"];
    const ext = path.extname(file.originalname).toLowerCase();
    console.log("File upload check - originalname:", file.originalname, "ext:", ext);
    if (allowedExtensions.includes(ext)) {
      cb(null, true);
    } else {
      console.log("File rejected - extension not allowed:", ext);
      cb(new Error("File không được hỗ trợ. Chỉ hỗ trợ .xlsx, .xls, .csv"), false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
});

// Đảm bảo thư mục uploads/temp tồn tại
const uploadDir = path.join(__dirname, "../../../uploads/temp");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

router.get("/", function (req, res) {
  // Đọc success/error message từ query
  let success = null;
  let error = null;
  if (req.query.success === "imported") {
    success = "Import câu hỏi thành công!";
  } else if (req.query.error) {
    error = decodeURIComponent(req.query.error);
  }

  res.render("admin/questions.ejs", {
    message: null,
    success: success,
    error: error,
    importErrors: null, // Khởi tạo để tránh lỗi undefined
    user: req.user,
  });
});

// POST /admin/questions/import - Import questions từ file Excel/CSV
router.post("/import", function (req, res, next) {
  upload.single("file")(req, res, function (err) {
    if (err) {
      // Xử lý lỗi từ multer (fileFilter, fileSize, etc.)
      return res.redirect("/admin/questions?error=" + encodeURIComponent(err.message || "Lỗi khi upload file"));
    }
    next();
  });
}, async function (req, res) {
  if (!req.file) {
    return res.redirect("/admin/questions?error=" + encodeURIComponent("Vui lòng chọn file để import"));
  }

  const filePath = req.file.path;
  const originalName = req.file.originalname;

  try {
    const service = new QuestionService();
    console.log("Importing file:", originalName, "Path:", filePath);
    const result = await service.importQuestions(filePath, originalName);

    // Xóa file tạm sau khi xử lý
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    if (!result.ok) {
      return res.redirect("/admin/questions?error=" + encodeURIComponent(result.message));
    }

    // Hiển thị kết quả import
    const importResult = result.result;
    let message = `Import hoàn tất: ${importResult.success} câu hỏi thành công`;
    if (importResult.failed > 0) {
      message += `, ${importResult.failed} câu hỏi thất bại`;
    }

    // Nếu có lỗi, hiển thị chi tiết
    let errorDetails = null;
    if (importResult.errors && importResult.errors.length > 0) {
      errorDetails = importResult.errors.slice(0, 20); // Hiển thị tối đa 20 lỗi đầu tiên
      if (importResult.errors.length > 20) {
        message += ` (hiển thị 20 lỗi đầu tiên trong ${importResult.errors.length} lỗi)`;
      }
    }

    return res.render("admin/questions.ejs", {
      message: message,
      success: importResult.success > 0 ? message : null,
      error: importResult.failed > 0 ? `Có ${importResult.failed} câu hỏi import thất bại` : null,
      importErrors: errorDetails,
      user: req.user,
    });
  } catch (error) {
    // Xóa file tạm nếu có lỗi
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    console.error("Import error:", error);
    return res.redirect("/admin/questions?error=" + encodeURIComponent("Lỗi khi import: " + error.message));
  }
});

module.exports = router;



