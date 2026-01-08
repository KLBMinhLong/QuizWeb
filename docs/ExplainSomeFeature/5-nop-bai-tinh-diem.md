# Chức năng Nộp Bài Thi và Tính Điểm

Tính năng xử lý khi người dùng nộp bài thi và tự động chấm điểm.

## Luồng hoạt động

```mermaid
flowchart TD
    A[User click "Nộp bài"] --> B[Thu thập câu trả lời]
    B --> C[POST /exam/submit]
    C --> D{Attempt hợp lệ?}
    D -->|Không| E[Trả lỗi]
    D -->|Có| F{Đã nộp rồi?}
    F -->|Có| G[Trả lỗi trùng]
    F -->|Chưa| H[Duyệt từng câu hỏi]
    H --> I[So sánh với đáp án đúng]
    I --> J[Đếm số câu đúng]
    J --> K[Tính điểm phần trăm]
    K --> L[Cập nhật ExamAttempt]
    L --> M[Render trang result]
    M --> N[Hiển thị điểm + thống kê]
```

## Các file liên quan

### 1. Controller: [examcontroller.js](file:///d:/Downloads/OnThiTracNghiem/QuizWeb/apps/controllers/examcontroller.js)

**Route POST `/exam/submit`** (dòng 68-86):
```javascript
router.post("/submit", optionalAuth, async function (req, res) {
  try {
    const user = req.user || null;

    // Kiểm tra quyền
    const canTake = hasPermission(user, "exams.take");
    if (!canTake) {
      if (!user) return res.status(401).redirect("/auth/login");
      return res.status(403).send("Bạn không có quyền nộp bài thi");
    }

    // Gọi service submit
    const service = new ExamService();
    const result = await service.submitExam(req.body, user);
    
    if (!result.ok) return res.status(400).send(result.message);
    
    // Render kết quả
    res.render("exam/result.ejs", { result, user: req.user || null });
  } catch (e) {
    console.error("Error submitting exam:", e);
    res.status(500).send("Lỗi server");
  }
});
```

### 2. Service: [ExamService.js](file:///d:/Downloads/OnThiTracNghiem/QuizWeb/apps/Services/ExamService.js)

**Hàm `submitExam(payload, user)`** (dòng 157-229):

#### Bước 1: Validate request
```javascript
const { attemptId, answers } = payload;

if (!attemptId) {
  return { ok: false, message: "Thiếu attemptId" };
}
```

#### Bước 2: Lấy và kiểm tra attempt (dòng 166-179)
```javascript
const attempt = await this.examAttemptRepo.getById(attemptId);
if (!attempt) {
  return { ok: false, message: "Không tìm thấy attempt" };
}

// Kiểm tra đã nộp chưa
if (attempt.finishedAt) {
  return { ok: false, message: "Bài thi đã được nộp rồi" };
}

// Kiểm tra quyền sở hữu
if (attempt.userId && user && user.userId) {
  if (String(attempt.userId) !== String(user.userId)) {
    return { ok: false, message: "Bạn không có quyền nộp bài thi này" };
  }
}
```

#### Bước 3: Chấm điểm từng câu (dòng 181-204)
```javascript
const questionsSnapshot = attempt.questionsSnapshot || [];
const userAnswers = answers || {};

let correctCount = 0;
const questionResults = [];

for (const question of questionsSnapshot) {
  const questionId = String(question._id);
  const userAnswer = userAnswers[questionId];
  
  // So sánh đáp án
  const isCorrect = QuestionService.compareAnswer(
    question.type,
    question.answers,
    userAnswer
  );

  if (isCorrect) {
    correctCount++;
  }

  questionResults.push({
    questionId,
    isCorrect,
  });
}
```

#### Bước 4: Tính điểm và lưu (dòng 206-216)
```javascript
const totalQuestions = questionsSnapshot.length;
const score = totalQuestions === 0 
  ? 0 
  : Math.round((correctCount / totalQuestions) * 100);

await this.examAttemptRepo.updateAttempt(attemptId, {
  finishedAt: new Date(),
  score: score,
  userAnswers: userAnswers,
});
```

#### Bước 5: Trả về kết quả
```javascript
return {
  ok: true,
  score,
  total: totalQuestions,
  correctCount,
  questionResults,
  attemptId: attemptId,
};
```

