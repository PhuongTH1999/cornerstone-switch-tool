# Common — cấu hình dùng chung

## 4. Node SDUI (`ServerDrivenData`)

Mọi node trong cây đều có cùng khung sau:

```jsonc
{
  "type": "container",        // BẮT BUỘC — xem §5
  "style": { ... },           // BẮT BUỘC (có thể là {})
  "property": { ... },        // theo từng type — xem §6
  "value": ...,               // theo từng type — xem §6
  "onTap": { ... },           // optional — action khi tap
  "trackTypes": { ... },      // optional — tracking, xem §7
  "expire_time": "1813004156000" // optional — xem §8
}
```

| Field         | Bắt buộc | Ghi chú                                                                   |
|---------------|----------|---------------------------------------------------------------------------|
| `type`        | ✅       | Một trong: `container`, `text`, `image`, `button`, `tag`, `spacer`.       |
| `style`       | ✅       | Object (có thể rỗng `{}`). Xem §5.1.                                       |
| `property`    | tùy type | Object cấu hình UI. **Phải là object** (xem cảnh báo §9).                  |
| `value`       | tùy type | Nội dung — string hoặc object tùy `type`.                                  |
| `onTap`       | ❌       | Action khi tap. **Đặt được trên bất kỳ node nào** (container, image, …), không chỉ button. Xem §6.7. |
| `trackTypes`  | ❌       | Tracking của node. Xem §7.                                                |
| `expire_time` | ❌       | Timestamp ms (string hoặc number). Hết hạn → node bị ẩn. Xem §8.         |
| `widgetId`    | ❌       | ID định danh widget/node (chủ yếu ở node gốc). Không ảnh hưởng render.    |

### 5.1. `style` (`ServerDrivenCommonStyle`) — dùng chung cho mọi type

```jsonc
"style": {
  "width": 235,            // number (dp/pt), optional
  "height": 52,            // number, optional
  "fillMaxWidth": true,    // bool — chiếm hết chiều ngang còn lại (trong row)
  "fillMaxHeight": true,   // bool — chiếm hết chiều dọc còn lại (trong column)
  "backgroundColor": "#FFFFFF", // hex string
  "cornerRadius": 12,      // number
  "border": { "width": 1, "color": "#E8EAED" },
  "padding": {             // có thể dùng `all` HOẶC từng cạnh
    "all": 12,
    "top": 0, "bottom": 0, "left": 0, "right": 0
  }
}
```

Tất cả field trong `style` đều optional. Màu là chuỗi hex (`#RRGGBB` hoặc `#AARRGGBB`).

---


### 6.7. `onTap` — gắn action vào bất kỳ node nào
Không chỉ `button` mới bấm được. Có thể gắn `onTap` lên **container** (cả card bấm được)
hoặc **image** (icon bấm được)… Cấu trúc giống `actions` của button:

```jsonc
{
  "type": "container",
  "style": { ... },
  "property": { "layout": "column", "spacing": 8 },
  "onTap": {
    "actionType": "REDIRECT",
    "actions": [
      { "actionType": "REDIRECT", "featureCode": "spending_insight", "params": {} }
    ]
  },
  "value": { "children": [ ... ] }
}
```

Ví dụ thực tế:
- Cả **card insight** bấm để mở chi tiết: đặt `onTap` ở container item.
- **Icon header** ("xem thêm") bấm để điều hướng: đặt `onTap` ở node `image`.

---

## 7. Tracking (`trackTypes`)

```jsonc
"trackTypes": {
  "containerType": "widget",   // "widget" (node CHA) | "item" (node CON)
  "trackId": "229c1d5f-...",
  "tracking":     { "id": "...", "type": "Disco", "data": "<base64>", "trackifyData": "" },
  "trackify":     { ... },
  "itemTracking": { "item_id": "...", "position_slot": 0, "position_zone": 4, ... }
}
```

### Quy tắc `containerType`
| Giá trị    | Dùng cho            | Hành vi impression                                   |
|------------|---------------------|------------------------------------------------------|
| `"widget"` | Node CHA (cả widget)| Bắn impression cấp widget — **KHÔNG** kèm `itemTracking`. |
| `"item"`   | Node CON (từng item)| Bắn impression cấp item — **CÓ** kèm `itemTracking`. |
| (không có) | Node thường         | Giữ hành vi cũ (kèm `itemTracking` nếu kế thừa được). |

### Kế thừa tracking (nearest-ancestor)
- Mỗi field (`tracking`, `trackify`, `itemTracking`) tự **kế thừa từ ancestor gần nhất** nếu node hiện tại không khai báo.
- Thông thường: node **cha** khai báo `tracking`/`trackify` (cấp widget); mỗi node **item con** chỉ cần khai báo `itemTracking` riêng — phần `tracking`/`trackify` tự kế thừa từ cha.

---

## 8. `expire_time`

```jsonc
"expire_time": "1813004156000"   // timestamp mili-giây; chấp nhận string HOẶC number
```
- Khi thời điểm hiện tại ≥ `expire_time` → node **bị ẩn** khỏi UI.
- Đặt ở node **item con** để hết hạn từng item; item hết hạn sẽ bị loại khỏi danh sách, các item còn lại vẫn hiển thị bình thường.
- Giá trị `-1` (hoặc không có) = **không bao giờ hết hạn**.

---


## modifier

Editor giữ modifier khi import/export; modifier.weight được xuất khi chỉnh Weight. Preview dùng weight để chia không gian flex. Cần đối chiếu semantics với từng runtime native.
