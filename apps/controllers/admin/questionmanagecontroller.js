var express = require("express");
var router = express.Router();
var multer = require("multer");
var path = require("path");
var fs = require("fs");
var crypto = require("crypto");
var QuestionService = require(global.__basedir + "/apps/Services/QuestionService");
var SubjectService = require(global.__basedir + "/apps/Services/SubjectService");

var uploadImport = multer({
  dest: path.join(__dirname, "../../../uploads/temp"),
  fileFilter: function (req, file, cb) {
    const allowedExtensions = [".xlsx", ".xls", ".csv"];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedExtensions.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error("File không được hỗ trợ. Chỉ hỗ trợ .xlsx, .xls, .csv"), false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});

const questionImagesDir = path.join(__dirname, "../../../public/uploads/questions");
if (!fs.existsSync(questionImagesDir)) {
  fs.mkdirSync(questionImagesDir, { recursive: true });
}

var uploadQuestionImage = multer({
  storage: multer.diskStorage({
    destination: function(req, file, cb) {
      cb(null, questionImagesDir);
    },
    filename: function(req, file, cb) {
      const ext = path.extname(file.originalname).toLowerCase();
      const timestamp = Date.now();
      const random = crypto.randomBytes(4).toString('hex');
      const filename = `question_${timestamp}_${random}${ext}`;
      cb(null, filename);
    }
  }),
  fileFilter: function(req, file, cb) {
    const allowedExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp"];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedExtensions.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error("Chỉ hỗ trợ ảnh: .jpg, .jpeg, .png, .gif, .webp"), false);
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024,
  }
});

const uploadDir = path.join(__dirname, "../../../uploads/temp");
const importedDir = path.join(__dirname, "../../../uploads/imported");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
if (!fs.existsSync(importedDir)) {
  fs.mkdirSync(importedDir, { recursive: true });
}

router.get("/", async function (req, res) {
  try {
    const questionService = new QuestionService();
    const subjectService = new SubjectService();
    
    const subjects = await subjectService.getAllSubjects();
    
    const subjectId = req.query.subjectId || null;
    const difficulty = req.query.difficulty || "";
    const type = req.query.type || "";
    const keyword = req.query.keyword || "";
    
    const page = parseInt(req.query.page) || 1;
    const limit = 20;
    
    const allQuestions = await questionService.getQuestions({
      subjectId: subjectId,
      difficulty: difficulty || null,
      type: type || null,
      keyword: keyword || null,
    });
    
    const totalItems = allQuestions.length;
    const totalPages = Math.ceil(totalItems / limit);
    const currentPage = Math.max(1, Math.min(page, totalPages || 1));
    const startIndex = (currentPage - 1) * limit;
    const questions = allQuestions.slice(startIndex, startIndex + limit);
    
    let baseUrl = '/admin/questions?';
    if (subjectId) baseUrl += `subjectId=${subjectId}&`;
    if (difficulty) baseUrl += `difficulty=${difficulty}&`;
    if (type) baseUrl += `type=${type}&`;
    if (keyword) baseUrl += `keyword=${encodeURIComponent(keyword)}&`;
    baseUrl = baseUrl.slice(0, -1);
    
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
      currentPage: currentPage,
      totalPages: totalPages,
      totalItems: totalItems,
      itemsPerPage: limit,
      baseUrl: baseUrl,
      success: success,
      error: error,
      user: req.user,
    });
  } catch (e) {
    console.error("Error loading questions list:", e);
    res.status(500).send("Lỗi server khi tải danh sách câu hỏi");
  }
});

router.get("/:id/view", async function (req, res) {
  try {
    const questionService = new QuestionService();
    const subjectService = new SubjectService();
    
    const question = await questionService.getQuestionById(req.params.id);
    if (!question) {
      return res.redirect("/admin/questions?error=" + encodeURIComponent("Không tìm thấy câu hỏi"));
    }
    
    const subject = await subjectService.getById(question.subjectId);
    
    res.render("admin/question-detail.ejs", {
      question: question,
      subject: subject,
      user: req.user,
    });
  } catch (e) {
    console.error("Error loading question detail:", e);
    res.redirect("/admin/questions?error=" + encodeURIComponent("Lỗi khi tải chi tiết câu hỏi"));
  }
});

router.get("/import", function (req, res) {
  res.render("admin/question-import.ejs", {
    success: null,
    error: null,
    importErrors: null,
    user: req.user,
  });
});

