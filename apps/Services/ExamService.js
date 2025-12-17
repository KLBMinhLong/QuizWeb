var ObjectId = require("mongodb").ObjectId;

var DatabaseConnection = require(global.__basedir + "/apps/Database/Database");
var SubjectRepository = require(global.__basedir + "/apps/Repository/SubjectRepository");
var QuestionRepository = require(global.__basedir + "/apps/Repository/QuestionRepository");

class ExamService {
  constructor() {
    this.client = DatabaseConnection.getMongoClient();
    this.db = this.client.db(DatabaseConnection.getDatabaseName());
    this.subjectRepo = new SubjectRepository(this.db);
    this.questionRepo = new QuestionRepository(this.db);
  }

  async generateExam(subjectId) {
    await this.client.connect();
    try {
      const subject = await this.subjectRepo.getById(subjectId);
      if (!subject) return { ok: false, message: "Không tìm thấy môn học" };

      const cfg = subject.examConfig || { easyCount: 10, mediumCount: 5, hardCount: 5, durationMinutes: 30 };
      const questions = await this.questionRepo.sampleByDifficulty(String(subject._id), cfg);

      // Không trả "đáp án đúng" theo đúng nguyên tắc (MVP: answers có isCorrect thì vẫn tồn tại trong DB,
      // ở UI chỉ render text; chấm điểm sẽ làm tiếp khi có snapshot/attempt)
      const publicQuestions = questions.map((q) => ({
        _id: String(q._id),
        type: q.type,
        difficulty: q.difficulty,
        content: q.content,
        mediaUrl: q.mediaUrl || null,
        answers: Array.isArray(q.answers) ? q.answers.map((a, idx) => ({ id: idx, text: a.text })) : q.answers,
      }));

      return { ok: true, durationMinutes: cfg.durationMinutes, questions: publicQuestions };
    } finally {
      await this.client.close();
    }
  }

  async submitExam(payload) {
    // MVP: chấm điểm cực đơn giản dựa trên payload `correctIndex` (để demo UI).
    // Giai đoạn tiếp theo: lưu ExamAttempt + snapshot, và chấm điểm dựa trên snapshot/server.
    const answers = payload.answers || {};
    const correct = payload.correct || {};

    let total = 0;
    let correctCount = 0;

    for (const qid of Object.keys(correct)) {
      total += 1;
      if (String(answers[qid]) === String(correct[qid])) correctCount += 1;
    }

    const score = total === 0 ? 0 : Math.round((correctCount / total) * 100);
    return { ok: true, score, total, correctCount };
  }
}

module.exports = ExamService;



