# QuizWeb - OnThiTracNghiem

Web ôn thi trắc nghiệm (MVP) dùng Node.js + Express + EJS, code theo pattern đơn giản như `Lab3`:

`app.js` → `apps/controllers` → `apps/Services` → `apps/Repository` → `apps/Entity` → EJS views.

## 1. Docs

Toàn bộ tài liệu nằm trong `docs/`:

- `docs/ARCHITECTURE.md`
- `docs/DATA_MODEL.md`
- `docs/SETUP.md`
- `docs/CODING_GUIDE.md`
- `docs/user-stories/` (tách theo từng chức năng, là các việc cần làm tiếp)

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



