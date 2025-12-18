# US-01 - Auth (Register / Login / Logout / Role)

## 1. Actors

- Guest
- User
- Admin

## 2. Mục tiêu

- Guest đăng ký/đăng nhập để trở thành User
- Admin đăng nhập để vào khu vực quản trị
- Bảo vệ route admin bằng role
- Hệ thống quản lý user theo cấu trúc ASP.NET Identity (many-to-many roles, claims, tokens)

## 3. UI Pages (EJS)

- `apps/views/auth/register.ejs`
- `apps/views/auth/login.ejs`

## 4. Routes (Controller)

- `GET /auth/register` → render form
- `POST /auth/register` → tạo user
- `GET /auth/login` → render form
- `POST /auth/login` → set cookie token
- `GET /auth/logout` → clear cookie

Files:
- `apps/controllers/authcontroller.js`
- `apps/Services/AuthService.js`
- `apps/Repository/UserRepository.js`
- `apps/Util/VerifyToken.js` (middleware verify JWT)

## 5. Data / DB - Cấu trúc giống ASP.NET Identity

### 5.1 Collections

#### `users` (Collection chính)
- `_id` (ObjectId)
- `username` (string, unique)
- `normalizedUserName` (string, uppercase, để tìm kiếm)
- `email` (string, unique)
- `normalizedEmail` (string, uppercase)
- `passwordHash` (string, bcrypt)
- `fullName` (string)
- `address` (string)
- `dateOfBirth` (Date)
- `profilePicture` (string, path/URL)
- `ngayTao` (Date)
- `tichDiem` (number, tích điểm)
- `trangThai` (string: "active", "blocked", "inactive")
- `concurrencyStamp` (string, để optimistic concurrency)
- `createdAt` (Date)
- `updatedAt` (Date)
- `lastLoginAt` (Date)

#### `roles` (Collection roles)
- `_id` (ObjectId)
- `name` (string, unique, ví dụ: "user", "admin", "moderator")
- `normalizedName` (string, uppercase, để tìm kiếm)
- `description` (string)
- `concurrencyStamp` (string)
- `createdAt` (Date)
- `updatedAt` (Date)

#### `userRoles` (Junction table - many-to-many)
- `_id` (ObjectId)
- `userId` (ObjectId, FK → users)
- `roleId` (ObjectId, FK → roles)
- `createdAt` (Date)

#### `userClaims` (Claims của user)
- `_id` (ObjectId)
- `userId` (ObjectId, FK → users)
- `claimType` (string, ví dụ: "Permission", "CustomClaim")
- `claimValue` (string)
- `createdAt` (Date)

#### `roleClaims` (Claims của role)
- `_id` (ObjectId)
- `roleId` (ObjectId, FK → roles)
- `claimType` (string)
- `claimValue` (string)
- `createdAt` (Date)

#### `userLogins` (External logins - Google, Facebook, etc.)
- `_id` (ObjectId)
- `loginProvider` (string, ví dụ: "Google", "Facebook")
- `providerKey` (string, ID từ provider)
- `providerDisplayName` (string)
- `userId` (ObjectId, FK → users)
- `createdAt` (Date)

#### `userTokens` (Refresh tokens, password reset tokens, etc.)
- `_id` (ObjectId)
- `userId` (ObjectId, FK → users)
- `loginProvider` (string)
- `name` (string, ví dụ: "RefreshToken", "PasswordReset")
- `value` (string, token value)
- `expiresAt` (Date, optional)
- `createdAt` (Date)
- `updatedAt` (Date)

### 5.2 Rules

- `username` unique, `email` unique
- `normalizedUserName` và `normalizedEmail` tự động uppercase để tìm kiếm không phân biệt hoa thường
- Password lưu `passwordHash` (bcrypt, salt rounds = 10)
- User mới đăng ký tự động được gán role "user" (nếu role chưa tồn tại thì tự tạo)
- Roles là many-to-many: 1 user có thể có nhiều roles, 1 role có thể gán cho nhiều users
- Claims: user có thể có claims riêng, hoặc kế thừa từ roles

## 6. Main flows

### 6.1 Register

1. Guest mở `/auth/register`
2. Nhập `username`, `email`, `password`
3. Submit
4. Server validate:
   - username not empty
   - email hợp lệ
   - password >= 6
5. Server check trùng username/email (dùng normalizedUserName/normalizedEmail)
6. Hash password với bcrypt
7. Tạo user document với đầy đủ field (normalizedUserName, normalizedEmail, concurrencyStamp, etc.)
8. Đảm bảo role "user" tồn tại (nếu chưa có thì tạo)
9. Tạo UserRole để gán role "user" cho user mới
10. Redirect `/auth/login`

### 6.2 Login

1. Guest mở `/auth/login`
2. Nhập `username`, `password`
3. Server verify:
   - Tìm user theo username (dùng normalizedUserName để không phân biệt hoa thường)
   - Kiểm tra `trangThai` không phải "blocked" hoặc "inactive"
   - So sánh password với bcrypt
