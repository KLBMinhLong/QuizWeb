# US-32 - Admin Questions Import (XLSX)

## 1. Actor

- Admin (hoặc user có permission `questions.write`)

## 2. Mục tiêu

- Import nhiều câu hỏi từ Excel (xlsx)
- Validate theo US-30, báo lỗi theo dòng

## 3. Routes (gợi ý)

- `POST /admin/questions/import`

## 4. Input file format (đề xuất)

- Sheet `Questions`
- Columns:
  - `subjectSlug`
  - `difficulty` (easy|medium|hard)
  - `type`
  - `content`
  - `answersJson` (JSON string theo schema US-30)

## 5. Phân quyền (Permissions)

### Routes Protection
- Route `/admin/questions/import` được bảo vệ bởi:
  - `requireAuth` - Yêu cầu đăng nhập
  - `requireAdmin` - Yêu cầu role admin (hoặc có permission `questions.write`)

### Permissions chi tiết
- **Import questions**: `questions.write`

### Roles có quyền
- **Admin**: Có quyền import (questions.write)
- **Moderator**: Có quyền import (questions.write)
- **Teacher**: Có quyền import (questions.write)
- **User**: Không có quyền import

## 6. Acceptance criteria

- AC1: Import thành công tạo N câu
- AC2: Dòng invalid không crash; trả báo cáo lỗi (row + message)
- AC3: Không cho import vào subject không tồn tại
- AC4: Chỉ user có permission `questions.write` mới import được


