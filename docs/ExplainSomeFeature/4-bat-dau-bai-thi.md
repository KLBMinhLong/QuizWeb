# Chức năng Bắt Đầu Bài Thi

Tính năng cho phép người dùng bắt đầu làm bài thi trắc nghiệm theo môn học đã chọn.

## Luồng hoạt động

```mermaid
flowchart TD
    A[User truy cập /exam/start/:subjectSlug] --> B[Hiển thị trang start]
    B --> C[Click "Bắt đầu thi"]
    C --> D[POST /exam/generate]
    D --> E{Có attempt đang dở?}
    E -->|Có| F{Còn thời gian?}
    F -->|Còn| G[Resume bài thi cũ]
    F -->|Hết| H[Auto submit bài cũ]
    H --> I[Tạo bài thi mới]
    E -->|Không| I
    I --> J[Random câu hỏi theo config]
    J --> K[Tạo ExamAttempt]
    K --> L[Render trang take.ejs]
    L --> M[User làm bài]
```

## Các file liên quan

### 1. Controller: [examcontroller.js](file:///d:/Downloads/OnThiTracNghiem/QuizWeb/apps/controllers/examcontroller.js)

**Route GET `/exam/start/:subjectSlug`** (dòng 10-26):
```javascript
router.get("/start/:subjectSlug", optionalAuth, async function (req, res) {
  try {
    const subjectService = new SubjectService();
    const subject = await subjectService.getBySlugWithStats(req.params.subjectSlug);
    
    if (!subject) return res.status(404).send("Không tìm thấy môn");
    
    // Chặn môn học không active (trừ admin)
    if (!subject.isActive && (!req.user || req.user.role !== "admin")) {
      return res.status(404).send("Không tìm thấy môn học");
    }

    res.render("exam/start.ejs", { subject, user: req.user || null });
  } catch (e) {
    res.status(500).send("Lỗi server");
  }
});
```

**Route POST `/exam/generate`** (dòng 28-67):
```javascript
router.post("/generate", optionalAuth, async function (req, res) {
  try {
    const { subjectId } = req.body;
    const user = req.user || null;

    // Kiểm tra quyền
    const canRead = hasPermission(user, "exams.read");
    const canTake = hasPermission(user, "exams.take");
    if (!canRead && !canTake) {
      if (!user) return res.status(401).redirect("/auth/login");
      return res.status(403).send("Bạn không có quyền tạo đề thi");
    }

    // Gọi service generate exam
    const service = new ExamService();
    const exam = await service.generateExam(subjectId, user);
    if (!exam.ok) return res.status(400).send(exam.message);

    // Lấy thông tin môn học
    const subjectService = new SubjectService();
    const subject = await subjectService.getById(subjectId);

    // Render trang làm bài
    res.render("exam/take.ejs", {
      subjectId,
      subject: subject || { _id: subjectId, name: "Môn học", slug: "" },
      questions: exam.questions,
      durationMinutes: exam.durationMinutes,
      remainingSeconds: exam.remainingSeconds,
      userAnswers: exam.userAnswers || {},
      isResume: exam.isResume || false,
      attemptId: exam.attemptId,
      hasShortage: exam.hasShortage,
      shortages: exam.shortages,
      user,
    });
  } catch (e) {
    res.status(500).send("Lỗi server");
  }
});
```

### 2. Service: [ExamService.js](file:///d:/Downloads/OnThiTracNghiem/QuizWeb/apps/Services/ExamService.js)

**Hàm `generateExam(subjectId, user)`** (dòng 25-155):

#### Bước 1: Kiểm tra môn học
```javascript
const subject = await this.subjectRepo.getById(subjectId);
if (!subject) return { ok: false, message: "Không tìm thấy môn học" };
```

#### Bước 2: Kiểm tra bài thi đang dở (dòng 31-75)
```javascript
if (user && user.userId) {
  const activeAttempt = await this.examAttemptRepo.findActiveAttempt(
    user.userId,
    subjectId
  );

  if (activeAttempt) {
    const now = new Date();
    const startTime = new Date(activeAttempt.startedAt);
    const durationMs = activeAttempt.durationMinutes * 60 * 1000;
    const endTime = new Date(startTime.getTime() + durationMs);
    const remainingMs = endTime.getTime() - now.getTime();

    if (remainingMs <= 0) {
      // Hết giờ -> auto submit
      await this.submitExam({
        attemptId: String(activeAttempt._id),
        answers: activeAttempt.userAnswers || {},
      }, user);
    } else {
      // Còn giờ -> resume bài cũ
      return {
        ok: true,
        isResume: true,
        attemptId: String(activeAttempt._id),
        questions: publicQuestions,
        durationMinutes: activeAttempt.durationMinutes,
        remainingSeconds: Math.floor(remainingMs / 1000),
        userAnswers: activeAttempt.userAnswers || {},
        hasShortage: false,
      };
    }
  }
}
```

