var ObjectId = require("mongodb").ObjectId;

class RoleClaimRepository {
  constructor(db) {
    this.db = db;
  }

  collection() {
    return this.db.collection("roleClaims");
  }

  async findByRoleId(roleId) {
    const cursor = await this.collection().find({ roleId: new ObjectId(String(roleId)) });
    return await cursor.toArray();
  }

  async insertRoleClaim(roleClaim) {
    return await this.collection().insertOne({
      roleId: new ObjectId(String(roleClaim.roleId)),
      claimType: roleClaim.claimType,
      claimValue: roleClaim.claimValue,
      createdAt: new Date(),
    });
  }

  async deleteRoleClaim(id) {
    return await this.collection().deleteOne({ _id: new ObjectId(String(id)) });
  }

  async deleteByRoleId(roleId) {
    return await this.collection().deleteMany({ roleId: new ObjectId(String(roleId)) });
  }
}

module.exports = RoleClaimRepository;

