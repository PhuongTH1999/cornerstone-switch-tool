# container

## Định danh

- Component ID: `container` (dùng chung giữa các ngôn ngữ).
- Document version: `1.0.0` (phiên bản tài liệu, không phải phiên bản SDK).
- JSON discriminator: `type: "container"`.
- Nguồn: schema SDUI hiện có và editor TypeScript trong repository này.

## Contract: property và value

```jsonc
{
  "type": "container",
  "style": { ... },
  "property": {
    "layout": "column",   // "column" (mặc định) | "row" | "scrollColumn" | "scrollRow"
    "spacing": 8,          // number — khoảng cách giữa các con
    "alignment": "center"  // column: "left"/"leading" | "center" | "right"/"trailing"
                           // row:    "top" | "center" | "bottom"/"end"
  },
  "value": {
    "children": [ /* mảng node SDUI */ ]
  }
}
```
- `layout` thiếu → mặc định `"column"`.
- `scrollRow` / `scrollColumn` cho phép cuộn. Trong `scrollRow` nên đặt `style.width` cụ thể cho con (vì chiều ngang vô hạn).
- Trong `row`: con có `style.fillMaxWidth = true` (hoặc node `spacer`) sẽ giãn chiếm phần trống.

## Style và cấu hình chung

Áp dụng contract [Common](../common.md): style, modifier, onTap, tracking, widgetId và expire_time.
Các field nội bộ của editor không thuộc JSON contract.

## Hỗ trợ theo ngôn ngữ / runtime

| Runtime | Trạng thái đối chiếu | Ghi chú |
| --- | --- | --- |
| TypeScript / Web editor | Đã đối chiếu source hiện tại | Preview hỗ trợ layout hàng/cột/cuộn, spacing, alignment, arrangement. Editor còn xuất modifier.weight. Validator cũ chưa khai báo scrollColumn. |
| Kotlin / Android | Chưa xác minh source runtime | Cần bổ sung phiên bản SDK và đường dẫn implementation khi sync. |
| Swift / iOS | Chưa xác minh source runtime | Cần bổ sung phiên bản SDK và đường dẫn implementation khi sync. |

## Quy tắc đồng bộ

Giữ nguyên Component ID, đường dẫn field và enum của JSON giữa các ngôn ngữ.
Khi thay đổi contract, cập nhật document version, ví dụ và bảng runtime trong cùng thay đổi.
Không coi trạng thái chưa xác minh là đã hỗ trợ hoặc không hỗ trợ.
