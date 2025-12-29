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

      // Snapshot đầy đủ để chấm server-side (convert ObjectId thành string để dễ serialize/deserialize)
      const questionsSnapshot = questions.map((q) => ({
        _id: String(q._id),
        subjectId: String(q.subjectId),
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

  async submitExam(payload, user) {
    await this.client.connect();
    try {
      const { attemptId, answers } = payload;

      if (!attemptId) {
        return { ok: false, message: "Thiếu attemptId" };
      }

      // Load attempt từ database
      const attempt = await this.examAttemptRepo.getById(attemptId);
      if (!attempt) {
        return { ok: false, message: "Không tìm thấy attempt" };
      }

      // Check attempt chưa finished (AC2)
      if (attempt.finishedAt) {
        return { ok: false, message: "Bài thi đã được nộp rồi" };
      }

      // Verify user owns this attempt (nếu có userId)
      if (attempt.userId && user && user.userId) {
        if (String(attempt.userId) !== String(user.userId)) {
          return { ok: false, message: "Bạn không có quyền nộp bài thi này" };
        }
      }

      // Chấm điểm dựa trên questionsSnapshot (AC1)
      const questionsSnapshot = attempt.questionsSnapshot || [];
      const userAnswers = answers || {};

      let correctCount = 0;
      const questionResults = [];

      for (const question of questionsSnapshot) {
        const questionId = String(question._id);
        const userAnswer = userAnswers[questionId];
        const isCorrect = QuestionService.compareAnswer(
          question.type,
          question.answers,
          userAnswer
        );

        if (isCorrect) {
          correctCount++;
        }

        questionResults.push({
          questionId,
          isCorrect,
        });
      }

      const totalQuestions = questionsSnapshot.length;
      const score = totalQuestions === 0 ? 0 : Math.round((correctCount / totalQuestions) * 100);

      // Update attempt với finishedAt, score, userAnswers (AC1)
      await this.examAttemptRepo.updateAttempt(attemptId, {
        finishedAt: new Date(),
        score: score,
        userAnswers: userAnswers,
      });

      return {
        ok: true,
        score,
        total: totalQuestions,
        correctCount,
        questionResults, // Để hiển thị chi tiết nếu cần
      };
    } finally {
      await this.client.close();
    }
  }
}

module.exports = ExamService;
