# DATA MODEL (Subject-only)

Mục tiêu: schema tối thiểu đủ chạy MVP, tránh phức tạp.

## 1. `users`

- `_id`: ObjectId
- `username`: String (unique)
- `email`: String (unique)
- `passwordHash`: String
- `role`: "user" | "admin"
- `status`: "active" | "blocked"
- `createdAt`, `updatedAt`: Date
- `lastLoginAt`: Date (optional)

## 2. `subjects`

- `_id`: ObjectId
- `name`: String
- `slug`: String (unique)
- `description`: String
- `isActive`: Boolean
- `tags`: [String]
- `examConfig`: `{ easyCount, mediumCount, hardCount, durationMinutes }`
- `createdAt`, `updatedAt`: Date

## 3. `questions`

- `_id`: ObjectId
- `subjectId`: ObjectId
- `difficulty`: "easy" | "medium" | "hard"
- `type`: "single_choice" | "multiple_choice" | "true_false" | "fill_in_blank" | "matching"
- `content`: String
- `mediaUrl`: String (optional)
- `answers`: Mixed (tuỳ type)
- `createdAt`, `updatedAt`: Date

## 4. `examAttempts` (phase 2)

MVP hiện mới demo luồng generate/submit. Khi vào phase 2 sẽ thêm collection này để lưu attempt/history.



