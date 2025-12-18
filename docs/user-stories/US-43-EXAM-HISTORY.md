# US-43 - Exam History (Attempt list / Detail)

## 1. Actor

- User

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

## 6. Acceptance criteria

- AC1: User chỉ xem được history của chính họ
- AC2: Detail attempt hiển thị đúng/sai theo từng câu (dựa snapshot)
- AC3: List có pagination khi dữ liệu lớn (optional)


