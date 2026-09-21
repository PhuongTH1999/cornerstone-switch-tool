# tag

## Định danh

- Component ID: `tag` (dùng chung giữa các ngôn ngữ).
- Document version: `1.0.0` (phiên bản tài liệu, không phải phiên bản SDK).
- JSON discriminator: `type: "tag"`.
- Nguồn: schema SDUI hiện có và editor TypeScript trong repository này.

## Contract: property và value

```jsonc
{
  "type": "tag",
  "style": {},
  "property": {
    "tagType": "highlight",      // "info" | "success" | "error" | "warning" | "highlight" → màu preset
    "backgroundColor": "#FFF3E0",// optional — override màu nền
    "textColor": "#E65100",      // optional — override màu chữ
    "iconUrl": "https://..."     // optional — icon đứng trước
  },
  "value": "HOT"                 // string nội dung tag
}
```

## Style và cấu hình chung

Áp dụng contract [Common](../common.md): style, modifier, onTap, tracking, widgetId và expire_time.
Các field nội bộ của editor không thuộc JSON contract.

## Hỗ trợ theo ngôn ngữ / runtime

| Runtime | Trạng thái đối chiếu | Ghi chú |
| --- | --- | --- |
| TypeScript / Web editor | Đã đối chiếu source hiện tại | Editor hỗ trợ import, chỉnh và preview tag; menu Add chưa có tag. Preview hiển thị màu và nội dung, chưa render iconUrl. Validator/plugin converter cũ chưa khai báo tag. |
| Kotlin / Android | Chưa xác minh source runtime | Cần bổ sung phiên bản SDK và đường dẫn implementation khi sync. |
| Swift / iOS | Chưa xác minh source runtime | Cần bổ sung phiên bản SDK và đường dẫn implementation khi sync. |

## Quy tắc đồng bộ

Giữ nguyên Component ID, đường dẫn field và enum của JSON giữa các ngôn ngữ.
Khi thay đổi contract, cập nhật document version, ví dụ và bảng runtime trong cùng thay đổi.
Không coi trạng thái chưa xác minh là đã hỗ trợ hoặc không hỗ trợ.
