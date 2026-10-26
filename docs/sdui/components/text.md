# SDUI `text`

| | |
|---|---|
| **Spec** | [../sdui-spec.md](../sdui-spec.md) §6.1, typography §5.2 |
| **Android** | `ServerDrivenUI/UITypes/Text/ServerText.kt`, `ServerTextProperty.kt` |
| **iOS** | `ios/ServerDrivenUI/UITypes/Text/ServerText.swift`, `ServerTextProperty.swift` |
| **Phần chung** | node, style, tracking, onTap: [README.md](README.md) |

Hiển thị một đoạn chữ, font theo bộ typography của MoMo kits.

## 1. Interface

```ts
type TextNode = SduiNode<"text", TextProperty, string>;   // value = nội dung chữ

interface TextProperty {
  typography?: Typography;
  color?: string;
  lineLimit?: number;
  textAlignment?: "leading" | "center" | "trailing" | "right";
  truncationMode?: "tail" | "head" | "middle";
  lineSpacing?: number;
}

type Typography =
  | "headlineDefaultBold" | "headerDefaultBold" | "headerSSemibold" | "headerXsSemibold"
  | "descriptionDefaultRegular" | "descriptionXsRegular"
  | "labelSMedium" | "labelXsMedium"
  | "actionDefaultBold" | "actionSBold" | "actionXsBold";
```

## 2. Field

### `value`
| Kiểu | Bắt buộc | Thiếu / sai kiểu |
|---|---|---|
| `string` | ✅ | Android: `""` (chữ rỗng). **iOS: node bị bỏ** |

### `property`
| Field | Kiểu | Mặc định | Ghi chú |
|---|---|---|---|
| `typography` | string | `descriptionDefaultRegular` | Phân biệt hoa thường; giá trị lạ → mặc định. Bảng §3 |
| `color` | `#RRGGBB` | `#303233` | Màu lỗi: Android `#303233`, iOS **đen** |
| `lineLimit` | số nguyên | không giới hạn | Quá số dòng → cắt và thêm `…` |
| `textAlignment` | string | `leading` (trái) | `center` → giữa; `trailing` / `right` → phải; giá trị khác → trái |
| `truncationMode` | string | `tail` | Vị trí dấu `…` khi bị cắt. **Android luôn `tail`** |
| `lineSpacing` | số | không | Android: đặt **line-height = lineSpacing**; iOS: **cộng thêm** khoảng cách giữa dòng |

⚠️ iOS decode `property` chặt: một field sai kiểu (ví dụ `"lineLimit": "1"`, `"color": 303233`) → **cả node bị bỏ**.
Android chỉ bỏ qua field đó.

## 3. Typography

| Giá trị | Size | Weight | Dùng cho |
|---|---|---|---|
| `headlineDefaultBold` | 24 | bold | số liệu lớn, tiêu đề nổi bật |
| `headerDefaultBold` | 16 | bold | tiêu đề widget |
| `headerSSemibold` | 14 | semibold | tiêu đề thẻ |
| `headerXsSemibold` | 12 | semibold | tiêu đề nhỏ |
| `descriptionDefaultRegular` | 12 | regular | mô tả (**mặc định**) |
| `descriptionXsRegular` | 10 | regular | mô tả phụ |
| `labelSMedium` | 12 | medium | nhãn |
| `labelXsMedium` | 10 | medium | nhãn nhỏ |
| `actionDefaultBold` | 16 | bold | chữ hành động |
| `actionSBold` | 14 | bold | chữ hành động |
| `actionXsBold` | 12 | bold | chữ hành động nhỏ |

Line-height do MoMo kits quyết định.

## 4. Cách vẽ

- Android `Text(maxLines = lineLimit, overflow = Ellipsis, textAlign)`; iOS `Text` + `.lineLimit` +
  `.multilineTextAlignment` + `.truncationMode` + `.lineSpacing`.
- Trong `container` dạng `row`: text không có `style.width` được co giãn để không đẩy các child khác ra ngoài
  (xem [container.md](container.md)). Muốn chữ dài tự xuống dòng / cắt đúng chỗ thì đặt `lineLimit`.
- `textAlignment` chỉ có tác dụng khi khung chữ rộng hơn nội dung (ví dụ `style.fillMaxWidth: true`).
  ⚠️ iOS (D28): `textAlignment` chỉ căn các dòng của chữ **nhiều dòng**. Chữ **dòng đơn** có `width` luôn nằm giữa khung,
  có `fillMaxWidth` luôn nằm trái — bất kể `textAlignment`. Muốn căn giữa chắc chắn trên cả 2: bọc text trong
  `container` `column` có `alignment: "center"` + `style.fillMaxWidth`, và để text **không** có `fillMaxWidth`.

## 5. Khác biệt Android ↔ iOS

| Vùng | Android | iOS | Khuyến nghị |
|---|---|---|---|
| `truncationMode` `head` / `middle` | luôn cắt cuối | đúng như khai báo | chỉ dùng `tail` |
| `lineSpacing` | = line-height | cộng thêm | tránh dùng nếu cần giống nhau |
| `color` lỗi | `#303233` | đen | luôn gửi `#RRGGBB` đúng |
| Line-height (D27) | theo kits (`headerDefaultBold` 22) | tự nhiên của font (≈ 19.1) | không căn layout theo chiều cao chữ |
| `textAlignment` chữ dòng đơn (D28) | theo `textAlignment` | `width` → giữa, `fillMaxWidth` → trái | xem §4 |
| `value` thiếu / sai kiểu | chữ rỗng | node bị bỏ | luôn gửi chuỗi |
| field sai kiểu | bỏ field | node bị bỏ | gửi đúng kiểu |

## 6. Ví dụ

Tiêu đề 1 dòng:
```json
{ "type": "text", "value": "Ưu đãi 8K",
  "property": { "typography": "headerSSemibold", "color": "#303233", "lineLimit": 1 } }
```

Mô tả tối đa 2 dòng, căn giữa trên cả 2 nền tảng (kể cả khi chỉ có 1 dòng, xem §4):
```json
{ "type": "container", "style": { "fillMaxWidth": true },
  "property": { "layout": "column", "spacing": 0, "alignment": "center" },
  "value": { "children": [
    { "type": "text", "value": "Cho đơn từ 0Đ qua MoMoQR tại Highlands Coffee",
      "property": { "typography": "descriptionDefaultRegular", "color": "#727272", "lineLimit": 2, "textAlignment": "center" } }
  ] } }
```

Số liệu lớn màu hồng:
```json
{ "type": "text", "value": "1.250.000đ", "property": { "typography": "headlineDefaultBold", "color": "#A50064" } }
```

## 7. Lỗi thường gặp

- [ ] `lineLimit` gửi dạng chuỗi (`"1"`) → iOS mất node.
- [ ] `typography` viết sai hoa thường (`"HeaderDefaultBold"`) → về mặc định.
- [ ] Màu `#AARRGGBB` hoặc không có `#` → iOS về đen.
- [ ] Chữ dài trong `row` không có `lineLimit` → chiếm nhiều dòng, đẩy chiều cao thẻ.
