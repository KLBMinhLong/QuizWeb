# UI DESIGN GUIDE

Tài liệu này mô tả **style UI thống nhất** cho toàn bộ web ôn thi, để khi code EJS/CSS đều cùng “một ngôn ngữ thiết kế”.
Tham chiếu từ UI mẫu (tông xanh lá, card mềm, shadow nhẹ) nhưng được đơn giản hoá cho project hiện tại.

---

## 1. Tông màu & cảm giác tổng thể

- **Mood chung**: sáng sủa, nhẹ nhàng, tạo cảm giác học tập thoải mái.
- **Màu chính (primary)**: xanh lá dịu.
  - `--color-primary`: `#22c55e` (xanh lá tươi, dùng cho nút chính, icon).
  - `--color-primary-dark`: `#16a34a` (hover / active).
  - `--color-primary-soft`: `#dcfce7` (nền card nhẹ, badge).
- **Màu nền (background)**:
  - `--color-bg-page`: `#f4f7f5` (xám xanh rất nhạt, tránh trắng “gắt”).
  - `--color-bg-card`: `#ffffff`.
- **Màu text**:
  - `--color-text-main`: `#14532d` (xanh đậm).
  - `--color-text-muted`: `#64748b` (xám xanh).
  - `--color-text-invert`: `#ffffff` (trên nút xanh).
- **Màu trạng thái khó/dễ** (dùng cho phân bố câu hỏi, badge):
  - `--color-easy`: `#22c55e` (xanh lá).
  - `--color-medium`: `#eab308` (vàng).
  - `--color-hard`: `#ef4444` (đỏ).

> Khi code CSS, nên định nghĩa các biến trên trong một file chung, ví dụ `public/css/theme.css`.

---

## 2. Layout chung

- **Chiều rộng nội dung**:
  - Dùng container giữa màn hình, max-width khoảng `1200px`.
  - Canh giữa bằng `margin: 0 auto; padding: 24px;`.
- **Bố cục trang chi tiết môn (subject detail)**:
  - Bên trái: tiêu đề, mô tả, meta (ngày cập nhật, tổng số câu hỏi, độ phổ biến, thời gian thi).
  - Bên phải: card “Phân bố câu hỏi” + nút “Bắt đầu luyện thi”.
  - Dùng layout 2 cột: `display: grid; grid-template-columns: 2fr 1.2fr; gap: 32px;` trên desktop, chuyển về 1 cột trên mobile.

---

## 3. Breadcrumb (điều hướng cấp bậc)

### 3.1 Cấu trúc nội dung

- Breadcrumb luôn hiển thị ở đầu trang, phía trên tiêu đề lớn.
- Ví dụ cho trang chi tiết môn:
  - `Trang chủ > Chủ đề > Lịch sử Việt Nam`
- Mỗi item:
  - Item trước là **link** (`a`), item cuối là **text** (không click).

### 3.2 Gợi ý HTML (EJS)

```html
<nav class="breadcrumb">
  <a href="/" class="breadcrumb__item">Trang chủ</a>
  <span class="breadcrumb__separator">›</span>
  <a href="/subjects" class="breadcrumb__item">Chủ đề</a>
  <span class="breadcrumb__separator">›</span>
  <span class="breadcrumb__item breadcrumb__item--current"><%= subject.name %></span>
</nav>
```

### 3.3 Gợi ý CSS

```css
.breadcrumb {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: var(--color-text-muted);
  margin-bottom: 16px;
}

.breadcrumb__item {
  color: var(--color-text-muted);
  text-decoration: none;
}

.breadcrumb__item:hover {
  color: var(--color-primary);
}

.breadcrumb__item--current {
  font-weight: 600;
  color: var(--color-text-main);
}

.breadcrumb__separator {
  opacity: 0.6;
}
```

---

## 4. Card & khối thông tin

- Card dùng nhiều cho:
  - Khối “Phân bố câu hỏi” (dễ / trung bình / khó / tổng).
  - Khối tổng quan môn học, danh sách môn.
- Style chung:
  - Nền trắng hoặc màu rất nhạt (`--color-primary-soft`).
  - Bo góc: `border-radius: 24px` cho card lớn, `16px` cho ô nhỏ.
  - Bóng đổ nhẹ: `box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08);`.
  - Padding thoáng: `24px`–`32px`.

### Ví dụ CSS cho card phân bố câu hỏi

```css
.question-distribution {
  background: #ffffff;
  border-radius: 24px;
  padding: 24px;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08);
}

.question-distribution__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.question-stat {
  border-radius: 18px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.question-stat--easy {
  background: #ecfdf3;
  color: var(--color-easy);
}

.question-stat--medium {
  background: #fef9c3;
  color: var(--color-medium);
}

.question-stat--hard {
  background: #fee2e2;
  color: var(--color-hard);
}

.question-stat--total {
  background: #ecfeff;
  color: var(--color-text-main);
}

.question-stat__number {
  font-size: 32px;
  font-weight: 700;
}

.question-stat__label {
  font-size: 14px;
  margin-top: 4px;
}
```

---

## 5. Nút (Buttons)

- Nút chính: dùng cho hành động quan trọng (ví dụ “Bắt đầu luyện thi”).
  - Nền: `--color-primary`.
  - Chữ: trắng.
  - Bo góc lớn: `border-radius: 999px` (pill).
  - Padding: `padding: 14px 32px;`.
  - Font: `font-weight: 600;`.

