var DatabaseConnection = require(global.__basedir + "/apps/Database/Database");
var RoleRepository = require(global.__basedir + "/apps/Repository/RoleRepository");
var UserRoleRepository = require(global.__basedir + "/apps/Repository/UserRoleRepository");
var RoleClaimRepository = require(global.__basedir + "/apps/Repository/RoleClaimRepository");
var crypto = require("crypto");

class RoleService {
  constructor() {
    this.client = DatabaseConnection.getMongoClient();
    this.db = this.client.db(DatabaseConnection.getDatabaseName());
    this.roleRepo = new RoleRepository(this.db);
    this.userRoleRepo = new UserRoleRepository(this.db);
    this.roleClaimRepo = new RoleClaimRepository(this.db);
  }

  async getAllRoles() {
    await this.client.connect();
    try {
      const roles = await this.roleRepo.getAllRoles();
      const rolesWithCounts = await Promise.all(
        roles.map(async (role) => {
          const userCount = await this.userRoleRepo.findByRoleId(role._id);
          return {
            ...role,
            userCount: userCount.length,
          };
        })
      );
      return rolesWithCounts;
    } finally {
      await this.client.close();
    }
  }

  async getRoleById(id) {
    await this.client.connect();
    try {
      const role = await this.roleRepo.findById(id);
      if (!role) return null;

      const claims = await this.roleClaimRepo.findByRoleId(id);
      const userCount = await this.userRoleRepo.findByRoleId(id);

      return {
        ...role,
        claims: claims,
        userCount: userCount.length,
      };
    } finally {
      await this.client.close();
    }
  }

  async createRole(roleData) {
    await this.client.connect();
    try {
      const normalizedName = (roleData.name || "").toUpperCase().trim();
      if (!normalizedName) {
        return { ok: false, message: "Tên role không được để trống" };
      }

      const existing = await this.roleRepo.findByNormalizedName(normalizedName);
      if (existing) {
        return { ok: false, message: `Role "${roleData.name}" đã tồn tại` };
      }

      const doc = {
        name: roleData.name.trim(),
        normalizedName: normalizedName,
        description: roleData.description || "",
        concurrencyStamp: crypto.randomBytes(16).toString("hex"),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = await this.roleRepo.insertRole(doc);
      return { ok: true, roleId: result.insertedId };
    } finally {
      await this.client.close();
    }
  }

  async updateRole(id, roleData) {
    await this.client.connect();
    try {
      const role = await this.roleRepo.findById(id);
      if (!role) {
        return { ok: false, message: "Không tìm thấy role" };
      }

      if (role.normalizedName === "ADMIN" && roleData.name && roleData.name.toUpperCase() !== "ADMIN") {
        return { ok: false, message: "Không thể đổi tên role admin" };
      }

      const normalizedName = (roleData.name || role.name).toUpperCase().trim();
      
      if (roleData.name && normalizedName !== role.normalizedName) {
        const existing = await this.roleRepo.findByNormalizedName(normalizedName);
        if (existing && String(existing._id) !== String(id)) {
          return { ok: false, message: `Role "${roleData.name}" đã tồn tại` };
        }
      }

      const updates = {
        updatedAt: new Date(),
      };

      if (roleData.name) {
        updates.name = roleData.name.trim();
        updates.normalizedName = normalizedName;
      }

      if (roleData.description !== undefined) {
        updates.description = roleData.description || "";
      }

      await this.roleRepo.updateRole(id, updates);
      return { ok: true };
    } finally {
      await this.client.close();
    }
  }

  async deleteRole(id) {
    await this.client.connect();
    try {
      const role = await this.roleRepo.findById(id);
      if (!role) {
        return { ok: false, message: "Không tìm thấy role" };
      }

      if (role.normalizedName === "ADMIN") {
        return { ok: false, message: "Không thể xoá role admin" };
      }

      const userRoles = await this.userRoleRepo.findByRoleId(id);
      if (userRoles.length > 0) {
        return { 
          ok: false, 
          message: `Không thể xoá role này vì đang có ${userRoles.length} user đang sử dụng` 
        };
      }

      await this.roleClaimRepo.deleteByRoleId(id);
      await this.roleRepo.deleteRole(id);
      return { ok: true };
    } finally {
      await this.client.close();
    }
  }

  static getAvailablePermissions() {
    return [
      { value: "users.read", label: "Xem danh sách users", category: "Users" },
      { value: "users.write", label: "Tạo/sửa users", category: "Users" },
      { value: "users.delete", label: "Xóa users", category: "Users" },
      { value: "roles.read", label: "Xem danh sách roles", category: "Roles" },
      { value: "roles.write", label: "Tạo/sửa roles", category: "Roles" },
      { value: "roles.delete", label: "Xóa roles", category: "Roles" },
      { value: "subjects.read", label: "Xem danh sách môn học", category: "Subjects" },
      { value: "subjects.write", label: "Tạo/sửa môn học", category: "Subjects" },
      { value: "subjects.delete", label: "Xóa môn học", category: "Subjects" },
      { value: "questions.read", label: "Xem câu hỏi", category: "Questions" },
      { value: "questions.write", label: "Tạo/sửa câu hỏi", category: "Questions" },
      { value: "questions.delete", label: "Xóa câu hỏi", category: "Questions" },
      { value: "exams.read", label: "Xem bài thi", category: "Exams" },
      { value: "exams.write", label: "Tạo/sửa bài thi", category: "Exams" },
      { value: "exams.delete", label: "Xóa bài thi", category: "Exams" },
      { value: "exams.take", label: "Làm bài thi", category: "Exams" },
      { value: "comments.write", label: "Viết bình luận", category: "Comments" },
      { value: "comments.moderate", label: "Kiểm duyệt bình luận", category: "Comments" },
      { value: "system.config", label: "Cấu hình hệ thống", category: "System" },
    ];
  }

  async addClaimToRole(roleId, claimType, claimValue) {
    await this.client.connect();
    try {
      const role = await this.roleRepo.findById(roleId);
      if (!role) {
        return { ok: false, message: "Không tìm thấy role" };
      }

      const existingClaims = await this.roleClaimRepo.findByRoleId(roleId);
      const exists = existingClaims.some(
        (c) => c.claimType === claimType && c.claimValue === claimValue
      );

      if (exists) {
        return { ok: false, message: "Claim này đã tồn tại trong role" };
      }

      await this.roleClaimRepo.insertRoleClaim({
        roleId: roleId,
        claimType: claimType,
        claimValue: claimValue,
      });

      return { ok: true };
    } finally {
      await this.client.close();
    }
  }

  async removeClaimFromRole(claimId) {
    await this.client.connect();
    try {
      await this.roleClaimRepo.deleteRoleClaim(claimId);
      return { ok: true };
    } finally {
      await this.client.close();
    }
  }

  async getRoleClaims(roleId) {
    await this.client.connect();
    try {
      const claims = await this.roleClaimRepo.findByRoleId(roleId);
      return claims.filter((c) => c.claimType === "permission");
    } finally {
      await this.client.close();
    }
  }
}

module.exports = RoleService;
