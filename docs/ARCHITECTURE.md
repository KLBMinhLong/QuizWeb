# ARCHITECTURE (Pattern giống Lab3)

## 1. Mục tiêu

Xây dựng web ôn thi trắc nghiệm cho các môn đại học. Hệ thống ưu tiên **đơn giản, dễ đọc code, dễ tách lớp**, render bằng EJS.

## 2. Tech stack

- Node.js + Express
- View: EJS
- DB: MongoDB (mongodb driver) — giống `Lab3`
- Auth: JWT + bcrypt (token lưu cookie httpOnly ở MVP)
- Import: multer + xlsx (giai đoạn sau)

## 3. Kiến trúc thư mục

- `app.js`: entrypoint (middleware, static, mount controllers, setup EJS)
- `Config/Setting.json`: cấu hình MongoDB + JWT
- `apps/controllers/`: router/controller
- `apps/Services/`: nghiệp vụ
- `apps/Repository/`: CRUD MongoDB
- `apps/Entity/`: entity class (shape dữ liệu)
- `apps/Database/Database.js`: tạo MongoClient
- `apps/views/`: EJS templates + partial
- `public/`: static assets

## 4. Luồng xử lý request (server-render)

1. `app.js` mount `apps/controllers/index.js`
2. Controller nhận request, validate, gọi service
3. Service gọi repository để thao tác DB
4. Controller trả `res.render(view, model)`

## 5. Module MVP

- Auth: register/login/logout + role
- Subjects: list/detail + cấu hình đề mặc định
- Questions: ngân hàng câu hỏi theo môn (admin CRUD)
- Exams: generate đề theo độ khó + submit + (giai đoạn sau) lưu attempt/history

## 6. Nguyên tắc giữ đơn giản

- Không over-engineer
- Tách lớp đúng vai trò
- Config để trong `Setting.json` (sau này mới thêm `.env`)



