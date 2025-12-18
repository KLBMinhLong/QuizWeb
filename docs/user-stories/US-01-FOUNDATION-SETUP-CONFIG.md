# US-01 - Foundation: Setup / Config / Secrets

## 1. Mục tiêu

- Chạy được local ổn định với MongoDB (local hoặc Atlas)
- Không lộ secret lên GitHub (Mongo URI / JWT secret)
- Cấu hình nhất quán: ưu tiên env/.env, fallback `Config/Setting.json`

## 2. Actors

- Dev

## 3. Cấu hình bắt buộc

### 3.1 Biến môi trường (khuyến nghị)

- `MONGODB_URI`
- `MONGODB_DB`
- `JWT_SECRET`
- `JWT_EXPIRES_IN` (optional, default `7d`)

### 3.2 File `.env`

Tạo `.env` ở root (đã được ignore trong `.gitignore`):

```
MONGODB_URI="mongodb+srv://..."
MONGODB_DB="onthitracnghiem"
JWT_SECRET="..."
JWT_EXPIRES_IN="7d"
```

> Lưu ý: nếu môi trường editor của bạn chặn tạo file `.env` trong workspace,
> bạn có thể cấu hình bằng cách copy `Config/Setting.example.json` → `Config/Setting.json`
> và điền giá trị thật (nhớ không commit secret lên GitHub).

### 3.3 Code load dotenv

Trong `app.js` phải có:

```js
require("dotenv").config();
```

## 4. Acceptance criteria

- AC1: `npm install` chạy OK
- AC2: App dùng Mongo URI từ `process.env.MONGODB_URI` nếu có
- AC3: JWT dùng `process.env.JWT_SECRET` nếu có
- AC4: `.env` không bị commit lên GitHub

## 5. Files liên quan

- `app.js`
- `apps/Database/Database.js`
- `apps/Services/AuthService.js`
- `apps/Util/VerifyToken.js`
- `.gitignore`
- `docs/SETUP.md`
- `Config/Setting.example.json`


