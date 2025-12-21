/**
 * Seed Identity Data
 * Tạo roles, claims và tài khoản admin mặc định cho hệ thống
 */

require("dotenv").config();
global.__basedir = require("path").resolve(__dirname, "..");

const bcrypt = require("bcrypt");
const crypto = require("crypto");
const DatabaseConnection = require(global.__basedir + "/apps/Database/Database");

// Định nghĩa các roles cơ bản
const ROLES = [
  {
    name: "admin",
    normalizedName: "ADMIN",
    description: "Quản trị viên - có toàn quyền quản lý hệ thống",
  },
  {
    name: "moderator",
    normalizedName: "MODERATOR",
    description: "Người kiểm duyệt - quản lý nội dung và câu hỏi",
  },
  {
    name: "teacher",
    normalizedName: "TEACHER",
    description: "Giáo viên - tạo và quản lý bài thi, câu hỏi",
  },
  {
    name: "user",
    normalizedName: "USER",
    description: "Người dùng thông thường - làm bài thi",
  },
];

// Định nghĩa các claims theo role
const ROLE_CLAIMS = {
  admin: [
    { claimType: "permission", claimValue: "users.read" },
    { claimType: "permission", claimValue: "users.write" },
    { claimType: "permission", claimValue: "users.delete" },
    { claimType: "permission", claimValue: "roles.read" },
    { claimType: "permission", claimValue: "roles.write" },
    { claimType: "permission", claimValue: "roles.delete" },
    { claimType: "permission", claimValue: "subjects.read" },
    { claimType: "permission", claimValue: "subjects.write" },
    { claimType: "permission", claimValue: "subjects.delete" },
    { claimType: "permission", claimValue: "questions.read" },
    { claimType: "permission", claimValue: "questions.write" },
    { claimType: "permission", claimValue: "questions.delete" },
    { claimType: "permission", claimValue: "exams.read" },
    { claimType: "permission", claimValue: "exams.write" },
    { claimType: "permission", claimValue: "exams.delete" },
    { claimType: "permission", claimValue: "comments.moderate" },
    { claimType: "permission", claimValue: "system.config" },
  ],
  moderator: [
    { claimType: "permission", claimValue: "subjects.read" },
    { claimType: "permission", claimValue: "questions.read" },
    { claimType: "permission", claimValue: "questions.write" },
    { claimType: "permission", claimValue: "questions.delete" },
    { claimType: "permission", claimValue: "comments.moderate" },
    { claimType: "permission", claimValue: "users.read" },
  ],
  teacher: [
    { claimType: "permission", claimValue: "subjects.read" },
    { claimType: "permission", claimValue: "subjects.write" },
    { claimType: "permission", claimValue: "questions.read" },
    { claimType: "permission", claimValue: "questions.write" },
    { claimType: "permission", claimValue: "exams.read" },
    { claimType: "permission", claimValue: "exams.write" },
  ],
  user: [
    { claimType: "permission", claimValue: "subjects.read" },
    { claimType: "permission", claimValue: "exams.read" },
    { claimType: "permission", claimValue: "exams.take" },
    { claimType: "permission", claimValue: "comments.write" },
  ],
};

// Tài khoản admin mặc định
const ADMIN_USER = {
  username: "admin",
  email: "admin@quizweb.com",
  password: "Admin@123456", // Nên đổi sau khi đăng nhập lần đầu
  fullName: "Administrator",
};