router.post("/import", function (req, res, next) {
  uploadImport.single("file")(req, res, function (err) {
    if (err) {
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
    const fileHash = QuestionService.calculateFileHash(filePath);
    
    const result = await service.importQuestions(filePath, originalName, fileHash);
 
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

    const importResult = result.result;
    let savedPath = null;
    
    if (importResult.success > 0) {
      const timestamp = Date.now();
      const ext = path.extname(originalName);
      const baseName = path.basename(originalName, ext);
      const savedFileName = `${baseName}_${timestamp}${ext}`;
      savedPath = path.join(importedDir, savedFileName);
      
      try {
        fs.copyFileSync(filePath, savedPath);
        
        await service.saveImportedFileInfo(
          result.fileHash,
          originalName,
          savedPath,
          importResult.success,
          importResult.failed
        );
      } catch (copyError) {
        console.error("Error copying file to imported folder:", copyError);
      }
    }
    
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    let message = `Import hoàn tất: ${importResult.success} câu hỏi thành công`;
    if (importResult.failed > 0) {
      message += `, ${importResult.failed} câu hỏi thất bại`;
    }

    let errorDetails = null;
    if (importResult.errors && importResult.errors.length > 0) {
      errorDetails = importResult.errors.slice(0, 20);
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

router.post("/create", function(req, res, next) {
  uploadQuestionImage.single("questionImage")(req, res, function(err) {
    if (err) {
      console.error("Image upload error:", err);
      req.uploadError = err.message;
    }
    next();
  });
}, async function (req, res) {
  try {
    const subjectService = new SubjectService();
    const subjects = await subjectService.getAllSubjects();
    
    if (req.uploadError) {
      return res.render("admin/question-create.ejs", {
        subjects: subjects,
        error: req.uploadError,
        user: req.user,
      });
    }
    
    let mediaUrl = null;
    if (req.file) {
      mediaUrl = "/static/uploads/questions/" + req.file.filename;
    }
    
    const questionService = new QuestionService();
    const result = await questionService.createQuestion({
      subjectId: req.body.subjectId,
      difficulty: req.body.difficulty,
      type: req.body.type,
      content: req.body.content,
      mediaUrl: mediaUrl,
      answers: JSON.parse(req.body.answers || "[]"),
    });
    
    if (!result.ok) {
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      return res.render("admin/question-create.ejs", {
        subjects: subjects,
        error: result.message,
        user: req.user,
      });
    }
    
    return res.redirect("/admin/questions?success=created");
  } catch (e) {
    console.error("Error creating question:", e);
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    const subjectService = new SubjectService();
    const subjects = await subjectService.getAllSubjects();
    return res.render("admin/question-create.ejs", {
      subjects: subjects,
      error: "Lỗi khi tạo câu hỏi: " + e.message,
      user: req.user,
    });
  }
});

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

router.post("/:id/update", function(req, res, next) {
  uploadQuestionImage.single("questionImage")(req, res, function(err) {
    if (err) {
      console.error("Image upload error:", err);
      req.uploadError = err.message;
    }
    next();
  });
}, async function (req, res) {
  try {
    const questionService = new QuestionService();
    const subjectService = new SubjectService();
    
    if (req.uploadError) {
      const question = await questionService.getQuestionById(req.params.id);
      const subjects = await subjectService.getAllSubjects();
      return res.render("admin/question-edit.ejs", {
        question: question,
        subjects: subjects,
        error: req.uploadError,
        user: req.user,
      });
    }
    
    const existingQuestion = await questionService.getQuestionById(req.params.id);
    
    let mediaUrl = existingQuestion ? existingQuestion.mediaUrl : null;
    
    if (req.file) {
      mediaUrl = "/static/uploads/questions/" + req.file.filename;
      
      if (existingQuestion && existingQuestion.mediaUrl && existingQuestion.mediaUrl.startsWith("/static/uploads/questions/")) {
        const oldImagePath = path.join(__dirname, "../../../public", existingQuestion.mediaUrl.replace("/static/", ""));
        if (fs.existsSync(oldImagePath)) {
          try {
            fs.unlinkSync(oldImagePath);
          } catch (e) {
            console.error("Error deleting old image:", e);
          }
        }
      }
    }
    
    if (req.body.removeImage === "true") {
      if (existingQuestion && existingQuestion.mediaUrl && existingQuestion.mediaUrl.startsWith("/static/uploads/questions/")) {
        const oldImagePath = path.join(__dirname, "../../../public", existingQuestion.mediaUrl.replace("/static/", ""));
        if (fs.existsSync(oldImagePath)) {
          try {
            fs.unlinkSync(oldImagePath);
          } catch (e) {
            console.error("Error deleting old image:", e);
          }
        }
      }
      mediaUrl = null;
    }
    
    const result = await questionService.updateQuestion(req.params.id, {
      subjectId: req.body.subjectId,
      difficulty: req.body.difficulty,
      type: req.body.type,
      content: req.body.content,
      mediaUrl: mediaUrl,
      answers: JSON.parse(req.body.answers || "[]"),
    });
    
    if (!result.ok) {
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
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
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    return res.redirect("/admin/questions?error=" + encodeURIComponent("Lỗi khi cập nhật câu hỏi"));
  }
});

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
