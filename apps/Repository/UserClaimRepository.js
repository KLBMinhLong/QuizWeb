var ObjectId = require("mongodb").ObjectId;

class UserClaimRepository {
  constructor(db) {
    this.db = db;
  }

  collection() {
    return this.db.collection("userClaims");
  }

  async findByUserId(userId) {
    const cursor = await this.collection().find({ userId: new ObjectId(String(userId)) });
    return await cursor.toArray();
  }

  async findByUserIdAndType(userId, claimType) {
    const cursor = await this.collection().find({
      userId: new ObjectId(String(userId)),
      claimType,
    });
    return await cursor.toArray();
  }

  async insertUserClaim(userClaim) {
    return await this.collection().insertOne({
      userId: new ObjectId(String(userClaim.userId)),
      claimType: userClaim.claimType,
      claimValue: userClaim.claimValue,
      createdAt: new Date(),
    });
  }

  async deleteUserClaim(id) {
    return await this.collection().deleteOne({ _id: new ObjectId(String(id)) });
  }

  async deleteByUserId(userId) {
    return await this.collection().deleteMany({ userId: new ObjectId(String(userId)) });
  }
}

module.exports = UserClaimRepository;

