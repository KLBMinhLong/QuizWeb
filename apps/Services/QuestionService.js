var DatabaseConnection = require(global.__basedir + "/apps/Database/Database");
var QuestionRepository = require(global.__basedir + "/apps/Repository/QuestionRepository");
var SubjectRepository = require(global.__basedir + "/apps/Repository/SubjectRepository");
var ObjectId = require("mongodb").ObjectId;
var XLSX = require("xlsx");
var fs = require("fs");
var path = require("path");
var crypto = require("crypto");

class QuestionService {
  constructor() {
    this.client = DatabaseConnection.getMongoClient();
    this.db = this.client.db(DatabaseConnection.getDatabaseName());
    this.questionRepo = new QuestionRepository(this.db);
    this.subjectRepo = new SubjectRepository(this.db);
  }

  // Static methods - không cần database connection
  static stripCorrectAnswers(type, answers) {
    if (!answers) {
      return null;
    }

    switch (type) {
      case "single_choice":
      case "multiple_choice":
        // Chỉ trả về text, bỏ isCorrect
        if (Array.isArray(answers)) {
          return answers.map((a) => ({ text: a.text }));
        }
        return answers;

      case "true_false":
        // Chỉ trả về value, bỏ isCorrect
        if (Array.isArray(answers)) {
          return answers.map((a) => ({ value: a.value }));
        }
        return answers;

      case "fill_in_blank":
        // Không gửi accepted values, chỉ gửi structure để hiển thị input
        return { placeholder: "Nhập đáp án của bạn" };

      case "matching":
        // Chỉ gửi danh sách left và right riêng biệt để hiển thị, không gửi mapping
        if (answers && answers.pairs && Array.isArray(answers.pairs)) {
          const leftItems = answers.pairs.map((p) => p.left);
          const rightItems = answers.pairs.map((p) => p.right);
          // Shuffle để không lộ thứ tự đúng
          const shuffledRight = [...rightItems].sort(() => Math.random() - 0.5);
          return {
            leftItems: leftItems,
            rightItems: shuffledRight,
          };
        }
        return { leftItems: [], rightItems: [] };

      default:
        return answers;
    }
  }

  static validateAnswers(type, answers) {
    if (!type) {
      return { ok: false, message: "Type câu hỏi không được để trống" };
    }

    switch (type) {
      case "single_choice":
      case "multiple_choice":
        return QuestionService._validateChoiceAnswers(type, answers);

      case "true_false":
        return QuestionService._validateTrueFalseAnswers(answers);

      case "fill_in_blank":
        return QuestionService._validateFillInBlankAnswers(answers);

      case "matching":
        return QuestionService._validateMatchingAnswers(answers);

      default:
        return { ok: false, message: `Type '${type}' không được hỗ trợ` };
    }
  }

  static _validateChoiceAnswers(type, answers) {
    if (!Array.isArray(answers)) {
      return { ok: false, message: "Answers phải là array" };
    }

    if (answers.length < 2) {
      return { ok: false, message: "Phải có ít nhất 2 lựa chọn" };
    }

    let correctCount = 0;
    for (let i = 0; i < answers.length; i++) {
      const a = answers[i];
      if (!a || typeof a !== "object") {
        return { ok: false, message: `Lựa chọn thứ ${i + 1} không hợp lệ` };
      }
      if (typeof a.text !== "string" || a.text.trim() === "") {
        return { ok: false, message: `Lựa chọn thứ ${i + 1} phải có text không rỗng` };
      }
      if (typeof a.isCorrect !== "boolean") {
        return { ok: false, message: `Lựa chọn thứ ${i + 1} phải có isCorrect là boolean` };
      }
      if (a.isCorrect) {
        correctCount++;
      }
    }

    if (type === "single_choice") {
      if (correctCount !== 1) {
        return { ok: false, message: "Câu hỏi single_choice phải có đúng 1 đáp án đúng" };
      }
    } else if (type === "multiple_choice") {
      if (correctCount < 1) {
        return { ok: false, message: "Câu hỏi multiple_choice phải có ít nhất 1 đáp án đúng" };
      }
    }

    return { ok: true };
  }

