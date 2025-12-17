# US-06 - Admin Questions (CRUD + Import)

## 1. Actor

- Admin

## 2. Mục tiêu

- Quản lý ngân hàng câu hỏi theo môn học (Subject)
- Hỗ trợ nhiều loại câu hỏi
- Import Excel/CSV (giai đoạn sau)

## 3. UI Pages

- `apps/views/admin/questions.ejs` (hiện chỉ là placeholder)
- (cần thêm) `apps/views/admin/question-create.ejs`
- (cần thêm) `apps/views/admin/question-edit.ejs`

## 4. Routes

- `GET /admin/questions` (filter theo subject)
- `GET /admin/questions/create`
- `POST /admin/questions/create`
- `GET /admin/questions/:id/edit`
- `POST /admin/questions/:id/update`
- `POST /admin/questions/:id/delete`
- (phase 2) `POST /admin/questions/import` (multer + xlsx)

## 5. Data

Collection: `questions`

Field tối thiểu:
- `subjectId`, `difficulty`, `type`, `content`, `answers`, `createdAt`, `updatedAt`

## 6. Validation theo type (server-side)

- `single_choice`: answers là array >= 2, đúng **1** isCorrect=true
- `multiple_choice`: answers >= 2, đúng >=1 isCorrect=true
- `true_false`: answers cố định True/False, đúng 1
- `fill_in_blank`: answers là list đáp án string, normalize
- `matching`: answers là list cặp left/right

## 7. Acceptance criteria

- AC1: Câu hỏi luôn gắn với 1 subjectId hợp lệ
- AC2: Validate theo type ở server
- AC3: List/filter theo môn + difficulty
- AC4: Import tạo được nhiều câu và báo lỗi dòng invalid



