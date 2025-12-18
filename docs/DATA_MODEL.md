# DATA MODEL (MongoDB Collections)

Mục tiêu: mô tả **data model đủ rõ để phát triển lâu dài**, vẫn giữ cấu trúc đơn giản theo pattern Controller → Service → Repository.
Chi tiết luồng auth Identity-style xem thêm `docs/user-stories/US-10-AUTH-IDENTITY-CORE.md`.

---

## 1. Identity-style (Auth / Users / Roles)

### 1.1 `users`

- `_id`: ObjectId
- `username`: String (unique)
- `normalizedUserName`: String (uppercase)
- `email`: String (unique)
- `normalizedEmail`: String (uppercase)
- `passwordHash`: String (bcrypt)
- `fullName`: String
- `address`: String
- `dateOfBirth`: Date | null
- `profilePicture`: String
- `ngayTao`: Date
- `tichDiem`: Number
- `trangThai`: "active" | "blocked" | "inactive"
- `concurrencyStamp`: String
- `createdAt`, `updatedAt`: Date
- `lastLoginAt`: Date | null

> `users` không còn lưu `role` trực tiếp; role được quản lý qua `userRoles` (many-to-many).

### 1.2 `roles`

- `_id`: ObjectId
- `name`: String (unique) — ví dụ: "user", "admin"
- `normalizedName`: String (uppercase)
- `description`: String
- `concurrencyStamp`: String
- `createdAt`, `updatedAt`: Date

### 1.3 `userRoles` (many-to-many)

- `_id`: ObjectId
- `userId`: ObjectId (FK → users)
- `roleId`: ObjectId (FK → roles)
- `createdAt`: Date

### 1.4 `userClaims` / `roleClaims`

- `userClaims`: `_id`, `userId`, `claimType`, `claimValue`, `createdAt`
- `roleClaims`: `_id`, `roleId`, `claimType`, `claimValue`, `createdAt`

### 1.5 `userLogins` / `userTokens`

- `userLogins`: external login (Google/Facebook) — `_id`, `loginProvider`, `providerKey`, `providerDisplayName`, `userId`, `createdAt`
- `userTokens`: refresh/reset token — `_id`, `userId`, `loginProvider`, `name`, `value`, `expiresAt?`, `createdAt`, `updatedAt?`

---

## 2. Nội dung học tập

### 2.1 `subjects`

- `_id`: ObjectId
- `name`: String
- `slug`: String (unique) — **tự sinh từ name** (slugify) và đảm bảo unique
- `description`: String
- `isActive`: Boolean
- `tags`: [String]
- `examConfig`: `{ easyCount, mediumCount, hardCount, durationMinutes }`
- `createdAt`, `updatedAt`: Date

### 2.2 `questions`

- `_id`: ObjectId
- `subjectId`: ObjectId
- `difficulty`: "easy" | "medium" | "hard"
- `type`: "single_choice" | "multiple_choice" | "true_false" | "fill_in_blank" | "matching"
- `content`: String
- `mediaUrl`: String (optional)
- `answers`: Mixed (tuỳ type)
- `createdAt`, `updatedAt`: Date

### 2.3 `subjectComments`

Collection bình luận theo môn (xem `docs/user-stories/US-22-SUBJECT-COMMENTS.md`):

- `_id`: ObjectId
- `subjectId`: ObjectId (FK → subjects)
- `userId`: ObjectId (FK → users)
- `usernameSnapshot`: String
- `content`: String
- `status`: "visible" | "hidden" | "deleted"
- `createdAt`, `updatedAt`: Date

---

## 3. Thi & lịch sử

### 3.1 `examAttempts`

Collection này dùng để lưu lịch sử thi (xem `docs/user-stories/US-43-EXAM-HISTORY.md`):

- `_id`: ObjectId
- `userId`: ObjectId
- `subjectId`: ObjectId
- `startedAt`: Date
- `finishedAt`: Date | null
- `durationMinutes`: Number
- `score`: Number
- `totalQuestions`: Number
- `questionsSnapshot`: Array (đề snapshot để chấm server-side)
- `userAnswers`: Object/Array (câu trả lời của user)

---

## 4. Index gợi ý (hiệu năng)

- `questions`: index theo `subjectId + difficulty`
- `examAttempts`: index theo `userId + startedAt`



