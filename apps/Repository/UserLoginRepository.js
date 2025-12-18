var ObjectId = require("mongodb").ObjectId;

class UserLoginRepository {
  constructor(db) {
    this.db = db;
  }

  collection() {
    return this.db.collection("userLogins");
  }

  async findByUserId(userId) {
    const cursor = await this.collection().find({ userId: new ObjectId(String(userId)) });
    return await cursor.toArray();
  }

  async findByProvider(loginProvider, providerKey) {
    return await this.collection().findOne({
      loginProvider,
      providerKey,
    });
  }

  async insertUserLogin(userLogin) {
    return await this.collection().insertOne({
      loginProvider: userLogin.loginProvider,
      providerKey: userLogin.providerKey,
      providerDisplayName: userLogin.providerDisplayName || userLogin.loginProvider,
      userId: new ObjectId(String(userLogin.userId)),
      createdAt: new Date(),
    });
  }

  async deleteUserLogin(loginProvider, providerKey, userId) {
    return await this.collection().deleteOne({
      loginProvider,
      providerKey,
      userId: new ObjectId(String(userId)),
    });
  }

  async deleteByUserId(userId) {
    return await this.collection().deleteMany({ userId: new ObjectId(String(userId)) });
  }
}

module.exports = UserLoginRepository;

