# SDUI `spacer`

| | |
|---|---|
| **Spec** | [../sdui-spec.md](../sdui-spec.md) §6.3, luật chia chỗ §6.5 |
| **Android** | `ServerDrivenUI/UITypes/Spacer/ServerSpacer.kt`, `ServerSpacerProperty.kt` |
| **iOS** | `ios/ServerDrivenUI/UITypes/Spacer/ServerSpacer.swift`, `ServerSpacerProperty.swift` |
| **Phần chung** | node, style, tracking, onTap: [README.md](README.md) |

Khoảng trống co giãn: chiếm phần còn lại trong `container` dạng `row` / `column`, dùng để đẩy các child về hai đầu.

## 1. Interface

```ts
type SpacerNode = SduiNode<"spacer", SpacerProperty, "">;   // value không dùng, gửi ""

interface SpacerProperty {
  minLength?: number;
}
```

## 2. Field

| Field | Kiểu | Mặc định | Ghi chú |
|---|---|---|---|
| `value` | `""` | — | Bắt buộc gửi (iOS bỏ node nếu thiếu), nội dung bỏ qua |
| `property.minLength` | số | Android `0` · **iOS ~8 (mặc định hệ thống)** | Kích thước tối thiểu theo chiều của container cha. **Luôn gửi** |

⚠️ iOS decode `property` chặt: `minLength` sai kiểu → **cả node bị bỏ**.

## 3. Cách vẽ

| Container cha | Spacer |
|---|---|
| `row` | co giãn theo chiều ngang (Android `weight(1f)`), **trừ khi** trong hàng có một `container` co giãn được (không `width`, không `fillMaxWidth`) — khi đó spacer chỉ rộng `minLength` |
| `column` | co giãn theo chiều dọc (cần column có chiều cao cố định mới thấy tác dụng) |
| `scrollRow` / `scrollColumn` / `box` | **không** co giãn, chỉ bằng `minLength` |

Muốn khoảng cách cố định giữa các child thì dùng `container.spacing`, không dùng spacer.

## 4. Khác biệt Android ↔ iOS

| Vùng | Android | iOS | Khuyến nghị |
|---|---|---|---|
| `minLength` thiếu | 0 | ~8 | luôn gửi |
| Trong `box` / scroll | 0 + minLength | không co giãn rõ ràng | không dùng spacer trong các container này |
| `minLength` (D35) | min cả 2 chiều → trong `row` hàng cao ≥ `minLength` | chỉ trục chính | giữ `minLength` nhỏ hơn chiều cao hàng |
| `spacer` cạnh `text` trong `row` (D29) | text bị giới hạn ½ chỗ còn lại | text lấy đủ chỗ | xem [container.md](container.md) §5 |

## 5. Ví dụ

Đẩy tiêu đề sang trái, nút "Xem tất cả" sang phải:
```json
{ "type": "container", "style": { "fillMaxWidth": true },
  "property": { "layout": "row", "spacing": 0, "alignment": "center" },
  "value": { "children": [
    { "type": "text", "value": "Ưu đãi cho bạn", "property": { "typography": "headerDefaultBold" } },
    { "type": "spacer", "value": "", "property": { "minLength": 8 } },
    { "type": "text", "value": "Xem tất cả", "property": { "typography": "labelSMedium", "color": "#A50064" } }
  ] } }
```

## 6. Lỗi thường gặp

- [ ] Không gửi `minLength` → iOS thêm ~8 so với Android.
- [ ] Không gửi `value: ""` → iOS mất node.
- [ ] Hàng có thêm `container` co giãn → spacer không đẩy được (Android); đặt `width` hoặc `fillMaxWidth` cho container đó.
