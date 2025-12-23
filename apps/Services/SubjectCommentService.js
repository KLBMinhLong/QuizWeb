var DatabaseConnection = require(global.__basedir + "/apps/Database/Database");
var SubjectCommentRepository = require(global.__basedir +
  "/apps/Repository/SubjectCommentRepository");
var SubjectRepository = require(global.__basedir +
  "/apps/Repository/SubjectRepository");

class SubjectCommentService {
  constructor() {
    this.client = DatabaseConnection.getMongoClient();
    this.db = this.client.db(DatabaseConnection.getDatabaseName());
    this.commentRepo = new SubjectCommentRepository(this.db);
    this.subjectRepo = new SubjectRepository(this.db);
  }

  async getCommentsBySubjectId(subjectId) {
    await this.client.connect();
    try {
      return await this.commentRepo.getCommentsBySubjectId(subjectId);
    } finally {
      await this.client.close();
    }
  }

  async createComment(subjectId, userId, username, content) {
    await this.client.connect();
    try {
      // Validate subject exists
      const subject = await this.subjectRepo.getById(subjectId);
      if (!subject) {
        return { ok: false, message: "Không tìm thấy môn học" };
      }

      // Validate content
      const trimmedContent = (content || "").trim();
      if (!trimmedContent) {
        return { ok: false, message: "Nội dung bình luận không được để trống" };
      }

      if (trimmedContent.length > 1000) {
        return {
          ok: false,
          message: "Bình luận không được vượt quá 1000 ký tự",
        };
      }

      // Create comment
      const doc = {
        subjectId: subject._id,
        userId,
        usernameSnapshot: username,
        content: trimmedContent,
        status: "visible",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await this.commentRepo.insertComment(doc);
      return { ok: true };
    } finally {
      await this.client.close();
    }
  }

  async deleteComment(commentId, userId, userRole) {
    await this.client.connect();
    try {
      const comment = await this.commentRepo.getCommentById(commentId);
      if (!comment) {
        return { ok: false, message: "Không tìm thấy bình luận" };
      }

      // Check permission: owner or moderator
      const isOwner = String(comment.userId) === String(userId);
      const isModerator = userRole === "admin" || userRole === "moderator";

      if (!isOwner && !isModerator) {
        return { ok: false, message: "Bạn không có quyền xóa bình luận này" };
      }

      await this.commentRepo.deleteComment(commentId);
      return { ok: true };
    } finally {
      await this.client.close();
    }
  }

  async hideComment(commentId, userRole) {
    await this.client.connect();
    try {
      // Only admin/moderator can hide
      if (userRole !== "admin" && userRole !== "moderator") {
        return { ok: false, message: "Bạn không có quyền ẩn bình luận" };
      }

      const comment = await this.commentRepo.getCommentById(commentId);
      if (!comment) {
        return { ok: false, message: "Không tìm thấy bình luận" };
      }

      await this.commentRepo.hideComment(commentId);
      return { ok: true };
    } finally {
      await this.client.close();
    }
  }
}

module.exports = SubjectCommentService;
