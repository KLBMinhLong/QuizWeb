var ObjectId = require("mongodb").ObjectId;

class UserRepository {
  constructor(db) {
    this.db = db;
  }

  collection() {
    return this.db.collection("users");
  }

  async findByUsernameOrEmail(username, email) {
    return await this.collection().findOne({
      $or: [{ username }, { normalizedUserName: username?.toUpperCase() }, { email }, { normalizedEmail: email?.toUpperCase() }],
    });
  }

  async findByUsername(username) {
    return await this.collection().findOne({
      $or: [{ username }, { normalizedUserName: username?.toUpperCase() }],
    });
  }

  async findByEmail(email) {
    return await this.collection().findOne({
      $or: [{ email }, { normalizedEmail: email?.toUpperCase() }],
    });
  }

  async findById(id) {
    return await this.collection().findOne({ _id: new ObjectId(String(id)) });
  }

  async insertUser(user) {
    return await this.collection().insertOne(user);
  }

  async updateUser(userId, updates) {
    return await this.collection().updateOne(
      { _id: new ObjectId(String(userId)) },
      { $set: { ...updates, updatedAt: new Date() } }
    );
  }

  async updateLastLogin(userId) {
    return await this.collection().updateOne(
      { _id: new ObjectId(String(userId)) },
      { $set: { lastLoginAt: new Date(), updatedAt: new Date() } }
    );
  }

  async getAllUsers() {
    const cursor = await this.collection().find({}).sort({ createdAt: -1 });
    return await cursor.toArray();
  }
}

module.exports = UserRepository;



