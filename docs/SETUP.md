# SETUP (Local)

## 1. Yêu cầu

- Node.js LTS
- MongoDB local hoặc Atlas

## 2. Cấu hình

Khuyến nghị dùng biến môi trường / `.env` để tránh lộ secret lên GitHub.

### Cách 1: `.env` (khuyến nghị)

Tạo file `.env` ở root project:

```
MONGODB_URI="mongodb+srv://..."
MONGODB_DB="onthitracnghiem"
JWT_SECRET="YOUR_SECRET"
JWT_EXPIRES_IN="7d"
```

Và đảm bảo `app.js` có:

```js
require("dotenv").config();
```

### Cách 2: `Config/Setting.json` (chỉ dùng local/demo)

Sửa `Config/Setting.json`:

- `mongodb.uri`: URI MongoDB
- `mongodb.database`: tên database
- `auth.jwtSecret`: JWT secret

## 3. Chạy

```bash
npm install
node app.js
```

Mặc định: `http://localhost:3000`