async function seedIdentity() {
  const client = DatabaseConnection.getMongoClient();
  
  try {
    await client.connect();
    console.log("✓ Đã kết nối MongoDB");
    
    const db = client.db(DatabaseConnection.getDatabaseName());
    const rolesCol = db.collection("roles");
    const roleClaimsCol = db.collection("roleClaims");
    const usersCol = db.collection("users");
    const userRolesCol = db.collection("userRoles");
    
    // 1. Tạo roles
    console.log("\n📋 Đang tạo roles...");
    const roleMap = {}; // Lưu mapping name -> _id
    
    for (const roleData of ROLES) {
      const existing = await rolesCol.findOne({ normalizedName: roleData.normalizedName });
      
      if (existing) {
        console.log(`  ⚠ Role "${roleData.name}" đã tồn tại`);
        roleMap[roleData.name] = existing._id;
      } else {
        const role = {
          ...roleData,
          concurrencyStamp: crypto.randomBytes(16).toString("hex"),
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        const result = await rolesCol.insertOne(role);
        roleMap[roleData.name] = result.insertedId;
        console.log(`  ✓ Đã tạo role "${roleData.name}"`);
      }
    }
    
    // 2. Tạo role claims
    console.log("\n🔐 Đang tạo role claims...");
    
    for (const [roleName, claims] of Object.entries(ROLE_CLAIMS)) {
      const roleId = roleMap[roleName];
      if (!roleId) {
        console.log(`  ⚠ Không tìm thấy role "${roleName}"`);
        continue;
      }
      
      // Xóa claims cũ của role này
      await roleClaimsCol.deleteMany({ roleId });
      
      // Thêm claims mới
      for (const claim of claims) {
        await roleClaimsCol.insertOne({
          roleId,
          claimType: claim.claimType,
          claimValue: claim.claimValue,
          createdAt: new Date(),
        });
      }
      
      console.log(`  ✓ Đã tạo ${claims.length} claims cho role "${roleName}"`);
    }
    
    // 3. Tạo tài khoản admin
    console.log("\n👤 Đang tạo tài khoản admin...");
    
    const existingAdmin = await usersCol.findOne({
      normalizedUserName: ADMIN_USER.username.toUpperCase(),
    });
    
    if (existingAdmin) {
      console.log(`  ⚠ Tài khoản admin "${ADMIN_USER.username}" đã tồn tại`);
      console.log(`     ID: ${existingAdmin._id}`);
    } else {
      const passwordHash = await bcrypt.hash(ADMIN_USER.password, 10);
      
      const adminUser = {
        username: ADMIN_USER.username,
        normalizedUserName: ADMIN_USER.username.toUpperCase(),
        email: ADMIN_USER.email,
        normalizedEmail: ADMIN_USER.email.toUpperCase(),
        passwordHash,
        fullName: ADMIN_USER.fullName,
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
      
      const result = await usersCol.insertOne(adminUser);
      const adminUserId = result.insertedId;
      
      console.log(`  ✓ Đã tạo tài khoản admin`);
      console.log(`     Username: ${ADMIN_USER.username}`);
      console.log(`     Password: ${ADMIN_USER.password}`);
      console.log(`     Email: ${ADMIN_USER.email}`);
      console.log(`     ID: ${adminUserId}`);
      
      // Gán role admin
      const adminRoleId = roleMap["admin"];
      if (adminRoleId) {
        await userRolesCol.insertOne({
          userId: adminUserId,
          roleId: adminRoleId,
          createdAt: new Date(),
        });
        console.log(`  ✓ Đã gán role "admin" cho tài khoản`);
      }
    }
    
    // 4. Tạo indexes
    console.log("\n📊 Đang tạo indexes...");
    
    // Users indexes
    await usersCol.createIndex({ normalizedUserName: 1 }, { unique: true });
    await usersCol.createIndex({ normalizedEmail: 1 }, { unique: true });
    await usersCol.createIndex({ username: 1 });
    await usersCol.createIndex({ email: 1 });
    console.log("  ✓ Đã tạo indexes cho collection users");
    
    // Roles indexes
    await rolesCol.createIndex({ normalizedName: 1 }, { unique: true });
    await rolesCol.createIndex({ name: 1 });
    console.log("  ✓ Đã tạo indexes cho collection roles");
    
    // UserRoles indexes
    await userRolesCol.createIndex({ userId: 1 });
    await userRolesCol.createIndex({ roleId: 1 });
    await userRolesCol.createIndex({ userId: 1, roleId: 1 }, { unique: true });
    console.log("  ✓ Đã tạo indexes cho collection userRoles");
    
    // RoleClaims indexes
    await roleClaimsCol.createIndex({ roleId: 1 });
    await roleClaimsCol.createIndex({ claimType: 1, claimValue: 1 });
    console.log("  ✓ Đã tạo indexes cho collection roleClaims");
    
    console.log("\n✅ Hoàn thành seed Identity data!");
    console.log("\n📝 Thông tin đăng nhập admin:");
    console.log(`   URL: http://localhost:3000/auth/login`);
    console.log(`   Username: ${ADMIN_USER.username}`);
    console.log(`   Password: ${ADMIN_USER.password}`);
    console.log(`   ⚠️  Nên đổi mật khẩu sau khi đăng nhập lần đầu!`);
    
  } catch (error) {
    console.error("❌ Lỗi khi seed data:", error);
    process.exit(1);
  } finally {
    await client.close();
    console.log("\n✓ Đã đóng kết nối MongoDB");
  }
}

// Chạy script
if (require.main === module) {
  seedIdentity()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}

module.exports = seedIdentity;

