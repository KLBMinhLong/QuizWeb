# Permissions Guide - Hướng dẫn Phân quyền

Tài liệu này mô tả chi tiết hệ thống phân quyền dựa trên **Roles** và **Claims (Permissions)**.

---

## 1. Tổng quan

Hệ thống sử dụng mô hình **Role-Based Access Control (RBAC)** kết hợp **Claims-Based Authorization**:

- **Roles**: Vai trò của user (admin, moderator, teacher, user)
- **Claims/Permissions**: Quyền chi tiết (users.read, subjects.write, ...)
- **UserRoles**: Quan hệ many-to-many giữa users và roles
- **RoleClaims**: Permissions gắn với role
- **UserClaims**: Permissions gắn trực tiếp với user (override)

---

## 2. Permissions có sẵn (25 permissions)

### 2.1 Users Management
- `users.read` - Xem danh sách users
- `users.write` - Tạo/sửa users, block/unblock, gán roles
- `users.delete` - Xóa users

### 2.2 Roles Management
- `roles.read` - Xem danh sách roles
- `roles.write` - Tạo/sửa roles, quản lý permissions
- `roles.delete` - Xóa roles

### 2.3 Subjects Management
- `subjects.read` - Xem danh sách môn học
- `subjects.write` - Tạo/sửa môn học, cập nhật examConfig
- `subjects.delete` - Xóa môn học

### 2.4 Questions Management
- `questions.read` - Xem danh sách câu hỏi
- `questions.write` - Tạo/sửa câu hỏi, import
- `questions.delete` - Xóa câu hỏi

### 2.5 Exams Management
- `exams.read` - Xem bài thi, lịch sử thi
- `exams.write` - Tạo/sửa bài thi
- `exams.delete` - Xóa bài thi
- `exams.take` - Làm bài thi

### 2.6 Comments Management
- `comments.write` - Viết bình luận
- `comments.moderate` - Kiểm duyệt bình luận (xóa/ẩn)

### 2.7 System
- `system.config` - Cấu hình hệ thống

---

## 3. Roles và Permissions mặc định

### 3.1 Admin
**Permissions**: Tất cả (17 permissions)
- `users.*`, `roles.*`, `subjects.*`, `questions.*`, `exams.*`, `comments.moderate`, `system.config`

**Quyền hạn**:
- Toàn quyền quản lý hệ thống
- Quản lý users, roles, subjects, questions
- Xem và làm bài thi
- Kiểm duyệt comments
- Cấu hình hệ thống

### 3.2 Moderator
**Permissions**: 6 permissions
- `subjects.read`, `questions.read`, `questions.write`, `questions.delete`, `comments.moderate`, `users.read`

**Quyền hạn**:
- Xem danh sách môn học
- Quản lý câu hỏi (CRUD)
- Kiểm duyệt comments
- Xem danh sách users

### 3.3 Teacher
**Permissions**: 6 permissions
- `subjects.read`, `subjects.write`, `questions.read`, `questions.write`, `exams.read`, `exams.write`

**Quyền hạn**:
- Xem và quản lý môn học (không xóa)
- Xem và tạo/sửa câu hỏi (không xóa)
- Xem và tạo bài thi
- Làm bài thi

### 3.4 User
**Permissions**: 4 permissions
- `subjects.read`, `exams.read`, `exams.take`, `comments.write`

**Quyền hạn**:
- Xem danh sách môn học
- Xem và làm bài thi
- Viết bình luận

---

## 4. Sử dụng trong Code

### 4.1 Middleware Protection

#### requireAdmin (hiện tại)
```javascript
// Bảo vệ tất cả admin routes
router.use(requireAuth);
router.use(requireAdmin);
```

#### requirePermission (nâng cấp - tùy chọn)
```javascript
// Bảo vệ route với permission cụ thể
router.get("/users", requireAuth, requirePermission("users.read"), handler);
router.post("/users", requireAuth, requirePermission("users.write"), handler);
router.delete("/users/:id", requireAuth, requirePermission("users.delete"), handler);
```

### 4.2 Helper Functions

```javascript
const { hasPermission, hasRole } = require("./apps/Util/VerifyToken");

// Trong controller
if (hasPermission(req.user, "users.write")) {
  // Cho phép tạo/sửa user
}

// Trong EJS
<% if (hasPermission(user, 'questions.write')) { %>
  <a href="/admin/questions/create">Tạo câu hỏi</a>
<% } %>
```

---

## 5. Mapping Routes → Permissions

### Admin Routes

