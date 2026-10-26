# SDUI `pageIndicator`

| | |
|---|---|
| **Spec** | [../sdui-spec.md](../sdui-spec.md) §6.9 |
| **Android** | `ServerDrivenUI/UITypes/PageIndicator/ServerPageIndicator.kt`, `ServerPageIndicatorProperty.kt` |
| **iOS** | `ios/ServerDrivenUI/UITypes/PageIndicator/ServerPageIndicator.swift`, `ServerPageIndicatorProperty.swift` |
| **Phần chung** | node, style, tracking, onTap: [README.md](README.md) |

Hàng chấm **tĩnh** chỉ vị trí (ví dụ bước 2/4). Không liên kết với pager nào. Indicator chạy theo trang thì dùng
`pager.showIndicator` ([pager.md](pager.md)).

## 1. Interface

```ts
type PageIndicatorNode = SduiNode<"pageIndicator", PageIndicatorProperty, "">;   // value không dùng, gửi ""

interface PageIndicatorProperty {
  total?: number;
  activeIndex?: number;
  activeColor?: string;
  inactiveColor?: string;
}
```

## 2. Field

| Field | Kiểu | Mặc định | Ghi chú |
|---|---|---|---|
| `value` | `""` | — | Bắt buộc gửi (iOS bỏ node nếu thiếu), nội dung bỏ qua |
| `property.total` | số nguyên | `0` | Số chấm. `<= 1` → không vẽ gì |
| `property.activeIndex` | số nguyên | `0` | Chấm đang active, đếm từ 0 |
| `property.activeColor` | `#RRGGBB` | `#A50064` | |
| `property.inactiveColor` | `#RRGGBB` | `#DFDFE6` | |

⚠️ iOS decode `property` chặt: field sai kiểu (ví dụ `"total": "4"`) → **cả node bị bỏ**.

## 3. Cách vẽ

Hàng ngang các chấm cách nhau 4: chấm active là viên 12×4, chấm inactive 4×4, bo tròn. Kích thước theo nội dung.

## 4. Ví dụ

Bước 2 trên 4:
```json
{ "type": "pageIndicator", "value": "", "property": { "total": 4, "activeIndex": 1 } }
```

Màu tự chọn, căn giữa trong cột:
```json
{ "type": "container", "style": { "fillMaxWidth": true }, "property": { "layout": "column", "spacing": 0, "alignment": "center" },
  "value": { "children": [
    { "type": "pageIndicator", "value": "", "property": { "total": 3, "activeIndex": 0, "activeColor": "#303233", "inactiveColor": "#E8EAED" } }
  ] } }
```

## 5. Lỗi thường gặp

- [ ] Dùng `pageIndicator` cạnh `pager` mong nó chạy theo trang → không chạy; dùng `pager.showIndicator`.
- [ ] `total: 1` → không vẽ gì.
- [ ] Số gửi dạng chuỗi → iOS mất node.
