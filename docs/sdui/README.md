# SDUI component documents

Mỗi component có một document độc lập trong `components/`. `manifest.json` là danh mục được tab Document đọc trực tiếp; ID trùng giá trị JSON `type`, không phụ thuộc Kotlin, Swift hay TypeScript.

- `overview.md`: tổng quan editor.
- `common.md`: style và hành vi chung, tránh lặp contract ở sáu file.
- `components/<type>.md`: định danh, property/value, ví dụ JSONC, style chung, bảng hỗ trợ runtime và quy tắc đồng bộ.

## Cập nhật

1. Sửa document của component; nếu thay đổi field dùng chung, sửa `common.md`.
2. Tăng document version ở file và manifest khi thay đổi contract.
3. Với mỗi runtime, ghi phiên bản SDK, đường dẫn implementation và kết quả xác minh; không suy ra hỗ trợ native từ preview web.
4. Thêm type mới bằng document cùng cấu trúc, một entry manifest và import vào `src/components/SDUIDocumentation.tsx`.

Đây là cấu trúc chuẩn bị cho đồng bộ tài liệu đa ngôn ngữ; chưa tự động sinh code hoặc đồng bộ repository Kotlin/Swift. Các ví dụ JSONC có comment/dấu ... là minh họa, cần hoàn thiện trước khi gửi API.

`sdui-json-schema.md` ở root được giữ làm tài liệu tham khảo cũ và ví dụ tổng hợp. Các mục component trong tab Document lấy từ thư mục này.
