# SDUI — Interface (DTO) các component

| | |
|---|---|
| **Theo spec** | [../sdui-spec.md](../sdui-spec.md) `1.1.1` (hành vi render chi tiết, bảng khác biệt §10, changelog) · tool preview: [../sdui-preview.md](../sdui-preview.md) |
| **Cập nhật** | 2026-10-26 |
| **Code** | Android `android/src/main/java/com/momoplatform/nativewidget/ServerDrivenUI/**` · iOS `ios/ServerDrivenUI/**` |
| **Đối tượng** | Backend dựng payload SDUI, dev native, bên làm preview |

Thư mục này trả lời câu hỏi **"gửi JSON thế nào"**: mỗi component một file, gồm interface, bảng field (kiểu, bắt buộc,
mặc định trên từng nền tảng), cách vẽ, khác biệt Android ↔ iOS, ví dụ và lỗi thường gặp. File này chứa phần dùng chung.

## Mục lục component

| `type` | File | Dùng để | `value` |
|---|---|---|---|
| `text` | [text.md](text.md) | chữ | `string` |
| `image` | [image.md](image.md) | ảnh từ URL | `string` (URL) |
| `spacer` | [spacer.md](spacer.md) | khoảng trống co giãn | `""` |
| `tag` | [tag.md](tag.md) | nhãn nhỏ có nền | `string` |
| `container` | [container.md](container.md) | xếp child theo hàng / cột / cuộn | `{ children }` |
| `box` | [box.md](box.md) | chồng child lên nhau | `{ children }` |
| `button` | [button.md](button.md) | nút bấm chạy action | `{ title, type, … }` |
| `pager` | [pager.md](pager.md) | carousel vuốt ngang | `{ children }` |
| `pageIndicator` | [page-indicator.md](page-indicator.md) | hàng chấm tĩnh | `""` |
| `progressBar` | [progress-bar.md](progress-bar.md) | thanh tiến độ + 2 dòng mô tả | `{ currentValue, maxValue, … }` |

`type` **phân biệt hoa thường** (`"pageIndicator"`, `"progressBar"`).

Quy ước trong các file: `field?` = không bắt buộc; đơn vị kích thước dp (Android) = pt (iOS); màu **chỉ dùng `#RRGGBB`**.

---

## 1. Node chung

```ts
interface SduiNode<TType extends string, TProperty, TValue> {
  type: TType;                 // BẮT BUỘC — thiếu / sai → node bị bỏ
  property: TProperty;         // LUÔN GỬI, kể cả {} — iOS bỏ node nếu thiếu (trừ button)
  value: TValue;               // LUÔN GỬI — component không dùng value thì gửi ""
  style?: CommonStyle;         // §2
  onTap?: OnTap;               // §4 — bấm cả vùng node
  trackTypes?: TrackTypes;     // §3
  expire_time?: number | string;   // epoch milliseconds; -1 = không hết hạn
}
```

| Field | Bắt buộc | Thiếu / sai thì |
|---|---|---|
| `type` | ✅ | node bị bỏ (child bị bỏ; root → không render gì) |
| `property` | ✅ (gửi `{}` nếu không có gì) | Android: dùng mặc định. **iOS: node bị bỏ** (trừ `button`) |
| `value` | ✅ | component dạng chuỗi: Android `""`, **iOS node bị bỏ**; component dạng object: node bị bỏ (cả 2) |
| `style` | | không style |
| `trackTypes` | | không tracking riêng (kế thừa cha). Sai kiểu: Android bỏ qua, **iOS node bị bỏ** |
| `onTap` | | không bấm được. Sai kiểu → bỏ qua (cả 2) |
| `expire_time` | | không hết hạn. Child hết hạn (`now >= expire_time`) bị ẩn. **Root không kiểm tra** |

Key lạ bị bỏ qua. Child lỗi trong `children` chỉ làm mất child đó, không mất cả cây.

---

## 2. `style` (CommonStyle)

```ts
interface CommonStyle {
  width?: number;                    // kích thước NGOÀI, đã gồm padding (như CSS border-box)
  height?: number;
  fillMaxWidth?: boolean | 0 | 1;    // chiếm hết chiều ngang còn lại
  fillMaxHeight?: boolean | 0 | 1;
  padding?: { all?: number; top?: number; left?: number; right?: number; bottom?: number };
  backgroundColor?: string;          // #RRGGBB
  cornerRadius?: number;
  border?: { width: number; color: string };
}
```

