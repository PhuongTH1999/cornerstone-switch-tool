# SDUI `box`

| | |
|---|---|
| **Spec** | [../sdui-spec.md](../sdui-spec.md) §6.6 |
| **Android** | `ServerDrivenUI/UITypes/Box/ServerBox.kt`, `ServerBoxProperty.kt`, `UITypes/AlignmentUtils.kt` |
| **iOS** | `ios/ServerDrivenUI/UITypes/Box/ServerBox.swift`, `ServerBoxProperty.swift` |
| **Phần chung** | node, style, tracking, onTap: [README.md](README.md) |

Chồng các child lên nhau (child sau nằm trên). Dùng cho ảnh nền + chữ đè, badge ở góc thẻ, …

## 1. Interface

```ts
type BoxNode = SduiNode<"box", BoxProperty, { children: SduiNode<any, any, any>[] }>;

interface BoxProperty {
  contentAlignment?: Alignment9;
}

type Alignment9 =
  | "topStart" | "topCenter" | "top" | "topEnd"
  | "centerStart" | "start" | "center" | "centerEnd" | "end"
  | "bottomStart" | "bottomCenter" | "bottom" | "bottomEnd";
```

## 2. Field

| Field | Kiểu | Bắt buộc / mặc định | Ghi chú |
|---|---|---|---|
| `value` | object | ✅ | Thiếu → node bị bỏ |
| `value.children` | mảng node | nên có | Child lỗi chỉ mất child đó; child hết hạn bị ẩn |
| `property.contentAlignment` | string | `topStart` | Vị trí của **mọi** child trong box, bảng §3 |

⚠️ iOS decode `property` chặt: `contentAlignment` sai kiểu (không phải chuỗi) → **cả node bị bỏ**.

## 3. `contentAlignment`

| Giá trị | Vị trí |
|---|---|
| `topStart` (mặc định) | trên-trái |
| `topCenter` · `top` | trên-giữa |
| `topEnd` | trên-phải |
| `centerStart` · `start` | giữa-trái |
| `center` | giữa |
| `centerEnd` · `end` | giữa-phải |
| `bottomStart` | dưới-trái |
| `bottomCenter` · `bottom` | dưới-giữa |
| `bottomEnd` | dưới-phải |

Cùng bảng giá trị dùng cho `pager.alignmentIndicator`.

## 4. Cách vẽ

- Android `Box(contentAlignment)`, iOS `ZStack(alignment)`.
- Kích thước box = child lớn nhất, trừ khi `style` đặt size.
- Tất cả child dùng chung một `contentAlignment`. Muốn mỗi child một vị trí: cho child `style.fillMaxWidth` /
  `fillMaxHeight` rồi căn bên trong child, hoặc lồng thêm `box`.
- `spacer` trong box không co giãn.
- ⚠️ `style` đặt size lớn hơn mọi child (D24): Android căn theo `contentAlignment` trong **cả khung**; iOS căn trong vùng
  bằng child lớn nhất, vùng đó nằm **giữa** khung. Muốn giống nhau: cho 1 child (vd ảnh nền) cùng size với box.

## 5. Ví dụ

Ảnh nền + tag ở góc dưới phải:
```json
{ "type": "box", "style": { "width": 136, "height": 96, "cornerRadius": 8 },
  "property": { "contentAlignment": "bottomEnd" },
  "value": { "children": [
    { "type": "image", "value": "https://…/cover.png",
      "style": { "width": 136, "height": 96 }, "property": { "contentMode": "fill" } },
    { "type": "tag", "value": "-50%", "style": { "padding": { "all": 4 } }, "property": { "tagType": "error" } }
  ] } }
```

Chữ đè giữa ảnh:
```json
{ "type": "box", "property": { "contentAlignment": "center" },
  "value": { "children": [
    { "type": "image", "value": "https://…/bg.png", "style": { "width": 200, "height": 80 }, "property": { "contentMode": "fill" } },
    { "type": "text", "value": "Ưu đãi hôm nay", "property": { "typography": "headerDefaultBold", "color": "#FFFFFF" } }
  ] } }
```

## 6. Lỗi thường gặp

- [ ] Thứ tự child ngược (child cần nằm trên đặt trước) → bị che.
- [ ] Muốn mỗi child một góc nhưng chỉ có một `contentAlignment` → lồng thêm box.
- [ ] `contentAlignment` viết khác bảng (`"bottom_end"`) → về `topStart`.
