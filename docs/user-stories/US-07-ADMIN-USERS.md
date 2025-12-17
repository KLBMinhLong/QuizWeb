# US-07 - Admin Users (List / Block)

## 1. Actor

- Admin

## 2. Mục tiêu

- Admin xem danh sách users
- Admin block/unblock user

## 3. UI Pages

- (cần thêm) `apps/views/admin/users.ejs`

## 4. Routes

- `GET /admin/users`
- `POST /admin/users/:id/block`
- `POST /admin/users/:id/unblock`

## 5. Acceptance criteria

- AC1: Chỉ admin truy cập được
- AC2: User bị block không đăng nhập được



