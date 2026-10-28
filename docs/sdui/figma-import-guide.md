### Lấy JSON trên MoMo Design

1. Mở [MoMo Design](https://momo-design.mservice.com.vn/), chọn **Create a new project** → nguồn **Figma link**.
2. Trong Figma, chọn đúng **frame hoặc component** cần chuyển → chuột phải → **Copy as → Copy link to selection**. Dán link vào ô **Figma link** trên MoMo Design và chờ hệ thống tạo UI.
3. Mở **Export to Figma** → **Pick screens**, chọn **một** màn hình → **Copy JSON**. Không cần **Send to Figma** hay pairing code.

> Ô JSON ở tab này cần nội dung từ **Copy JSON** (bước 3). Link Figma chỉ dùng trên MoMo Design (bước 2). Mỗi màn hình tạo một SDUI template.

### Phần nào được chuyển

| Trong thiết kế | Thành SDUI | Ghi chú |
|---|---|---|
| View / khung có auto layout | `container` (row / column) | Giữ khoảng cách, căn lề, padding, nền, bo góc, viền |
| ScrollView cuộn ngang | `container` `scrollRow` | ScrollView cuộn **dọc** thành `column` thường |
| Text | `text` | Giữ typography MoMo, màu, số dòng tối đa |
| Image | `image` | Cần URL ảnh HTTP(S); chưa có thì dùng ảnh placeholder |
| Button, Tag, Spacer | `button`, `tag`, `spacer` | Button chỉ được tạo khi nguồn đúng là Button |
| Màu / khoảng cách / bo góc dạng token | Giá trị thật | `Colors.*`, `Spacing.*`, `Radius.*` đã map sẵn |

**Không được chuyển** (sẽ có cảnh báo):
- **Vector / SVG**: thay bằng ảnh placeholder. Export vector thành PNG rồi nhập URL.
- **Header, footer, overlay, tracking, localization** của màn hình: template chỉ gồm phần nội dung.
- **Thuộc tính riêng của component** (ví dụ `size`, `useMargin`) và style chưa hỗ trợ (ví dụ `overflow`).

### Mẹo để chuyển đổi sạch

- Dùng **auto layout** cho mọi khung; khung đặt vị trí tự do không chuyển được bố cục.
- Dùng **typography và màu từ thư viện MoMo**, tránh giá trị nhập tay.
- Chuẩn bị sẵn **URL ảnh** (logo, banner) để nhập ở mục **Thay ảnh placeholder** sau khi chuyển đổi.
- Sau khi **Open in Editor**, dùng chế độ **So sánh** để kiểm tra Android và iOS, rồi **Save schema**.