| Route | Permission | Roles có quyền |
|-------|-----------|----------------|
| `GET /admin/users` | `users.read` | Admin, Moderator |
| `POST /admin/users/:id/block` | `users.write` | Admin |
| `POST /admin/users/:id/roles/add` | `users.write` | Admin |
| `GET /admin/roles` | `roles.read` | Admin |
| `POST /admin/roles/create` | `roles.write` | Admin |
| `POST /admin/roles/:id/delete` | `roles.delete` | Admin |
| `GET /admin/subjects` | `subjects.read` | Admin, Moderator, Teacher |
| `POST /admin/subjects/create` | `subjects.write` | Admin, Teacher |
| `POST /admin/subjects/:id/delete` | `subjects.delete` | Admin |
| `GET /admin/questions` | `questions.read` | Admin, Moderator, Teacher |
| `POST /admin/questions/create` | `questions.write` | Admin, Moderator, Teacher |
| `POST /admin/questions/:id/delete` | `questions.delete` | Admin, Moderator |
| `POST /admin/questions/import` | `questions.write` | Admin, Moderator, Teacher |

### Public Routes

| Route | Permission | Roles có quyền |
|-------|-----------|----------------|
| `GET /subjects` | `subjects.read` | Tất cả (nếu cho phép guest) |
| `GET /subjects/:slug` | `subjects.read` | Tất cả (nếu cho phép guest) |
| `POST /subjects/:slug/comments` | `comments.write` | User, Teacher |
| `POST /subjects/:slug/comments/:id/delete` | `comments.moderate` | Admin, Moderator |
| `GET /exam/start/:slug` | `exams.read` | Tất cả (nếu cho phép guest) |
| `POST /exam/generate` | `exams.read` hoặc `exams.take` | Tất cả (nếu cho phép guest) |
| `POST /exam/submit` | `exams.take` | Tất cả (nếu cho phép guest) |
| `GET /exam/history` | `exams.read` | User, Teacher, Moderator, Admin |
| `GET /exam/attempt/:id` | `exams.read` | User (chỉ của mình), Admin/Moderator (tất cả) |

---

## 6. Best Practices

### 6.1 Principle of Least Privilege
- Chỉ gán permissions cần thiết cho từng role
- User thông thường chỉ có quyền xem và làm bài
- Teacher có thể quản lý subjects/questions nhưng không xóa
- Moderator quản lý questions và comments nhưng không quản lý users/roles

### 6.2 Permission Hierarchy
- `read` < `write` < `delete`
- Nếu có `write` thường cần có `read`
- Nếu có `delete` thường cần có `read` và `write`

### 6.3 Security Considerations
- Luôn validate permission ở server-side
- Không tin client về permissions
- JWT token chứa permissions để check nhanh
- Refresh token khi permissions thay đổi

---

## 7. Nâng cấp tương lai

### 7.1 Fine-grained Control
Thay vì chỉ dùng `requireAdmin`, có thể nâng cấp để dùng `requirePermission`:

```javascript
// Thay vì
router.use(requireAdmin);

// Có thể dùng
router.get("/", requireAuth, requirePermission("users.read"), handler);
router.post("/", requireAuth, requirePermission("users.write"), handler);
```

### 7.2 UI Permissions
Ẩn/hiện UI elements dựa trên permissions:

```ejs
<% if (hasPermission(user, 'questions.write')) { %>
  <button>Tạo câu hỏi</button>
<% } %>

<% if (hasPermission(user, 'questions.delete')) { %>
  <button>Xóa</button>
<% } %>
```

### 7.3 Dynamic Permissions
- Cho phép admin gán permissions trực tiếp cho user (UserClaims)
- Override permissions từ role
- Temporary permissions (có thời hạn)

---

## 8. Testing Permissions

### Test Cases
1. **Admin**: Có tất cả permissions → Truy cập được tất cả routes
2. **Moderator**: Chỉ có permissions cụ thể → Chỉ truy cập được routes tương ứng
3. **Teacher**: Chỉ có permissions cụ thể → Chỉ truy cập được routes tương ứng
4. **User**: Chỉ có permissions cơ bản → Chỉ truy cập được public routes
5. **Guest**: Không có permissions → Chỉ xem được public content

### Test Scenarios
- User không có permission → 403 Forbidden
- User có permission → Truy cập được
- Permission thay đổi → Cần refresh token để có hiệu lực

---

## 9. Troubleshooting

### Vấn đề thường gặp

1. **User không truy cập được route mặc dù có role**
   - Kiểm tra role có permissions chưa
   - Kiểm tra JWT token có chứa permissions
   - Refresh token sau khi thay đổi permissions

2. **Permission không hoạt động**
   - Kiểm tra middleware đã apply chưa
   - Kiểm tra permission name đúng chưa
   - Kiểm tra role có permission đó chưa

3. **UI vẫn hiển thị button mặc dù không có permission**
   - Kiểm tra EJS template có dùng `hasPermission()` chưa
   - Kiểm tra `user` object có được truyền vào view chưa

---

## 10. Tài liệu tham khảo

- `docs/user-stories/US-10-AUTH-IDENTITY-CORE.md` - Auth Identity Core
- `docs/user-stories/US-11-AUTH-MIDDLEWARE-GUARDS.md` - Middleware Guards
- `docs/user-stories/US-12-ADMIN-ROLES.md` - Admin Roles
- `docs/user-stories/US-13-ADMIN-USERS.md` - Admin Users
- `scripts/seedIdentity.js` - Seed data với roles và permissions

---

**Last Updated**: 21/12/2025