### 3. QuestionService - So sánh đáp án

**Hàm `compareAnswer(type, correctAnswers, userAnswer)`** (dòng 220-309):

#### single_choice
```javascript
if (type === "single_choice") {
  // userAnswer là index của đáp án được chọn
  const correctIndex = correctAnswers.findIndex(a => a.isCorrect);
  return Number(userAnswer) === correctIndex;
}
```

#### multiple_choice
```javascript
if (type === "multiple_choice") {
  // userAnswer là mảng các index
  const correctIndexes = correctAnswers
    .map((a, i) => a.isCorrect ? i : -1)
    .filter(i => i !== -1);
  
  const userIndexes = (userAnswer || []).map(Number).sort();
  const correct = correctIndexes.sort();
  
  return JSON.stringify(userIndexes) === JSON.stringify(correct);
}
```

#### true_false
```javascript
if (type === "true_false") {
  const correctIndex = correctAnswers.findIndex(a => a.isCorrect);
  return Number(userAnswer) === correctIndex;
}
```

#### fill_in_blank
```javascript
if (type === "fill_in_blank") {
  const accepted = correctAnswers.accepted || [];
  const userText = String(userAnswer || "").trim().toLowerCase();
  
  // So sánh không phân biệt hoa thường
  return accepted.some(a => 
    String(a).trim().toLowerCase() === userText
  );
}
```

#### matching
```javascript
if (type === "matching") {
  const correctPairs = correctAnswers.pairs || [];
  const userPairs = userAnswer || {};
  
  // Kiểm tra tất cả cặp khớp
  for (const pair of correctPairs) {
    if (userPairs[pair.left] !== pair.right) {
      return false;
    }
  }
  return true;
}
```

### 4. View: [result.ejs](file:///d:/Downloads/OnThiTracNghiem/QuizWeb/apps/views/exam/result.ejs)

Hiển thị kết quả với:
- Điểm số dạng vòng tròn animate
- Badge Đạt/Không đạt (>= 50 điểm)
- Thống kê: câu đúng, câu sai, tổng số câu, tỷ lệ
- Progress bar
- Link xem chi tiết bài làm

```html
<div class="result-score-circle" data-score="<%= result.score %>">
  <svg class="result-progress-ring">
    <circle class="result-progress-bar" />
  </svg>
  <div class="result-score-value"><%= result.score %></div>
</div>

<% if (result.score >= 50) { %>
  <div class="result-badge result-badge--pass">Đạt</div>
<% } else { %>
  <div class="result-badge result-badge--fail">Chưa đạt</div>
<% } %>
```

## Công thức tính điểm

```
score = Math.round((correctCount / totalQuestions) * 100)
```

- Điểm tối đa: 100
- Điểm tối thiểu: 0
- Điểm đạt: >= 50

## Xử lý edge cases

| Case | Xử lý |
|------|-------|
| Không có câu hỏi | score = 0 |
| Attempt không tồn tại | Báo lỗi |
| Đã nộp rồi | Báo lỗi |
| Sai user | Báo lỗi 403 |
| Hết giờ | Auto submit |

## Auto-submit khi hết giờ

Trong [exam-take.js](file:///d:/Downloads/OnThiTracNghiem/QuizWeb/public/js/exam-take.js):

```javascript
function autoSubmit() {
  // Thu thập tất cả câu trả lời
  const answers = collectAnswers();
  
  // Submit form ẩn
  const form = document.createElement('form');
  form.method = 'POST';
  form.action = '/exam/submit';
  
  // Thêm attemptId và answers
  addHiddenField(form, 'attemptId', attemptId);
  addHiddenField(form, 'answers', JSON.stringify(answers));
  
  document.body.appendChild(form);
  form.submit();
}

// Gọi khi remainingSeconds <= 0
if (remainingSeconds <= 0) {
  autoSubmit();
}
```

## Xem chi tiết bài làm

Sau khi nộp, user có thể xem chi tiết tại `/exam/attempt/:id`:

- Hiển thị từng câu hỏi
- Đánh dấu câu đúng/sai
- Hiển thị đáp án user đã chọn
- Hiển thị đáp án đúng
- Highlight so sánh

Xem thêm: [attempt-detail.ejs](file:///d:/Downloads/OnThiTracNghiem/QuizWeb/apps/views/exam/attempt-detail.ejs)
