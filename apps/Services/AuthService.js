var bcrypt = require("bcrypt");
var jwt = require("jsonwebtoken");
var crypto = require("crypto");

var DatabaseConnection = require(global.__basedir + "/apps/Database/Database");
var config = require(global.__basedir + "/Config/Setting.json");
var UserRepository = require(global.__basedir + "/apps/Repository/UserRepository");
var RoleRepository = require(global.__basedir + "/apps/Repository/RoleRepository");
var UserRoleRepository = require(global.__basedir + "/apps/Repository/UserRoleRepository");
var RoleClaimRepository = require(global.__basedir + "/apps/Repository/RoleClaimRepository");
var UserClaimRepository = require(global.__basedir + "/apps/Repository/UserClaimRepository");

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
    this.roleClaimRepo = new RoleClaimRepository(this.db);
    this.userClaimRepo = new UserClaimRepository(this.db);
  }

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

  async getUserClaims(userId) {
    const claims = [];
    const claimSet = new Set();

    const roles = await this.getUserRoles(userId);
    for (const role of roles) {
      const roleClaims = await this.roleClaimRepo.findByRoleId(role._id);
      for (const claim of roleClaims) {
        const key = `${claim.claimType}:${claim.claimValue}`;
        if (!claimSet.has(key)) {
          claimSet.add(key);
          claims.push({
            type: claim.claimType,
            value: claim.claimValue,
          });
        }
      }
    }

    const userClaims = await this.userClaimRepo.findByUserId(userId);
    for (const claim of userClaims) {
      const key = `${claim.claimType}:${claim.claimValue}`;
      if (!claimSet.has(key)) {
        claimSet.add(key);
        claims.push({
          type: claim.claimType,
          value: claim.claimValue,
        });
      }
    }

    return claims;
  }

  async getUserPermissions(userId) {
    const claims = await this.getUserClaims(userId);
    return claims
      .filter((c) => c.type === "permission")
      .map((c) => c.value);
  }

  async register(username, email, password) {
    await this.client.connect();
    try {
      const exists = await this.userRepo.findByUsernameOrEmail(username, email);
      if (exists) return { ok: false, message: "Username hoặc email đã tồn tại" };

      const passwordHash = await bcrypt.hash(password, 10);
      const normalizedUserName = username.toUpperCase();
      const normalizedEmail = email.toUpperCase();

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

      const roles = await this.getUserRoles(user._id);
      const roleNames = roles.map((r) => r.name);
      const primaryRole = roleNames.length > 0 ? roleNames[0] : "user";

      const permissions = await this.getUserPermissions(user._id);

      const token = jwt.sign(
        {
          userId: String(user._id),
          username: user.username,
          role: primaryRole,
          roles: roleNames,
          permissions,
        },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
      );
      return { 
        ok: true, 
        token 
      };
    } finally {
      await this.client.close();
    }
  }
}

module.exports = AuthService;
