# US-04 - Exam History (Attempt list/detail)

## 1. Actor

- User

## 2. Mục tiêu

- User xem lịch sử thi theo thời gian và theo môn
- User xem lại chi tiết attempt (điểm, câu đúng/sai)

## 3. UI Pages

- `apps/views/exam/history.ejs` (cần tạo)
- `apps/views/exam/attempt-detail.ejs` (cần tạo)

## 4. Routes

- `GET /exam/history`
- `GET /exam/attempt/:id`

## 5. Data

Collection: `examAttempts`

Fields quan trọng:
- `userId`, `subjectId`, `startedAt`, `finishedAt`
- `score`, `totalQuestions`
- `questionsSnapshot`, `userAnswers`

## 6. Acceptance criteria

- AC1: User chỉ xem được history của chính họ
- AC2: Detail attempt hiển thị đúng/sai theo từng câu
- AC3: Attempt list có pagination (phase 2)



