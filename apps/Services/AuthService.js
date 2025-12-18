var bcrypt = require("bcrypt");
var jwt = require("jsonwebtoken");
var crypto = require("crypto");

var DatabaseConnection = require(global.__basedir + "/apps/Database/Database");
var config = require(global.__basedir + "/Config/Setting.json");
var UserRepository = require(global.__basedir + "/apps/Repository/UserRepository");
var RoleRepository = require(global.__basedir + "/apps/Repository/RoleRepository");
var UserRoleRepository = require(global.__basedir + "/apps/Repository/UserRoleRepository");

// Ưu tiên lấy JWT secret từ biến môi trường
const JWT_SECRET = process.env.JWT_SECRET || config.auth.jwtSecret;
const JWT_EXPIRES_IN =
  process.env.JWT_EXPIRES_IN || config.auth.jwtExpiresIn || "7d";

class AuthService {
  constructor() {
    this.client = DatabaseConnection.getMongoClient();
    this.db = this.client.db(DatabaseConnection.getDatabaseName());
    this.userRepo = new UserRepository(this.db);
    this.roleRepo = new RoleRepository(this.db);
    this.userRoleRepo = new UserRoleRepository(this.db);
  }

  /**
   * Tạo hoặc lấy role "user" mặc định
   */
  async ensureDefaultRole() {
    let defaultRole = await this.roleRepo.findByNormalizedName("USER");
    if (!defaultRole) {
      const roleDoc = {
        name: "user",
        normalizedName: "USER",
        description: "Người dùng thông thường",
        concurrencyStamp: crypto.randomBytes(16).toString("hex"),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const result = await this.roleRepo.insertRole(roleDoc);
      defaultRole = { ...roleDoc, _id: result.insertedId };
    }
    return defaultRole;
  }

  /**
   * Lấy tất cả roles của user (many-to-many)
   */
  async getUserRoles(userId) {
    const userRoles = await this.userRoleRepo.findByUserId(userId);
    if (userRoles.length === 0) return [];

    const roleIds = userRoles.map((ur) => ur.roleId);
    const roles = [];
    for (const roleId of roleIds) {
      const role = await this.roleRepo.findById(roleId);
      if (role) roles.push(role);
    }
    return roles;
  }

  async register(username, email, password) {
    await this.client.connect();
    try {
      const exists = await this.userRepo.findByUsernameOrEmail(username, email);
      if (exists) return { ok: false, message: "Username hoặc email đã tồn tại" };

      const passwordHash = await bcrypt.hash(password, 10);
      const normalizedUserName = username.toUpperCase();
      const normalizedEmail = email.toUpperCase();

      // Tạo user mới
      const userDoc = {
        username,
        normalizedUserName,
        email,
        normalizedEmail,
        passwordHash,
        fullName: "",
        address: "",
        dateOfBirth: null,
        profilePicture: "",
        ngayTao: new Date(),
        tichDiem: 0,
        trangThai: "active",
        concurrencyStamp: crypto.randomBytes(16).toString("hex"),
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLoginAt: null,
      };

      const userResult = await this.userRepo.insertUser(userDoc);
      const userId = userResult.insertedId;

      // Đảm bảo role "user" tồn tại và gán cho user mới
      const defaultRole = await this.ensureDefaultRole();
      await this.userRoleRepo.insertUserRole({
        userId: userId,
        roleId: defaultRole._id,
      });

      return { ok: true };
    } finally {
      await this.client.close();
    }
  }

  async login(username, password) {
    await this.client.connect();
    try {
      const user = await this.userRepo.findByUsername(username);
      if (!user) return { ok: false, message: "Sai tài khoản hoặc mật khẩu" };
      if (user.trangThai === "blocked" || user.trangThai === "inactive") {
        return { ok: false, message: "Tài khoản bị khoá hoặc không hoạt động" };
      }

      const match = await bcrypt.compare(password, user.passwordHash);
      if (!match) return { ok: false, message: "Sai tài khoản hoặc mật khẩu" };

      await this.userRepo.updateLastLogin(user._id);

      // Lấy roles của user (many-to-many)
      const roles = await this.getUserRoles(user._id);
      const roleNames = roles.map((r) => r.name);
      // Nếu không có role nào, mặc định là "user" (backward compatible)
      const primaryRole = roleNames.length > 0 ? roleNames[0] : "user";

      // Tạo JWT với thông tin user và roles
      const token = jwt.sign(
        {
          userId: String(user._id),
          username: user.username,
          role: primaryRole, // Role chính để backward compatible
          roles: roleNames, // Tất cả roles để dùng sau này
        },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
      );
      return { ok: true, token, user: { id: String(user._id), username: user.username, roles: roleNames } };
    } finally {
      await this.client.close();
    }
  }
}

module.exports = AuthService;



