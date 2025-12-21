# US-43 - Exam History (Attempt list / Detail)

## 1. Actor

- User (cần permission `exams.read`)

## 2. Mục tiêu

- User xem lịch sử thi theo thời gian và theo môn
- User xem chi tiết attempt (điểm, đúng/sai theo từng câu)

## 3. UI Pages

- (cần tạo) `apps/views/exam/history.ejs`
- (cần tạo) `apps/views/exam/attempt-detail.ejs`

UI theo `docs/UI_DESIGN.md` (breadcrumb + card list).

## 4. Routes

- `GET /exam/history` (requireAuth)
- `GET /exam/attempt/:id` (requireAuth)

## 5. Data

Collection: `examAttempts` (xem `docs/DATA_MODEL.md`)

Fields tối thiểu:
- `userId`, `subjectId`, `startedAt`, `finishedAt`
- `score`, `totalQuestions`
- `questionsSnapshot`, `userAnswers`

## 6. Phân quyền (Permissions)

### Routes Protection
- `GET /exam/history` - Yêu cầu:
  - `requireAuth` - Đăng nhập
  - Permission `exams.read`
- `GET /exam/attempt/:id` - Yêu cầu:
  - `requireAuth` - Đăng nhập
  - Permission `exams.read`
  - Chỉ xem được attempt của chính mình (hoặc admin có thể xem tất cả)

### Permissions chi tiết
- **Xem lịch sử thi**: `exams.read`
- **Xem chi tiết attempt**: `exams.read`

### Roles có quyền
- **Admin**: `exams.read` (có thể xem tất cả attempts)
- **Moderator**: `exams.read` (có thể xem tất cả attempts)
- **Teacher**: `exams.read` (có thể xem attempts của mình)
- **User**: `exams.read` (chỉ xem attempts của chính mình)
- **Guest**: Không có quyền

## 7. Acceptance criteria

- AC1: User chỉ xem được history của chính họ (trừ admin/moderator)
- AC2: Detail attempt hiển thị đúng/sai theo từng câu (dựa snapshot)
- AC3: List có pagination khi dữ liệu lớn (optional)
- AC4: User không có permission `exams.read` không thể xem lịch sử
- AC5: Admin/Moderator có thể xem lịch sử của tất cả users


