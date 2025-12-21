# US-22 - Subject Comments (Bình luận theo môn học)

## 1. Actor

- Guest (đọc bình luận) - Không cần đăng nhập
- User (đăng bình luận) - Cần permission `comments.write`
- Admin/Moderator (moderate: xoá/ẩn bình luận) - Cần permission `comments.moderate`

## 2. Mục tiêu

- Hiển thị danh sách bình luận ngay trên trang chi tiết môn (`/subjects/:slug`)
- User đăng nhập có thể viết bình luận
- Không cho spam cơ bản (validate + rate-limit đơn giản theo phiên — optional)

## 3. UI Pages

- `apps/views/subjects/detail.ejs` (thêm section “Bình luận”)

UI theo `docs/UI_DESIGN.md`:
- Section comment là một card (nền trắng, bo góc, shadow nhẹ)
- Form input + button theo style chung
- Breadcrumb vẫn giữ: `Trang chủ > Môn học > <Tên môn>`

## 4. Routes

### 4.1 Public

- `GET /subjects/:slug` → trả về trang detail + comments

### 4.2 Comment actions

- `POST /subjects/:slug/comments` → tạo bình luận (requireAuth)
- (optional) `POST /subjects/:slug/comments/:id/delete` → xoá (requireAdmin hoặc owner)

## 5. Data / DB

### 5.1 Collection: `subjectComments`

- `_id`: ObjectId
- `subjectId`: ObjectId (FK → subjects)
- `userId`: ObjectId (FK → users)
- `usernameSnapshot`: String (để render nhanh, tránh query join)
- `content`: String
- `status`: "visible" | "hidden" | "deleted"
- `createdAt`: Date
- `updatedAt`: Date

### 5.2 Index gợi ý

- Index: `subjectId + createdAt`
- Index: `userId + createdAt` (optional, phục vụ chống spam)

## 6. Validation rules

- `content`:
  - required
  - trim
  - min length: 1
  - max length: 500 (hoặc 1000, tuỳ bạn)
- Chỉ user `trangThai=active` mới được post

## 7. Main flows

### 7.1 Hiển thị bình luận

1. User mở `/subjects/:slug`
2. Server load subject theo slug
3. Server load comments theo `subjectId`, `status=visible`, sort `createdAt desc`
4. Render danh sách bình luận dưới phần mô tả môn

### 7.2 Post bình luận

1. User đăng nhập (token cookie)
2. Submit form comment
3. Controller validate `content`
4. Service:
   - verify subject tồn tại
   - insert `subjectComments` với `usernameSnapshot`
5. Redirect về `/subjects/:slug` (anchor `#comments` nếu muốn)

### 7.3 (Optional) Xoá/ẩn

- Admin có thể ẩn/xoá comment spam bằng status `hidden/deleted`

## 8. Phân quyền (Permissions)

### Routes Protection
- `GET /subjects/:slug` - Public (không cần đăng nhập)
- `POST /subjects/:slug/comments` - Yêu cầu:
  - `requireAuth` - Đăng nhập
  - Permission `comments.write`
- `POST /subjects/:slug/comments/:id/delete` - Yêu cầu:
  - `requireAuth` - Đăng nhập
  - Permission `comments.moderate` HOẶC là owner của comment
- `POST /subjects/:slug/comments/:id/hide` - Yêu cầu:
  - `requireAuth` - Đăng nhập
  - Permission `comments.moderate`

### Permissions chi tiết
- **Xem comments**: Không cần permission (public)
- **Viết comment**: `comments.write`
- **Moderate (xóa/ẩn)**: `comments.moderate`

### Roles có quyền
- **Admin**: `comments.moderate` (có thể xóa/ẩn comments)
- **Moderator**: `comments.moderate` (có thể xóa/ẩn comments)
- **Teacher**: `comments.write` (chỉ viết, không moderate)
- **User**: `comments.write` (chỉ viết, không moderate)
- **Guest**: Không có quyền viết, chỉ xem

## 9. Acceptance criteria

- AC1: Guest xem được comments (read-only)
- AC2: User chưa login post comment → redirect `/auth/login`
- AC3: User không có permission `comments.write` không thể post comment
- AC4: Comment hợp lệ được lưu và hiển thị ngay
- AC5: Comment quá dài/empty bị reject với message rõ ràng
- AC6: Chỉ lấy comment theo đúng subjectId, sort đúng
- AC7: Chỉ user có permission `comments.moderate` hoặc owner mới xóa được comment

## 10. Files liên quan (gợi ý)

- `apps/controllers/subjectcontroller.js` (mở rộng thêm POST comment)
- `apps/Services/SubjectCommentService.js` (khuyến nghị tạo)
- `apps/Repository/SubjectCommentRepository.js` (khuyến nghị tạo)
- `apps/Util/VerifyToken.js` (dùng `requireAuth`)


