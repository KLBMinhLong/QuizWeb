var ObjectId = require("mongodb").ObjectId;

class ExamAttemptRepository {
  constructor(db) {
    this.db = db;
  }

  collection() {
    return this.db.collection("examAttempts");
  }

  async getById(id) {
    return await this.collection().findOne({ _id: new ObjectId(String(id)) });
  }

  async createAttempt(attempt) {
    const now = new Date();
    const doc = {
      userId: attempt.userId ? new ObjectId(String(attempt.userId)) : null,
      subjectId: new ObjectId(String(attempt.subjectId)),
      startedAt: attempt.startedAt || now,
      finishedAt: attempt.finishedAt || null,
      durationMinutes: Number(attempt.durationMinutes) || 0,
      score: typeof attempt.score === "number" ? attempt.score : null,
      totalQuestions: Number(attempt.totalQuestions) || 0,
      questionsSnapshot: attempt.questionsSnapshot || [],
      userAnswers: attempt.userAnswers || {},
      createdAt: now,
      updatedAt: now,
    };

    const result = await this.collection().insertOne(doc);
    return result.insertedId;
  }

  async updateAttempt(id, update) {
    const setDoc = {
      ...update,
      updatedAt: new Date(),
    };

    await this.collection().updateOne(
      { _id: new ObjectId(String(id)) },
      { $set: setDoc }
    );

    return await this.getById(id);
  }

  async getByUserId(userId, options = {}) {
    const filter = { userId: new ObjectId(String(userId)) };

    const query = this.collection().find(filter).sort({ startedAt: -1 }); // Mới nhất trước

    if (options.limit) {
      query.limit(options.limit);
    }
    if (options.skip) {
      query.skip(options.skip);
    }

    return await query.toArray();
  }

  async getAllAttempts(options = {}) {
    const query = this.collection().find({}).sort({ startedAt: -1 }); // Mới nhất trước

    if (options.limit) {
      query.limit(options.limit);
    }
    if (options.skip) {
      query.skip(options.skip);
    }

    return await query.toArray();
  }

  async countByUserId(userId) {
    return await this.collection().countDocuments({
      userId: new ObjectId(String(userId)),
    });
  }

  async countAll() {
    return await this.collection().countDocuments({});
  }

  // Tìm bài thi đang làm dở (chưa finish)
  async findActiveAttempt(userId, subjectId) {
    return await this.collection().findOne({
      userId: new ObjectId(String(userId)),
      subjectId: new ObjectId(String(subjectId)),
      finishedAt: null,
    });
  }
}

module.exports = ExamAttemptRepository;