### HTML gợi ý

```html
<button class="btn btn-primary">
  Bắt đầu luyện thi
</button>
```

### CSS gợi ý

```css
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  cursor: pointer;
  font-weight: 600;
  transition: transform 0.15s ease, box-shadow 0.15s ease, background-color 0.15s ease;
}

.btn-primary {
  background-color: var(--color-primary);
  color: var(--color-text-invert);
  border-radius: 999px;
  padding: 14px 32px;
  box-shadow: 0 10px 25px rgba(34, 197, 94, 0.35);
}

.btn-primary:hover {
  background-color: var(--color-primary-dark);
  transform: translateY(-1px);
  box-shadow: 0 14px 35px rgba(22, 163, 74, 0.4);
}

.btn-primary:active {
  transform: translateY(0);
  box-shadow: 0 8px 20px rgba(22, 163, 74, 0.3);
}
```

---

## 6. Typography & khoảng cách

- Font chữ: tuỳ môi trường, có thể dùng stack:
  - `font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;`
- Heading:
  - Tiêu đề trang (H1): 32–40px, đậm, màu `--color-text-main`.
  - Heading phụ (H2): 20–24px.
- Đoạn mô tả:
  - Font-size: 16px, line-height ~1.6, màu `--color-text-muted`.
- Khoảng cách:
  - Giữa các section chính: `margin-top: 32px`–`40px`.
  - Giữa tiêu đề & nội dung: `margin-bottom: 12px`–`16px`.

---

## 7. Áp dụng vào EJS hiện tại

Khi code các view trong `apps/views`:

- Luôn:
  - Include **header/footer** chung (đã có `apps/views/partical/header.ejs` / `footer.ejs`).
  - Trong `header.ejs`, link tới file CSS theme chung (`/static/css/theme.css`).
- Với các trang:
  - `subjects/index.ejs`: dùng card cho từng môn, nút “Luyện ngay”.
  - `subjects/detail.ejs`: áp dụng layout 2 cột, breadcrumb, card phân bố câu hỏi, nút “Bắt đầu luyện thi”.
  - `exam/start.ejs`, `exam/take.ejs`: dùng cùng palette màu, button style đồng nhất.

Mục tiêu: **dù sau này bạn mở rộng chức năng hay làm UI phức tạp hơn, màu sắc / layout / breadcrumb / nút vẫn thống nhất theo file này**.

---

## 8. Comments (bình luận) – style gợi ý

Áp dụng cho section “Bình luận” trên trang chi tiết môn (`/subjects/:slug`):

- Comment section là một card giống các card khác.
- Avatar có thể là chữ cái đầu (A, B, C) trong vòng tròn nền `--color-primary-soft`.
- Form gồm textarea + nút submit (primary).

### HTML gợi ý (EJS)

```html
<section class="comments" id="comments">
  <h3 class="comments__title">Bình luận</h3>

  <form class="comment-form" method="post" action="/subjects/<%= subject.slug %>/comments">
    <textarea name="content" class="comment-form__input" rows="3" placeholder="Viết bình luận..."></textarea>
    <div class="comment-form__actions">
      <button class="btn btn-primary" type="submit">Gửi bình luận</button>
    </div>
  </form>

  <div class="comment-list">
    <% comments.forEach(function(c){ %>
      <div class="comment-item">
        <div class="comment-item__avatar"><%= (c.usernameSnapshot || "?").slice(0,1).toUpperCase() %></div>
        <div class="comment-item__body">
          <div class="comment-item__meta">
            <span class="comment-item__user"><%= c.usernameSnapshot %></span>
            <span class="comment-item__time"><%= c.createdAt %></span>
          </div>
          <div class="comment-item__content"><%= c.content %></div>
        </div>
      </div>
    <% }) %>
  </div>
</section>
```

### CSS gợi ý

```css
.comments {
  margin-top: 32px;
  background: var(--color-bg-card);
  border-radius: 24px;
  padding: 24px;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08);
}

.comment-form__input {
  width: 100%;
  border: 1px solid rgba(15, 23, 42, 0.12);
  border-radius: 16px;
  padding: 14px 16px;
  outline: none;
  resize: vertical;
}

.comment-form__input:focus {
  border-color: rgba(34, 197, 94, 0.6);
  box-shadow: 0 0 0 4px rgba(34, 197, 94, 0.15);
}

.comment-form__actions {
  margin-top: 12px;
  display: flex;
  justify-content: flex-end;
}

.comment-item {
  display: flex;
  gap: 12px;
  padding: 14px 0;
  border-top: 1px solid rgba(15, 23, 42, 0.08);
}

.comment-item__avatar {
  width: 40px;
  height: 40px;
  border-radius: 999px;
  background: var(--color-primary-soft);
  color: var(--color-primary-dark);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
}

.comment-item__meta {
  display: flex;
  gap: 10px;
  align-items: baseline;
  color: var(--color-text-muted);
  font-size: 13px;
}

.comment-item__user {
  color: var(--color-text-main);
  font-weight: 600;
}

.comment-item__content {
  margin-top: 6px;
  color: var(--color-text-main);
  line-height: 1.6;
}
```


