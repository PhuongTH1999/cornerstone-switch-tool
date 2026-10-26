# Template Tracking — logic `tracking` / `trackify` của template widgets

Tài liệu tham chiếu nhanh: **event tracking của template widgets được build, gửi, chống trùng thế nào trên Android và iOS**, cùng các case đặc biệt / điểm lệch giữa 2 platform.
Dùng làm context khi debug thiếu/trùng event hoặc khi team data hỏi về field.

> Cập nhật lần cuối: 2026-10-26 (package `@momo-platform/native-widget` 1.1.0-rc.fix.sdui.1).
> Khi đổi `buildTrackingParams`, `triggerOnTrackEvent`, `ActionHandler` hay cách tính impression ID, sửa lại file này.

---

## 0. File chính

| Vai trò | Android | iOS |
|---|---|---|
| Build payload | `utils/Utils.kt` → `CommomUtils.buildTrackingParams` / `buildAndTrackEvent` | `Utils/TrackingUtils.swift` → `TrackingUtils.buildTrackingParams` |
| Gửi + chống trùng | `utils/CornerstoneStore.kt` → `triggerOnTrackEvent` | `Cornerstone/CornerstoneStore.swift` → `triggerOnTrackEvent` |
| Impression (visibility) | `utils/modifier/Extension.kt` → `Modifier.trackVisibility`, `components/VisibilityTrack/` | `Utils/InViewPort.swift` |
| Click (CTA) | `utils/ActionHandler.kt`, `common/CtaHandling.kt` | `Utils/TemplateActionHandler.swift`, `Utils/CtaHandlerUtil.swift` |
| Từng template | `components/templates/TemplateLayouts/*` | `Cornerstone/Components/Templates/TemplateLayouts/*` |

Đường dẫn Android tính từ `android/src/main/java/com/momoplatform/nativewidget/`, iOS từ `ios/`.

---

## 1. Payload chung

Mọi event (impression lẫn click) đều đi qua `buildTrackingParams`:

```
{
  action:               "impression" | "impression_50per" | "click" | ...
  tracking:             tracking của zone/widget
  trackify:             trackify gốc + cns_source + cns_component
  itemTracking:         tracking cấp item
  third_party_tracking: { <action>: [url, ...] }
  app_info:             { ...field bổ sung, requested_time }
}
```

- `cns_source = "vn.momo.cornerstone"` và `cns_component` (lấy từ `optionalField`: `item` | `cta` | `widget`) **chỉ được thêm khi `trackify` không rỗng**.
- Key `trackify` **luôn có** trong payload, rỗng thì là `{}`.
- `app_info.requested_time` = epoch millis lúc build. iOS luôn gửi `app_info` (có thể `{}`); Android chỉ gửi khi có `app_info`.

## 2. Gửi event — `CornerstoneStore.triggerOnTrackEvent`

1. Bỏ event nếu `tracking`, `trackify`, `third_party_tracking`, `app_info`, `itemTracking` đều rỗng.
2. Bỏ event nếu host chưa đăng ký track handler.
3. Nếu có `impressionTrackingId`: đã gửi rồi thì bỏ, chưa thì ghi nhớ.
   - Android: giữ tối đa 5000 ID gần nhất (`MAX_IMPRESSION_LOG_SIZE`).
   - iOS: `Set` không giới hạn.
4. Nếu `third_party_tracking[action]` có URL → gọi third-party handler với list URL.
5. Gọi handler chính với payload.

## 3. Impression

| | Android | iOS |
|---|---|---|
| Cơ chế | `Modifier.trackVisibility(thresholdPercentage = FULL, resetKey = isHomeFocused)` | `InViewPort(visiblePercent = 0.99)` |
| Ngưỡng | ≥ 99% diện tích | ≥ 99% diện tích |
| So với | Bounds của **parent** (mini-app: root view) | Bounds của **màn hình** |
| Điều kiện thêm | Chỉ bắn khi `isHomeFocused == true` | Delay 0.5s sau `onAppear`; phụ thuộc `FocusManager` |

- Bắn ở **2 cấp**: 1 lần cho widget, 1 lần cho mỗi item.
- Impression ID: `buildImpressionTrackingId(action, params...)` → nối params bằng `_` + hậu tố `100per` (hoặc `50per`).
  - Widget: `<trackId ?: id>_100per`
  - Item: `<trackId ?: itemId ?: id>_100per`