#### Bước 3: Lấy config đề thi (dòng 77-82)
```javascript
const cfg = subject.examConfig || {
  easyCount: 10,
  mediumCount: 5,
  hardCount: 5,
  durationMinutes: 30,
};
```

#### Bước 4: Random câu hỏi theo độ khó (dòng 84-88)
```javascript
const stats = await this.questionRepo.getQuestionStats(subject._id);
const questions = await this.questionRepo.sampleByDifficulty(
  String(subject._id),
  cfg
);
```

#### Bước 5: Strip đáp án đúng (dòng 120-127)
```javascript
const publicQuestions = questions.map((q) => ({
  _id: String(q._id),
  type: q.type,
  difficulty: q.difficulty,
  content: q.content,
  mediaUrl: q.mediaUrl || null,
  answers: QuestionService.stripCorrectAnswers(q.type, q.answers),
}));
```

#### Bước 6: Tạo ExamAttempt (dòng 129-139)
```javascript
const attemptData = {
  userId: user && user.userId ? user.userId : null,
  subjectId: subject._id,
  startedAt: new Date(),
  durationMinutes: cfg.durationMinutes,
  totalQuestions: questions.length,
  questionsSnapshot, // Lưu câu hỏi gốc với đáp án đúng
  userAnswers: {},
};

const attemptId = await this.examAttemptRepo.createAttempt(attemptData);
```

### 3. View: [take.ejs](file:///d:/Downloads/OnThiTracNghiem/QuizWeb/apps/views/exam/take.ejs)

Giao diện làm bài với:
- Header cố định với countdown timer
- Danh sách câu hỏi
- Navigation sidebar
- Auto-save progress

### 4. JavaScript: [exam-take.js](file:///d:/Downloads/OnThiTracNghiem/QuizWeb/public/js/exam-take.js)

```javascript
// Countdown timer
let remainingSeconds = <%= remainingSeconds %>;
setInterval(() => {
  remainingSeconds--;
  updateTimerDisplay();
  if (remainingSeconds <= 0) {
    autoSubmit();
  }
}, 1000);

// Auto-save progress mỗi 30 giây
setInterval(() => {
  saveProgress();
}, 30000);
```

## Cấu trúc dữ liệu ExamAttempt

| Field | Type | Mô tả |
|-------|------|-------|
| `_id` | ObjectId | ID của attempt |
| `userId` | ObjectId | ID người dùng |
| `subjectId` | ObjectId | ID môn học |
| `startedAt` | Date | Thời điểm bắt đầu |
| `finishedAt` | Date | Thời điểm nộp bài |
| `durationMinutes` | Number | Thời gian làm bài |
| `totalQuestions` | Number | Tổng số câu |
| `questionsSnapshot` | Array | Bản sao câu hỏi + đáp án đúng |
| `userAnswers` | Object | Câu trả lời: `{questionId: answer}` |
| `score` | Number | Điểm số (sau khi nộp) |

## stripCorrectAnswers

Hàm ẩn đáp án đúng trước khi gửi cho client:

```javascript
static stripCorrectAnswers(type, answers) {
  if (type === "single_choice" || type === "multiple_choice") {
    return answers.map(a => ({ text: a.text })); // Bỏ isCorrect
  }
  if (type === "true_false") {
    return answers.map(a => ({ value: a.value })); // Bỏ isCorrect
  }
  if (type === "fill_in_blank") {
    return {}; // Ẩn hoàn toàn
  }
  if (type === "matching") {
    return { pairs: answers.pairs.map(p => ({ left: p.left })) }; // Chỉ giữ left
  }
}
```

## Xử lý thiếu câu hỏi

Khi số câu hỏi trong DB ít hơn config:
- Vẫn tạo đề với số câu có sẵn
- Hiển thị cảnh báo `hasShortage` trên UI
- Ghi log `shortages` chi tiết
