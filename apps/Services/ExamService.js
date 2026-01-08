var ObjectId = require("mongodb").ObjectId;

var DatabaseConnection = require(global.__basedir + "/apps/Database/Database");
var SubjectRepository = require(global.__basedir +
  "/apps/Repository/SubjectRepository");
var QuestionRepository = require(global.__basedir +
  "/apps/Repository/QuestionRepository");
var ExamAttemptRepository = require(global.__basedir +
  "/apps/Repository/ExamAttemptRepository");
var UserRepository = require(global.__basedir +
  "/apps/Repository/UserRepository");
var QuestionService = require(global.__basedir +
  "/apps/Services/QuestionService");

class ExamService {
  constructor() {
    this.client = DatabaseConnection.getMongoClient();
    this.db = this.client.db(DatabaseConnection.getDatabaseName());
    this.subjectRepo = new SubjectRepository(this.db);
    this.questionRepo = new QuestionRepository(this.db);
    this.examAttemptRepo = new ExamAttemptRepository(this.db);
    this.userRepo = new UserRepository(this.db);
  }

  async generateExam(subjectId, user) {
    await this.client.connect();
    try {
      const subject = await this.subjectRepo.getById(subjectId);
      if (!subject) return { ok: false, message: "Không tìm thấy môn học" };

      if (user && user.userId) {
        const activeAttempt = await this.examAttemptRepo.findActiveAttempt(
          user.userId,
          subjectId
        );

        if (activeAttempt) {
          const now = new Date();
          const startTime = new Date(activeAttempt.startedAt);
          const durationMs = activeAttempt.durationMinutes * 60 * 1000;
          const endTime = new Date(startTime.getTime() + durationMs);
          const remainingMs = endTime.getTime() - now.getTime();

          if (remainingMs <= 0) {
            await this.submitExam(
              {
                attemptId: String(activeAttempt._id),
                answers: activeAttempt.userAnswers || {},
              },
              user
            );
          } else {
            const questions = activeAttempt.questionsSnapshot || [];
            const publicQuestions = questions.map((q) => ({
              _id: String(q._id),
              type: q.type,
              difficulty: q.difficulty,
              content: q.content,
              mediaUrl: q.mediaUrl || null,
              answers: QuestionService.stripCorrectAnswers(q.type, q.answers),
            }));

            return {
              ok: true,
              isResume: true,
              attemptId: String(activeAttempt._id),
              questions: publicQuestions,
              durationMinutes: activeAttempt.durationMinutes,
              remainingSeconds: Math.floor(remainingMs / 1000),
              endTime: endTime.getTime(),
              serverTime: Date.now(),
              userAnswers: activeAttempt.userAnswers || {},
              hasShortage: false,
            };
          }
        }
      }

      const cfg = subject.examConfig || {
        easyCount: 10,
        mediumCount: 5,
        hardCount: 5,
        durationMinutes: 30,
      };

      const stats = await this.questionRepo.getQuestionStats(subject._id);
      const questions = await this.questionRepo.sampleByDifficulty(
        String(subject._id),
        cfg
      );

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

      const questionsSnapshot = questions.map((q) => ({
        _id: String(q._id),
        subjectId: String(q.subjectId),
        difficulty: q.difficulty,
        type: q.type,
        content: q.content,
        mediaUrl: q.mediaUrl || null,
        answers: q.answers,
      }));

      const publicQuestions = questions.map((q) => ({
        _id: String(q._id),
        type: q.type,
        difficulty: q.difficulty,
        content: q.content,
        mediaUrl: q.mediaUrl || null,
        answers: QuestionService.stripCorrectAnswers(q.type, q.answers),
      }));

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

      const newEndTime = new Date(attemptData.startedAt.getTime() + cfg.durationMinutes * 60 * 1000);

      return {
        ok: true,
        isResume: false,
        durationMinutes: cfg.durationMinutes,
        remainingSeconds: cfg.durationMinutes * 60,
        endTime: newEndTime.getTime(),
        serverTime: Date.now(),
        questions: publicQuestions,
        attemptId: String(attemptId),
        shortages,
        hasShortage,
        userAnswers: {},
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

      const attempt = await this.examAttemptRepo.getById(attemptId);
      if (!attempt) {
        return { ok: false, message: "Không tìm thấy attempt" };
      }

      if (attempt.finishedAt) {
        return { ok: false, message: "Bài thi đã được nộp rồi" };
      }

      if (attempt.userId && user && user.userId) {
        if (String(attempt.userId) !== String(user.userId)) {
          return { ok: false, message: "Bạn không có quyền nộp bài thi này" };
        }
      }

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
      const score =
        totalQuestions === 0
          ? 0
          : Math.round((correctCount / totalQuestions) * 100);

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
        questionResults,
        attemptId: attemptId,
      };
    } finally {
      await this.client.close();
    }
  }

