# US-00 - Overview (Backlog & Definition)

## 1. Mục tiêu MVP

User có thể:

- Xem danh sách môn học (Subject)
- Xem chi tiết môn học
- Generate đề theo cấu hình độ khó (easy/medium/hard)
- Làm bài trên UI và nộp bài để nhận kết quả

Admin có thể:

- Tạo môn học (Subject)
- (Phase tiếp) tạo câu hỏi

## 2. Definition of Done (DoD) chung

- Có route/controller/service/repository tương ứng
- Có trang EJS tương ứng
- Validate input tối thiểu
- Không crash server, có thông báo lỗi cơ bản

## 3. Thứ tự triển khai khuyến nghị

1. US-05 Admin Subjects (tạo môn)
2. US-06 Admin Questions (tạo câu hỏi cho môn)
3. US-02 Subjects (list/detail + start)
4. US-03 Exam (generate/take/submit đúng chuẩn server chấm)
5. US-04 Exam history (lưu attempt)
6. US-01 Auth (enforce login/role cho admin và attempt)

> Lưu ý: hiện code skeleton đã có route/view cơ bản; các US dưới đây mô tả “phiên bản hoàn chỉnh” cần làm tiếp.



