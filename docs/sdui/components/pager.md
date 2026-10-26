# SDUI `pager`

| | |
|---|---|
| **Spec** | [../sdui-spec.md](../sdui-spec.md) §6.8 |
| **Android** | `ServerDrivenUI/UITypes/Pager/ServerPager.kt`, `ServerPagerProperty.kt` |
| **iOS** | `ios/ServerDrivenUI/UITypes/Pager/ServerPager.swift`, `ServerPagerProperty.swift` |
| **Phần chung** | node, style, tracking, onTap: [README.md](README.md) |

Carousel vuốt ngang, mỗi child là một trang, có thể kèm hàng chấm chỉ trang hiện tại.

## 1. Interface

```ts
type PagerNode = SduiNode<"pager", PagerProperty, { children: SduiNode<any, any, any>[] }>;

interface PagerProperty {
  showIndicator?: boolean;
  activeColor?: string;
  inactiveColor?: string;
  indicatorBackgroundColor?: string;
  alignmentIndicator?: Alignment9;          // bảng giá trị như box.contentAlignment
  paddingIndicator?: { top?: number; left?: number; right?: number; bottom?: number };
}
```

## 2. Field

### `value`
| Field | Kiểu | Bắt buộc | Ghi chú |
|---|---|---|---|
| `value` | object | ✅ | Thiếu → node bị bỏ |
| `value.children` | mảng node | nên có | Mỗi child = 1 trang. Child lỗi chỉ mất trang đó; child hết hạn bị ẩn |

### `property`
| Field | Kiểu | Mặc định | Ghi chú |
|---|---|---|---|
| `showIndicator` | `true` / `false` | `true` | Chỉ vẽ indicator khi có > 1 trang. **Không dùng 0/1** |
| `activeColor` | `#RRGGBB` | `#A50064` | Chấm trang hiện tại |
| `inactiveColor` | `#RRGGBB` | `#DFDFE6` | Chấm các trang khác |
| `indicatorBackgroundColor` | `#RRGGBB` | đen ~20% | Nền "viên thuốc" chứa các chấm |
| `alignmentIndicator` | string | `bottomCenter` | Vị trí indicator trên pager, bảng ở [box.md](box.md) §3 |
| `paddingIndicator` | object | thiếu cả object: `top 4, left 6, bottom 4, right 6` | Khoảng cách indicator tới mép pager. **Gửi đủ 4 cạnh** |

⚠️ iOS decode `property` chặt: field sai kiểu (ví dụ `"showIndicator": 1`) → **cả node bị bỏ**.

## 3. Cách vẽ

- Vuốt ngang từng trang. **Không tự chạy, không lặp vòng.**
- Indicator: hàng chấm như [page-indicator.md](page-indicator.md) (chấm active 12×4, inactive 4×4, cách nhau 4), đặt
  trong viên thuốc nền `indicatorBackgroundColor`, padding trong 6 (ngang) / 4 (dọc), bo góc 8, chồng lên pager theo
  `alignmentIndicator`, cách mép theo `paddingIndicator`.
- **Phải đặt `style.height`**: iOS (TabView) không tự co theo nội dung.

## 4. Khác biệt Android ↔ iOS

| Vùng | Android | iOS | Khuyến nghị |
|---|---|---|---|
| Không có trang nào | không vẽ | TabView rỗng | không gửi pager rỗng |
| Chiều rộng | luôn full width | theo khung cha | đặt `style.fillMaxWidth` |
| Chiều cao | theo trang hiện tại | **cần `style.height`** | luôn đặt `style.height` |
| `paddingIndicator` có nhưng thiếu cạnh | left 6, right 0, top 0, bottom 4 | left **4**, right 0, top 0, bottom 4 | gửi đủ 4 cạnh |
| `showIndicator` dạng 0/1 | coi như `true` | node bị bỏ | dùng `true` / `false` |

## 5. Ví dụ

Banner 3 trang, indicator giữa đáy:
```json
{ "type": "pager",
  "style": { "fillMaxWidth": true, "height": 140, "cornerRadius": 12 },
  "property": { "showIndicator": true, "alignmentIndicator": "bottomCenter",
                "paddingIndicator": { "top": 0, "left": 0, "right": 0, "bottom": 8 } },
  "value": { "children": [
    { "type": "image", "value": "https://…/banner1.png", "style": { "fillMaxWidth": true, "height": 140 }, "property": { "contentMode": "fill" } },
    { "type": "image", "value": "https://…/banner2.png", "style": { "fillMaxWidth": true, "height": 140 }, "property": { "contentMode": "fill" } },
    { "type": "image", "value": "https://…/banner3.png", "style": { "fillMaxWidth": true, "height": 140 }, "property": { "contentMode": "fill" } }
  ] } }
```

Pager không indicator, mỗi trang là một thẻ:
```json
{ "type": "pager", "style": { "fillMaxWidth": true, "height": 96 },
  "property": { "showIndicator": false },
  "value": { "children": [ { "type": "container", "property": { "layout": "row", "spacing": 8 }, "value": { "children": [] } } ] } }
```

## 6. Lỗi thường gặp

- [ ] Không đặt `style.height` → iOS hiển thị sai chiều cao.
- [ ] `showIndicator: 1` → iOS mất node.
- [ ] `paddingIndicator` thiếu cạnh → indicator lệch giữa 2 nền tảng.
- [ ] Mong pager tự chạy / lặp vòng → hiện chưa hỗ trợ.