  static _validateTrueFalseAnswers(answers) {
    if (!Array.isArray(answers)) {
      return { ok: false, message: "Answers phải là array" };
    }

    if (answers.length !== 2) {
      return { ok: false, message: "Câu hỏi true/false phải có đúng 2 lựa chọn" };
    }

    let correctCount = 0;
    for (let i = 0; i < answers.length; i++) {
      const a = answers[i];
      if (!a || typeof a !== "object") {
        return { ok: false, message: `Lựa chọn thứ ${i + 1} không hợp lệ` };
      }
      if (typeof a.value !== "boolean") {
        return { ok: false, message: `Lựa chọn thứ ${i + 1} phải có value là boolean` };
      }
      if (typeof a.isCorrect !== "boolean") {
        return { ok: false, message: `Lựa chọn thứ ${i + 1} phải có isCorrect là boolean` };
      }
      if (a.isCorrect) {
        correctCount++;
      }
    }

    if (correctCount !== 1) {
      return { ok: false, message: "Câu hỏi true/false phải có đúng 1 đáp án đúng" };
    }

    return { ok: true };
  }

  static _validateFillInBlankAnswers(answers) {
    if (!answers || typeof answers !== "object" || Array.isArray(answers)) {
      return { ok: false, message: "Answers phải là object với property 'accepted'" };
    }

    if (!answers.accepted || !Array.isArray(answers.accepted)) {
      return { ok: false, message: "Answers phải có property 'accepted' là array" };
    }

    if (answers.accepted.length === 0) {
      return { ok: false, message: "Phải có ít nhất 1 đáp án được chấp nhận" };
    }

    for (let i = 0; i < answers.accepted.length; i++) {
      const accepted = answers.accepted[i];
      if (typeof accepted !== "string" || accepted.trim() === "") {
        return { ok: false, message: `Đáp án chấp nhận thứ ${i + 1} phải là chuỗi không rỗng` };
      }
    }

    return { ok: true };
  }

  static _validateMatchingAnswers(answers) {
    if (!answers || typeof answers !== "object" || Array.isArray(answers)) {
      return { ok: false, message: "Answers phải là object với property 'pairs'" };
    }

    if (!answers.pairs || !Array.isArray(answers.pairs)) {
      return { ok: false, message: "Answers phải có property 'pairs' là array" };
    }

    if (answers.pairs.length < 2) {
      return { ok: false, message: "Phải có ít nhất 2 cặp để ghép" };
    }

    for (let i = 0; i < answers.pairs.length; i++) {
      const pair = answers.pairs[i];
      if (!pair || typeof pair !== "object") {
        return { ok: false, message: `Cặp thứ ${i + 1} không hợp lệ` };
      }
      if (typeof pair.left !== "string" || pair.left.trim() === "") {
        return { ok: false, message: `Cặp thứ ${i + 1} phải có 'left' là chuỗi không rỗng` };
      }
      if (typeof pair.right !== "string" || pair.right.trim() === "") {
        return { ok: false, message: `Cặp thứ ${i + 1} phải có 'right' là chuỗi không rỗng` };
      }
    }

    return { ok: true };
  }

  /**
   * Normalize answers trước khi lưu vào DB
   * - fill_in_blank: trim và lowercase các accepted values
   */
  static normalizeAnswers(type, answers) {
    if (type === "fill_in_blank" && answers && answers.accepted && Array.isArray(answers.accepted)) {
      return {
        accepted: answers.accepted.map((a) => String(a).trim().toLowerCase()).filter((a) => a.length > 0),
      };
    }
    // Các type khác giữ nguyên
    return answers;
  }

