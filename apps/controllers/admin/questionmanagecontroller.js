var express = require("express");
var router = express.Router();
var multer = require("multer");
var path = require("path");
var fs = require("fs");
var crypto = require("crypto");
var QuestionService = require(global.__basedir + "/apps/Services/QuestionService");
var SubjectService = require(global.__basedir + "/apps/Services/SubjectService");

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

// Đảm bảo thư mục uploads/temp và uploads/imported tồn tại
const uploadDir = path.join(__dirname, "../../../uploads/temp");
const importedDir = path.join(__dirname, "../../../uploads/imported");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
if (!fs.existsSync(importedDir)) {
  fs.mkdirSync(importedDir, { recursive: true });
}

// Sử dụng QuestionService.calculateFileHash thay vì tạo function riêng

// GET /admin/questions - Danh sách câu hỏi với filter
router.get("/", async function (req, res) {
  try {
    const questionService = new QuestionService();
    const subjectService = new SubjectService();
    
    // Lấy danh sách subjects để hiển thị trong filter
    const subjects = await subjectService.getAllSubjects();
    
    // Lấy filter từ query
    const subjectId = req.query.subjectId || null;
    const difficulty = req.query.difficulty || "";
    const type = req.query.type || "";
    const keyword = req.query.keyword || "";
    
    // Lấy danh sách questions với filter
    const questions = await questionService.getQuestions({
      subjectId: subjectId,
      difficulty: difficulty || null,
      type: type || null,
      keyword: keyword || null,
    });
    
    // Đọc success/error message từ query
    let success = null;
    let error = null;
    if (req.query.success === "created") {
      success = "Tạo câu hỏi thành công!";
    } else if (req.query.success === "updated") {
      success = "Cập nhật câu hỏi thành công!";
    } else if (req.query.success === "deleted") {
      success = "Xóa câu hỏi thành công!";
    } else if (req.query.error) {
      error = decodeURIComponent(req.query.error);
    }
    
    res.render("admin/questions.ejs", {
      questions: questions,
      subjects: subjects,
      filters: {
        subjectId: subjectId,
        difficulty: difficulty,
        type: type,
        keyword: keyword,
      },
      success: success,
      error: error,
      user: req.user,
    });
  } catch (e) {
    console.error("Error loading questions list:", e);
    res.status(500).send("Lỗi server khi tải danh sách câu hỏi");
  }
});

// GET /admin/questions/import - Trang import câu hỏi
router.get("/import", function (req, res) {
  res.render("admin/question-import.ejs", {
    success: null,
    error: null,
    importErrors: null,
    user: req.user,
  });
});

