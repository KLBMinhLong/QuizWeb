# US-21 - Admin Subjects (CRUD + ExamConfig + Active)

## 1. Actor

- Admin

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
- (optional) `POST /admin/subjects/:id/delete`

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

## 6. Acceptance criteria

- AC1: Slug unique (tự sinh + tránh trùng)
- AC2: Update examConfig validate + lưu `updatedAt`
- AC3: `isActive=false` thì user không thấy ở list
- AC4: Admin routes bảo vệ bằng `requireAdmin`

## 7. Files liên quan

- `apps/controllers/admin/subjectmanagecontroller.js`
- `apps/Services/SubjectService.js`
- `apps/Repository/SubjectRepository.js`


