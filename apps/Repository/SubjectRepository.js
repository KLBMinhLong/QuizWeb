var ObjectId = require("mongodb").ObjectId;

class SubjectRepository {
  constructor(db) {
    this.db = db;
  }

  collection() {
    return this.db.collection("subjects");
  }

  async getActiveSubjects() {
    const cursor = await this.collection()
      .find({ isActive: true })
      .sort({ name: 1 });
    return await cursor.toArray();
  }

  async getAllSubjects() {
    const cursor = await this.collection().find({}).sort({ createdAt: -1 });
    return await cursor.toArray();
  }

  async getBySlug(slug) {
    return await this.collection().findOne({ slug });
  }

  async getById(id) {
    return await this.collection().findOne({ _id: new ObjectId(String(id)) });
  }

  async insertSubject(subject) {
    return await this.collection().insertOne(subject);
  }

  async updateSubject(id, updates) {
    return await this.collection().updateOne(
      { _id: new ObjectId(String(id)) },
      { $set: updates }
    );
  }

  async deleteSubject(id) {
    return await this.collection().deleteOne({ _id: new ObjectId(String(id)) });
  }

  async toggleActive(id, isActive) {
    return await this.collection().updateOne(
      { _id: new ObjectId(String(id)) },
      { $set: { isActive, updatedAt: new Date() } }
    );
  }
}

module.exports = SubjectRepository;
