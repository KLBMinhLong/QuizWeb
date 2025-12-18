# US-40 - Exam: Generate & Attempt Snapshot

## 1. Actor

- User

## 2. Mục tiêu

- Generate đề theo `subject.examConfig` (easy/medium/hard)
- Tạo attempt snapshot để chấm server-side (không tin client)

## 3. UI Pages

- `apps/views/exam/start.ejs`
- `apps/views/exam/take.ejs`

UI theo `docs/UI_DESIGN.md` (breadcrumb + button + card).

## 4. Routes

- `POST /exam/generate`

## 5. Data

- `subjects.examConfig`
- `questions`
- `examAttempts` (xem `docs/DATA_MODEL.md`)

## 6. Main flow (Generate)

1. Controller nhận `subjectId`
2. Service load subject + examConfig
3. Repo sample questions theo difficulty (ưu tiên `$sample`)
4. Tạo attempt:
   - `userId` (nếu đã yêu cầu login)
   - `subjectId`
   - `startedAt`
   - `durationMinutes`
   - `questionsSnapshot` (đầy đủ dữ liệu để chấm)
5. Render `take.ejs` với:
   - `attemptId`
   - danh sách câu hỏi đã strip đáp án đúng (US-30)

## 7. Acceptance criteria

- AC1: Đủ số lượng câu theo config nếu DB đủ
- AC2: Nếu thiếu câu: lấy tối đa có thể + hiển thị cảnh báo
- AC3: Không gửi đáp án đúng ra client


