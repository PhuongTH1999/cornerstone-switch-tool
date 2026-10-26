# SDUI `button`

| | |
|---|---|
| **Spec** | [../sdui-spec.md](../sdui-spec.md) §6.7, actions §7, tracking §8 |
| **Android** | `ServerDrivenUI/UITypes/Button/ServerButton.kt`, `ServerButtonProperty.kt`; chạy action `utils/ActionHandler.kt` |
| **iOS** | `ios/ServerDrivenUI/UITypes/Button/ServerButton.swift`, `ServerButtonProperty.swift`; chạy action `ios/Utils/TemplateActionHandler.swift` |
| **Phần chung** | node, style, tracking, onTap: [README.md](README.md) |

Nút bấm chạy action. Dựng bằng component CTA dùng chung với template (`TemplateCtaContainer`), nên hành vi giống `cta`
của template widget: cùng kiểu nút, cùng cách chạy action, cùng cách đổi nút sau khi gọi API.

## 1. Interface

```ts
type ButtonNode = SduiNode<"button", ButtonProperty, ButtonValue>;

interface ButtonValue {
  title: string;
  type?: ButtonType;
  iconLeft?: string;
  iconRight?: string;
  color?: string;
  description?: string;
}

interface ButtonProperty {
  ctaType?: "BUTTON" | "TOGGLE" | "ICON";
  actions?: Action[];        // xem README §4
  type?: ButtonType;         // fallback
  iconLeft?: string;         // fallback
  iconRight?: string;        // fallback
  color?: string;            // fallback
  actionType?: string;       // giữ để tương thích, không ảnh hưởng hành vi
}

type ButtonType = "primary" | "secondary" | "tonal" | "outline" | "danger" | "text" | "disabled";

interface Action {
  actionType: "CALL_API" | "REDIRECT";
  featureCode?: string;
  endpoint?: string;
  params?: Record<string, any>;
}
```

Giá trị enum (`ctaType`, `actionType`, `type`) **không phân biệt hoa thường**.

## 2. Field

### `value` (bắt buộc — thiếu → node bị bỏ)
| Field | Bắt buộc | Mặc định khi thiếu | Ghi chú |
|---|---|---|---|
| `title` | ✅ | — | Thiếu hoặc rỗng → **không vẽ nút** |
| `type` | nên có | `property.type`; vẫn thiếu → Android `text`, iOS `outline` | Bảng §3 |
| `iconLeft` / `iconRight` | | lấy từ `property` | URL icon |
| `color` | | lấy từ `property` | Đọc nhưng **chưa dùng khi vẽ** (màu theo `type`) |
| `description` | | — | Đọc nhưng chưa dùng khi vẽ |

### `property` (không phải object → coi như `{}`)
| Field | Bắt buộc | Mặc định khi thiếu | Ghi chú |
|---|---|---|---|
| `ctaType` | | `BUTTON` | `TOGGLE` → công tắc bật/tắt theo kết quả action; `ICON` → không vẽ. Giá trị lạ → `BUTTON` |
| `actions` | nên có | `[]` → bấm không làm gì | Chạy tuần tự, action trước thành công mới chạy action sau |
| `type`, `iconLeft`, `iconRight`, `color` | | — | Chỉ dùng khi `value` không có field đó |

`ctaType` đặt trong **`property`**, không đặt trong `value` (đặt trong `value` bị bỏ qua).

### `Action`
| Field | `REDIRECT` | `CALL_API` |
|---|---|---|
| `actionType` | `"REDIRECT"` | `"CALL_API"` |
| `featureCode` | ✅ màn đích | không dùng (không gửi cho host) |
| `endpoint` | không dùng | ✅ endpoint API |
| `params` | tham số mở màn | body gọi API |

`actionType` thiếu hoặc sai → bỏ riêng action đó (các action khác vẫn chạy). Key khác (`action_type`, `ref_id`, …) bị bỏ qua.

## 3. `ButtonType`

| Giá trị | Nút |
|---|---|
| `primary` | nền chính (hồng) |
| `secondary` | phụ |
| `tonal` | nền nhạt |
| `outline` | viền |
| `danger` | cảnh báo |
| `text` | chỉ chữ |
| `disabled` | trạng thái vô hiệu |

Kích thước nút: small, theo nội dung (không full width).

## 4. Hành vi khi bấm

```
Bấm → chạy property.actions tuần tự
  REDIRECT → track "click" → host onPress({ refId: featureCode,
                                            params: { ...params, sourceFromForTracking: "service_widget" } })
  CALL_API → nút hiện loading + khoá bấm
           → host onSubmit({ endpoint, params }, callback)
           → callback(response) → track "click" (app_info.requested_status = success | failed)
           → response hợp lệ → cập nhật nút; action kế tiếp được phép chạy
```

### Response `CALL_API` (host trả vào callback)

```ts
interface CallApiResponse {
  response_status: { code: number };   // số nguyên 200 mới là thành công
  data?: ItemData;                     // object item; có data → thành công
  toast?: { title?: string; description?: string; type?: string; icon?: string; duration?: number };
}
```

| Điều kiện | Kết quả |
|---|---|
| `code == 200` và có `data` (object) | Thành công: giữ item trả về, `TOGGLE` bật, action kế tiếp chạy |
| `data.cta` có `title` hoặc `actions` | **Nút đổi sang `data.cta`** (chữ, kiểu, action mới) |
| `data.cta` không có / rỗng | Nút giữ nguyên |
| `code != 200`, `code` dạng chuỗi (`"200"`), thiếu `data` | Thất bại: tắt loading, dừng chuỗi action |

