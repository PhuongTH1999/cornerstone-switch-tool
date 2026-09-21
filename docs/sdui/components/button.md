# button

## Định danh

- Component ID: `button` (dùng chung giữa các ngôn ngữ).
- Document version: `1.0.0` (phiên bản tài liệu, không phải phiên bản SDK).
- JSON discriminator: `type: "button"`.
- Nguồn: schema SDUI hiện có và editor TypeScript trong repository này.

## Contract: property và value

```jsonc
{
  "type": "button",
  "style": {},
  "property": {
    "actionType": "REDIRECT",   // optional
    "ctaType": "BUTTON",        // "BUTTON" | "TOGGLE" | "ICON"
    "color": "#303233",         // optional
    "actions": [                // mảng action chạy khi nhấn
      {
        "actionType": "REDIRECT", // "CALL_API" | "REDIRECT"
        "featureCode": "refund_handbook",
        "params": {},
        "endpoint": "..."         // dùng khi CALL_API
      }
    ]
  },
  "value": {
    "title": "Thu thập",        // text trên nút
    "type": "text",             // ButtonTypeTemplate: primary|secondary|tonal|outline|danger|text|disabled
    "iconLeft": "https://...",  // optional
    "iconRight": "https://..."  // optional
  }
}
```
> ⚠️ `property` của button **phải là object**. Xem cảnh báo §9.

## Style và cấu hình chung

Áp dụng contract [Common](../common.md): style, modifier, onTap, tracking, widgetId và expire_time.
Các field nội bộ của editor không thuộc JSON contract.

## Hỗ trợ theo ngôn ngữ / runtime

| Runtime | Trạng thái đối chiếu | Ghi chú |
| --- | --- | --- |
| TypeScript / Web editor | Đã đối chiếu source hiện tại | Editor chỉnh title, type, iconLeft, iconRight, ctaType, color, actionType và actions[0].featureCode. Preview hiển thị nút, không thực thi action; TOGGLE/ICON chưa được mô phỏng đầy đủ. |
| Kotlin / Android | Chưa xác minh source runtime | Cần bổ sung phiên bản SDK và đường dẫn implementation khi sync. |
| Swift / iOS | Chưa xác minh source runtime | Cần bổ sung phiên bản SDK và đường dẫn implementation khi sync. |

## Quy tắc đồng bộ

Giữ nguyên Component ID, đường dẫn field và enum của JSON giữa các ngôn ngữ.
Khi thay đổi contract, cập nhật document version, ví dụ và bảng runtime trong cùng thay đổi.
Không coi trạng thái chưa xác minh là đã hỗ trợ hoặc không hỗ trợ.
