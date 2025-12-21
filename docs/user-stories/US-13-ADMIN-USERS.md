# US-13 - Admin Users (List / Block / Assign Roles)

## 1. Actor

- Admin (hoặc user có permission `users.read`, `users.write`, `users.delete`)

## 2. Mục tiêu

- Admin xem danh sách users
- Admin block/unblock (đổi `trangThai`)
- Admin gán/bỏ role cho user (many-to-many)

## 3. UI Pages

- (cần tạo) `apps/views/admin/users.ejs`

## 4. Routes (gợi ý)

- `GET /admin/users` (filter theo `trangThai`, search username/email)
- `POST /admin/users/:id/block`
- `POST /admin/users/:id/unblock`
- `POST /admin/users/:id/roles/add`
- `POST /admin/users/:id/roles/remove`

## 5. Data

- `users.trangThai`: "active" | "blocked" | "inactive"
- `userRoles` liên kết tới `roles`

## 6. Phân quyền (Permissions)

### Routes Protection
- Tất cả routes `/admin/users/*` được bảo vệ bởi:
  - `requireAuth` - Yêu cầu đăng nhập
  - `requireAdmin` - Yêu cầu role admin (hoặc có permission tương ứng)

### Permissions chi tiết (theo từng action)
- **Xem danh sách users**: `users.read`
- **Block/Unblock user**: `users.write`
- **Gán/Bỏ role cho user**: `users.write`
- **Xóa user** (nếu có): `users.delete`

**Lưu ý**: Hiện tại code dùng `requireAdmin` (check role), có thể nâng cấp sau để dùng `requirePermission` cho fine-grained control.

### Roles có quyền
- **Admin**: Tất cả permissions (users.read, users.write, users.delete)
- **Moderator**: Chỉ có `users.read` (xem danh sách)
- **Teacher**: Không có quyền quản lý users
- **User**: Không có quyền quản lý users

## 7. Acceptance criteria

- AC1: Chỉ admin (hoặc user có permission `users.read`) truy cập được
- AC2: User bị `blocked` không login được (đã enforce trong `AuthService.login`)
- AC3: Assign/remove role cập nhật đúng trong `userRoles`
- AC4: User không có permission `users.write` không thể block/unblock hoặc gán role
- AC5: User không có permission `users.delete` không thể xóa user (nếu có tính năng này)

## 7. Files liên quan (gợi ý)

- `apps/controllers/admin/usermanagecontroller.js` (cần tạo)
- `apps/Repository/UserRepository.js`
- `apps/Repository/RoleRepository.js`
- `apps/Repository/UserRoleRepository.js`