  /**
   * So sánh đáp án user với đáp án đúng để chấm điểm
   * @param {string} type - Loại câu hỏi
   * @param {any} correctAnswers - Đáp án đúng từ snapshot
   * @param {any} userAnswer - Đáp án của user (có thể là undefined nếu user không trả lời)
   * @returns {boolean} - true nếu đúng, false nếu sai
   */
  static compareAnswer(type, correctAnswers, userAnswer) {
    if (!correctAnswers) return false;
    // Nếu user không trả lời (undefined/null), coi như sai
    if (userAnswer === undefined || userAnswer === null) return false;

    switch (type) {
      case "single_choice":
        // userAnswer là index (số hoặc string)
        const index = Number(userAnswer);
        if (isNaN(index) || !Array.isArray(correctAnswers) || index < 0 || index >= correctAnswers.length) {
          return false;
        }
        return correctAnswers[index]?.isCorrect === true;

      case "multiple_choice":
        // userAnswer là array indices (string[] hoặc number[])
        if (!Array.isArray(userAnswer)) return false;
        if (!Array.isArray(correctAnswers)) return false;
        
        const userIndices = userAnswer.map((i) => Number(i)).filter((i) => !isNaN(i));
        const correctIndices = correctAnswers
          .map((a, idx) => (a.isCorrect === true ? idx : -1))
          .filter((idx) => idx !== -1);
        
        // Phải chọn đúng tất cả đáp án đúng và không chọn thêm đáp án sai
        if (userIndices.length !== correctIndices.length) return false;
        return userIndices.every((idx) => correctIndices.includes(idx)) &&
               correctIndices.every((idx) => userIndices.includes(idx));

      case "true_false":
        // userAnswer là boolean (true/false), có thể là string "true"/"false"
        let booleanAnswer;
        if (typeof userAnswer === "boolean") {
          booleanAnswer = userAnswer;
        } else if (typeof userAnswer === "string") {
          // Convert string "true"/"false"/"1"/"0" thành boolean
          if (userAnswer === "true" || userAnswer === "1") {
            booleanAnswer = true;
          } else if (userAnswer === "false" || userAnswer === "0") {
            booleanAnswer = false;
          } else {
            return false;
          }
        } else {
          return false;
        }
        if (!Array.isArray(correctAnswers)) return false;
        const correctAnswer = correctAnswers.find((a) => a.isCorrect === true);
        return correctAnswer && correctAnswer.value === booleanAnswer;

      case "fill_in_blank":
        // userAnswer là string, normalize và check trong accepted[]
        if (typeof userAnswer !== "string") return false;
        if (!correctAnswers.accepted || !Array.isArray(correctAnswers.accepted)) return false;
        const normalizedUserAnswer = userAnswer.trim().toLowerCase();
        return correctAnswers.accepted.includes(normalizedUserAnswer);

      case "matching":
        // userAnswer là object map {left: right} hoặc array [{left, right}]
        if (!correctAnswers.pairs || !Array.isArray(correctAnswers.pairs)) return false;
        if (!userAnswer || typeof userAnswer !== "object") return false;
        
        // Convert userAnswer thành array nếu là object map
        let userPairs = [];
        if (Array.isArray(userAnswer)) {
          userPairs = userAnswer;
        } else {
          // Convert object map {left1: right1, left2: right2} thành array
          userPairs = Object.keys(userAnswer).map((left) => ({
            left: left,
            right: userAnswer[left],
          }));
        }
        
        // Phải có đúng số lượng cặp
        if (userPairs.length !== correctAnswers.pairs.length) return false;
        
        // Check từng cặp phải khớp
        for (const correctPair of correctAnswers.pairs) {
          const userPair = userPairs.find((p) => p.left === correctPair.left);
          if (!userPair || userPair.right !== correctPair.right) {
            return false;
          }
        }
        return true;

      default:
        return false;
    }
  }

