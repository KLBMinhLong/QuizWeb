# US-00 - Roadmap & Definition of Done

## 1. Mục tiêu

Chuẩn hoá thứ tự triển khai + tiêu chí “xong” để có thể **code tuần tự dựa trên US** mà không bị thiếu spec.

## 2. Definition of Done (DoD) chung

- Có route/controller/service/repository tương ứng (đúng `docs/CODING_GUIDE.md`)
- Có trang EJS tương ứng (nếu là UI feature)
- Validate input tối thiểu ở controller (express-validator)
- Không crash server; lỗi trả message hợp lý
- Log lỗi tối thiểu ở server (console)
- Tài liệu US cập nhật đúng với code (không “nói một đằng code một nẻo”)

## 3. Thứ tự triển khai khuyến nghị (code theo thứ tự này)

> Tick khi hoàn thành. Mỗi US đều có Acceptance Criteria để tự check.

- [x] **US-01** Foundation setup/config (dotenv/env + Mongo)
- [ ] **US-02** UI System (theme, breadcrumb, card/button thống nhất)
- [ ] **US-10** Auth Identity core (register/login/logout + roles many-to-many)
- [ ] **US-11** Middleware guards (requireAuth/requireAdmin + header login state)
- [ ] **US-21** Admin Subjects (CRUD + examConfig + isActive)
- [ ] **US-22** Subject comments (bình luận theo môn, requireAuth khi post)
- [ ] **US-31** Admin Questions CRUD (tạo/sửa/xoá + filter)
- [ ] **US-30** Questions model/validation (chuẩn hoá schema answers + validate theo type)
- [ ] **US-40** Exam generate & attempt snapshot (server-side đúng chuẩn)
- [ ] **US-42** Exam submit & scoring (chấm server-side theo snapshot)
- [ ] **US-41** Exam take UI (timer/UX đồng nhất UI system)
- [ ] **US-43** Exam history (list/detail)
- [ ] **US-12/US-13** Admin Roles/Users (phân quyền & quản lý user nâng cao)
- [ ] **US-32** Import questions (nâng cấp)
- [ ] **US-90** Non-functional (index, security hardening, logging nâng cao)

## 4. Tài liệu tham chiếu

- Kiến trúc: `docs/ARCHITECTURE.md`
- Data model: `docs/DATA_MODEL.md`
- Coding rules: `docs/CODING_GUIDE.md`
- UI rules: `docs/UI_DESIGN.md`


