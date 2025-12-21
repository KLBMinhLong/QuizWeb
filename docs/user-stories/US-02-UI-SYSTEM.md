# US-02 - UI System (Theme / Layout / Breadcrumb)

## 1. Mục tiêu

- UI đồng nhất toàn dự án: màu sắc, card, button, spacing
- Có breadcrumb chuẩn trên các trang detail/flow
- Khi code EJS mới, chỉ cần “copy pattern” từ doc này để không lệch style

## 2. Actors

- Dev
- User
- Admin

## 3. Tài liệu chuẩn

- Quy ước UI: `docs/UI_DESIGN.md` (palette, card, button, breadcrumb…)

## 4. Scope áp dụng

Áp dụng cho các trang:

- Public: `home.ejs`, `subjects/index.ejs`, `subjects/detail.ejs`, `exam/*`, `auth/*`
- Admin: `admin/dashboard.ejs`, `admin/subjects.ejs`, `admin/questions.ejs`, `admin/users.ejs`

## 5. Breadcrumb rules

- Luôn đặt breadcrumb phía trên H1
- Pattern:
  - Trang list: `Trang chủ > Môn học`
  - Trang detail môn: `Trang chủ > Môn học > <Tên môn>`
  - Trang exam: `Trang chủ > Môn học > <Tên môn> > Làm bài`
  - Admin: `Trang chủ > Quản trị > <Màn hình>`

## 6. Acceptance criteria

- AC1: Có CSS theme chung (các biến màu + component styles)
- AC2: Breadcrumb hiển thị đúng & nhất quán
- AC3: Button chính/secondary/card dùng style chung

## 7. Files liên quan (gợi ý)

- `public/css/theme.css` (khuyến nghị tạo nếu chưa có)
- `apps/views/partical/header.ejs` (link CSS theme)
- Các view trong `apps/views/**`


