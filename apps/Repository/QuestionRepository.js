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

  async getById(id) {
    return await this.collection().findOne({ _id: new ObjectId(String(id)) });
  }

  async getAll(filter = {}) {
    return await this.collection().find(filter).toArray();
  }

  async create(question) {
    const now = new Date();
    const doc = {
      ...question,
      subjectId: new ObjectId(String(question.subjectId)),
      createdAt: now,
      updatedAt: now,
    };
    const result = await this.collection().insertOne(doc);
    return await this.getById(result.insertedId);
  }

  async update(id, question) {
    const updateDoc = {
      $set: {
        ...question,
        subjectId: question.subjectId ? new ObjectId(String(question.subjectId)) : undefined,
        updatedAt: new Date(),
      },
    };
    Object.keys(updateDoc.$set).forEach((key) => {
      if (updateDoc.$set[key] === undefined) {
        delete updateDoc.$set[key];
      }
    });
    await this.collection().updateOne({ _id: new ObjectId(String(id)) }, updateDoc);
    return await this.getById(id);
  }

  async delete(id) {
    const result = await this.collection().deleteOne({ _id: new ObjectId(String(id)) });
    return result.deletedCount > 0;
  }

  async getBySubject(subjectId, options = {}) {
    const filter = { subjectId: new ObjectId(String(subjectId)) };
    if (options.difficulty) {
      filter.difficulty = options.difficulty;
    }
    if (options.type) {
      filter.type = options.type;
    }
    const query = this.collection().find(filter);
    if (options.sort) {
      query.sort(options.sort);
    }
    if (options.skip) {
      query.skip(options.skip);
    }
    if (options.limit) {
      query.limit(options.limit);
    }
    return await query.toArray();
  }
}

module.exports = QuestionRepository;
