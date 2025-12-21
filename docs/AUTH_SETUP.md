# Hướng dẫn Setup Hệ thống Auth Identity

## Tổng quan

Hệ thống Auth được xây dựng theo mô hình ASP.NET Core Identity với các tính năng:

- **Users**: Quản lý người dùng
- **Roles**: Quản lý vai trò (admin, moderator, teacher, user)
- **UserRoles**: Quan hệ nhiều-nhiều giữa user và role
- **Claims**: Quản lý quyền chi tiết (permissions)
- **RoleClaims**: Quyền gắn với role
- **UserClaims**: Quyền gắn trực tiếp với user

## Cài đặt ban đầu

### 1. Cài đặt dependencies

```bash
npm install
```

### 2. Cấu hình MongoDB

Tạo file `.env` tại thư mục gốc:

```env
MONGODB_URI=mongodb://127.0.0.1:27017
MONGODB_DB=onthitracnghiem
JWT_SECRET=your_super_secret_jwt_key_change_in_production
JWT_EXPIRES_IN=7d
```

**Lưu ý**: Nhớ đổi `JWT_SECRET` trong production!

### 3. Khởi tạo dữ liệu Identity

Chạy script seed để tạo roles, claims và tài khoản admin:

```bash
npm run seed:identity
```

Script sẽ tự động tạo:

- **4 Roles**: admin, moderator, teacher, user
- **Role Claims**: Quyền cho từng role
- **Tài khoản admin**: 
  - Username: `admin`
  - Password: `Admin@123456`
  - Email: `admin@quizweb.com`

### 4. Khởi động server

```bash
npm start
```

Server chạy tại: http://localhost:3000

## Đăng nhập Admin

1. Truy cập: http://localhost:3000/auth/login
2. Nhập thông tin:
   - **Username**: `admin`
   - **Password**: `Admin@123456`
3. **Quan trọng**: Đổi mật khẩu ngay sau khi đăng nhập lần đầu!

## Cấu trúc Roles & Permissions

### Admin
- Toàn quyền quản lý hệ thống
- Permissions:
  - `users.read`, `users.write`, `users.delete`
  - `roles.read`, `roles.write`, `roles.delete`
  - `subjects.read`, `subjects.write`, `subjects.delete`
  - `questions.read`, `questions.write`, `questions.delete`
  - `exams.read`, `exams.write`, `exams.delete`
  - `comments.moderate`
  - `system.config`

### Moderator
- Quản lý nội dung và câu hỏi
- Permissions:
  - `subjects.read`
  - `questions.read`, `questions.write`, `questions.delete`
  - `comments.moderate`
  - `users.read`

### Teacher
- Tạo và quản lý bài thi, câu hỏi
- Permissions:
  - `subjects.read`, `subjects.write`
  - `questions.read`, `questions.write`
  - `exams.read`, `exams.write`

### User
- Người dùng thông thường
- Permissions:
  - `subjects.read`
  - `exams.read`, `exams.take`
  - `comments.write`

## Sử dụng trong Code

### Middleware Authentication

```javascript
const { requireAuth, requireAdmin, requireRole, requirePermission } = require("./apps/Util/VerifyToken");

// Yêu cầu đăng nhập
router.get("/profile", requireAuth, (req, res) => {
  // req.user chứa thông tin user
});

// Yêu cầu role admin
router.get("/admin/dashboard", requireAuth, requireAdmin, (req, res) => {
  // Chỉ admin truy cập được
});

// Yêu cầu một trong các roles
router.get("/manage", requireAuth, requireRole("admin", "moderator"), (req, res) => {
  // Admin hoặc moderator truy cập được
});

// Yêu cầu permission cụ thể
router.post("/questions", requireAuth, requirePermission("questions.write"), (req, res) => {
  // Chỉ user có permission questions.write mới được tạo câu hỏi
});
```

### Helper Functions

