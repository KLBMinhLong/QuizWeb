var ObjectId = require("mongodb").ObjectId;

class UserTokenRepository {
  constructor(db) {
    this.db = db;
  }

  collection() {
    return this.db.collection("userTokens");
  }

  async findByUserId(userId) {
    const cursor = await this.collection().find({ userId: new ObjectId(String(userId)) });
    return await cursor.toArray();
  }

  async findByUserIdAndName(userId, name) {
    const cursor = await this.collection().find({
      userId: new ObjectId(String(userId)),
      name,
    });
    return await cursor.toArray();
  }

  async findByUserIdProviderAndName(userId, loginProvider, name) {
    return await this.collection().findOne({
      userId: new ObjectId(String(userId)),
      loginProvider,
      name,
    });
  }

  async insertUserToken(userToken) {
    return await this.collection().insertOne({
      userId: new ObjectId(String(userToken.userId)),
      loginProvider: userToken.loginProvider || "Default",
      name: userToken.name,
      value: userToken.value,
      createdAt: new Date(),
      expiresAt: userToken.expiresAt || null,
    });
  }

  async updateUserToken(userId, loginProvider, name, value) {
    return await this.collection().updateOne(
      {
        userId: new ObjectId(String(userId)),
        loginProvider: loginProvider || "Default",
        name,
      },
      {
        $set: {
          value,
          updatedAt: new Date(),
        },
      },
      { upsert: true }
    );
  }

  async deleteUserToken(userId, loginProvider, name) {
    return await this.collection().deleteOne({
      userId: new ObjectId(String(userId)),
      loginProvider: loginProvider || "Default",
      name,
    });
  }

  async deleteByUserId(userId) {
    return await this.collection().deleteMany({ userId: new ObjectId(String(userId)) });
  }
}

module.exports = UserTokenRepository;

