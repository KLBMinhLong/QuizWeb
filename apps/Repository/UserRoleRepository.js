var ObjectId = require("mongodb").ObjectId;

class UserRoleRepository {
  constructor(db) {
    this.db = db;
  }

  collection() {
    return this.db.collection("userRoles");
  }

  async findByUserId(userId) {
    const cursor = await this.collection().find({ userId: new ObjectId(String(userId)) });
    return await cursor.toArray();
  }

  async findByRoleId(roleId) {
    const cursor = await this.collection().find({ roleId: new ObjectId(String(roleId)) });
    return await cursor.toArray();
  }

  async findByUserAndRole(userId, roleId) {
    return await this.collection().findOne({
      userId: new ObjectId(String(userId)),
      roleId: new ObjectId(String(roleId)),
    });
  }

  async insertUserRole(userRole) {
    return await this.collection().insertOne({
      userId: new ObjectId(String(userRole.userId)),
      roleId: new ObjectId(String(userRole.roleId)),
      createdAt: new Date(),
    });
  }

  async deleteUserRole(userId, roleId) {
    return await this.collection().deleteOne({
      userId: new ObjectId(String(userId)),
      roleId: new ObjectId(String(roleId)),
    });
  }

  async deleteByUserId(userId) {
    return await this.collection().deleteMany({ userId: new ObjectId(String(userId)) });
  }

  async deleteByRoleId(roleId) {
    return await this.collection().deleteMany({ roleId: new ObjectId(String(roleId)) });
  }
}

module.exports = UserRoleRepository;

