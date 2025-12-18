# CODING GUIDE (hướng đối tượng + pattern rõ ràng)

Tài liệu này là **chuẩn coding** cho toàn bộ project, dùng kiến trúc đơn giản nhưng rõ ràng:  
**Route → Controller → Service → Repository → MongoDB (+ Entity)**.

---

## 1. Kiến trúc & vai trò từng lớp

- **Controller (apps/controllers)**  
  - Nhận request từ Express Router.
  - Validate input (dùng `express-validator`).
  - Gọi **Service** tương ứng.
  - Quyết định **render EJS** hay **trả JSON / redirect**.
  - Không chứa nghiệp vụ phức tạp, không truy vấn Mongo trực tiếp.

- **Service (apps/Services)**  
  - Chứa **nghiệp vụ chính**: auth, generate đề, submit bài, quản lý môn, câu hỏi,…
  - Gọi **Repository** để thao tác DB.
  - Có thể gọi nhiều Repository / Service khác để xử lý 1 use-case.
  - Không render view, không đụng tới `req`, `res`.

- **Repository (apps/Repository)**  
  - Nơi duy nhất thao tác **MongoDB thuần** (`find`, `insertOne`, `updateOne`,…).
  - Mỗi Repository làm việc với **1 collection chính**:  
    `UserRepository` → `users`, `SubjectRepository` → `subjects`,…
  - Không chứa nghiệp vụ; chỉ nên là các hàm CRUD + query phức tạp.

- **Entity (apps/Entity)**  
  - Class mô tả **cấu trúc dữ liệu** (User, Subject, Question, Role,…).
  - Chủ yếu để tham khảo, tư duy OOP; DB thực tế dùng plain object khi insert/update.

- **Util (apps/Util)**  
  - Các helper/middleware dùng chung (ví dụ: `VerifyToken.js` cho JWT).

**Nguyên tắc chung**: Controller “mỏng”, Service “dày”, Repository “thuần MongoDB”.

---

## 2. Quy ước đặt tên & cấu trúc thư mục

- **Controller** (`apps/controllers`)
  - `homecontroller.js`, `authcontroller.js`, `subjectcontroller.js`, `examcontroller.js`
  - Admin: `apps/controllers/admin/admincontroller.js`, `subjectmanagecontroller.js`, `questionmanagecontroller.js`

- **Service** (`apps/Services`)
  - `AuthService.js`, `SubjectService.js`, `ExamService.js`, …

- **Repository** (`apps/Repository`)
  - `UserRepository.js`, `SubjectRepository.js`, `QuestionRepository.js`, …
  - Identity-style: `RoleRepository.js`, `UserRoleRepository.js`, `UserClaimRepository.js`,…

- **Entity** (`apps/Entity`)
  - `User.js`, `Subject.js`, `Question.js`, `Role.js`,…

- **Collection MongoDB**
  - `users`, `roles`, `userRoles`, `userClaims`, `roleClaims`, `userLogins`, `userTokens`
  - `subjects`, `questions`, `examAttempts`

---

## 3. Quy ước route

- **Public**:
  - `/` → home
  - `/subjects` → list môn
  - `/subjects/:slug` → detail môn
  - `/exam/start/:subjectSlug` → trang bắt đầu làm bài
  - `/exam/generate` → generate đề (POST)
  - `/exam/submit` → submit bài (POST)
  - `/auth/login`, `/auth/register`, `/auth/logout`

- **Admin** (bảo vệ bằng middleware):
  - `/admin` → dashboard
  - `/admin/subjects` → quản lý môn
  - `/admin/questions` → quản lý câu hỏi

Route chỉ nên **điều hướng và gọi controller**; mọi logic để trong controller/service.

---

## 4. Chuẩn code cho Auth (theo US-01-AUTH + Identity style)

- **Collections chính** (xem chi tiết trong `docs/user-stories/US-01-AUTH.md`):
  - `users`, `roles`, `userRoles`, `userClaims`, `roleClaims`, `userLogins`, `userTokens`.