  async getAttemptHistory(user, options = {}) {
    await this.client.connect();
    try {
      if (!user) {
        return { ok: false, message: "Yêu cầu đăng nhập" };
      }

      const isAdminOrModerator =
        user.role === "admin" || user.role === "moderator";

      let attempts;
      if (isAdminOrModerator) {
        attempts = await this.examAttemptRepo.getAllAttempts(options);
      } else {
        attempts = await this.examAttemptRepo.getByUserId(user.userId, options);
      }

      const enrichedAttempts = [];
      for (const attempt of attempts) {
        const subject = await this.subjectRepo.getById(attempt.subjectId);
        const enrichedAttempt = {
          ...attempt,
          subject: subject || { name: "Môn học đã bị xóa", slug: "" },
        };

        if (isAdminOrModerator && attempt.userId) {
          const attemptUser = await this.userRepo.findById(attempt.userId);
          enrichedAttempt.user = attemptUser
            ? {
                _id: attemptUser._id,
                username: attemptUser.username,
                fullName: attemptUser.fullName || attemptUser.username,
              }
            : {
                username: "(Người dùng đã bị xóa)",
                fullName: "(Người dùng đã bị xóa)",
              };
        }

        enrichedAttempts.push(enrichedAttempt);
      }

      return { ok: true, attempts: enrichedAttempts, isAdminOrModerator };
    } finally {
      await this.client.close();
    }
  }

  async getAttemptDetail(attemptId, user) {
    await this.client.connect();
    try {
      if (!user) {
        return { ok: false, message: "Yêu cầu đăng nhập" };
      }

      const attempt = await this.examAttemptRepo.getById(attemptId);
      if (!attempt) {
        return { ok: false, message: "Không tìm thấy attempt" };
      }

      const isAdminOrModerator =
        user.role === "admin" || user.role === "moderator";
      const isOwner =
        attempt.userId && String(attempt.userId) === String(user.userId);

      if (!isAdminOrModerator && !isOwner) {
        return { ok: false, message: "Bạn không có quyền xem attempt này" };
      }

      const subject = await this.subjectRepo.getById(attempt.subjectId);

      const questionsSnapshot = attempt.questionsSnapshot || [];
      const userAnswers = attempt.userAnswers || {};
      const questionDetails = [];

      for (let i = 0; i < questionsSnapshot.length; i++) {
        const question = questionsSnapshot[i];
        const questionId = String(question._id);
        const userAnswer = userAnswers[questionId];

        const isCorrect = QuestionService.compareAnswer(
          question.type,
          question.answers,
          userAnswer
        );

        questionDetails.push({
          index: i + 1,
          question,
          userAnswer,
          isCorrect,
        });
      }

      return {
        ok: true,
        attempt,
        subject: subject || { name: "Môn học đã bị xóa", slug: "" },
        questionDetails,
      };
    } finally {
      await this.client.close();
    }
  }

  async saveProgress(attemptId, user, answers) {
    await this.client.connect();
    try {
      const attempt = await this.examAttemptRepo.getById(attemptId);
      if (!attempt) return { ok: false, message: "Không tìm thấy attempt" };

      if (attempt.finishedAt)
        return { ok: false, message: "Bài thi đã kết thúc" };

      if (
        user &&
        user.userId &&
        attempt.userId &&
        String(attempt.userId) !== String(user.userId)
      ) {
        return { ok: false, message: "Không có quyền" };
      }

      await this.examAttemptRepo.updateAttempt(attemptId, {
        userAnswers: answers,
      });

      return { ok: true };
    } finally {
      await this.client.close();
    }
  }
}

module.exports = ExamService;