## 4. Click

- CTA có nhiều `actions` chạy tuần tự qua `handleActionsSerialize`: **action sau chỉ chạy khi action trước thành công**, và **mỗi action bắn 1 click riêng** (CTA 2 action → 2 click).
- Thứ tự ưu tiên:
  - `trackify`: item → widget (`currentData.trackify ?: trackify`)
  - `tracking`: zone → item (Android `tracking ?: currentData.tracking`); iOS chỉ dùng tracking của zone, không fallback.
- `app_info`: `cta_type`, `cta_action_type`, `cta_endpoint` (= featureCode), `item_slot`, `item_type`, `item_id`, `item_name`.
  - `CALL_API` thêm `requested_status` (`success` / `failed`).
- `REDIRECT` thêm `sourceFromForTracking: "service_widget"` vào params redirect (không nằm trong event tracking).
- Nút **"see more" / feedback**: click chỉ có `tracking` + `app_info.item_name = "see_more"`, **không có `trackify`**.

---

## 5. Case đặc biệt

### 5.1 Impression chỉ bắn 1 lần mỗi phiên app

- Rời Home rồi quay lại: flag của từng view được reset (Android tăng `LocalDataChangeKey` khi `isFocused = false`), nhưng **store vẫn nhớ ID** → event bị chặn.
- Không chỗ nào xoá bộ nhớ ID:
  - iOS: lời gọi `clearAllImpressionLog()` đang bị comment ở `Cornerstone/CornerStone.swift:185`.
  - Android: thư viện không gọi `clearAllImpressionLog`; cũng không thấy lời gọi trong `momo-app`.
- **Ngoại lệ:** Android Group widget và banner của Collection Block bắn impression **không có ID** → bắn lại mỗi lần Home được focus lại.

### 5.2 Không có ID → dùng chung 1 key (Android)

- `trackId` và `id` đều thiếu → key thành `_100per`.
- Item parse thiếu `id` sẽ nhận `""` (`TemplateDataParser.kt`) → cũng ra `_100per`.
- Tất cả widget/item kiểu này **dùng chung 1 key → chỉ cái đầu tiên được gửi**.
- iOS fallback khác: widget `icon_title_description`, item `trackId ?? itemId ?? id ?? ""`.

### 5.3 Template có hành vi riêng (Android)

| Template | Khác biệt |
|---|---|
| Progress | Fallback key là `icon_title`; item không có impression riêng. |
| Activation item | Key `trackId ?: itemId` (không fallback `id`); `trackify` lấy từ state của view model; `tracking` không fallback sang item. |
| Basic Info | Impression dùng `inViewport` (không phải `trackVisibility`) → **không chờ Home focus**; thêm `app_info.position_slot = 0`. Click gửi `trackify` rỗng vì view model không nhận `trackify` và không truyền `currentData`. |
| Engage (widget-level) | `cns_component = "default"`. |
| Insight item card | Không truyền `optionalField` → không có `cns_component`. |
| Group widget, Collection Block banner | Impression không có ID (xem §5.1). Banner tự bắn click với `app_info` riêng (`item_type: banner`, `button_name: click_banner`, `ref_id`). |

### 5.4 Lệch giữa Android và iOS

| | Android | iOS |
|---|---|---|
| `third_party_tracking` trên impression/click của template | Có gửi | **Không bao giờ gửi** |
| `cns_component` impression cấp widget | Thiếu (Engage = `"default"`) | `"widget"` |
| `cns_component` Insight item card | Thiếu | `"item"` |
| Click từ CTA không có `ctaType` | `REDIRECT` → `item`, `CALL_API` → `cta` (null check không đồng nhất trong `ActionHandler.kt`) | Parser mặc định `ctaType = BUTTON` → `cta` |
| Impression cấp widget của Activations | Theo từng item | Dùng `trackify` và ID của item đầu tiên |
| `app_info.position_slot` ở Rating item | Không gửi | Có gửi |
| `tracking` của click | zone → item | Chỉ zone |

### 5.5 `CALL_API` click (Android)

- Click chỉ bắn **trong callback** của API.
- Response `null` → **không có click nào được gửi**.
- API throw exception → gửi click với `requested_status: failed`.

### 5.6 Tính visibility

- Android so với bounds của parent, iOS so với cả màn hình → cùng ngưỡng 99% nhưng có thể cho kết quả khác nhau giữa 2 platform.
