# US-20 - Subjects Public (List / Detail / Start)

## 1. Actor

- Guest / User

## 2. Mục tiêu

- User xem danh sách môn active
- Xem chi tiết môn (mô tả, examConfig, phân bố câu hỏi)
- Start flow để vào thi

## 3. UI Pages

- `apps/views/subjects/index.ejs`
- `apps/views/subjects/detail.ejs`
- `apps/views/exam/start.ejs`

UI phải theo `docs/UI_DESIGN.md` (card, button, breadcrumb).

## 4. Routes

- `GET /subjects` → list môn active
- `GET /subjects/:slug` → detail môn + nút “Bắt đầu”
- `GET /exam/start/:subjectSlug` → trang xác nhận start

## 5. Main flows

### 5.1 List

1. User mở `/subjects`
2. Server load subjects `isActive=true`
3. Render list (name + link slug)

### 5.2 Detail

1. User mở `/subjects/:slug`
2. Server tìm subject theo slug
3. Render mô tả + examConfig
4. Render phân bố câu hỏi (easy/medium/hard/total) nếu có thể tính nhanh
5. User bấm “Bắt đầu luyện thi”

### 5.3 Start

1. User mở `/exam/start/:subjectSlug`
2. Server lấy subject, hiển thị confirm
3. User bấm “Generate đề” (POST /exam/generate)

## 6. Phân quyền (Permissions)

### Routes Protection
- `GET /subjects` - Public (không cần đăng nhập, nhưng cần permission `subjects.read`)
- `GET /subjects/:slug` - Public (không cần đăng nhập, nhưng cần permission `subjects.read`)
- `GET /exam/start/:subjectSlug` - Public (không cần đăng nhập, nhưng cần permission `exams.read`)

### Permissions chi tiết
- **Xem danh sách subjects**: `subjects.read`
- **Xem chi tiết subject**: `subjects.read`
- **Bắt đầu làm bài**: `exams.read` (hoặc `exams.take`)

### Roles có quyền
- **Admin**: Tất cả permissions (subjects.read, exams.read)
- **Moderator**: `subjects.read`, `exams.read`
- **Teacher**: `subjects.read`, `exams.read`
- **User**: `subjects.read`, `exams.read`, `exams.take`
- **Guest**: Không có quyền (có thể cho phép `subjects.read` nếu muốn)

**Lưu ý**: Hiện tại code dùng `optionalAuth`, có thể nâng cấp sau để check permission cụ thể.

## 7. Acceptance criteria

- AC1: `/subjects` chỉ hiển thị môn `isActive=true`
- AC2: `/subjects/:slug` 404 nếu không tồn tại
- AC3: Detail có breadcrumb đúng: `Trang chủ > Môn học > <Tên môn>`
- AC4: Start page hiển thị đúng `subject._id` để generate
- AC5: User không có permission `subjects.read` không thể xem danh sách môn học
- AC6: User không có permission `exams.read` không thể bắt đầu làm bài

## 8. Files liên quan

- `apps/controllers/subjectcontroller.js`
- `apps/controllers/examcontroller.js` (start)
- `apps/Services/SubjectService.js`
- `apps/Repository/SubjectRepository.js`


