# SDUI `container`

| | |
|---|---|
| **Spec** | [../sdui-spec.md](../sdui-spec.md) §6.5 |
| **Android** | `ServerDrivenUI/UITypes/Container/ServerContainer.kt`, `ServerContainerProperty.kt`, `UITypes/AlignmentUtils.kt` |
| **iOS** | `ios/ServerDrivenUI/UITypes/Container/ServerContainer.swift`, `ServerContainerProperty.swift` |
| **Phần chung** | node, style, tracking, onTap: [README.md](README.md) |

Khung xếp các child theo cột, hàng, hoặc danh sách cuộn. Đây là component dựng bố cục chính.

## 1. Interface

```ts
type ContainerNode = SduiNode<"container", ContainerProperty, ContainerValue>;

interface ContainerProperty {
  layout?: "column" | "row" | "scrollColumn" | "scrollRow";
  spacing?: number;
  alignment?: string;
}

interface ContainerValue {
  children: SduiNode<any, any, any>[];
}
```

## 2. Field

### `value`
| Field | Kiểu | Bắt buộc | Ghi chú |
|---|---|---|---|
| `value` | object | ✅ | Thiếu → node bị bỏ (cả 2) |
| `value.children` | mảng node | nên có | Thiếu → không có child. Child lỗi chỉ mất child đó; child hết hạn bị ẩn |

### `property`
| Field | Kiểu | Mặc định | Ghi chú |
|---|---|---|---|
| `layout` | string | `column` | `column` xếp dọc · `row` xếp ngang · `scrollColumn` cuộn dọc · `scrollRow` cuộn ngang |
| `spacing` | số | Android `0` · **iOS ~8 (mặc định hệ thống)** | Khoảng cách giữa các child. **Luôn gửi**, kể cả `0` |
| `alignment` | string | đầu (top / leading) | Căn theo trục phụ, bảng §3 |

`container` decode khoan dung trên cả 2 nền tảng: field sai kiểu chỉ bị bỏ qua.

## 3. `alignment`

| `layout` | Giá trị | Kết quả |
|---|---|---|
| `column` | `center` | child căn giữa theo chiều ngang |
| `column` | `trailing` / `right` | child căn phải |
| `column` | khác / thiếu | căn trái |
| `row` | `center` | child căn giữa theo chiều dọc |
| `row` | `bottom` / `end` | child căn đáy |
| `row` | khác / thiếu | căn trên |

Android `column` còn dùng `center` / `bottom` / `end` để dồn cả nhóm child vào giữa / đáy khi column cao hơn nội dung.

## 4. Cách chia chỗ

### `row` (Android `Row`, iOS `HStack`)

| Child | Android | iOS |
|---|---|---|
| có `style.fillMaxWidth: true` | chiếm hết phần còn lại (`weight(1f)`) | `maxWidth: ∞` |
| `spacer` | chiếm phần còn lại, **trừ khi** hàng có container co giãn được (dòng dưới) | `Spacer`, ưu tiên thấp |
| `container` không `width`, không `fillMaxWidth` | nhận tối đa phần còn lại nhưng co theo nội dung (`weight(1f, fill=false)`) | ưu tiên 1 |
| `text` không `width` | như dòng trên | ưu tiên 1 |
| khác | kích thước tự nhiên | kích thước tự nhiên |

### `column` (Android `Column`, iOS `VStack`)
Child là `spacer` hoặc có `style.fillMaxHeight` → chiếm phần còn lại (chỉ thấy tác dụng khi column có chiều cao cố định).

### `scrollRow` / `scrollColumn`
Cuộn ngang / dọc, ẩn thanh cuộn (iOS). Không chia chỗ co giãn: mỗi child nên có `style.width` (scrollRow) hoặc
`style.height` (scrollColumn).

## 5. Khác biệt Android ↔ iOS

| Vùng | Android | iOS | Khuyến nghị |
|---|---|---|---|
| `spacing` thiếu | 0 | ~8 | luôn gửi |
| `fillMaxWidth` + `width` trên child | `width` thắng | khung rộng hết, nội dung `width` | không gửi cả hai |
| Container có `width`/`height` lớn hơn nhóm child (D24) | nhóm ở trên-trái | nhóm ở **giữa** | thêm `spacer` / child `fillMax*` để lấp khung |
| `row`: ≥ 2 child co giãn, vd `[text dài, spacer, icon]` (D29) | mỗi child tối đa phần bằng nhau → text tối đa ½ | text lấy đủ chỗ cần | đặt `lineLimit`; tránh spacer cạnh text dài, dùng `text.style.fillMaxWidth` |
| `row` không `width` trong `scrollRow`; `column` không `height` có `fillMaxHeight`/`spacer` trong feed (D30, cần xác nhận) | child co giãn = 0 | kích thước tự nhiên | đặt `width`/`height` cho container |
| `alignment` dọc của `column` (`center`/`bottom`/`end`) (D31) | dồn nhóm | không tác dụng | không dựa vào |
| Vùng bấm `onTap` (D25) | cả khung | chỉ chỗ có vẽ | đặt `backgroundColor` cho node có `onTap` |
| Nội dung tràn khung, `cornerRadius` 0 (D26) | không cắt | cắt | không để nội dung tràn |

## 6. Ví dụ

Thẻ ngang: ảnh + cột chữ + nút:
```json
{ "type": "container",
  "style": { "fillMaxWidth": true, "padding": { "all": 12 }, "backgroundColor": "#FFFFFF", "cornerRadius": 12 },
  "property": { "layout": "row", "spacing": 12, "alignment": "center" },
  "value": { "children": [
    { "type": "image", "value": "https://…/logo.png", "style": { "width": 48, "height": 48 }, "property": {} },
    { "type": "container", "style": { "fillMaxWidth": true },
      "property": { "layout": "column", "spacing": 4 },
      "value": { "children": [
        { "type": "text", "value": "Ưu đãi 8K", "property": { "typography": "headerSSemibold", "lineLimit": 1 } },
        { "type": "text", "value": "Cho đơn từ 0Đ", "property": { "lineLimit": 1 } }
      ] } },
    { "type": "button", "property": { "ctaType": "BUTTON", "actions": [] }, "value": { "title": "Thu thập", "type": "outline" } }
  ] } }
```

Danh sách thẻ cuộn ngang:
```json
{ "type": "container", "property": { "layout": "scrollRow", "spacing": 8 },
  "value": { "children": [
    { "type": "container", "style": { "width": 136, "padding": { "all": 8 } }, "property": { "layout": "column", "spacing": 4 },
      "value": { "children": [ { "type": "text", "value": "Thẻ 1", "property": {} } ] } },
    { "type": "container", "style": { "width": 136, "padding": { "all": 8 } }, "property": { "layout": "column", "spacing": 4 },
      "value": { "children": [ { "type": "text", "value": "Thẻ 2", "property": {} } ] } }
  ] } }
```

## 7. Lỗi thường gặp

- [ ] Không gửi `spacing` → iOS cách ~8, Android dính liền.
- [ ] Child trong `scrollRow` không có `width` → kích thước không đoán trước được.
- [ ] Muốn một child chiếm phần còn lại trong `row` nhưng quên `style.fillMaxWidth: true`.
- [ ] `value` gửi thẳng mảng (`"value": [ … ]`) thay vì `{ "children": [ … ] }` → node bị bỏ.
