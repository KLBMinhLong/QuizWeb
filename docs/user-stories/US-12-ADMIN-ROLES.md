# US-12 - Admin Roles (CRUD + Claims Management)

## 1. Actor

- Admin (hoặc user có permission `roles.read`, `roles.write`, `roles.delete`)

## 2. Mục tiêu

- Admin quản lý roles (create/list/update/delete)
- Admin quản lý permissions (claims) cho từng role
- Hiển thị số lượng users đang sử dụng mỗi role
- Bảo vệ role "admin" (không cho xoá/đổi tên)

## 3. UI Pages

- `apps/views/admin/roles.ejs` - Trang quản lý roles với modal quản lý permissions

## 4. Routes

### CRUD Roles
- `GET /admin/roles` - Danh sách roles
- `POST /admin/roles/create` - Tạo role mới
- `POST /admin/roles/:id/update` - Cập nhật role
- `POST /admin/roles/:id/delete` - Xoá role

### Claims/Permissions Management
- `GET /admin/roles/:id/claims` - API trả về JSON: claims hiện tại + danh sách permissions có sẵn
- `POST /admin/roles/:id/claims/add` - Thêm permission cho role
- `POST /admin/roles/:id/claims/:claimId/remove` - Xóa permission khỏi role

## 5. Data

- `roles`, `userRoles`, `roleClaims` (xem `docs/DATA_MODEL.md`)

### Rules
- `roles.name` unique (case-insensitive qua `normalizedName`)
- Không cho xoá role `"admin"` (bảo vệ role quan trọng)
- Không cho đổi tên role `"admin"`
- Không cho xoá role đang được sử dụng (có users)
- Khi xoá role, tự động xoá tất cả `roleClaims` của role đó

### Permissions có sẵn
Hệ thống có 25 permissions được định nghĩa sẵn, phân loại theo category:
- **Users**: `users.read`, `users.write`, `users.delete`
- **Roles**: `roles.read`, `roles.write`, `roles.delete`
- **Subjects**: `subjects.read`, `subjects.write`, `subjects.delete`
- **Questions**: `questions.read`, `questions.write`, `questions.delete`
- **Exams**: `exams.read`, `exams.write`, `exams.delete`, `exams.take`
- **Comments**: `comments.write`, `comments.moderate`
- **System**: `system.config`

## 6. Main flows

### 6.1 Tạo role mới
1. Validate input (tên role: 2-50 ký tự, chỉ chữ/số/underscore)
2. Check trùng tên (case-insensitive)
3. Insert vào `roles`
4. Redirect về danh sách với success message

### 6.2 Cập nhật role
1. Validate input
2. Check role tồn tại
3. Nếu là role "admin", không cho đổi tên
4. Nếu đổi tên, check trùng (case-insensitive)
5. Update role với `updatedAt`
6. Redirect về danh sách với success message

### 6.3 Xoá role
1. Check role tồn tại
2. Không cho xoá role "admin"
3. Check role đang được sử dụng (có users)
4. Xoá tất cả `roleClaims` của role
5. Xoá role
6. Redirect về danh sách với success message

### 6.4 Quản lý permissions
1. Load claims hiện tại của role
2. Load danh sách permissions có sẵn
3. Hiển thị trong modal:
   - Permissions hiện tại (có thể xóa)
   - Dropdown để thêm permission mới
   - Danh sách permissions theo category
4. Thêm permission: check trùng, insert vào `roleClaims`
5. Xóa permission: delete từ `roleClaims`

## 6. Phân quyền (Permissions)

### Routes Protection
- Tất cả routes `/admin/roles/*` được bảo vệ bởi:
  - `requireAuth` - Yêu cầu đăng nhập
  - `requireAdmin` - Yêu cầu role admin (hoặc có permission tương ứng)

### Permissions chi tiết (theo từng action)
- **Xem danh sách roles**: `roles.read`
- **Tạo role mới**: `roles.write`
- **Cập nhật role**: `roles.write`
- **Xóa role**: `roles.delete`
- **Quản lý permissions (claims)**: `roles.write`

**Lưu ý**: Hiện tại code dùng `requireAdmin` (check role), có thể nâng cấp sau để dùng `requirePermission` cho fine-grained control.

### Roles có quyền
- **Admin**: Tất cả permissions (roles.read, roles.write, roles.delete)
- **Moderator**: Không có quyền quản lý roles
- **Teacher**: Không có quyền quản lý roles
- **User**: Không có quyền quản lý roles

## 7. Acceptance criteria

- AC1: Chỉ admin (hoặc user có permission `roles.read`) truy cập được (qua `requireAdmin` middleware)
- AC2: Tạo role mới OK và không trùng (case-insensitive)
- AC3: Update role có cập nhật `updatedAt`
- AC4: Không thể xoá role "admin"
- AC5: Không thể xoá role đang được sử dụng
- AC6: Role mới tạo có thể được gán permissions ngay
- AC7: Có thể thêm/xóa permissions cho role qua UI
- AC8: Hiển thị số lượng users đang sử dụng mỗi role
- AC9: User không có permission `roles.write` không thể tạo/sửa role
- AC10: User không có permission `roles.delete` không thể xóa role

## 8. UI Features

### Danh sách roles
- Bảng hiển thị: Tên role, Mô tả, Số users, Ngày tạo, Thao tác
- Button "Permissions" để quản lý permissions
- Button "Sửa" để cập nhật role
- Button "Xoá" (disabled nếu là admin hoặc đang được sử dụng)

### Modal quản lý Permissions
- Hiển thị permissions hiện tại (badge style, có thể xóa)
- Dropdown để chọn và thêm permission mới
- Danh sách permissions theo category với visual indicators
- AJAX-based (không cần reload page)

## 9. Files liên quan

### Controllers
- `apps/controllers/admin/rolemanagecontroller.js` - CRUD + Claims management

### Services
- `apps/Services/RoleService.js` - Business logic cho roles và claims

### Repositories
- `apps/Repository/RoleRepository.js` - CRUD roles
- `apps/Repository/UserRoleRepository.js` - Quan hệ user-role
- `apps/Repository/RoleClaimRepository.js` - Quản lý role claims

### Views
- `apps/views/admin/roles.ejs` - UI quản lý roles và permissions

## 10. Validation

### Tên role
- Bắt buộc
- 2-50 ký tự
- Chỉ chứa chữ, số và dấu gạch dưới (`[a-zA-Z0-9_]+`)
- Unique (case-insensitive)

### Mô tả
- Tùy chọn
- Tối đa 500 ký tự

### Permission
- `claimType`: "permission"
- `claimValue`: Phải là một trong danh sách permissions có sẵn
- Không cho thêm trùng permission vào cùng một role