  /**
   * Validate toàn bộ question object (cho create/update)
   * @param {object} question - Question object cần validate
   * @returns {{ ok: boolean, message?: string }}
   */
  static validateQuestion(question) {
    if (!question) {
      return { ok: false, message: "Question không được để trống" };
    }

    // Validate subjectId
    if (!question.subjectId) {
      return { ok: false, message: "SubjectId không được để trống" };
    }
    try {
      new ObjectId(String(question.subjectId));
    } catch (e) {
      return { ok: false, message: "SubjectId không hợp lệ" };
    }

    // Validate difficulty
    const validDifficulties = ["easy", "medium", "hard"];
    if (!question.difficulty || !validDifficulties.includes(question.difficulty)) {
      return { ok: false, message: "Difficulty phải là 'easy', 'medium' hoặc 'hard'" };
    }

    // Validate type
    const validTypes = ["single_choice", "multiple_choice", "true_false", "fill_in_blank", "matching"];
    if (!question.type || !validTypes.includes(question.type)) {
      return { ok: false, message: "Type không hợp lệ" };
    }

    // Validate content
    if (!question.content || typeof question.content !== "string" || question.content.trim() === "") {
      return { ok: false, message: "Content không được để trống" };
    }

    // Validate answers
    const answersValidation = QuestionService.validateAnswers(question.type, question.answers);
    if (!answersValidation.ok) {
      return answersValidation;
    }

    return { ok: true };
  }

