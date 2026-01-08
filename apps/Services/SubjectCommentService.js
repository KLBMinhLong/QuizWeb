var DatabaseConnection = require(global.__basedir + "/apps/Database/Database");
var SubjectCommentRepository = require(global.__basedir +
  "/apps/Repository/SubjectCommentRepository");
var SubjectRepository = require(global.__basedir +
  "/apps/Repository/SubjectRepository");
var UserRepository = require(global.__basedir +
  "/apps/Repository/UserRepository");

class SubjectCommentService {
  constructor() {
    this.client = DatabaseConnection.getMongoClient();
    this.db = this.client.db(DatabaseConnection.getDatabaseName());
    this.commentRepo = new SubjectCommentRepository(this.db);
    this.subjectRepo = new SubjectRepository(this.db);
    this.userRepo = new UserRepository(this.db);
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
      const user = await this.userRepo.findById(userId);
      if (!user) {
        return { ok: false, message: "Không tìm thấy người dùng" };
      }
      if (user.trangThai !== "active") {
        return {
          ok: false,
          message: "Tài khoản của bạn chưa được kích hoạt hoặc đã bị khóa",
        };
      }

      const subject = await this.subjectRepo.getById(subjectId);
      if (!subject) {
        return { ok: false, message: "Không tìm thấy môn học" };
      }

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

      var ObjectId = require("mongodb").ObjectId;
      const doc = {
        subjectId: subject._id,
        userId: new ObjectId(String(userId)),
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

      var ObjectId = require("mongodb").ObjectId;
      const commentUserId = String(comment.userId);
      const requestUserId = String(userId);
      const isOwner = commentUserId === requestUserId;
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