4. Lấy tất cả roles của user từ `userRoles` (many-to-many)
5. Tạo JWT với payload:
   ```json
   {
     "userId": "string",
     "username": "string",
     "role": "user",  // Role chính (backward compatible)
     "roles": ["user", "admin"]  // Tất cả roles
   }
   ```
6. Set cookie `token` (httpOnly)
7. Update `lastLoginAt`
8. Redirect `/`

### 6.3 Logout

1. User bấm logout
2. Server clear cookie `token`
3. (Tùy chọn: có thể invalidate token trong `userTokens` nếu dùng refresh token)
4. Redirect `/`

## 7. Middleware & Security

### 7.1 VerifyToken.js

File: `apps/Util/VerifyToken.js`

Các function:
- `verifyToken(token)` - Verify JWT token, trả về decoded payload hoặc null
- `requireAuth(req, res, next)` - Middleware bắt buộc đăng nhập
  - Đọc token từ cookie `token` hoặc header `Authorization: Bearer <token>`
  - Verify token, nếu hợp lệ gắn `req.user = { userId, username, role, roles }`
  - Nếu không hợp lệ → redirect `/auth/login`
- `requireAdmin(req, res, next)` - Middleware yêu cầu role admin
  - Phải dùng sau `requireAuth`
  - Kiểm tra `req.user.role === "admin"` hoặc `req.user.roles.includes("admin")`
  - Nếu không có quyền → 403 Forbidden
- `optionalAuth(req, res, next)` - Middleware optional, không bắt buộc đăng nhập
  - Nếu có token hợp lệ thì gắn `req.user`, nếu không thì tiếp tục

### 7.2 Sử dụng middleware

```javascript
// Bảo vệ route admin
router.get("/admin/dashboard", requireAuth, requireAdmin, (req, res) => {
  // req.user đã có sẵn
});

// Route cần đăng nhập
router.get("/profile", requireAuth, (req, res) => {
  // req.user đã có sẵn
});

// Route optional (có thể có hoặc không có user)
router.get("/", optionalAuth, (req, res) => {
  // req.user có thể undefined hoặc có giá trị
});
```

## 8. Acceptance criteria

- AC1: Không thể đăng ký nếu trùng username/email (so sánh không phân biệt hoa thường)
- AC2: Không thể đăng nhập nếu sai password
- AC3: User bị `trangThai=blocked` hoặc `trangThai=inactive` không đăng nhập được
- AC4: Cookie `token` được set và có thể đọc/verify ở middleware
- AC5: User mới đăng ký tự động được gán role "user"
- AC6: JWT token chứa đầy đủ thông tin: userId, username, role (chính), roles (tất cả)
- AC7: Middleware `requireAuth` và `requireAdmin` hoạt động đúng

## 9. Entity & Repository Structure

### 9.1 Entities

- `apps/Entity/User.js` - User entity với đầy đủ field giống ASP.NET Identity
- `apps/Entity/Role.js` - Role entity
- `apps/Entity/UserRole.js` - UserRole junction entity
- `apps/Entity/UserClaim.js` - UserClaim entity
- `apps/Entity/RoleClaim.js` - RoleClaim entity
- `apps/Entity/UserLogin.js` - UserLogin entity (external logins)
- `apps/Entity/UserToken.js` - UserToken entity (refresh tokens, etc.)

### 9.2 Repositories

- `apps/Repository/UserRepository.js` - CRUD users, tìm theo username/email (normalized)
- `apps/Repository/RoleRepository.js` - CRUD roles
- `apps/Repository/UserRoleRepository.js` - Quản lý many-to-many user-roles
- `apps/Repository/UserClaimRepository.js` - Quản lý user claims
- `apps/Repository/RoleClaimRepository.js` - Quản lý role claims
- `apps/Repository/UserLoginRepository.js` - Quản lý external logins
- `apps/Repository/UserTokenRepository.js` - Quản lý tokens (refresh, reset password, etc.)

## 10. Work items (cần làm tiếp)

- [x] Tạo cấu trúc Entity giống ASP.NET Identity
- [x] Tạo các Repository cho roles, claims, tokens
- [x] Cập nhật AuthService để dùng many-to-many roles
- [x] Tạo VerifyToken.js với các middleware
- [ ] Dùng middleware `requireAuth` và `requireAdmin` ở `/admin/*` routes
- [ ] Hiển thị trạng thái login ở header (ẩn/hiện link Login/Logout dựa vào `req.user`)
- [ ] Tạo trang quản lý roles (admin)
- [ ] Tạo trang quản lý user roles (admin)
- [ ] Implement external login (Google, Facebook) - dùng `userLogins`
- [ ] Implement refresh token - dùng `userTokens`
- [ ] Implement password reset - dùng `userTokens` với name="PasswordReset"



