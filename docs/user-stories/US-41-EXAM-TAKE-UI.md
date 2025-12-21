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

## 5. Acceptance criteria

- AC1: Timer hiển thị đúng và auto submit khi hết giờ (tuỳ chọn)
- AC2: UI không hiển thị đáp án đúng
- AC3: Submit payload đúng schema (US-42)
- AC4: User không có permission `exams.take` không thể làm bài


