var DatabaseConnection = require(global.__basedir + "/apps/Database/Database");
var UserRepository = require(global.__basedir + "/apps/Repository/UserRepository");
var RoleRepository = require(global.__basedir + "/apps/Repository/RoleRepository");
var UserRoleRepository = require(global.__basedir + "/apps/Repository/UserRoleRepository");
var UserClaimRepository = require(global.__basedir + "/apps/Repository/UserClaimRepository");

class UserService {
  constructor() {
    this.client = DatabaseConnection.getMongoClient();
    this.db = this.client.db(DatabaseConnection.getDatabaseName());
    this.userRepo = new UserRepository(this.db);
    this.roleRepo = new RoleRepository(this.db);
    this.userRoleRepo = new UserRoleRepository(this.db);
    this.userClaimRepo = new UserClaimRepository(this.db);
  }

  /**
   * Lấy danh sách users với filter và search
   */
  async getUsers(filters = {}) {
    await this.client.connect();
    try {
      let query = {};

      // Filter theo trangThai
      if (filters.trangThai && filters.trangThai !== "all") {
        query.trangThai = filters.trangThai;
      }

      // Search theo username hoặc email
      if (filters.search && filters.search.trim()) {
        const searchTerm = filters.search.trim();
        const searchRegex = { $regex: searchTerm, $options: "i" };
        query.$or = [
          { username: searchRegex },
          { normalizedUserName: { $regex: searchTerm.toUpperCase(), $options: "i" } },
          { email: searchRegex },
          { normalizedEmail: { $regex: searchTerm.toUpperCase(), $options: "i" } },
          { fullName: searchRegex },
        ];
      }

      const users = await this.userRepo.collection().find(query).sort({ createdAt: -1 }).toArray();

      // Lấy roles cho mỗi user
      const usersWithRoles = await Promise.all(
        users.map(async (user) => {
          const userRoles = await this.userRoleRepo.findByUserId(user._id);
          const roleIds = userRoles.map((ur) => ur.roleId);
          const roles = [];
          for (const roleId of roleIds) {
            const role = await this.roleRepo.findById(roleId);
            if (role) roles.push(role);
          }
          return {
            ...user,
            roles: roles,
          };
        })
      );

      return usersWithRoles;
    } finally {
      await this.client.close();
    }
  }

  /**
   * Lấy user theo ID kèm roles và claims
   */
  async getUserById(id) {
    await this.client.connect();
    try {
      const user = await this.userRepo.findById(id);
      if (!user) return null;

      // Lấy roles
      const userRoles = await this.userRoleRepo.findByUserId(id);
      const roleIds = userRoles.map((ur) => ur.roleId);
      const roles = [];
      for (const roleId of roleIds) {
        const role = await this.roleRepo.findById(roleId);
        if (role) roles.push(role);
      }

      // Lấy claims
      const claims = await this.userClaimRepo.findByUserId(id);

      return {
        ...user,
        roles: roles,
        claims: claims,
      };
    } finally {
      await this.client.close();
    }
  }

  /**
   * Block user (đổi trangThai thành "blocked")
   */
  async blockUser(userId) {
    await this.client.connect();
    try {
      const user = await this.userRepo.findById(userId);
      if (!user) {
        return { ok: false, message: "Không tìm thấy user" };
      }

      // Không cho block chính mình (nếu cần check)
      // if (String(user._id) === String(currentUserId)) {
      //   return { ok: false, message: "Không thể block chính mình" };
      // }

      await this.userRepo.updateUser(userId, { trangThai: "blocked" });
      return { ok: true };
    } finally {
      await this.client.close();
    }
  }

  /**
   * Unblock user (đổi trangThai thành "active")
   */
  async unblockUser(userId) {
    await this.client.connect();
    try {
      const user = await this.userRepo.findById(userId);
      if (!user) {
        return { ok: false, message: "Không tìm thấy user" };
      }

      await this.userRepo.updateUser(userId, { trangThai: "active" });
      return { ok: true };
    } finally {
      await this.client.close();
    }
  }

  /**
   * Gán role cho user
   */
  async assignRoleToUser(userId, roleId) {
    await this.client.connect();
    try {
      const user = await this.userRepo.findById(userId);
      if (!user) {
        return { ok: false, message: "Không tìm thấy user" };
      }

      const role = await this.roleRepo.findById(roleId);
      if (!role) {
        return { ok: false, message: "Không tìm thấy role" };
      }

      // Kiểm tra đã có role này chưa
      const existing = await this.userRoleRepo.findByUserAndRole(userId, roleId);
      if (existing) {
        return { ok: false, message: "User đã có role này" };
      }

      await this.userRoleRepo.insertUserRole({ userId, roleId });
      return { ok: true };
    } finally {
      await this.client.close();
    }
  }

  /**
   * Bỏ role khỏi user
   */
  async removeRoleFromUser(userId, roleId) {
    await this.client.connect();
    try {
      const user = await this.userRepo.findById(userId);
      if (!user) {
        return { ok: false, message: "Không tìm thấy user" };
      }

      // Không cho bỏ role admin nếu chỉ có 1 admin (tùy chọn - có thể bỏ qua)
      // const userRoles = await this.userRoleRepo.findByUserId(userId);
      // const adminRole = await this.roleRepo.findByNormalizedName("ADMIN");
      // if (adminRole && String(roleId) === String(adminRole._id) && userRoles.length === 1) {
      //   return { ok: false, message: "Không thể bỏ role admin cuối cùng" };
      // }

      await this.userRoleRepo.deleteUserRole(userId, roleId);
      return { ok: true };
    } finally {
      await this.client.close();
    }
  }

  /**
   * Lấy tất cả roles có sẵn
   */
  async getAllRoles() {
    await this.client.connect();
    try {
      return await this.roleRepo.getAllRoles();
    } finally {
      await this.client.close();
    }
  }
}

module.exports = UserService;

