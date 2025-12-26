var ObjectId = require("mongodb").ObjectId;

var DatabaseConnection = require(global.__basedir + "/apps/Database/Database");
var SubjectRepository = require(global.__basedir +
  "/apps/Repository/SubjectRepository");
var QuestionRepository = require(global.__basedir +
  "/apps/Repository/QuestionRepository");
var ExamAttemptRepository = require(global.__basedir +
  "/apps/Repository/ExamAttemptRepository");
var QuestionService = require(global.__basedir +
  "/apps/Services/QuestionService");

class ExamService {
  constructor() {
    this.client = DatabaseConnection.getMongoClient();
    this.db = this.client.db(DatabaseConnection.getDatabaseName());
    this.subjectRepo = new SubjectRepository(this.db);
    this.questionRepo = new QuestionRepository(this.db);
    this.examAttemptRepo = new ExamAttemptRepository(this.db);
  }

  async generateExam(subjectId, user) {
    await this.client.connect();
    try {
      const subject = await this.subjectRepo.getById(subjectId);
      if (!subject) return { ok: false, message: "Không tìm thấy môn học" };

      const cfg = subject.examConfig || {
        easyCount: 10,
        mediumCount: 5,
        hardCount: 5,
        durationMinutes: 30,
      };
      // Lấy thống kê số lượng câu hỏi hiện có theo độ khó
      const stats = await this.questionRepo.getQuestionStats(subject._id);
      const questions = await this.questionRepo.sampleByDifficulty(
        String(subject._id),
        cfg
      );

      // Tính thiếu hụt theo từng độ khó để hiển thị cảnh báo (US-40)
      const requested = {
        easy: Number(cfg.easyCount) || 0,
        medium: Number(cfg.mediumCount) || 0,
        hard: Number(cfg.hardCount) || 0,
      };
      const available = {
        easy: stats.easy || 0,
        medium: stats.medium || 0,
        hard: stats.hard || 0,
      };
      const shortages = {
        easy: { requested: requested.easy, available: available.easy },
        medium: { requested: requested.medium, available: available.medium },
        hard: { requested: requested.hard, available: available.hard },
      };
      const hasShortage =
        available.easy < requested.easy ||
        available.medium < requested.medium ||
        available.hard < requested.hard;

      // Snapshot đầy đủ để chấm server-side
      const questionsSnapshot = questions.map((q) => ({
        _id: q._id,
        subjectId: q.subjectId,
        difficulty: q.difficulty,
        type: q.type,
        content: q.content,
        mediaUrl: q.mediaUrl || null,
        answers: q.answers,
      }));

      // Strip đáp án đúng khỏi answers trước khi gửi cho client (theo US-30)
      const publicQuestions = questions.map((q) => ({
        _id: String(q._id),
        type: q.type,
        difficulty: q.difficulty,
        content: q.content,
        mediaUrl: q.mediaUrl || null,
        answers: QuestionService.stripCorrectAnswers(q.type, q.answers),
      }));

      // Tạo examAttempt snapshot (US-40)
      const attemptData = {
        userId: user && user.userId ? user.userId : null,
        subjectId: subject._id,
        startedAt: new Date(),
        durationMinutes: cfg.durationMinutes,
        totalQuestions: questions.length,
        questionsSnapshot,
        userAnswers: {},
      };

      const attemptId = await this.examAttemptRepo.createAttempt(attemptData);

      return {
        ok: true,
        durationMinutes: cfg.durationMinutes,
        questions: publicQuestions,
        attemptId: String(attemptId),
        shortages,
        hasShortage,
      };
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
