# US-31 - Admin Questions (CRUD + Filter)

## 1. Actor

- Admin

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

## 5. Acceptance criteria

- AC1: Chỉ admin truy cập được
- AC2: Câu hỏi luôn gắn với 1 subjectId hợp lệ
- AC3: Validate theo type ở server (US-30)
- AC4: List/filter theo môn + difficulty + keyword (optional)

## 6. Files liên quan (gợi ý)

- `apps/controllers/admin/questionmanagecontroller.js`
- `apps/Services/QuestionService.js` (cần tạo nếu muốn tách nghiệp vụ)
- `apps/Repository/QuestionRepository.js`
- `apps/Repository/SubjectRepository.js`