  // Instance methods - cần database connection
  async createQuestion(question) {
    await this.client.connect();
    try {
      // Validate
      const validation = QuestionService.validateQuestion(question);
      if (!validation.ok) {
        return { ok: false, message: validation.message };
      }

      // Normalize answers
      const normalizedAnswers = QuestionService.normalizeAnswers(question.type, question.answers);

      // Tạo question object
      const questionDoc = {
        subjectId: new ObjectId(String(question.subjectId)),
        difficulty: question.difficulty,
        type: question.type,
        content: question.content.trim(),
        mediaUrl: question.mediaUrl || null,
        answers: normalizedAnswers,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = await this.questionRepo.create(questionDoc);
      return { ok: true, question: result };
    } finally {
      await this.client.close();
    }
  }

  async updateQuestion(id, question) {
    await this.client.connect();
    try {
      // Validate
      const validation = QuestionService.validateQuestion(question);
      if (!validation.ok) {
        return { ok: false, message: validation.message };
      }

      // Normalize answers
      const normalizedAnswers = QuestionService.normalizeAnswers(question.type, question.answers);

      // Update question object
      const updateDoc = {
        subjectId: new ObjectId(String(question.subjectId)),
        difficulty: question.difficulty,
        type: question.type,
        content: question.content.trim(),
        mediaUrl: question.mediaUrl || null,
        answers: normalizedAnswers,
        updatedAt: new Date(),
      };

      const result = await this.questionRepo.update(id, updateDoc);
      return { ok: true, question: result };
    } finally {
      await this.client.close();
    }
  }

  async getQuestionById(id) {
    await this.client.connect();
    try {
      return await this.questionRepo.getById(id);
    } finally {
      await this.client.close();
    }
  }

  async deleteQuestion(id) {
    await this.client.connect();
    try {
      const deleted = await this.questionRepo.delete(id);
      if (!deleted) {
        return { ok: false, message: "Không tìm thấy câu hỏi để xóa" };
      }
      return { ok: true };
    } finally {
      await this.client.close();
    }
  }

  async getQuestions(filters = {}) {
    await this.client.connect();
    try {
      const query = {};
      
      if (filters.subjectId) {
        query.subjectId = new ObjectId(String(filters.subjectId));
      }
      if (filters.difficulty) {
        query.difficulty = filters.difficulty;
      }
      if (filters.type) {
        query.type = filters.type;
      }
      if (filters.keyword) {
        query.content = { $regex: filters.keyword, $options: "i" };
      }
      
      const questions = await this.questionRepo.getAll(query);
      
      // Populate subject name nếu cần (tối ưu: chỉ query 1 lần)
      if (questions.length > 0) {
        const subjectIds = [...new Set(questions.map(q => String(q.subjectId)))];
        const subjectsMap = {};
        
        // Query tất cả subjects một lần
        if (subjectIds.length > 0) {
          const subjectDocs = await this.subjectRepo.collection().find({
            _id: { $in: subjectIds.map(id => new ObjectId(id)) }
          }).toArray();
          
          subjectDocs.forEach(s => {
            subjectsMap[String(s._id)] = s;
          });
        }
        
        // Attach subject info to questions
        questions.forEach(q => {
          q.subject = subjectsMap[String(q.subjectId)] || null;
        });
      }
      
      return questions;
    } finally {
      await this.client.close();
    }
  }

  /**
   * Check xem file đã được import chưa (dựa vào hash)
   * @param {string} fileHash - Hash của file
   * @returns {boolean}
   */
  async isFileImported(fileHash) {
    await this.client.connect();
    try {
      const importedFiles = this.db.collection("importedFiles");
      const existing = await importedFiles.findOne({ fileHash: fileHash });
      return !!existing;
    } finally {
      await this.client.close();
    }
  }

  /**
   * Lưu thông tin file đã import
   * @param {string} fileHash - Hash của file
   * @param {string} fileName - Tên file gốc
   * @param {string} savedPath - Đường dẫn file đã lưu
   * @param {number} successCount - Số câu hỏi import thành công
   * @param {number} failedCount - Số câu hỏi import thất bại
   */
  async saveImportedFileInfo(fileHash, fileName, savedPath, successCount, failedCount) {
    await this.client.connect();
    try {
      const importedFiles = this.db.collection("importedFiles");
      await importedFiles.insertOne({
        fileHash: fileHash,
        fileName: fileName,
        savedPath: savedPath,
        successCount: successCount,
        failedCount: failedCount,
        importedAt: new Date(),
        importedBy: null, // Có thể lưu userId nếu có
      });
    } finally {
      await this.client.close();
    }
  }

  /**
   * Tính hash của file
   * @param {string} filePath - Đường dẫn đến file
   * @returns {string} - Hash SHA256 của file
   */
  static calculateFileHash(filePath) {
    const fileBuffer = fs.readFileSync(filePath);
    const hashSum = crypto.createHash("sha256");
    hashSum.update(fileBuffer);
    return hashSum.digest("hex");
  }

  /**
   * Import questions từ Excel/CSV file
   * @param {string} filePath - Đường dẫn đến file Excel/CSV
   * @param {string} originalName - Tên file gốc (để lấy extension)
   * @param {string} fileHash - Hash của file (để check duplicate)
   * @returns {{ ok: boolean, message?: string, result?: { success: number, failed: number, errors: Array }, isDuplicate?: boolean }}
   */
  async importQuestions(filePath, originalName = null, fileHash = null) {
    await this.client.connect();
    try {
      // Tính hash nếu chưa có
      if (!fileHash) {
        fileHash = QuestionService.calculateFileHash(filePath);
      }

      // Check duplicate
      const isDuplicate = await this.isFileImported(fileHash);
      if (isDuplicate) {
        return {
          ok: false,
          message: "File này đã được import trước đó. Vui lòng chọn file khác.",
          isDuplicate: true,
        };
      }

      const results = {
        success: 0,
        failed: 0,
        errors: [], // Array of { row: number, message: string }
      };

      // Đọc file
      let rows = [];
      // Lấy extension từ originalName nếu có, nếu không thì từ filePath
      let fileExtension = "";
      if (originalName) {
        fileExtension = path.extname(originalName).toLowerCase().replace(".", "");
      } else {
        fileExtension = filePath.toLowerCase().split(".").pop();
      }
      console.log("ImportQuestions - filePath:", filePath, "originalName:", originalName, "extension:", fileExtension);

      if (fileExtension === "csv") {
        console.log("Parsing CSV file...");
        rows = this._parseCSV(filePath);
        console.log("CSV parsed, rows count:", rows.length);
      } else if (fileExtension === "xlsx" || fileExtension === "xls") {
        console.log("Parsing Excel file...");
        rows = this._parseExcel(filePath);
        console.log("Excel parsed, rows count:", rows.length);
      } else {
        console.log("Unsupported file extension:", fileExtension);
        return { ok: false, message: "File không được hỗ trợ. Chỉ hỗ trợ .xlsx, .xls, .csv" };
      }

      if (rows.length === 0) {
        console.log("File is empty or cannot be parsed");
        return { ok: false, message: "File không có dữ liệu" };
      }

      // Xử lý từng dòng (bỏ qua header row nếu có)
      const headerRow = rows[0];
      const isHeaderRow = this._isHeaderRow(headerRow);
      const dataRows = isHeaderRow ? rows.slice(1) : rows;
      const columnMap = isHeaderRow ? this._mapColumns(headerRow) : null;
      console.log("Header row detected:", isHeaderRow, "Data rows:", dataRows.length);

      for (let i = 0; i < dataRows.length; i++) {
        const rowIndex = i + (isHeaderRow ? 2 : 1); // Excel row number (1-based, +1 for header)
        const row = dataRows[i];

        try {
          // Parse row data
          const questionData = columnMap
            ? this._parseRowWithColumnMap(row, columnMap)
            : this._parseRowDefault(row);

          if (!questionData) {
            results.failed++;
            results.errors.push({ row: rowIndex, message: "Không thể parse dòng này" });
            continue;
          }

          // Validate subject slug
          const subject = await this.subjectRepo.getBySlug(questionData.subjectSlug);
          if (!subject) {
            results.failed++;
            results.errors.push({
              row: rowIndex,
              message: `Subject với slug '${questionData.subjectSlug}' không tồn tại`,
            });
            continue;
          }

          // Parse answers JSON
          let answers;
          try {
            answers = typeof questionData.answersJson === "string" ? JSON.parse(questionData.answersJson) : questionData.answersJson;
          } catch (e) {
            results.failed++;
            results.errors.push({ row: rowIndex, message: `answersJson không hợp lệ: ${e.message}` });
            continue;
          }

          // Build question object
          const question = {
            subjectId: String(subject._id),
            difficulty: questionData.difficulty,
            type: questionData.type,
            content: questionData.content,
            mediaUrl: questionData.mediaUrl || null,
            answers: answers,
          };

          // Validate question
          const validation = QuestionService.validateQuestion(question);
          if (!validation.ok) {
            results.failed++;
            results.errors.push({ row: rowIndex, message: validation.message });
            continue;
          }

          // Normalize answers
          const normalizedAnswers = QuestionService.normalizeAnswers(question.type, question.answers);

          // Create question
          const questionDoc = {
            subjectId: new ObjectId(String(question.subjectId)),
            difficulty: question.difficulty,
            type: question.type,
            content: question.content.trim(),
            mediaUrl: question.mediaUrl || null,
            answers: normalizedAnswers,
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          await this.questionRepo.create(questionDoc);
          results.success++;
        } catch (error) {
          results.failed++;
          results.errors.push({ row: rowIndex, message: `Lỗi: ${error.message}` });
        }
      }

      console.log("Import completed - Success:", results.success, "Failed:", results.failed);
      
      return {
        ok: true,
        fileHash: fileHash,
        result: {
          success: results.success,
          failed: results.failed,
          errors: results.errors,
        },
      };
    } finally {
      await this.client.close();
    }
  }

  /**
   * Parse CSV file
   */
  _parseCSV(filePath) {
    try {
      // Đọc file CSV với encoding UTF-8
      // XLSX có thể parse CSV nhưng tốt hơn là đọc thủ công với UTF-8 encoding
      const content = fs.readFileSync(filePath, { encoding: "utf-8" });
      const lines = content.split(/\r?\n/).filter((line) => line.trim() !== "");
      const rows = [];

      for (const line of lines) {
        // CSV parser với hỗ trợ quoted fields
        const fields = [];
        let currentField = "";
        let inQuotes = false;

        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          if (char === '"') {
            if (inQuotes && line[i + 1] === '"') {
              // Escaped quote
              currentField += '"';
              i++;
            } else {
              // Toggle quote state
              inQuotes = !inQuotes;
            }
          } else if (char === "," && !inQuotes) {
            fields.push(currentField);
            currentField = "";
          } else {
            currentField += char;
          }
        }
        fields.push(currentField); // Field cuối cùng
        rows.push(fields);
      }

      return rows;
    } catch (error) {
      console.error("Error parsing CSV:", error);
      throw error;
    }
  }

  /**
   * Parse Excel file
   */
  _parseExcel(filePath) {
    const workbook = XLSX.readFile(filePath);
    // Lấy sheet đầu tiên hoặc sheet có tên "Questions"
    const sheetName = workbook.SheetNames.includes("Questions") ? "Questions" : workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    return XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" });
  }

  /**
   * Kiểm tra xem dòng có phải là header không
   */
  _isHeaderRow(row) {
    if (!Array.isArray(row) || row.length === 0) return false;
    const firstCell = String(row[0]).toLowerCase().trim();
    return (
      firstCell === "subjectslug" ||
      firstCell === "subject_slug" ||
      firstCell === "subject slug" ||
      firstCell.includes("subject")
    );
  }

  /**
   * Map column names to indices
   */
  _mapColumns(headerRow) {
    const map = {};
    for (let i = 0; i < headerRow.length; i++) {
      const colName = String(headerRow[i]).toLowerCase().trim();
      if (colName.includes("subject") || colName === "subjectslug" || colName === "subject_slug") {
        map.subjectSlug = i;
      } else if (colName.includes("difficulty") || colName === "difficulty") {
        map.difficulty = i;
      } else if (colName.includes("type") || colName === "type") {
        map.type = i;
      } else if (colName.includes("content") || colName === "content") {
        map.content = i;
      } else if (colName.includes("answers") || colName === "answersjson" || colName === "answers_json") {
        map.answersJson = i;
      } else if (colName.includes("media") || colName === "mediaurl" || colName === "media_url") {
        map.mediaUrl = i;
      }
    }
    return map;
  }

  /**
   * Parse row với column map
   */
  _parseRowWithColumnMap(row, columnMap) {
    return {
      subjectSlug: columnMap.subjectSlug !== undefined ? String(row[columnMap.subjectSlug] || "").trim() : "",
      difficulty: columnMap.difficulty !== undefined ? String(row[columnMap.difficulty] || "").trim() : "",
      type: columnMap.type !== undefined ? String(row[columnMap.type] || "").trim() : "",
      content: columnMap.content !== undefined ? String(row[columnMap.content] || "").trim() : "",
      answersJson: columnMap.answersJson !== undefined ? String(row[columnMap.answersJson] || "").trim() : "",
      mediaUrl: columnMap.mediaUrl !== undefined ? String(row[columnMap.mediaUrl] || "").trim() : null,
    };
  }

  /**
   * Parse row theo thứ tự mặc định: subjectSlug, difficulty, type, content, answersJson, mediaUrl
   */
  _parseRowDefault(row) {
    if (!Array.isArray(row) || row.length < 5) return null;
    return {
      subjectSlug: String(row[0] || "").trim(),
      difficulty: String(row[1] || "").trim(),
      type: String(row[2] || "").trim(),
      content: String(row[3] || "").trim(),
      answersJson: String(row[4] || "").trim(),
      mediaUrl: row[5] ? String(row[5]).trim() : null,
    };
  }
}

module.exports = QuestionService;

