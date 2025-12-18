# US-12 - Admin Roles (CRUD + Assign)

## 1. Actor

- Admin

## 2. Mục tiêu

- Admin quản lý roles (create/list/update/delete)
- Admin gán role cho user (thông qua `userRoles`)

## 3. UI Pages

- (cần tạo) `apps/views/admin/roles.ejs`

## 4. Routes (gợi ý)

- `GET /admin/roles`
- `POST /admin/roles/create`
- `POST /admin/roles/:id/update`
- `POST /admin/roles/:id/delete`

## 5. Data

- `roles`, `userRoles` (xem `docs/DATA_MODEL.md`)

Rules:
- `roles.name` unique (case-insensitive qua `normalizedName`)
- Không cho xoá role `"admin"` nếu đang được dùng (tuỳ chọn)

## 6. Acceptance criteria

- AC1: Chỉ admin truy cập được
- AC2: Tạo role mới OK và không trùng (case-insensitive)
- AC3: Update role có cập nhật `updatedAt`

## 7. Files liên quan (gợi ý)

- `apps/controllers/admin/rolemanagecontroller.js` (cần tạo)
- `apps/Repository/RoleRepository.js`
- `apps/Repository/UserRoleRepository.js`


