# US-90 - Non-functional / Security / Quality

## 1. Security tối thiểu

- Password luôn bcrypt hash
- JWT secret không hardcode khi deploy (đưa vào env hoặc Setting.json riêng)
- Cookie token: `httpOnly` (khuyến nghị thêm `secure` + `sameSite` khi chạy HTTPS/production)
- Admin routes bảo vệ bằng role

## 2. Data integrity

- Generate đề: không gửi đáp án đúng ra client
- Submit: chấm điểm server-side dựa snapshot

## 3. Logging & error

- Giai đoạn đầu: log console đơn giản
- Khi hệ thống ổn định hơn: có thể thêm logger (winston/pino) để ghi file, phân cấp level

## 4. Performance

- Index `questions` theo `subjectId + difficulty`
- Index `examAttempts` theo `userId + startedAt`



