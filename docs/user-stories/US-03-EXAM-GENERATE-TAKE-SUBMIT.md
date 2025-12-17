# US-03 - Exam Flow (Generate → Take → Submit)

## 1. Actor

- User (khuyến nghị yêu cầu login từ phase 2)

## 2. UI Pages

- `apps/views/exam/start.ejs`
- `apps/views/exam/take.ejs`
- `apps/views/exam/result.ejs`

## 3. Routes

- `POST /exam/generate`
- `POST /exam/submit`

Files:
- `apps/controllers/examcontroller.js`
- `apps/Services/ExamService.js`
- `apps/Repository/QuestionRepository.js`
- (phase 2) `ExamAttemptRepository.js`

## 4. Business rules

- Generate đề theo `subject.examConfig`: easy/medium/hard, random bằng `$sample`.
- Client **không được** nhận đáp án đúng.
- Submit: server chấm điểm dựa trên dữ liệu server (snapshot/DB), không tin client.

## 5. Main flows (phiên bản hoàn chỉnh)

### 5.1 Generate

Input:
- `subjectId`

Steps:
1. Controller nhận `subjectId`
2. Service load subject + examConfig
3. Repository sample questions theo từng difficulty
4. Trộn câu hỏi
5. Tạo `ExamAttempt` (phase 2) lưu `questionsSnapshot` + `startedAt` + `durationMinutes`
6. Render `take.ejs` với `attemptId` + danh sách câu hỏi **đã strip đáp án đúng**

### 5.2 Take (UI)

- Render từng câu, cho user chọn đáp án
- Có timer đếm ngược theo duration
- Có “Nộp bài”

### 5.3 Submit

Input:
- `attemptId`
- `answers` (map questionId → userResponse)

Steps:
1. Controller nhận payload
2. Service load attempt + snapshot
3. So sánh từng câu:
   - single_choice: chọn đúng 1 đáp án đúng
   - multiple_choice: chọn đúng tập đáp án
   - true_false: đúng true/false
   - fill_in_blank: normalize string (trim/lower)
   - matching: đúng toàn bộ cặp
4. Tính score
5. Update attempt: `finishedAt`, `score`, `userAnswers`
6. Render `result.ejs`

## 6. Acceptance criteria

- AC1: Generate trả về đúng số lượng câu theo config (nếu thiếu thì lấy tối đa có thể + cảnh báo)
- AC2: Không có trường `isCorrect` trong dữ liệu render client
- AC3: Submit chấm điểm server-side (không dựa vào “correct” từ client)
- AC4: Không submit được attempt đã `finishedAt` (idempotent/guard)

## 7. Gap hiện tại trong code (cần làm tiếp)

Hiện `ExamService.submitExam()` đang là demo (dựa `correct` từ client). Cần refactor theo đúng flow snapshot ở trên khi bắt đầu phase 2.



