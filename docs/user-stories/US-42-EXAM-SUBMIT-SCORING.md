# US-42 - Exam: Submit & Server-side Scoring

## 1. Actor

- User

## 2. Mục tiêu

- Submit bài và chấm điểm hoàn toàn server-side
- Không tin client về đáp án đúng/sai

## 3. UI Pages

- `apps/views/exam/result.ejs`

## 4. Routes

- `POST /exam/submit`

## 5. Input

- `attemptId`
- `answers`: map `questionId` → `userResponse`

## 6. Main flow (Submit)

1. Controller nhận payload
2. Service load attempt (`examAttempts`) + `questionsSnapshot`
3. Chấm theo type (US-30):
   - single_choice: đúng 1 đáp án
   - multiple_choice: đúng tập đáp án
   - true_false: đúng true/false
   - fill_in_blank: normalize string (trim/lower)
   - matching: đúng toàn bộ cặp
4. Tính `score`, `totalQuestions`, breakdown đúng/sai
5. Update attempt:
   - `finishedAt`, `score`, `userAnswers`
6. Render `result.ejs`

## 7. Acceptance criteria

- AC1: Submit chấm server-side theo snapshot
- AC2: Không submit được attempt đã `finishedAt`
- AC3: Result hiển thị điểm + số đúng/sai tối thiểu