- **Đăng ký (`POST /auth/register`)**
  1. Controller validate `username`, `email`, `password` (express-validator).
  2. Gọi `AuthService.register(username, email, password)`.
  3. Service:
     - Check trùng username/email (dùng normalized).
     - Hash password (bcrypt).
     - Tạo user với các field chuẩn (normalizedUserName, normalizedEmail, concurrencyStamp,…).
     - Đảm bảo role `"user"` tồn tại, gán role qua `userRoles`.
  4. Redirect `/auth/login`.

- **Đăng nhập (`POST /auth/login`)**
  1. Controller validate input, gọi `AuthService.login(username, password)`.
  2. Service:
     - Tìm user theo username (normalized, không phân biệt hoa/thường).
     - Kiểm tra trạng thái (không bị blocked/inactive).
     - So sánh password (bcrypt).
     - Lấy roles của user từ `userRoles` + `roles`.
     - Tạo JWT: `{ userId, username, role, roles }`.
  3. Controller set cookie `token` (httpOnly) và redirect `/`.

- **Logout (`GET /auth/logout`)**
  - Clear cookie `token`, redirect `/`.

---

## 5. Middleware JWT & bảo vệ route

- File: `apps/Util/VerifyToken.js`
  - **`verifyToken(token)`**: verify JWT, trả về payload hoặc `null`.
  - **`requireAuth`**: bắt buộc đăng nhập
    - Lấy token từ cookie `token` hoặc header `Authorization: Bearer <token>`.
    - Nếu token hợp lệ → gán `req.user = { userId, username, role, roles }`.
    - Nếu không → clear cookie + redirect `/auth/login`.
  - **`requireAdmin`**: yêu cầu quyền admin
    - Dùng sau `requireAuth`.
    - Kiểm tra `req.user.role === "admin"` hoặc `req.user.roles.includes("admin")`.
  - **`optionalAuth`**: có cũng được, không có cũng được
    - Nếu có token hợp lệ thì gắn `req.user`, nếu không thì bỏ qua.

**Cách dùng trong controller** (ví dụ):

```js
var { requireAuth, requireAdmin, optionalAuth } = require("../Util/VerifyToken");

// Trang home: optional
router.get("/", optionalAuth, function (req, res) {
  res.render("home.ejs", { user: req.user || null });
});

// Trang profile: phải login
router.get("/profile", requireAuth, function (req, res) {
  // req.user đã có thông tin
  res.render("profile.ejs", { user: req.user });
});

// Admin dashboard: phải login + admin
router.get("/admin", requireAuth, requireAdmin, function (req, res) {
  res.render("admin/dashboard.ejs");
});
```

---

## 6. Error handling (MVP)

- Trong **controller**, luôn bọc logic async trong `try/catch` đơn giản:

```js
router.get("/something", async function (req, res) {
  try {
    // gọi service...
  } catch (e) {
    console.error(e);
    return res.status(500).send("Internal Server Error");
  }
});
```

- Phase 1 (MVP): chỉ cần log lỗi + trả 500 đơn giản hoặc render trang lỗi.
- Phase 2: có thể thêm **middleware error handler** chung để xử lý đẹp hơn.

---

## 7. Style chung khi code

- Ưu tiên **async/await** (không dùng callback thuần).
- Không truy vấn MongoDB trực tiếp trong controller/service – luôn đi qua Repository.
- Không nhúng string SQL/Mongo dài trong controller; nếu query phức tạp → cho vào Repository.
- Tên biến, tên hàm rõ nghĩa, tiếng Anh (trừ message hiển thị cho user có thể tiếng Việt).
- Comment ngắn gọn ở những đoạn logic quan trọng (đặc biệt ở Service).

Tài liệu này + các `US-*` trong `docs/user-stories/` là **chuẩn tham chiếu** để bạn code các chức năng tiếp theo (auth, admin, exam, subjects, questions).