| Field | Ghi chú |
|---|---|
| `width` / `height` | Có cả `fillMaxWidth` và `width`: Android `width` thắng; iOS khung rộng hết, nội dung rộng `width` |
| `padding` | Cạnh riêng ưu tiên hơn `all`; `all` là mặc định cho cạnh không khai báo |
| `backgroundColor` | Màu lỗi: Android bỏ nền, iOS trong suốt |
| `cornerRadius` | Bo cả nền, viền và cắt nội dung |
| `border` | Thiếu `width` hoặc `color` → không vẽ viền. iOS vẽ viền phía trong biên |

Thứ tự áp dụng (giống nhau 2 nền tảng): fillMax → size → nền → bo góc → viền → vùng bấm → padding. Vùng bấm `onTap`
phủ cả padding.

---

## 3. `trackTypes` (tracking)

```ts
interface TrackTypes {
  trackId?: string;                    // id chống trùng impression ("<trackId>_100per")
  containerType?: "widget" | "item";   // widget → impression không gửi itemTracking
  tracking?: Record<string, any>;
  trackify?: Record<string, any>;
  itemTracking?: Record<string, any>;  // position_slot → item_slot khi track click
}
```

- **Kế thừa theo từng field:** node không khai báo field nào thì lấy field đó của node cha gần nhất.
- **Impression:** node có ít nhất một trong `tracking` / `trackify` / `itemTracking` → khi hiện **100%** trên màn hình
  bắn `onTrackEvent({ action: "impression", … })`, chống trùng theo `trackId`. Thiếu `trackId` → mọi node dùng chung
  một id, chỉ bắn được một lần.
- **Click** (`onTap`, `button`): dùng tracking kế thừa + `app_info` (xem [button.md](button.md) §5).

---

## 4. `onTap` & `Action`

```ts
interface OnTap {
  actions: Action[];
  actionType?: string;                 // không ảnh hưởng hành vi
}

interface Action {
  actionType: "CALL_API" | "REDIRECT"; // BẮT BUỘC, không phân biệt hoa thường; thiếu / sai → bỏ riêng action này
  featureCode?: string;                // REDIRECT: màn đích
  endpoint?: string;                   // CALL_API: endpoint
  params?: Record<string, any>;
}
```

| `actionType` | Host nhận |
|---|---|
| `REDIRECT` | `onPress({ refId: featureCode, params: { ...params, sourceFromForTracking: "service_widget" } })` + track `click` |
| `CALL_API` | `onSubmit({ endpoint, params }, callback)` — response xem [button.md](button.md) §4 |

`actions` chạy tuần tự, action trước thành công mới chạy action sau. Key khác trong action (`ref_id`, `action_type`, …)
và trong `onTap` (`title`, `ctaType`, …) bị bỏ qua. `onTap` gắn được vào mọi node; nút bấm thật thì dùng
[button](button.md).

---

## 5. Bọc cây SDUI vào zone

```jsonc
{ "type": "template_widget", "templateType": "SDUI_WIDGET", "data": [ { /* root node */ } ] }
```

Dạng này chạy được trên cả 2 nền tảng. `{ "type": "server_driven_widget", "data": { … } }` cũng dùng được nhưng Android
yêu cầu `data` là object (không phải mảng). Chi tiết: spec §1.1.

---

## 6. Checklist chung cho backend

- [ ] JSON hợp lệ, **không có dấu phẩy thừa** trước `}` / `]`. Android bỏ qua lỗi này nhưng iOS không decode được cả cây.
- [ ] Mọi node có `type` đúng chính tả, luôn có `property` (kể cả `{}`) và `value` (kể cả `""`).
- [ ] **Gửi đúng kiểu dữ liệu** (số là số, chuỗi là chuỗi, bool là `true/false`). iOS bỏ cả node khi một key sai kiểu ở
      nhiều component; Android chỉ bỏ key đó.
- [ ] Màu dạng `#RRGGBB` (không dùng `#AARRGGBB`, không bỏ `#`, không dùng tên màu).
- [ ] Root không dựa vào `expire_time` để ẩn (root không bị kiểm tra hết hạn).
- [ ] Cần track impression / click thì khai báo `trackTypes` có `trackId` ở node phù hợp (node con tự kế thừa).
- [ ] Từng component: xem mục "Lỗi thường gặp" trong file của component đó.
