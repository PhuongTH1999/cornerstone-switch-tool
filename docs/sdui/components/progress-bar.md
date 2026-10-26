# SDUI `progressBar`

| | |
|---|---|
| **Spec** | [../sdui-spec.md](../sdui-spec.md) §6.10 |
| **Android** | `ServerDrivenUI/UITypes/ProgressBar/ServerProgressBar.kt`, `ServerProgressBarProperty.kt` |
| **iOS** | `ios/ServerDrivenUI/UITypes/ProgressBar/ServerProgressBar.swift`, `ServerProgressBarProperty.swift` |
| **Phần chung** | node, style, tracking, onTap: [README.md](README.md) |

Thanh tiến độ kèm một hàng mô tả phía trên (trái / phải). Ví dụ "Đã chi 300k ……… 1tr".

## 1. Interface

```ts
type ProgressBarNode = SduiNode<"progressBar", ProgressBarProperty, ProgressBarValue>;

interface ProgressBarValue {
  currentValue: number;
  maxValue: number;
  subDes1?: string;
  subDes2?: string;
}

interface ProgressBarProperty {
  color?: string;
  barHeight?: number;
  barWidth?: number;
}
```

## 2. Field

### `value`
| Field | Kiểu | Bắt buộc | Ghi chú |
|---|---|---|---|
| `currentValue` | số | ✅ | Thiếu / sai kiểu → **node bị bỏ** |
| `maxValue` | số | ✅ | Thiếu / sai kiểu → **node bị bỏ**. `<= 0` → thanh 0% |
| `subDes1` | string | | Chữ bên trái phía trên thanh, cắt còn **23 ký tự**, 1 dòng |
| `subDes2` | string | | Chữ bên phải phía trên thanh |

### `property`
| Field | Kiểu | Mặc định | Ghi chú |
|---|---|---|---|
| `color` | `#RRGGBB` | black_12 | Màu phần đã chạy |
| `barHeight` | số | `4` | Chiều cao thanh |
| `barWidth` | số | full width | Android: độ rộng cố định, sát trái; iOS: độ rộng tối đa, căn giữa |

⚠️ iOS: `property` field sai kiểu (ví dụ `"barHeight": "4"`) → **cả node bị bỏ**.

## 3. Cách vẽ

Cột, khoảng cách 2:
1. Hàng `subDes1` (trái) — `subDes2` (phải); chữ `descriptionXsRegular`, màu black_12. Hàng **luôn có** kể cả khi cả hai
   rỗng (chiếm chỗ một dòng chữ).
2. Thanh: nền `#F2F2F6` bo góc 2, cao `barHeight`; phần đã chạy màu `color`, tỉ lệ = `currentValue / maxValue` giới hạn
   trong 0–1, **tối thiểu 2%** (luôn thấy một chút màu), chạy animation từ 0 trong 800 ms.

## 4. Khác biệt Android ↔ iOS

| Vùng | Android | iOS | Khuyến nghị |
|---|---|---|---|
| `barWidth` (D15) | width cố định, **sát trái** | maxWidth, **căn giữa** | dùng `style.width` của node thay cho `barWidth` |
| `color` lỗi (D9) | black_12 | đen | gửi `#RRGGBB` đúng |
| `currentValue` âm | 0 → hiện 2% | hiện 2% | không gửi số âm |

## 5. Ví dụ

Chi tiêu 300k / 1tr:
```json
{ "type": "progressBar",
  "property": { "color": "#A50064", "barHeight": 4 },
  "value": { "currentValue": 300000, "maxValue": 1000000, "subDes1": "Đã chi 300k", "subDes2": "1tr" } }
```

Thanh mảnh, không mô tả:
```json
{ "type": "progressBar", "style": { "width": 120 },
  "property": { "color": "#34C759", "barHeight": 2 },
  "value": { "currentValue": 3, "maxValue": 5 } }
```

## 6. Lỗi thường gặp

- [ ] Thiếu `currentValue` hoặc `maxValue`, hoặc gửi dạng chuỗi → node bị bỏ (cả 2 nền tảng).
- [ ] `subDes1` dài hơn 23 ký tự → bị cắt.
- [ ] `maxValue: 0` → thanh 0% (vẫn hiện 2%).
