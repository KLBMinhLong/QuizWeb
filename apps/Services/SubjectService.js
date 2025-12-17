var DatabaseConnection = require(global.__basedir + "/apps/Database/Database");
var SubjectRepository = require(global.__basedir + "/apps/Repository/SubjectRepository");

class SubjectService {
  constructor() {
    this.client = DatabaseConnection.getMongoClient();
    this.db = this.client.db(DatabaseConnection.getDatabaseName());
    this.subjectRepo = new SubjectRepository(this.db);
  }

  async getActiveSubjects() {
    await this.client.connect();
    try {
      return await this.subjectRepo.getActiveSubjects();
    } finally {
      await this.client.close();
    }
  }

  async getAllSubjects() {
    await this.client.connect();
    try {
      return await this.subjectRepo.getAllSubjects();
    } finally {
      await this.client.close();
    }
  }

  async getBySlug(slug) {
    await this.client.connect();
    try {
      return await this.subjectRepo.getBySlug(slug);
    } finally {
      await this.client.close();
    }
  }

  async createSubject(subject) {
    await this.client.connect();
    try {
      const exists = await this.subjectRepo.getBySlug(subject.slug);
      if (exists) return { ok: false, message: "Slug đã tồn tại" };

      const doc = {
        name: subject.name,
        slug: subject.slug,
        description: subject.description || "",
        isActive: true,
        tags: [],
        examConfig: {
          easyCount: 10,
          mediumCount: 5,
          hardCount: 5,
          durationMinutes: 30,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      await this.subjectRepo.insertSubject(doc);
      return { ok: true };
    } finally {
      await this.client.close();
    }
  }
}

module.exports = SubjectService;



