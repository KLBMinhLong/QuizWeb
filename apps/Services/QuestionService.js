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


  static stripCorrectAnswers(type, answers) {
    if (!answers) {
      return null;
    }

    switch (type) {
      case "single_choice":
      case "multiple_choice":

        if (Array.isArray(answers)) {
          return answers.map((a) => ({ text: a.text }));
        }
        return answers;

      case "true_false":

        if (Array.isArray(answers)) {
          return answers.map((a) => ({ value: a.value }));
        }
        return answers;

      case "fill_in_blank":

        return { placeholder: "Nhập đáp án của bạn" };

      case "matching":

        if (answers && answers.pairs && Array.isArray(answers.pairs)) {
          const leftItems = answers.pairs.map((p) => p.left);
          const rightItems = answers.pairs.map((p) => p.right);

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

  static normalizeAnswers(type, answers) {
    if (type === "fill_in_blank" && answers && answers.accepted && Array.isArray(answers.accepted)) {
      return {
        accepted: answers.accepted.map((a) => String(a).trim().toLowerCase()).filter((a) => a.length > 0),
      };
    }
    return answers;
  }

  // Compare user answer with correct answer for grading
  static compareAnswer(type, correctAnswers, userAnswer) {
    if (!correctAnswers) return false;
    if (userAnswer === undefined || userAnswer === null) return false;

    switch (type) {
      case "single_choice":

        const index = Number(userAnswer);
        if (isNaN(index) || !Array.isArray(correctAnswers) || index < 0 || index >= correctAnswers.length) {
          return false;
        }
        return correctAnswers[index]?.isCorrect === true;

      case "multiple_choice":

        if (!Array.isArray(userAnswer)) return false;
        if (!Array.isArray(correctAnswers)) return false;
        
        const userIndices = userAnswer.map((i) => Number(i)).filter((i) => !isNaN(i));
        const correctIndices = correctAnswers
          .map((a, idx) => (a.isCorrect === true ? idx : -1))
          .filter((idx) => idx !== -1);
        

        if (userIndices.length !== correctIndices.length) return false;
        return userIndices.every((idx) => correctIndices.includes(idx)) &&
               correctIndices.every((idx) => userIndices.includes(idx));

      case "true_false":

        let booleanAnswer;
        if (typeof userAnswer === "boolean") {
          booleanAnswer = userAnswer;
        } else if (typeof userAnswer === "string") {

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

        if (typeof userAnswer !== "string") return false;
        if (!correctAnswers.accepted || !Array.isArray(correctAnswers.accepted)) return false;
        const normalizedUserAnswer = userAnswer.trim().toLowerCase();
        return correctAnswers.accepted.includes(normalizedUserAnswer);

      case "matching":

        if (!correctAnswers.pairs || !Array.isArray(correctAnswers.pairs)) return false;
        if (!userAnswer || typeof userAnswer !== "object") return false;
        

        let userPairs = [];
        if (Array.isArray(userAnswer)) {
          userPairs = userAnswer;
        } else {

          userPairs = Object.keys(userAnswer).map((left) => ({
            left: left,
            right: userAnswer[left],
          }));
        }
        

        if (userPairs.length !== correctAnswers.pairs.length) return false;
        

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

  static validateQuestion(question) {
    if (!question) {
      return { ok: false, message: "Question không được để trống" };
    }


    if (!question.subjectId) {
      return { ok: false, message: "SubjectId không được để trống" };
    }
    try {
      new ObjectId(String(question.subjectId));
    } catch (e) {
      return { ok: false, message: "SubjectId không hợp lệ" };
    }


    const validDifficulties = ["easy", "medium", "hard"];
    if (!question.difficulty || !validDifficulties.includes(question.difficulty)) {
      return { ok: false, message: "Difficulty phải là 'easy', 'medium' hoặc 'hard'" };
    }


    const validTypes = ["single_choice", "multiple_choice", "true_false", "fill_in_blank", "matching"];
    if (!question.type || !validTypes.includes(question.type)) {
      return { ok: false, message: "Type không hợp lệ" };
    }


    if (!question.content || typeof question.content !== "string" || question.content.trim() === "") {
      return { ok: false, message: "Content không được để trống" };
    }


    const answersValidation = QuestionService.validateAnswers(question.type, question.answers);
    if (!answersValidation.ok) {
      return answersValidation;
    }

    return { ok: true };
  }


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

      const validation = QuestionService.validateQuestion(question);
      if (!validation.ok) {
        return { ok: false, message: validation.message };
      }


      const normalizedAnswers = QuestionService.normalizeAnswers(question.type, question.answers);


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
      

      if (questions.length > 0) {
        const subjectIds = [...new Set(questions.map(q => String(q.subjectId)))];
        const subjectsMap = {};
        

        if (subjectIds.length > 0) {
          const subjectDocs = await this.subjectRepo.collection().find({
            _id: { $in: subjectIds.map(id => new ObjectId(id)) }
          }).toArray();
          
          subjectDocs.forEach(s => {
            subjectsMap[String(s._id)] = s;
          });
        }
        

        questions.forEach(q => {
          q.subject = subjectsMap[String(q.subjectId)] || null;
        });
      }
      
      return questions;
    } finally {
      await this.client.close();
    }
  }

  async isFileImported(fileHash) {

    const checkClient = DatabaseConnection.getMongoClient();
    await checkClient.connect();
    try {
      const checkDb = checkClient.db(DatabaseConnection.getDatabaseName());
      const importedFiles = checkDb.collection("importedFiles");
      const existing = await importedFiles.findOne({ fileHash: fileHash });
      return !!existing;
    } finally {
      await checkClient.close();
    }
  }

  async saveImportedFileInfo(fileHash, fileName, savedPath, successCount, failedCount) {

    const saveClient = DatabaseConnection.getMongoClient();
    await saveClient.connect();
    try {
      const saveDb = saveClient.db(DatabaseConnection.getDatabaseName());
      const importedFiles = saveDb.collection("importedFiles");
      await importedFiles.insertOne({
        fileHash: fileHash,
        fileName: fileName,
        savedPath: savedPath,
        successCount: successCount,
        failedCount: failedCount,
        importedAt: new Date(),
        importedBy: null,
      });
    } finally {
      await saveClient.close();
    }
  }

  static calculateFileHash(filePath) {
    const fileBuffer = fs.readFileSync(filePath);
    const hashSum = crypto.createHash("sha256");
    hashSum.update(fileBuffer);
    return hashSum.digest("hex");
  }

  async importQuestions(filePath, originalName = null, fileHash = null) {
    await this.client.connect();
    try {

      if (!fileHash) {
        fileHash = QuestionService.calculateFileHash(filePath);
      }


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
        errors: [],
      };

      let rows = [];
      let fileExtension = "";
      if (originalName) {
        fileExtension = path.extname(originalName).toLowerCase().replace(".", "");
      } else {
        fileExtension = filePath.toLowerCase().split(".").pop();
      }

      if (fileExtension === "csv") {
        rows = this._parseCSV(filePath);
      } else if (fileExtension === "xlsx" || fileExtension === "xls") {
        rows = this._parseExcel(filePath);
      } else {
        return { ok: false, message: "File không được hỗ trợ. Chỉ hỗ trợ .xlsx, .xls, .csv" };
      }

      if (rows.length === 0) {
        return { ok: false, message: "File không có dữ liệu" };
      }

      const headerRow = rows[0];
      const isHeaderRow = this._isHeaderRow(headerRow);
      const dataRows = isHeaderRow ? rows.slice(1) : rows;
      const columnMap = isHeaderRow ? this._mapColumns(headerRow) : null;

      for (let i = 0; i < dataRows.length; i++) {
        const rowIndex = i + (isHeaderRow ? 2 : 1);
        const row = dataRows[i];

        try {
          const questionData = columnMap
            ? this._parseRowWithColumnMap(row, columnMap)
            : this._parseRowDefault(row);

          if (!questionData) {
            results.failed++;
            results.errors.push({ row: rowIndex, message: "Không thể parse dòng này" });
            continue;
          }


          const subject = await this.subjectRepo.getBySlug(questionData.subjectSlug);
          if (!subject) {
            results.failed++;
            results.errors.push({
              row: rowIndex,
              message: `Subject với slug '${questionData.subjectSlug}' không tồn tại`,
            });
            continue;
          }


          let answers;
          try {
            let jsonStr = typeof questionData.answersJson === "string" ? questionData.answersJson : JSON.stringify(questionData.answersJson);

            if (questionData.type === "matching" && jsonStr.trim().startsWith("[") && !jsonStr.trim().endsWith("]")) {
              jsonStr = jsonStr.trim() + "]";
            }
            
            answers = JSON.parse(jsonStr);

            if (questionData.type === "matching" && Array.isArray(answers) && answers.length > 0 && answers[0].pairs) {
              answers = answers[0];
            }
          } catch (e) {
            results.failed++;
            results.errors.push({ row: rowIndex, message: `answersJson không hợp lệ: ${e.message}` });
            continue;
          }


          const question = {
            subjectId: String(subject._id),
            difficulty: questionData.difficulty,
            type: questionData.type,
            content: questionData.content,
            mediaUrl: questionData.mediaUrl || null,
            answers: answers,
          };


          const validation = QuestionService.validateQuestion(question);
          if (!validation.ok) {
            results.failed++;
            results.errors.push({ row: rowIndex, message: validation.message });
            continue;
          }


          const normalizedAnswers = QuestionService.normalizeAnswers(question.type, question.answers);


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

  _parseCSV(filePath) {
    try {
      const content = fs.readFileSync(filePath, { encoding: "utf-8" });
      const lines = content.split(/\r?\n/).filter((line) => line.trim() !== "");
      const rows = [];

      for (const line of lines) {

        const fields = [];
        let currentField = "";
        let inQuotes = false;

        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          if (char === '"') {
            if (inQuotes && line[i + 1] === '"') {

              currentField += '"';
              i++;
            } else {

              inQuotes = !inQuotes;
            }
          } else if (char === "," && !inQuotes) {
            fields.push(currentField);
            currentField = "";
          } else {
            currentField += char;
          }
        }
        fields.push(currentField);
        rows.push(fields);
      }

      return rows;
    } catch (error) {
      console.error("Error parsing CSV:", error);
      throw error;
    }
  }

  _parseExcel(filePath) {
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames.includes("Questions") ? "Questions" : workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    return XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" });
  }


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

