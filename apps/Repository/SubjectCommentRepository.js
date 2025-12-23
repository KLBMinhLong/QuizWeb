var ObjectId = require("mongodb").ObjectId;

class SubjectCommentRepository {
  constructor(db) {
    this.db = db;
  }

  collection() {
    return this.db.collection("subjectComments");
  }

  async getCommentsBySubjectId(subjectId) {
    const cursor = await this.collection()
      .find({
        subjectId: new ObjectId(String(subjectId)),
        status: "visible",
      })
      .sort({ createdAt: -1 });
    return await cursor.toArray();
  }

  async insertComment(comment) {
    return await this.collection().insertOne(comment);
  }

  async getCommentById(id) {
    return await this.collection().findOne({ _id: new ObjectId(String(id)) });
  }

  async deleteComment(id) {
    return await this.collection().updateOne(
      { _id: new ObjectId(String(id)) },
      { $set: { status: "deleted", updatedAt: new Date() } }
    );
  }

  async hideComment(id) {
    return await this.collection().updateOne(
      { _id: new ObjectId(String(id)) },
      { $set: { status: "hidden", updatedAt: new Date() } }
    );
  }

  async getCommentsByUserId(userId, limit = 10) {
    const cursor = await this.collection()
      .find({ userId: new ObjectId(String(userId)) })
      .sort({ createdAt: -1 })
      .limit(limit);
    return await cursor.toArray();
  }
}

module.exports = SubjectCommentRepository;
