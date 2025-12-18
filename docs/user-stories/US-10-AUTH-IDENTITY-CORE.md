# US-10 - Auth: Identity Core (Register / Login / Logout)

## 1. Actors

- Guest
- User
- Admin

## 2. Mục tiêu

- Đăng ký/đăng nhập/đăng xuất hoạt động ổn định
- Data model users/roles theo Identity-style (many-to-many)
- Token JWT chứa đủ thông tin để authorize (role + roles)

## 3. UI Pages (EJS)

- `apps/views/auth/register.ejs`
- `apps/views/auth/login.ejs`

## 4. Routes

- `GET /auth/register`
- `POST /auth/register`
- `GET /auth/login`
- `POST /auth/login`
- `GET /auth/logout`

## 5. Data / DB

Xem `docs/DATA_MODEL.md` và chi tiết Identity trong `users`, `roles`, `userRoles`, …

Rules:
- `username` unique, `email` unique (so sánh không phân biệt hoa thường bằng normalized)
- Password lưu `passwordHash` (bcrypt)
- User mới đăng ký được gán role `"user"` qua `userRoles`

## 6. Main flows

### 6.1 Register

1. Validate input
2. Check trùng username/email
3. Hash password
4. Insert `users`
5. Ensure role `"user"` tồn tại trong `roles`
6. Insert `userRoles` (gán `"user"`)
7. Redirect `/auth/login`

### 6.2 Login

1. Validate input
2. Find user theo username (normalized)
3. Check `trangThai` != blocked/inactive
4. bcrypt compare
5. Load roles từ `userRoles` + `roles`
6. Sign JWT payload:
   - `userId`, `username`
   - `role` (primary, backward compatible)
   - `roles` (array tất cả role)
7. Set cookie `token` (httpOnly)
8. Redirect `/`

### 6.3 Logout

- Clear cookie `token`, redirect `/`

## 7. Acceptance criteria

- AC1: Không thể đăng ký nếu trùng username/email
- AC2: Không thể đăng nhập nếu sai password
- AC3: User `trangThai=blocked|inactive` không login được
- AC4: JWT có `role` + `roles`

## 8. Files liên quan

- `apps/controllers/authcontroller.js`
- `apps/Services/AuthService.js`
- `apps/Repository/UserRepository.js`
- `apps/Repository/RoleRepository.js`
- `apps/Repository/UserRoleRepository.js`


