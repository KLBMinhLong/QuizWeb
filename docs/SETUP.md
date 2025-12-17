# SETUP (Local)

## 1. Yêu cầu

- Node.js LTS
- MongoDB local hoặc Atlas

## 2. Cấu hình

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