// POST /admin/questions/import - Import questions từ file Excel/CSV
router.post("/import", function (req, res, next) {
  upload.single("file")(req, res, function (err) {
    if (err) {
      // Xử lý lỗi từ multer (fileFilter, fileSize, etc.)
      return res.render("admin/question-import.ejs", {
        success: null,
        error: err.message || "Lỗi khi upload file",
        importErrors: null,
        user: req.user,
      });
    }
    next();
  });
}, async function (req, res) {
  if (!req.file) {
    return res.render("admin/question-import.ejs", {
      success: null,
      error: "Vui lòng chọn file để import",
      importErrors: null,
      user: req.user,
    });
  }

  const filePath = req.file.path;
  const originalName = req.file.originalname;

  try {
    const service = new QuestionService();
    // Tính hash của file để check duplicate
    const fileHash = QuestionService.calculateFileHash(filePath);
    
    console.log("Importing file:", originalName, "Path:", filePath, "Hash:", fileHash);
    const result = await service.importQuestions(filePath, originalName, fileHash);

    // Nếu là duplicate file, không cần xử lý thêm
    if (result.isDuplicate) {
      // Xóa file tạm
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      return res.render("admin/question-import.ejs", {
        success: null,
        error: result.message,
        importErrors: null,
        user: req.user,
      });
    }

    if (!result.ok) {
      // Xóa file tạm nếu có lỗi
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      return res.render("admin/question-import.ejs", {
        success: null,
        error: result.message,
        importErrors: null,
        user: req.user,
      });
    }

    // Lưu file vào thư mục imported thay vì xóa (chỉ khi có ít nhất 1 câu hỏi thành công)
    const importResult = result.result;
    let savedPath = null;
    
    if (importResult.success > 0) {
      // Chỉ lưu file nếu có ít nhất 1 câu hỏi import thành công
      const timestamp = Date.now();
      const ext = path.extname(originalName);
      const baseName = path.basename(originalName, ext);
      const savedFileName = `${baseName}_${timestamp}${ext}`;
      savedPath = path.join(importedDir, savedFileName);
      
      try {
        // Copy file từ temp sang imported
        fs.copyFileSync(filePath, savedPath);
        
        // Lưu thông tin file đã import
        await service.saveImportedFileInfo(
          result.fileHash,
          originalName,
          savedPath,
          importResult.success,
          importResult.failed
        );
      } catch (copyError) {
        console.error("Error copying file to imported folder:", copyError);
        // Nếu lỗi copy, vẫn tiếp tục nhưng không lưu file info
      }
    }
    
    // Xóa file tạm sau khi copy (hoặc nếu không cần lưu)
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Hiển thị kết quả import
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

    return res.render("admin/question-import.ejs", {
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
    return res.render("admin/question-import.ejs", {
      success: null,
      error: "Lỗi khi import: " + error.message,
      importErrors: null,
      user: req.user,
    });
  }
});

// GET /admin/questions/create - Trang tạo câu hỏi mới
router.get("/create", async function (req, res) {
  try {
    const subjectService = new SubjectService();
    const subjects = await subjectService.getAllSubjects();
    res.render("admin/question-create.ejs", {
      subjects: subjects,
      error: null,
      user: req.user,
    });
  } catch (e) {
    console.error("Error loading create question page:", e);
    res.status(500).send("Lỗi server");
  }
});

// POST /admin/questions/create - Tạo câu hỏi mới
router.post("/create", async function (req, res) {
  try {
    const subjectService = new SubjectService();
    const subjects = await subjectService.getAllSubjects();
    
    const questionService = new QuestionService();
    const result = await questionService.createQuestion({
      subjectId: req.body.subjectId,
      difficulty: req.body.difficulty,
      type: req.body.type,
      content: req.body.content,
      mediaUrl: req.body.mediaUrl || null,
      answers: JSON.parse(req.body.answers || "[]"),
    });
    
    if (!result.ok) {
      return res.render("admin/question-create.ejs", {
        subjects: subjects,
        error: result.message,
        user: req.user,
      });
    }
    
    return res.redirect("/admin/questions?success=created");
  } catch (e) {
    console.error("Error creating question:", e);
    const subjectService = new SubjectService();
    const subjects = await subjectService.getAllSubjects();
    return res.render("admin/question-create.ejs", {
      subjects: subjects,
      error: "Lỗi khi tạo câu hỏi: " + e.message,
      user: req.user,
    });
  }
});

// GET /admin/questions/:id/edit - Trang sửa câu hỏi
router.get("/:id/edit", async function (req, res) {
  try {
    const questionService = new QuestionService();
    const subjectService = new SubjectService();
    
    const question = await questionService.getQuestionById(req.params.id);
    if (!question) {
      return res.redirect("/admin/questions?error=" + encodeURIComponent("Không tìm thấy câu hỏi"));
    }
    
    const subjects = await subjectService.getAllSubjects();
    res.render("admin/question-edit.ejs", {
      question: question,
      subjects: subjects,
      error: null,
      user: req.user,
    });
  } catch (e) {
    console.error("Error loading edit question page:", e);
    res.redirect("/admin/questions?error=" + encodeURIComponent("Lỗi khi tải trang sửa"));
  }
});

// POST /admin/questions/:id/update - Cập nhật câu hỏi
router.post("/:id/update", async function (req, res) {
  try {
    const questionService = new QuestionService();
    const subjectService = new SubjectService();
    
    const result = await questionService.updateQuestion(req.params.id, {
      subjectId: req.body.subjectId,
      difficulty: req.body.difficulty,
      type: req.body.type,
      content: req.body.content,
      mediaUrl: req.body.mediaUrl || null,
      answers: JSON.parse(req.body.answers || "[]"),
    });
    
    if (!result.ok) {
      const question = await questionService.getQuestionById(req.params.id);
      const subjects = await subjectService.getAllSubjects();
      return res.render("admin/question-edit.ejs", {
        question: question,
        subjects: subjects,
        error: result.message,
        user: req.user,
      });
    }
    
    return res.redirect("/admin/questions?success=updated");
  } catch (e) {
    console.error("Error updating question:", e);
    return res.redirect("/admin/questions?error=" + encodeURIComponent("Lỗi khi cập nhật câu hỏi"));
  }
});

// POST /admin/questions/:id/delete - Xóa câu hỏi
router.post("/:id/delete", async function (req, res) {
  try {
    const questionService = new QuestionService();
    const result = await questionService.deleteQuestion(req.params.id);
    
    if (!result.ok) {
      return res.redirect("/admin/questions?error=" + encodeURIComponent(result.message));
    }
    
    return res.redirect("/admin/questions?success=deleted");
  } catch (e) {
    console.error("Error deleting question:", e);
    return res.redirect("/admin/questions?error=" + encodeURIComponent("Lỗi khi xóa câu hỏi"));
  }
});

module.exports = router;



