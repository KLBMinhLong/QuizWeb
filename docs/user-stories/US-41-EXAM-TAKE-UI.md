# US-41 - Exam: Take UI (Timer / UX)

## 1. Actor

- User (cần permission `exams.take`)

## 2. Mục tiêu

- UI làm bài rõ ràng, dễ dùng
- Có timer đếm ngược theo `durationMinutes`
- Nút “Nộp bài” và confirm trước khi submit

## 3. UI Pages

- `apps/views/exam/take.ejs`

UI theo `docs/UI_DESIGN.md`:
- Breadcrumb: `Trang chủ > Môn học > <Tên môn> > Làm bài`
- Card/badge difficulty + button thống nhất

## 4. Phân quyền (Permissions)

### Routes Protection
- `GET /exam/take` (render từ generate) - Yêu cầu:
  - `requireAuth` - Đăng nhập (optional, có thể cho phép guest)
  - Permission `exams.take`

### Permissions chi tiết
- **Làm bài thi**: `exams.take`

### Roles có quyền
- **Admin**: `exams.take` (có thể làm bài)
- **Moderator**: `exams.take` (có thể làm bài)
- **Teacher**: `exams.take` (có thể làm bài)
- **User**: `exams.take` (có thể làm bài)
- **Guest**: Không có quyền (có thể cho phép `exams.take` nếu muốn)

## 5. Các dạng câu hỏi (Question Types)

Hệ thống hỗ trợ **5 dạng câu hỏi** trong bài thi. UI phải hiển thị và xử lý input đúng cho từng dạng:

### 5.1 Single Choice (Chọn một đáp án)

**Mô tả**: Câu hỏi có nhiều lựa chọn, user chỉ được chọn **1 đáp án** duy nhất.

**Cấu trúc dữ liệu từ server**:
- `type`: `"single_choice"`
- `answers`: Array các object `{text: string}` (đã strip `isCorrect` bởi `QuestionService.stripCorrectAnswers`)

**UI hiển thị**:
- Hiển thị `content` của câu hỏi (có thể có HTML)
- Nếu có `mediaUrl`: hiển thị hình ảnh/video bên dưới content
- Danh sách các lựa chọn dùng **radio buttons** (`<input type="radio">`)
- Mỗi option hiển thị: radio button + text của option
- Styling: label có thể click được, hover effect rõ ràng

**Submit format**:
```javascript
{
  "questionId": "answerIndex"  // VD: "0", "1", "2" (index của option được chọn)
}
```

**Validation client-side**:
- Không bắt buộc (user có thể bỏ trống)
- Nếu đã chọn, phải là số hợp lệ trong range [0, answers.length-1]

---

### 5.2 Multiple Choice (Chọn nhiều đáp án)

**Mô tả**: Câu hỏi có nhiều lựa chọn, user có thể chọn **nhiều đáp án** (1 hoặc nhiều).

**Cấu trúc dữ liệu từ server**:
- `type`: `"multiple_choice"`
- `answers`: Array các object `{text: string}` (đã strip `isCorrect`)

**UI hiển thị**:
- Hiển thị `content` của câu hỏi (có thể có HTML)
- Nếu có `mediaUrl`: hiển thị hình ảnh/video bên dưới content
- Danh sách các lựa chọn dùng **checkboxes** (`<input type="checkbox">`)
- Mỗi option hiển thị: checkbox + text của option
- Styling: label có thể click được, hover effect rõ ràng
- **Hint text**: "Chọn một hoặc nhiều đáp án" (hiển thị nhỏ phía trên danh sách options)

**Submit format**:
```javascript
{
  "questionId": ["0", "2", "3"]  // Array các index (string) của các option được chọn
}
```

**Validation client-side**:
- Không bắt buộc (user có thể bỏ trống)
- Nếu có chọn, phải là array các số hợp lệ trong range [0, answers.length-1]

---

### 5.3 True/False (Đúng/Sai)

**Mô tả**: Câu hỏi dạng Đúng/Sai, user chọn **True** hoặc **False**.

**Cấu trúc dữ liệu từ server**:
- `type`: `"true_false"`
- `answers`: Array 2 phần tử `[{value: boolean}, {value: boolean}]` (đã strip `isCorrect`)
- Thứ tự: thường là `[{value: true}, {value: false}]` hoặc ngược lại

**UI hiển thị**:
- Hiển thị `content` của câu hỏi (có thể có HTML)
- Nếu có `mediaUrl`: hiển thị hình ảnh/video bên dưới content
- Dùng **radio buttons** (chỉ có 2 options)
- Hiển thị: radio "Đúng" (True) và radio "Sai" (False)
- Styling: label lớn, dễ click, có thể dùng button style cho radio để UX tốt hơn

**Submit format**:
```javascript
{
  "questionId": true  // hoặc false (boolean, không phải string)
}
```

**Hoặc**:
```javascript
{
  "questionId": "true"  // hoặc "false" (string) - server sẽ convert
}
```

**Validation client-side**:
- Không bắt buộc (user có thể bỏ trống)
- Nếu đã chọn, phải là boolean hoặc string "true"/"false"

---

### 5.4 Fill in Blank (Điền vào chỗ trống)

**Mô tả**: Câu hỏi yêu cầu user **nhập text** vào ô input. Server sẽ normalize (trim, lowercase) và so sánh với danh sách đáp án chấp nhận được.

**Cấu trúc dữ liệu từ server**:
- `type`: `"fill_in_blank"`
- `answers`: Object `{placeholder: "Nhập đáp án của bạn"}` (không gửi `accepted` values để tránh lộ đáp án)

