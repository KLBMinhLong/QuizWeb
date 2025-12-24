var ObjectId = require("mongodb").ObjectId;

class QuestionRepository {
  constructor(db) {
    this.db = db;
  }

  collection() {
    return this.db.collection("questions");
  }

  async sample(subjectId, difficulty, take) {
    const pipeline = [
      { $match: { subjectId: new ObjectId(String(subjectId)), difficulty } },
      { $sample: { size: Math.max(0, Number(take) || 0) } },
    ];
    return await this.collection().aggregate(pipeline).toArray();
  }

  async sampleByDifficulty(subjectId, cfg) {
    const easy = await this.sample(subjectId, "easy", cfg.easyCount);
    const medium = await this.sample(subjectId, "medium", cfg.mediumCount);
    const hard = await this.sample(subjectId, "hard", cfg.hardCount);

    // Trộn thứ tự
    const combined = [...easy, ...medium, ...hard];
    for (let i = combined.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [combined[i], combined[j]] = [combined[j], combined[i]];
    }
    return combined;
  }

  async countByDifficulty(subjectId, difficulty) {
    return await this.collection().countDocuments({
      subjectId: new ObjectId(String(subjectId)),
      difficulty,
    });
  }

  async getQuestionStats(subjectId) {
    const [easy, medium, hard] = await Promise.all([
      this.countByDifficulty(subjectId, "easy"),
      this.countByDifficulty(subjectId, "medium"),
      this.countByDifficulty(subjectId, "hard"),
    ]);
    return {
      easy,
      medium,
      hard,
      total: easy + medium + hard,
    };
  }
}

module.exports = QuestionRepository;
