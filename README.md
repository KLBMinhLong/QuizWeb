# QuizWeb - OnThiTracNghiem

Web ôn thi trắc nghiệm dùng Node.js + Express + EJS:

`app.js` → `apps/controllers` → `apps/Services` → `apps/Repository` → `apps/Entity` → EJS views

## 1. Docs

Toàn bộ tài liệu nằm trong `docs/`:

- `docs/ARCHITECTURE.md`
- `docs/SETUP.md`

## 2. Chạy local

```bash
npm install
node app.js
```

Mặc định: `http://localhost:3000`

## 3. Cấu hình MongoDB

Sửa `Config/Setting.json`:

- `mongodb.uri`
- `mongodb.database`
- `auth.jwtSecret`