**UI hiển thị**:
- Hiển thị `content` của câu hỏi (có thể có HTML, có thể chứa `_____` hoặc placeholder text để chỉ vị trí cần điền)
- Nếu có `mediaUrl`: hiển thị hình ảnh/video bên dưới content
- Dùng **text input** (`<input type="text">` hoặc `<textarea>` nếu cần nhiều dòng)
- Placeholder: "Nhập đáp án của bạn" (hoặc custom từ `answers.placeholder`)
- Styling: input có border rõ, focus state rõ ràng

**Submit format**:
```javascript
{
  "questionId": "text người dùng nhập"  // String, server sẽ normalize
}
```

**Validation client-side**:
- Không bắt buộc (user có thể bỏ trống)
- Nếu có nhập, trim whitespace trước khi submit (optional, server cũng sẽ trim)

---

### 5.5 Matching (Nối cặp)

**Mô tả**: Câu hỏi yêu cầu user **nối các cặp** từ 2 danh sách (Left và Right). Server sẽ so sánh toàn bộ mapping để chấm điểm.

**Cấu trúc dữ liệu từ server**:
- `type`: `"matching"`
- `answers`: Object `{leftItems: string[], rightItems: string[]}` 
  - `leftItems`: danh sách các item bên trái (theo thứ tự gốc)
  - `rightItems`: danh sách các item bên phải (đã shuffle để không lộ mapping đúng)

**UI hiển thị**:
- Hiển thị `content` của câu hỏi (có thể có HTML, giải thích cách nối)
- Nếu có `mediaUrl`: hiển thị hình ảnh/video bên dưới content
- Layout **2 cột**:
  - **Cột trái**: danh sách các item từ `leftItems` (theo thứ tự, có thể đánh số)
  - **Cột phải**: danh sách dropdown/select cho mỗi item trái, các option là `rightItems` (đã shuffle)
- Hoặc dùng **drag & drop** (nâng cao hơn): user kéo item trái thả vào item phải tương ứng
- Styling: 2 cột rõ ràng, dropdown/select dễ dùng, có thể highlight khi hover

**Submit format**:
```javascript
{
  "questionId": {
    "leftItem1": "rightItemX",
    "leftItem2": "rightItemY",
    // ... mapping cho tất cả các cặp
  }
}
```

**Hoặc** (nếu dùng array format):
```javascript
{
  "questionId": [
    {left: "leftItem1", right: "rightItemX"},
    {left: "leftItem2", right: "rightItemY"},
    // ...
  ]
}
```

**Validation client-side**:
- Không bắt buộc (user có thể bỏ trống một số cặp)
- Phải có đúng số lượng mapping = số lượng `leftItems` (nếu validate strict)

---

### 5.6 Media Support (Hỗ trợ media)

Tất cả các dạng câu hỏi đều có thể có `mediaUrl` (optional):
- Nếu có `mediaUrl`: hiển thị hình ảnh hoặc video bên dưới `content`
- **Image**: dùng `<img>` tag với responsive width
- **Video**: dùng `<video>` tag với controls
- Styling: media có border-radius nhẹ, max-width 100%, margin-top phù hợp

---

### 5.7 Badge và Metadata

Mỗi câu hỏi hiển thị:
- **Số thứ tự**: "Câu 1", "Câu 2", ... (badge)
- **Độ khó**: `easy` / `medium` / `hard` (badge với màu tương ứng theo `UI_DESIGN.md`)
- **Loại câu hỏi**: `single_choice`, `multiple_choice`, ... (badge info, optional - có thể ẩn để UI gọn hơn)

---

### 5.8 Security và UX

**Không hiển thị đáp án đúng**:
- Server phải strip tất cả thông tin `isCorrect`, `accepted` values trước khi gửi về client
- Sử dụng `QuestionService.stripCorrectAnswers()` trong `ExamService`

**Auto-save (tùy chọn)**:
- Có thể lưu tạm đáp án vào `localStorage` mỗi khi user thay đổi
- Restore khi reload trang (nếu chưa hết thời gian)

**Progress indicator**:
- Hiển thị tiến độ: "Câu 5 / 20"
- Có thể highlight các câu đã trả lời vs chưa trả lời

---

## 6. Acceptance criteria

- AC1: Timer hiển thị đúng và auto submit khi hết giờ (tuỳ chọn)
- AC2: UI không hiển thị đáp án đúng (strip `isCorrect`, `accepted` values)
- AC3: Submit payload đúng schema cho từng dạng câu hỏi (US-42)
- AC4: User không có permission `exams.take` không thể làm bài
- AC5: Tất cả 5 dạng câu hỏi hiển thị đúng UI và format submit đúng:
  - AC5.1: `single_choice` dùng radio buttons, submit index (string)
  - AC5.2: `multiple_choice` dùng checkboxes, submit array indices
  - AC5.3: `true_false` dùng radio buttons, submit boolean hoặc "true"/"false"
  - AC5.4: `fill_in_blank` dùng text input, submit string
  - AC5.5: `matching` dùng dropdown/select hoặc drag-drop, submit object mapping
- AC6: Media (hình ảnh/video) hiển thị đúng nếu có `mediaUrl`
- AC7: Badge hiển thị đúng số thứ tự, độ khó, loại câu hỏi
- AC8: Form có confirm dialog trước khi submit
- AC9: UI responsive, dễ dùng trên mobile


