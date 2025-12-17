# US-90 - Non-functional / Security / Quality

## 1. Security tối thiểu

- Password luôn bcrypt hash
- JWT secret không hardcode khi deploy (đưa vào env hoặc Setting.json riêng)
- Cookie token: `httpOnly` (phase 2 thêm `secure` + `sameSite`)
- Admin routes bảo vệ bằng role

## 2. Data integrity

- Generate đề: không gửi đáp án đúng ra client
- Submit: chấm điểm server-side dựa snapshot

## 3. Logging & error

- MVP: log console
- Phase 2: thêm logger (winston/pino)

## 4. Performance

- Index `questions` theo `subjectId + difficulty`
- Index `examAttempts` theo `userId + startedAt`



