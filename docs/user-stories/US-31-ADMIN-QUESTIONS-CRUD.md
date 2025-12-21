# US-31 - Admin Questions (CRUD + Filter)

## 1. Actor

- Admin (hoặc user có permission `questions.read`, `questions.write`, `questions.delete`)

## 2. Mục tiêu

- Admin quản lý ngân hàng câu hỏi theo môn học (Subject)
- CRUD câu hỏi + filter theo subject/difficulty/type
- Validate theo US-30

## 3. UI Pages

- `apps/views/admin/questions.ejs` (hiện là placeholder → cần làm list/filter)
- (cần thêm) `apps/views/admin/question-create.ejs`
- (cần thêm) `apps/views/admin/question-edit.ejs`

UI theo `docs/UI_DESIGN.md` (breadcrumb admin, card form, button).

## 4. Routes

- `GET /admin/questions` (filter theo subject + difficulty)
- `GET /admin/questions/create`
- `POST /admin/questions/create`
- `GET /admin/questions/:id/edit`
- `POST /admin/questions/:id/update`
- `POST /admin/questions/:id/delete`

## 5. Phân quyền (Permissions)

### Routes Protection
- Tất cả routes `/admin/questions/*` được bảo vệ bởi:
  - `requireAuth` - Yêu cầu đăng nhập
  - `requireAdmin` - Yêu cầu role admin (hoặc có permission tương ứng)

### Permissions chi tiết (theo từng action)
- **Xem danh sách questions**: `questions.read`
- **Tạo question mới**: `questions.write`
- **Cập nhật question**: `questions.write`
- **Xóa question**: `questions.delete`
- **Import questions** (US-32): `questions.write`

**Lưu ý**: Hiện tại code dùng `requireAdmin` (check role), có thể nâng cấp sau để dùng `requirePermission` cho fine-grained control.

### Roles có quyền
- **Admin**: Tất cả permissions (questions.read, questions.write, questions.delete)
- **Moderator**: `questions.read`, `questions.write`, `questions.delete` (quản lý câu hỏi)
- **Teacher**: `questions.read`, `questions.write` (xem và tạo/sửa, không xóa)
- **User**: Không có quyền quản lý questions

## 6. Acceptance criteria

- AC1: Chỉ admin (hoặc user có permission `questions.read`) truy cập được
- AC2: Câu hỏi luôn gắn với 1 subjectId hợp lệ
- AC3: Validate theo type ở server (US-30)
- AC4: List/filter theo môn + difficulty + keyword (optional)
- AC5: User không có permission `questions.write` không thể tạo/sửa question
- AC6: User không có permission `questions.delete` không thể xóa question

## 6. Files liên quan (gợi ý)

- `apps/controllers/admin/questionmanagecontroller.js`
- `apps/Services/QuestionService.js` (cần tạo nếu muốn tách nghiệp vụ)
- `apps/Repository/QuestionRepository.js`
- `apps/Repository/SubjectRepository.js`


