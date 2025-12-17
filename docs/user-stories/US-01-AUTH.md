# US-01 - Auth (Register / Login / Logout / Role)

## 1. Actors

- Guest
- User
- Admin

## 2. Mục tiêu

- Guest đăng ký/đăng nhập để trở thành User
- Admin đăng nhập để vào khu vực quản trị
- Bảo vệ route admin bằng role

## 3. UI Pages (EJS)

- `apps/views/auth/register.ejs`
- `apps/views/auth/login.ejs`

## 4. Routes (Controller)

- `GET /auth/register` → render form
- `POST /auth/register` → tạo user
- `GET /auth/login` → render form
- `POST /auth/login` → set cookie token
- `GET /auth/logout` → clear cookie

Files:
- `apps/controllers/authcontroller.js`
- `apps/Services/AuthService.js`
- `apps/Repository/UserRepository.js`

## 5. Data / DB

Collection: `users`

Rules:
- `username` unique, `email` unique
- password lưu `passwordHash` (bcrypt)
- `role` mặc định `"user"`

## 6. Main flows

### 6.1 Register

1. Guest mở `/auth/register`
2. Nhập `username`, `email`, `password`
3. Submit
4. Server validate:
   - username not empty
   - email hợp lệ
   - password >= 6
5. Server check trùng username/email
6. Hash password, insert user
7. Redirect `/auth/login`

### 6.2 Login

1. Guest mở `/auth/login`
2. Nhập `username`, `password`
3. Server verify user tồn tại + bcrypt compare
4. Tạo JWT với payload `{ userId, role, username }`
5. Set cookie `token` (httpOnly)
6. Redirect `/`

### 6.3 Logout

1. User bấm logout
2. Server clear cookie `token`
3. Redirect `/`

## 7. Acceptance criteria

- AC1: Không thể đăng ký nếu trùng username/email
- AC2: Không thể đăng nhập nếu sai password
- AC3: User bị `status=blocked` không đăng nhập được
- AC4: Cookie `token` được set và có thể đọc/verify ở middleware

## 8. Work items (cần làm tiếp)

- Middleware `requireAuth` (verify JWT từ cookie)
- Middleware `requireAdmin` (role=admin)
- Dùng middleware ở `/admin/*`
- Hiển thị trạng thái login ở header (ẩn/hiện link Login/Logout)



