# text

## Định danh

- Component ID: `text` (dùng chung giữa các ngôn ngữ).
- Document version: `1.0.0` (phiên bản tài liệu, không phải phiên bản SDK).
- JSON discriminator: `type: "text"`.
- Nguồn: schema SDUI hiện có và editor TypeScript trong repository này.

## Contract: property và value

```jsonc
{
  "type": "text",
  "style": {},
  "property": {
    "typography": "headerSSemibold", // token design system — xem danh sách bên dưới
    "color": "#303233",              // hex
    "lineLimit": 1,                  // số dòng tối đa
    "textAlignment": "center",       // "left" | "center" | "right"
    "truncationMode": "tail",        // optional
    "lineSpacing": 2                 // optional, number
  },
  "value": "Giảm 50.000đ"            // string nội dung
}
```
> `typography` là **token** của design system. Các token đã gặp trong data thực tế:
> `labelXsMedium`, `labelSMedium`, `headerXsSemibold`, `headerSSemibold`, `headerDefaultBold`,
> `descriptionXsRegular`, `descriptionDefaultRegular`, `actionSBold`.
> Token không khớp sẽ rơi về style mặc định. Liên hệ team Design/Native để có danh sách đầy đủ.

## Style và cấu hình chung

Áp dụng contract [Common](../common.md): style, modifier, onTap, tracking, widgetId và expire_time.
Các field nội bộ của editor không thuộc JSON contract.

## Hỗ trợ theo ngôn ngữ / runtime

| Runtime | Trạng thái đối chiếu | Ghi chú |
| --- | --- | --- |
| TypeScript / Web editor | Đã đối chiếu source hiện tại | Preview hỗ trợ typography, color, lineLimit, textAlignment. truncationMode và lineSpacing có trong tài liệu schema nhưng chưa có form chỉnh riêng hoặc mô phỏng đầy đủ. |
| Kotlin / Android | Chưa xác minh source runtime | Cần bổ sung phiên bản SDK và đường dẫn implementation khi sync. |
| Swift / iOS | Chưa xác minh source runtime | Cần bổ sung phiên bản SDK và đường dẫn implementation khi sync. |

## Quy tắc đồng bộ

Giữ nguyên Component ID, đường dẫn field và enum của JSON giữa các ngôn ngữ.
Khi thay đổi contract, cập nhật document version, ví dụ và bảng runtime trong cùng thay đổi.
Không coi trạng thái chưa xác minh là đã hỗ trợ hoặc không hỗ trợ.
