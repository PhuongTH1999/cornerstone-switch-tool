## Hướng dẫn tạo SDUI template từ Figma

### 1. Tạo project trên MoMo Design

Truy cập [MoMo Design](https://momo-design.mservice.com.vn/), chọn **Create a new project**, sau đó chọn **Figma link** làm nguồn thiết kế.

### 2. Sao chép link của UI trong Figma

Mở file Figma và chọn đúng **frame hoặc component** muốn chuyển đổi. Nhấn chuột phải → **Copy as → Copy link to selection**.

Quay lại MoMo Design, dán link vừa sao chép vào ô **Figma link** và bắt đầu tạo UI. Chờ hệ thống xử lý xong, sau đó kiểm tra giao diện được tạo.

### 3. Sao chép JSON của màn hình

Trên MoMo Design, mở **Export to Figma**. Trong phần **Pick screens**, chọn màn hình cần chuyển đổi, rồi nhấn **Copy JSON**.

Chọn một màn hình mỗi lần để chuyển sang một SDUI template. Bước này dùng **Copy JSON**, không cần **Send to Figma** hoặc nhập pairing code.

### 4. Chuyển JSON sang SDUI

Quay lại **Cornerstone → SDUI → Figma migration**, dán nội dung vừa sao chép vào ô **JSON Figma**, rồi chọn **Convert to SDUI**.

Kiểm tra kết quả và các cảnh báo. Nếu thiếu màu, khoảng cách hoặc ảnh, bổ sung trong **Token & asset mapping** rồi chuyển đổi lại.

### 5. Kiểm tra và lưu template

Chọn **Open in Editor** để xem preview và chỉnh sửa. Khi đã hoàn thiện, chọn **Save schema** để lưu vào thư viện SDUI Templates. Bạn cũng có thể chọn **Download JSON** để tải JSON SDUI về máy.

**Lưu ý:** Ô JSON Figma ở bước 4 cần nội dung từ **Copy JSON** ở bước 3; link Figma chỉ dùng tại MoMo Design ở bước 2.
