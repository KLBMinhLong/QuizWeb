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
}

module.exports = ExamAttemptRepository;
