var DatabaseConnection = require(global.__basedir + "/apps/Database/Database");
var SubjectRepository = require(global.__basedir +
  "/apps/Repository/SubjectRepository");
var slugify = require("slugify");

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

  async getById(id) {
    await this.client.connect();
    try {
      return await this.subjectRepo.getById(id);
    } finally {
      await this.client.close();
    }
  }

  async createSubject(subject) {
    await this.client.connect();
    try {
      // Sinh slug tự động từ name
      const baseSlug = slugify(subject.name || "", {
        lower: true,
        strict: true,
      });
      if (!baseSlug) {
        return { ok: false, message: "Tên môn học không hợp lệ" };
      }

      // Đảm bảo slug là duy nhất: nếu trùng thì thêm -2, -3, ...
      let slug = baseSlug;
      let counter = 1;
      // Lặp tối đa 50 lần để tránh loop vô hạn
      // Nếu vẫn trùng thì báo lỗi
      // (Trường hợp này gần như không xảy ra)
      while (await this.subjectRepo.getBySlug(slug)) {
        counter += 1;
        if (counter > 50) {
          return {
            ok: false,
            message: "Không thể tạo slug duy nhất cho môn học này",
          };
        }
        slug = `${baseSlug}-${counter}`;
      }

      const doc = {
        name: subject.name,
        slug: slug,
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

  async updateSubject(id, updates) {
    await this.client.connect();
    try {
      const subject = await this.subjectRepo.getById(id);
      if (!subject) {
        return { ok: false, message: "Không tìm thấy môn học" };
      }

      const updateData = {
        updatedAt: new Date(),
      };

      if (updates.name) {
        updateData.name = updates.name;
      }
      if (updates.description !== undefined) {
        updateData.description = updates.description;
      }

      await this.subjectRepo.updateSubject(id, updateData);
      return { ok: true };
    } finally {
      await this.client.close();
    }
  }

  async updateExamConfig(id, examConfig) {
    await this.client.connect();
    try {
      const subject = await this.subjectRepo.getById(id);
      if (!subject) {
        return { ok: false, message: "Không tìm thấy môn học" };
      }

      // Validation
      const easyCount = parseInt(examConfig.easyCount) || 0;
      const mediumCount = parseInt(examConfig.mediumCount) || 0;
      const hardCount = parseInt(examConfig.hardCount) || 0;
      const durationMinutes = parseInt(examConfig.durationMinutes) || 0;

      if (easyCount < 0 || mediumCount < 0 || hardCount < 0) {
        return { ok: false, message: "Số lượng câu hỏi phải >= 0" };
      }

      if (durationMinutes <= 0) {
        return { ok: false, message: "Thời gian thi phải > 0" };
      }

      const updateData = {
        examConfig: {
          easyCount,
          mediumCount,
          hardCount,
          durationMinutes,
        },
        updatedAt: new Date(),
      };

      await this.subjectRepo.updateSubject(id, updateData);
      return { ok: true };
    } finally {
      await this.client.close();
    }
  }

  async toggleActive(id, isActive) {
    await this.client.connect();
    try {
      const subject = await this.subjectRepo.getById(id);
      if (!subject) {
        return { ok: false, message: "Không tìm thấy môn học" };
      }

      await this.subjectRepo.toggleActive(id, isActive);
      return { ok: true };
    } finally {
      await this.client.close();
    }
  }

  async deleteSubject(id) {
    await this.client.connect();
    try {
      const subject = await this.subjectRepo.getById(id);
      if (!subject) {
        return { ok: false, message: "Không tìm thấy môn học" };
      }

      await this.subjectRepo.deleteSubject(id);
      return { ok: true };
    } finally {
      await this.client.close();
    }
  }
}

module.exports = SubjectService;
