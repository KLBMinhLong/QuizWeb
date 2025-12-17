# US-05 - Admin Subjects (CRUD + ExamConfig)

## 1. Actor

- Admin

## 2. UI Pages

- `apps/views/admin/subjects.ejs` (đã có, cần mở rộng)

## 3. Routes

- `GET /admin/subjects` list
- `POST /admin/subjects/create` create
- (cần thêm) `POST /admin/subjects/update`
- (cần thêm) `POST /admin/subjects/toggle-active`
- (optional) `POST /admin/subjects/delete`

## 4. Main flows

### 4.1 Create

Input:
- `name`, `slug`, `description`

Rules:
- `slug` unique
- auto init `examConfig` default

### 4.2 Update examConfig

Admin cập nhật:
- `easyCount`, `mediumCount`, `hardCount`, `durationMinutes`

Validation:
- tất cả là số nguyên >= 0
- durationMinutes > 0

### 4.3 Toggle active

- `isActive=true/false`
- User chỉ thấy `isActive=true` ở `/subjects`

## 5. Acceptance criteria

- AC1: Slug unique
- AC2: Update examConfig có validate và lưu `updatedAt`
- AC3: `isActive=false` thì user không thấy ở list

## 6. Work items (cần làm tiếp)

- Auto slugify từ name nếu admin không nhập slug
- UI form update examConfig ngay trong trang subjects



