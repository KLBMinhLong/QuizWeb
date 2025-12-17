var ObjectId = require("mongodb").ObjectId;

class UserRepository {
  constructor(db) {
    this.db = db;
  }

  collection() {
    return this.db.collection("users");
  }

  async findByUsernameOrEmail(username, email) {
    return await this.collection().findOne({ $or: [{ username }, { email }] });
  }

  async findByUsername(username) {
    return await this.collection().findOne({ username });
  }

  async insertUser(user) {
    return await this.collection().insertOne(user);
  }

  async updateLastLogin(userId) {
    return await this.collection().updateOne(
      { _id: new ObjectId(String(userId)) },
      { $set: { lastLoginAt: new Date(), updatedAt: new Date() } }
    );
  }
}

module.exports = UserRepository;



