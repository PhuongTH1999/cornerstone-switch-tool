# Hỗ trợ trong SDUI Editor

Tra cứu cấu trúc JSON, component, property, style và ví dụ ở các mục bên trái. Hợp đồng JSON và hành vi từng nền tảng lấy từ **SDUI spec 1.1.1** (`sdui-spec.md`, `sdui-preview.md`, `components/*.md` — đồng bộ từ repo native-widget).

## 10 component type

| Type | Nội dung (value) | Chỉnh trong bảng thuộc tính |
| --- | --- | --- |
| container | `{ children }` | layout (column, row, scrollRow, scrollColumn), spacing, alignment, kích thước, nền, viền |
| text | String | typography (11 giá trị), color, lineLimit, textAlignment |
| image | String URL | contentMode (fit, fill, scaleAspectFill), tintColor, aspectRatio, kích thước, cornerRadius |
| button | `{ title, type, iconLeft, iconRight }` | ctaType, color, actions[0].featureCode |
| tag | String | tagType, backgroundColor, textColor, iconUrl |
| spacer | `""` | minLength |
| box | `{ children }` | contentAlignment, kích thước |
| pager | `{ children }` (mỗi child 1 trang) | showIndicator, alignmentIndicator, màu indicator, kích thước |
| pageIndicator | `""` | total, activeIndex, màu |
| progressBar | `{ currentValue, maxValue, subDes1, subDes2 }` | currentValue, maxValue, subDes1, subDes2, color, barHeight, barWidth |

Thêm component bằng menu **+ Add** khi đang chọn `container`, `box` hoặc `pager`. Component mới được tạo với giá trị an toàn cho cả 2 nền tảng (container có `spacing: 0`, spacer có `minLength: 0`, image có size, pager có `height`).

## Style và cấu trúc chung

- Node có type, style, property và value. Tên node trong editor được xuất thành `property.id` (native bỏ qua key này).
- Style gồm backgroundColor, cornerRadius, padding (`all`/`top`/`left`/`right`/`bottom`), border, width, height, fillMaxWidth, fillMaxHeight.
- `modifier`, `property.arrangement`, `padding.horizontal/vertical` **không có trong spec** — native bỏ qua. Editor giữ lại khi import nhưng preview không vẽ, lint báo "Key không có tác dụng".
- Editor giữ các field của node gốc khi import (onTap, trackTypes, widgetId, expire_time); chưa có form chỉnh riêng.
- Xoá trống một ô số trong Inspector sẽ xoá key đó (giá trị `""` ở key số làm iOS bỏ cả node).

## Preview Android / iOS

Preview vẽ **đúng JSON được export**, theo `sdui-preview.md` (spec 1.1.1), trên khung rộng 375:

- **Android / iOS / So sánh**: mỗi quy tắc [A]/[I] trong tài liệu được vẽ riêng theo nền tảng, kể cả các khác biệt D1–D36. Không gộp hay "sửa" khác biệt.
- **Chọn node**: bấm vào preview để chọn layer.
- **Bấm thử**: tô vùng bấm theo nền tảng (D25), chạy action giả lập và ghi log (không gọi API, không tracking). Chọn kết quả `CALL_API`: thất bại / thành công / thành công có `cta` (nút đổi sang `cta`).
- **Lint**: mỗi cảnh báo có mức (❌ ⚠️ ℹ️), mã D (hoặc mục tài liệu) và đường dẫn node (`root.children[1].children[0]`). Bấm vào cảnh báo để khoanh node trên preview.
- Viền đỏ nét đứt = trường hợp tài liệu chưa mô tả, preview đang vẽ tạm (cần xác nhận trên máy thật).

Preview là mô phỏng trên trình duyệt: các giá trị ≈ / 🔎 trong tài liệu nằm ở `src/renderers/sdui/preview/approx.ts`, cần đối chiếu với máy thật theo bộ test §9 của `sdui-preview.md`.

## Lưu ý về validator cũ

`src/renderers/sdui/validator.ts` (dùng cho plugin converter) vẫn chỉ khai báo 5 type và danh sách property/style hẹp hơn spec. Figma migration vẫn xuất cuộn dọc thành `column` (không dùng `scrollColumn`).

## Cách tra cứu

1. Chọn mục schema hoặc component ở danh sách bên trái. Link giữa các tài liệu mở mục tương ứng trong tab này.
2. Xem value, các property, style và enum trong ví dụ JSON.
3. Các block jsonc có comment hoặc dấu … là minh họa; bỏ comment và thay … bằng dữ liệu thật trước khi import JSON.
