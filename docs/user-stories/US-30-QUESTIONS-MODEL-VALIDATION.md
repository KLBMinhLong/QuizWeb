# US-30 - Questions: Model & Server Validation

## 1. Mục tiêu

- Chuẩn hoá schema `questions.answers` theo từng `type`
- Validate server-side khi admin tạo/sửa câu hỏi
- Khi generate đề: dữ liệu trả về client **không chứa đáp án đúng**

## 2. Data

Collection: `questions` (xem `docs/DATA_MODEL.md`)

### 2.1 Types

- `single_choice`
- `multiple_choice`
- `true_false`
- `fill_in_blank`
- `matching`

### 2.2 Answers schema (đề xuất)

#### `single_choice` / `multiple_choice`

`answers` là array:

- `{ text: string, isCorrect: boolean }[]`

Rules:
- >= 2 options
- single_choice: đúng **1** isCorrect=true
- multiple_choice: đúng >=1 isCorrect=true

#### `true_false`

`answers` là:
- `{ value: true|false, isCorrect: boolean }[]` (2 phần tử)

#### `fill_in_blank`

`answers` là:
- `{ accepted: string[] }` (server normalize trim/lower)

#### `matching`

`answers` là:
- `{ pairs: { left: string, right: string }[] }`

## 3. Strip correct answer khi render client

Khi generate đề để render `take.ejs`:
- Không gửi `isCorrect` ra client
- Với `fill_in_blank`/`matching`, chỉ gửi phần cần hiển thị, không gửi đáp án đúng

## 4. Acceptance criteria

- AC1: Admin create/update bị reject nếu answers sai schema
- AC2: Không có đáp án đúng trong payload render client
- AC3: Submit chấm server-side dựa snapshot (xem US-42)


