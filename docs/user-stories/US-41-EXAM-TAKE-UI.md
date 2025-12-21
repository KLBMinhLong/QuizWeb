# US-41 - Exam: Take UI (Timer / UX)

## 1. Actor

- User

## 2. Mục tiêu

- UI làm bài rõ ràng, dễ dùng
- Có timer đếm ngược theo `durationMinutes`
- Nút “Nộp bài” và confirm trước khi submit

## 3. UI Pages

- `apps/views/exam/take.ejs`

UI theo `docs/UI_DESIGN.md`:
- Breadcrumb: `Trang chủ > Môn học > <Tên môn> > Làm bài`
- Card/badge difficulty + button thống nhất

## 4. Acceptance criteria

- AC1: Timer hiển thị đúng và auto submit khi hết giờ (tuỳ chọn)
- AC2: UI không hiển thị đáp án đúng
- AC3: Submit payload đúng schema (US-42)


