# image

## Định danh

- Component ID: `image` (dùng chung giữa các ngôn ngữ).
- Document version: `1.0.0` (phiên bản tài liệu, không phải phiên bản SDK).
- JSON discriminator: `type: "image"`.
- Nguồn: schema SDUI hiện có và editor TypeScript trong repository này.

## Contract: property và value

```jsonc
{
  "type": "image",
  "style": { "width": 52, "height": 52, "cornerRadius": 26 },
  "property": {
    "contentMode": "fill",   // "fit" (mặc định) | "fill"
    "tintColor": "#727272",  // optional — bật template rendering (tô màu icon)
    "cornerRadius": 26,      // optional
    "aspectRatio": 1.5       // optional — tỉ lệ width/height
  },
  "value": "https://static.momocdn.net/app/icon/promotion/logo.png" // URL string
}
```

## Style và cấu hình chung

Áp dụng contract [Common](../common.md): style, modifier, onTap, tracking, widgetId và expire_time.
Các field nội bộ của editor không thuộc JSON contract.

## Hỗ trợ theo ngôn ngữ / runtime

| Runtime | Trạng thái đối chiếu | Ghi chú |
| --- | --- | --- |
| TypeScript / Web editor | Đã đối chiếu source hiện tại | Editor có form contentMode (fit/fill/center), tintColor và aspectRatio. Tài liệu native hiện liệt kê fit/fill; center cần xác minh với runtime. Preview chưa mô phỏng đầy đủ tintColor/aspectRatio. |
| Kotlin / Android | Chưa xác minh source runtime | Cần bổ sung phiên bản SDK và đường dẫn implementation khi sync. |
| Swift / iOS | Chưa xác minh source runtime | Cần bổ sung phiên bản SDK và đường dẫn implementation khi sync. |

## Quy tắc đồng bộ

Giữ nguyên Component ID, đường dẫn field và enum của JSON giữa các ngôn ngữ.
Khi thay đổi contract, cập nhật document version, ví dụ và bảng runtime trong cùng thay đổi.
Không coi trạng thái chưa xác minh là đã hỗ trợ hoặc không hỗ trợ.