```javascript
const { hasRole, hasPermission } = require("./apps/Util/VerifyToken");

// Trong EJS template
<% if (hasRole(user, 'admin')) { %>
  <a href="/admin">Admin Panel</a>
<% } %>

// Trong controller
if (hasPermission(req.user, "questions.delete")) {
  // Cho phép xóa
}
```

### JWT Token Payload

Token chứa các thông tin:

```json
{
  "userId": "507f1f77bcf86cd799439011",
  "username": "admin",
  "role": "admin",
  "roles": ["admin"],
  "permissions": ["users.read", "users.write", ...]
}
```

## API Endpoints

### Authentication

- `GET /auth/login` - Trang đăng nhập
- `POST /auth/login` - Xử lý đăng nhập
- `GET /auth/register` - Trang đăng ký
- `POST /auth/register` - Xử lý đăng ký
- `GET /auth/logout` - Đăng xuất

### Validation Rules

#### Register
- **username**: 
  - Bắt buộc, 3-50 ký tự
  - Chỉ chữ, số và dấu gạch dưới
- **email**: 
  - Bắt buộc, định dạng email hợp lệ
- **password**: 
  - Bắt buộc, 6-100 ký tự
  - Ít nhất 1 chữ hoa, 1 chữ thường, 1 số

#### Login
- **username**: Bắt buộc
- **password**: Bắt buộc

## Database Collections

### users
```javascript
{
  _id: ObjectId,
  username: String (unique),
  normalizedUserName: String (uppercase),
  email: String (unique),
  normalizedEmail: String (uppercase),
  passwordHash: String (bcrypt),
  fullName: String,
  trangThai: "active" | "blocked" | "inactive",
  // ... other fields
}
```

### roles
```javascript
{
  _id: ObjectId,
  name: String (unique),
  normalizedName: String (uppercase),
  description: String,
}
```

### userRoles
```javascript
{
  _id: ObjectId,
  userId: ObjectId,
  roleId: ObjectId,
}
```

### roleClaims
```javascript
{
  _id: ObjectId,
  roleId: ObjectId,
  claimType: String (e.g., "permission"),
  claimValue: String (e.g., "users.write"),
}
```

### userClaims
```javascript
{
  _id: ObjectId,
  userId: ObjectId,
  claimType: String,
  claimValue: String,
}
```

## Troubleshooting

### Lỗi kết nối MongoDB
- Kiểm tra MongoDB đã chạy: `mongosh`
- Kiểm tra connection string trong `.env` hoặc `Config/Setting.json`

### Lỗi JWT invalid
- Kiểm tra `JWT_SECRET` khớp nhau
- Xóa cookie và đăng nhập lại

### Không thể đăng ký user mới
- Kiểm tra username/email đã tồn tại
- Kiểm tra validation password (phải có chữ hoa, thường, số)

### Permission denied
- Kiểm tra role và permissions của user
- Chạy lại `npm run seed:identity` để khôi phục claims

## Best Practices

1. **Luôn đổi mật khẩu admin mặc định** sau khi setup
2. **Sử dụng biến môi trường** (.env) cho thông tin nhạy cảm
3. **Kiểm tra permissions** thay vì chỉ kiểm tra roles cho authorization chi tiết
4. **Log các hành động quan trọng** (login, thay đổi role, etc.)
5. **Implement rate limiting** cho login endpoint để tránh brute force

## Next Steps

- [ ] Implement password reset functionality
- [ ] Add 2FA (Two-Factor Authentication)
- [ ] Add OAuth login (Google, Facebook)
- [ ] Add user profile management
- [ ] Add audit log cho các hành động admin
- [ ] Implement refresh token

## Tài liệu liên quan

- [US-10: Auth Identity Core](./user-stories/US-10-AUTH-IDENTITY-CORE.md)
- [US-11: Auth Middleware Guards](./user-stories/US-11-AUTH-MIDDLEWARE-GUARDS.md)
- [US-12: Admin Roles](./user-stories/US-12-ADMIN-ROLES.md)
- [US-13: Admin Users](./user-stories/US-13-ADMIN-USERS.md)
- [DATA_MODEL.md](./DATA_MODEL.md)

