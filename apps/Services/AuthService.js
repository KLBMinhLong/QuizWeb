var bcrypt = require("bcrypt");
var jwt = require("jsonwebtoken");

var DatabaseConnection = require(global.__basedir + "/apps/Database/Database");
var config = require(global.__basedir + "/Config/Setting.json");
var UserRepository = require(global.__basedir + "/apps/Repository/UserRepository");

class AuthService {
  constructor() {
    this.client = DatabaseConnection.getMongoClient();
    this.db = this.client.db(DatabaseConnection.getDatabaseName());
    this.userRepo = new UserRepository(this.db);
  }

  async register(username, email, password) {
    await this.client.connect();
    try {
      const exists = await this.userRepo.findByUsernameOrEmail(username, email);
      if (exists) return { ok: false, message: "Username hoặc email đã tồn tại" };

      const passwordHash = await bcrypt.hash(password, 10);
      await this.userRepo.insertUser({
        username,
        email,
        passwordHash,
        role: "user",
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date(),
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
      if (user.status === "blocked") return { ok: false, message: "Tài khoản bị khoá" };

      const match = await bcrypt.compare(password, user.passwordHash);
      if (!match) return { ok: false, message: "Sai tài khoản hoặc mật khẩu" };

      await this.userRepo.updateLastLogin(user._id);

      const token = jwt.sign(
        { userId: String(user._id), role: user.role, username: user.username },
        config.auth.jwtSecret,
        { expiresIn: config.auth.jwtExpiresIn || "7d" }
      );
      return { ok: true, token };
    } finally {
      await this.client.close();
    }
  }
}

module.exports = AuthService;



