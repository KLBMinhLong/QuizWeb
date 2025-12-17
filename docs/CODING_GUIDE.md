# CODING GUIDE (giống style Lab3)

## 1. Nguyên tắc

- **Controller**: điều hướng + validate + gọi service + render/json.
- **Service**: nghiệp vụ (generate đề, submit, auth).
- **Repository**: thao tác MongoDB thuần (CRUD).
- **Entity**: class mô tả dữ liệu (optional).

## 2. Quy ước đặt tên

- Controller: `homecontroller.js`, `authcontroller.js`, `subjectcontroller.js`, `examcontroller.js`
- Service: `AuthService.js`, `SubjectService.js`, `ExamService.js`
- Repository: `UserRepository.js`, `SubjectRepository.js`, `QuestionRepository.js`
- Collection: `users`, `subjects`, `questions`, `examAttempts`

## 3. Quy ước route

- Public:
  - `/` home
  - `/subjects` list, `/subjects/:slug` detail
  - `/exam/start/:subjectSlug`, `/exam/generate`, `/exam/submit`
  - `/auth/login`, `/auth/register`, `/auth/logout`
- Admin:
  - `/admin`
  - `/admin/subjects`
  - `/admin/questions`

## 4. Error handling MVP

- Controller dùng try/catch và trả `500` đơn giản.
- Khi sang phase 2: thêm middleware error handler.



