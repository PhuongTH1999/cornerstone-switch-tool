# spacer

## Định danh

- Component ID: `spacer` (dùng chung giữa các ngôn ngữ).
- Document version: `1.0.0` (phiên bản tài liệu, không phải phiên bản SDK).
- JSON discriminator: `type: "spacer"`.
- Nguồn: schema SDUI hiện có và editor TypeScript trong repository này.

## Contract: property và value

```jsonc
{
  "type": "spacer",
  "style": {},
  "property": { "minLength": 0 }, // optional — khoảng tối thiểu
  "value": ""                     // luôn là chuỗi rỗng
}
```
- Trong `row`/`column`, `spacer` giãn để đẩy các phần tử ra hai phía (giống `Spacer()` SwiftUI / `weight(1f)` Compose).

## Style và cấu hình chung

Áp dụng contract [Common](../common.md): style, modifier, onTap, tracking, widgetId và expire_time.
Các field nội bộ của editor không thuộc JSON contract.

## Hỗ trợ theo ngôn ngữ / runtime

| Runtime | Trạng thái đối chiếu | Ghi chú |
| --- | --- | --- |
| TypeScript / Web editor | Đã đối chiếu source hiện tại | Preview có khoảng trống co giãn. minLength có form chỉnh nhưng cần xác minh trên native. |
| Kotlin / Android | Chưa xác minh source runtime | Cần bổ sung phiên bản SDK và đường dẫn implementation khi sync. |
| Swift / iOS | Chưa xác minh source runtime | Cần bổ sung phiên bản SDK và đường dẫn implementation khi sync. |

## Quy tắc đồng bộ

Giữ nguyên Component ID, đường dẫn field và enum của JSON giữa các ngôn ngữ.
Khi thay đổi contract, cập nhật document version, ví dụ và bảng runtime trong cùng thay đổi.
Không coi trạng thái chưa xác minh là đã hỗ trợ hoặc không hỗ trợ.
