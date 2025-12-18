# US-32 - Admin Questions Import (XLSX)

## 1. Actor

- Admin

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

## 5. Acceptance criteria

- AC1: Import thành công tạo N câu
- AC2: Dòng invalid không crash; trả báo cáo lỗi (row + message)
- AC3: Không cho import vào subject không tồn tại


