# US-11 - Auth: Middleware Guards (requireAuth / requireAdmin / optionalAuth)

## 1. Mục tiêu

- Chuẩn hoá verify JWT và gắn `req.user`
- Bảo vệ `/admin/*` bằng role admin
- Header/UI có thể biết trạng thái login (ẩn/hiện Login/Logout)

## 2. Middleware

File: `apps/Util/VerifyToken.js`

Yêu cầu:
- `verifyToken(token)` trả payload hoặc null
- `requireAuth`:
  - đọc token từ cookie `token` hoặc `Authorization: Bearer ...`
  - nếu fail → clear cookie + redirect `/auth/login`
  - nếu ok → gắn `req.user = { userId, username, role, roles }`
- `requireAdmin`:
  - check `req.user.role === "admin"` hoặc `req.user.roles.includes("admin")`
- `optionalAuth`:
  - nếu có token hợp lệ thì gắn `req.user`, không có thì bỏ qua

## 3. Routes cần bảo vệ

- Tất cả `/admin/*` dùng `requireAuth` + `requireAdmin`
- `/exam/history` và `/exam/attempt/:id` dùng `requireAuth`

## 4. Acceptance criteria

- AC1: Không có token → redirect login
- AC2: Token sai/hết hạn → clear cookie, redirect login
- AC3: User không phải admin → 403
- AC4: `req.user.roles` luôn là array (nếu token không có thì default `[]`)

## 5. Files liên quan

- `apps/Util/VerifyToken.js`
- `apps/controllers/admin/*`
- `apps/views/partical/header.ejs` (ẩn/hiện Login/Logout dựa `user`)