`data.cta` theo format `cta` của template:

```ts
interface Cta {
  title?: string;
  ctaType?: "BUTTON" | "TOGGLE";
  type?: ButtonType;
  iconLeft?: string;
  iconRight?: string;
  color?: string;
  description?: string;
  actions?: Action[];
}
```

`toast` hiện chưa hiển thị trên Android.

### Trạng thái
- Trong lúc `CALL_API` chạy: nút loading, không bấm lại được.
- `TOGGLE`: bật khi action gần nhất trả `data`, tắt khi không có.
- Server gửi lại node mới (ví dụ Home tải lại khi quay về tab) → nút quay về dữ liệu của node, bỏ `cta` cũ đã nhận từ
  response trước.

## 5. Tracking click

- `tracking` / `trackify` / `itemTracking` **kế thừa** từ node cha gần nhất có `trackTypes`. Cả cây không có tracking →
  click không được track.
- `app_info`: `cta_type`, `cta_action_type`, `cta_endpoint` (= `featureCode`), `item_slot`, `item_type`, `item_id`,
  `item_name`, `requested_status` (chỉ có với `CALL_API`).
- `item_slot` = `itemTracking.position_slot` kế thừa, mặc định `-1`.
- Sau `CALL_API` thành công, các field `item_*` của lần bấm sau lấy từ item trả về.

## 6. Khác biệt Android ↔ iOS

| Vùng | Android | iOS | Khuyến nghị |
|---|---|---|---|
| `type` không gửi | `text` | `outline` | **Luôn gửi `value.type`** |
| `type` giá trị lạ | `text` | `primary` | Chỉ dùng giá trị trong bảng §3 |
| Một lần bấm `[CALL_API, REDIRECT]` | `REDIRECT` **không chạy** nếu host trả callback bất đồng bộ (platform) | chạy sau khi có response | Dùng cách đổi nút + bấm lần 2 (§7.2) |
| Kích thước | theo layout cha | `.fixedSize()` theo nội dung | — |
| Kích thước SMALL (D33) | cao 28 cố định, bo góc 8 | cao ≈ 26.3 theo nội dung, bo góc 6 | — |
| `title: ""` (D33) | vẽ nút rỗng | không vẽ | không gửi title rỗng |
| `ctaType: TOGGLE` (D34) | **bỏ** `style`, `onTap`, impression của node; loading không vẽ gì | áp dụng; loading hiện spinner | không gắn `style`/`trackTypes` lên node toggle — bọc trong `container` |

## 7. Ví dụ

### 7.1 Mở màn (`REDIRECT`)
```json
{ "type": "button",
  "property": { "ctaType": "BUTTON",
                "actions": [ { "actionType": "REDIRECT", "featureCode": "voucher_detail",
                               "params": { "campaignId": "261020_clvc_g07uzmqa", "giftType": "261020_giam_50pt3k_wytfl" } } ] },
  "value": { "title": "Xem chi tiết", "type": "outline" } }
```

### 7.2 Thu thập → "Dùng ngay" (`CALL_API`, response đổi nút)
Node:
```json
{ "type": "button",
  "property": { "ctaType": "BUTTON",
                "actions": [ { "actionType": "CALL_API", "endpoint": "voucher_promotion",
                               "params": { "campaign_id": "…", "voucher_id": "…", "template_type": "ENGAGE_WIDGET" } } ] },
  "value": { "title": "Thu thập", "type": "outline" } }
```
Response host trả vào callback:
```json
{ "response_status": { "code": 200, "message": "" },
  "data": { "itemId": "…",
            "cta": { "title": "Dùng ngay", "ctaType": "BUTTON", "type": "text",
                     "actions": [ { "actionType": "REDIRECT", "featureCode": "ScanQRCode", "params": { "voucher": { } } } ] } } }
```
Kết quả: nút đổi thành "Dùng ngay"; bấm lần nữa → mở `ScanQRCode`.

### 7.3 Công tắc (`TOGGLE`)
```json
{ "type": "button",
  "property": { "ctaType": "TOGGLE",
                "actions": [ { "actionType": "CALL_API", "endpoint": "subscribe_reminder", "params": { "id": "…" } } ] },
  "value": { "title": "Nhắc tôi", "type": "outline" } }
```
Bật khi `CALL_API` trả `code 200` kèm `data`.

## 8. Lỗi thường gặp

- [ ] Dấu phẩy thừa sau `"actions": [ … ],` → iOS không decode được cả cây.
- [ ] Thiếu `value.title` → không có nút.
- [ ] Không gửi `value.type` → Android và iOS vẽ kiểu khác nhau.
- [ ] `ctaType` đặt trong `value` → bị bỏ qua (vẫn ra `BUTTON` nên khó phát hiện).
- [ ] Nhãn không khớp action: "Thu thập" nhưng action `REDIRECT` → bấm mở màn thay vì thu thập.
- [ ] `REDIRECT` thiếu `featureCode` / `CALL_API` thiếu `endpoint`.
- [ ] Response `code` dạng chuỗi `"200"` hoặc `data` không phải object → coi như thất bại, nút không đổi.
- [ ] Response trả `""` / `{}` / `[]` cho field không đổi thay vì bỏ field → ghi đè làm mất dữ liệu item (icon, tracking…).
