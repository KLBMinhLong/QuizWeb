# US-13 - Admin Users (List / Block / Assign Roles)

## 1. Actor

- Admin

## 2. Mục tiêu

- Admin xem danh sách users
- Admin block/unblock (đổi `trangThai`)
- Admin gán/bỏ role cho user (many-to-many)

## 3. UI Pages

- (cần tạo) `apps/views/admin/users.ejs`

## 4. Routes (gợi ý)

- `GET /admin/users` (filter theo `trangThai`, search username/email)
- `POST /admin/users/:id/block`
- `POST /admin/users/:id/unblock`
- `POST /admin/users/:id/roles/add`
- `POST /admin/users/:id/roles/remove`

## 5. Data

- `users.trangThai`: "active" | "blocked" | "inactive"
- `userRoles` liên kết tới `roles`

## 6. Acceptance criteria

- AC1: Chỉ admin truy cập được
- AC2: User bị `blocked` không login được (đã enforce trong `AuthService.login`)
- AC3: Assign/remove role cập nhật đúng trong `userRoles`

## 7. Files liên quan (gợi ý)

- `apps/controllers/admin/usermanagecontroller.js` (cần tạo)
- `apps/Repository/UserRepository.js`
- `apps/Repository/RoleRepository.js`
- `apps/Repository/UserRoleRepository.js`


