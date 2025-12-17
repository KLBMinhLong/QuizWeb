# US-02 - Subjects (List / Detail / Start Exam)

## 1. Actor

- Guest / User

## 2. UI Pages

- `apps/views/subjects/index.ejs`
- `apps/views/subjects/detail.ejs`
- `apps/views/exam/start.ejs`

## 3. Routes

- `GET /subjects` → list môn active
- `GET /subjects/:slug` → detail môn + nút “Bắt đầu”
- `GET /exam/start/:subjectSlug` → trang xác nhận start

Files:
- `apps/controllers/subjectcontroller.js`
- `apps/controllers/examcontroller.js` (start)
- `apps/Services/SubjectService.js`
- `apps/Repository/SubjectRepository.js`

## 4. Main flows

### 4.1 List

1. User mở `/subjects`
2. Server load subjects `isActive=true`
3. Render list (name + link slug)

### 4.2 Detail

1. User mở `/subjects/:slug`
2. Server tìm subject theo slug
3. Render mô tả + examConfig
4. User bấm “Bắt đầu làm bài”

### 4.3 Start

1. User mở `/exam/start/:subjectSlug`
2. Server lấy subject, hiển thị confirm
3. User bấm “Generate đề” (POST)

## 5. Acceptance criteria

- AC1: `/subjects` chỉ hiển thị môn `isActive=true`
- AC2: `/subjects/:slug` 404 nếu không tồn tại
- AC3: Start page hiển thị đúng `subject._id` để generate

## 6. Work items (cần làm tiếp)

- Nâng UI: search/filter theo tags (optional)
- Đảm bảo slug chuẩn (có thể auto slugify ở admin tạo môn)



