# SDUI `tag`

| | |
|---|---|
| **Spec** | [../sdui-spec.md](../sdui-spec.md) §6.4, token màu §5.3 |
| **Android** | `ServerDrivenUI/UITypes/Tag/ServerTag.kt`, `ServerTagProperty.kt` |
| **iOS** | `ios/ServerDrivenUI/UITypes/Tag/ServerTag.swift`, `ServerTagProperty.swift` |
| **Phần chung** | node, style, tracking, onTap: [README.md](README.md) |

Nhãn nhỏ có nền màu (ví dụ "Mới", "Tại cửa hàng", "Sắp hết hạn"), có thể kèm icon bên trái.

## 1. Interface

```ts
type TagNode = SduiNode<"tag", TagProperty, string>;   // value = nội dung nhãn

interface TagProperty {
  tagType?: "info" | "success" | "error" | "warning" | "highlight";
  backgroundColor?: string;
  textColor?: string;
  iconUrl?: string;
}
```

## 2. Field

### `value`
| Kiểu | Bắt buộc | Thiếu / sai kiểu |
|---|---|---|
| `string` | ✅ | Android: nhãn rỗng. **iOS: node bị bỏ** |

### `property`
| Field | Kiểu | Mặc định | Ghi chú |
|---|---|---|---|
| `tagType` | string | xám (black_17 / black_01) | Chọn bộ màu có sẵn, bảng §3 |
| `backgroundColor` | `#RRGGBB` | theo `tagType` | Ghi đè màu nền |
| `textColor` | `#RRGGBB` | theo `tagType` | Ghi đè màu chữ |
| `iconUrl` | URL | không | Icon 12×12 bên trái chữ |

⚠️ iOS decode `property` chặt: field sai kiểu → **cả node bị bỏ**.

## 3. Bộ màu `tagType`

| `tagType` | Nền | Chữ |
|---|---|---|
| `info` | blue_08 | blue_03 |
| `success` | green_08 | green_03 |
| `error` | red_08 | red_03 |
| `warning` | orange_08 | orange_03 |
| `highlight` | gold_09 | gold_03 |
| khác / thiếu | black_17 | black_01 |

Tên token theo bảng màu MoMo kits (giống nhau 2 nền tảng).

## 4. Cách vẽ

Hàng ngang `[icon 12×12]? + chữ`, cách nhau `Spacing.XXS`; padding ngang `Spacing.S`, dọc 1; bo góc `Spacing.S`; chữ
`labelSMedium`, **1 dòng** (dài thì cắt). Kích thước theo nội dung.

## 5. Khác biệt Android ↔ iOS

| Vùng | Android | iOS | Khuyến nghị |
|---|---|---|---|
| `backgroundColor` lỗi | về màu của `tagType` | trong suốt | gửi `#RRGGBB` đúng |
| `textColor` lỗi | về màu của `tagType` | đen | gửi `#RRGGBB` đúng |
| `value` thiếu / sai kiểu | nhãn rỗng | node bị bỏ | luôn gửi chuỗi |
| Chiều cao nhãn (D27) | 20 (chữ 18 + 2) | ≈ 16 (chữ ≈ 14.3 + 2) | không căn layout theo chiều cao tag |

## 6. Ví dụ

Nhãn thông tin:
```json
{ "type": "tag", "value": "Tại cửa hàng", "property": { "tagType": "info" } }
```

Màu tự chọn kèm icon:
```json
{ "type": "tag", "value": "Hot",
  "property": { "backgroundColor": "#FFE5F0", "textColor": "#A50064", "iconUrl": "https://static.momocdn.net/…/ic_fire.png" } }
```

Nhiều tag trên một hàng:
```json
{ "type": "container", "property": { "layout": "row", "spacing": 4 },
  "value": { "children": [
    { "type": "tag", "value": "Mới", "property": { "tagType": "success" } },
    { "type": "tag", "value": "Sắp hết hạn", "property": { "tagType": "warning" } }
  ] } }
```

## 7. Lỗi thường gặp

- [ ] Nhãn quá dài → bị cắt (chỉ 1 dòng).
- [ ] `tagType` viết hoa (`"INFO"`) → về màu xám.
- [ ] Màu sai định dạng → iOS nền trong suốt / chữ đen.
