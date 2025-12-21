var ObjectId = require("mongodb").ObjectId;

class RoleRepository {
  constructor(db) {
    this.db = db;
  }

  collection() {
    return this.db.collection("roles");
  }

  async findByName(name) {
    return await this.collection().findOne({ name });
  }

  async findByNormalizedName(normalizedName) {
    return await this.collection().findOne({ normalizedName });
  }

  async findById(id) {
    return await this.collection().findOne({ _id: new ObjectId(String(id)) });
  }

  async getAllRoles() {
    const cursor = await this.collection().find({}).sort({ name: 1 });
    return await cursor.toArray();
  }

  async insertRole(role) {
    return await this.collection().insertOne(role);
  }

  async updateRole(id, updates) {
    return await this.collection().updateOne(
      { _id: new ObjectId(String(id)) },
      { $set: { ...updates, updatedAt: new Date() } }
    );
  }

  async deleteRole(id) {
    return await this.collection().deleteOne({ _id: new ObjectId(String(id)) });
  }
}

module.exports = RoleRepository;

