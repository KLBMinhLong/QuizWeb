# US-21 - Admin Subjects (CRUD + ExamConfig + Active)

## 1. Actor

- Admin (hoặc user có permission `subjects.read`, `subjects.write`, `subjects.delete`)

## 2. Mục tiêu

- Admin tạo/sửa môn học
- Slug tự sinh từ name, đảm bảo unique
- Admin cập nhật examConfig (easy/medium/hard/duration)
- Admin bật/tắt active (user chỉ thấy active)

## 3. UI Pages

- `apps/views/admin/subjects.ejs` (đã có, cần mở rộng)

UI theo `docs/UI_DESIGN.md` (card, button, breadcrumb admin).

## 4. Routes

- `GET /admin/subjects`
- `POST /admin/subjects/create`
- `POST /admin/subjects/:id/update` (cần thêm)
- `POST /admin/subjects/:id/toggle-active` (cần thêm)
- `POST /admin/subjects/:id/delete`

## 5. Main flows

### 5.1 Create

Input:
- `name`, `description`

Rules:
- `slug` tự sinh từ `name` (slugify) + nếu trùng thì thêm hậu tố `-2`, `-3`, …
- auto init `examConfig` default

### 5.2 Update examConfig

Admin cập nhật:
- `easyCount`, `mediumCount`, `hardCount`, `durationMinutes`

Validation:
- tất cả là số nguyên >= 0
- durationMinutes > 0

### 5.3 Toggle active

- `isActive=true/false`
- User chỉ thấy `isActive=true` ở `/subjects`

## 6. Phân quyền (Permissions)

### Routes Protection
- Tất cả routes `/admin/subjects/*` được bảo vệ bởi:
  - `requireAuth` - Yêu cầu đăng nhập
  - `requireAdmin` - Yêu cầu role admin (hoặc có permission tương ứng)

### Permissions chi tiết (theo từng action)
- **Xem danh sách subjects**: `subjects.read`
- **Tạo subject mới**: `subjects.write`
- **Cập nhật subject**: `subjects.write`
- **Cập nhật examConfig**: `subjects.write`
- **Toggle active**: `subjects.write`
- **Xóa subject**: `subjects.delete`

**Lưu ý**: Hiện tại code dùng `requireAdmin` (check role), có thể nâng cấp sau để dùng `requirePermission` cho fine-grained control.

### Roles có quyền
- **Admin**: Tất cả permissions (subjects.read, subjects.write, subjects.delete)
- **Moderator**: Chỉ có `subjects.read` (xem danh sách)
- **Teacher**: `subjects.read`, `subjects.write` (xem và tạo/sửa, không xóa)
- **User**: Không có quyền quản lý subjects

## 7. Acceptance criteria

- AC1: Slug unique (tự sinh + tránh trùng)
- AC2: Update examConfig validate + lưu `updatedAt`
- AC3: `isActive=false` thì user không thấy ở list
- AC4: Admin routes bảo vệ bằng `requireAdmin` (hoặc permission tương ứng)
- AC5: User không có permission `subjects.write` không thể tạo/sửa subject
- AC6: User không có permission `subjects.delete` không thể xóa subject

## 7. Files liên quan

- `apps/controllers/admin/subjectmanagecontroller.js`
- `apps/Services/SubjectService.js`
- `apps/Repository/SubjectRepository.js`


