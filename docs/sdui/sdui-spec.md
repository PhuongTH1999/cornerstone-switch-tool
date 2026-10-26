# SDUI Spec — ServerDrivenUIRenderer (Android + iOS)

| | |
|---|---|
| **Spec version** | `1.1.1` |
| **Cập nhật** | 2026-10-26 |
| **Đối chiếu với code** | native-widget `1.0.3-rc.54.privacy.2` (commit `0fa07a1d`) |
| **Nguồn sự thật** | Android `android/src/main/java/com/momoplatform/nativewidget/ServerDrivenUI/**` · iOS `ios/ServerDrivenUI/**` |
| **Đối tượng** | Dev native Android/iOS, và bên dựng **preview** bằng ngôn ngữ khác (web, Flutter...) |

Tài liệu mô tả **hợp đồng JSON** của SDUI và **cách mỗi nền tảng dựng UI** từ JSON đó, đủ chi tiết để viết
một renderer thứ ba (preview) ra cùng kết quả. Chỗ nào 2 nền tảng đang khác nhau được đánh dấu ⚠️ — preview
nên chọn theo cột ghi "chuẩn" hoặc hiển thị cả hai.

DTO từng component (interface, bảng field, ví dụ JSON, lỗi thường gặp — mỗi component một file): [sdui/README.md](sdui/README.md).

Công thức dựng cho tool preview (parse → layout → vẽ, tách nhánh Android/iOS, token ra hex, lint, bộ test): [sdui-preview.md](sdui-preview.md).

---

## Mục lục

0. [Quy tắc version & cập nhật tài liệu](#0-quy-tắc-version--cập-nhật-tài-liệu)
1. [Luồng tổng quát](#1-luồng-tổng-quát)
2. [Schema của một node](#2-schema-của-một-node)
3. [Quy tắc parse & lỗi](#3-quy-tắc-parse--lỗi)
4. [Common style](#4-common-style)
5. [Token: màu, typography, spacing](#5-token-màu-typography-spacing)
6. [Component](#6-component) — text · image · spacer · tag · container · box · button · pager · pageIndicator · progressBar
7. [onTap & actions](#7-ontap--actions)
8. [Tracking & impression](#8-tracking--impression)
9. [Ví dụ đầy đủ có chú thích](#9-ví-dụ-đầy-đủ-có-chú-thích)
10. [Bảng khác biệt Android ↔ iOS](#10-bảng-khác-biệt-android--ios)
11. [Changelog](#11-changelog)

---

## 0. Quy tắc version & cập nhật tài liệu

### 0.1 Khi nào phải sửa file này

**Mọi PR chạm vào file trong bảng dưới phải cập nhật mục tương ứng + bump version + thêm dòng Changelog (§11).**

| Sửa file (Android / iOS) | Cập nhật mục |
|---|---|
| `Model/ServerDrivenData.kt` / `Model/ServerDrivenData.swift` | §2, §3, §4 (key style), §8 (trackTypes) |
| `Model/ServerDrivenType.kt` / `Model/ServerDrivenType.swift` (thêm/bớt type) | §2.2, §6 (thêm mục component), §10 |
| `CommonStyleModifier.kt` / `CommonStyleModifier.swift` | §4, §7 |
| `ServerDrivenUIRenderer.kt` / `ServerDriverUIRenderer.swift` | §1, §8 |
| `SDUITracking*.kt` / `SDUITracking*.swift`, `utils/modifier/Extension.kt` (`trackVisibility`), `ios/Utils/InViewPort.swift` | §8 |
| `UITypes/<Type>/*` | §6.<type>, §10 |
| `UITypes/AlignmentUtils.kt` | §6 box, pager |
| Entry: `CornerStone.kt` / `CornerStone.swift` (`server_driven_widget`), `TemplateSwitcher.kt` / `TemplateView.swift` (`SDUI_WIDGET`) | §1.1 |
| `utils/ActionHandler.kt` / `Utils/TemplateActionHandler.swift`, `TemplateCtaContainer.*` | §6 button, §7 |
| Token (`Typography`, `Colors`, `Color+Ext.swift`, `CommomUtils.safeParseColor`) | §5 |

Sửa xong 1 nền tảng mà chưa sửa nền tảng kia → ghi vào §10 với ⚠️ và ghi rõ trong Changelog.

Đổi key / giá trị / mặc định của component (§2–§7) → cập nhật luôn file component tương ứng trong [sdui/](sdui/README.md) (interface + ví dụ).

Đổi bất cứ gì làm hình vẽ ra khác đi (§3–§6, §10) → cập nhật [sdui-preview.md](sdui-preview.md) và dòng "Implement theo spec" của nó.

### 0.2 Cách bump version (SemVer cho **hợp đồng JSON + hành vi render**)

| Bump | Khi nào | Ví dụ |
|---|---|---|
| **MAJOR** `x.0.0` | Bỏ/đổi tên key, đổi kiểu dữ liệu, đổi default làm UI cũ render khác | đổi `layout` default từ `column` sang `row` |
| **MINOR** `1.x.0` | Thêm type mới, thêm key mới (optional), thêm giá trị enum mới | thêm `type: "divider"`, thêm `typography: "headerLBold"` |
| **PATCH** `1.0.x` | Sửa bug để code khớp spec, sửa/bổ sung mô tả, đồng bộ parity | iOS sửa spacing mặc định cho giống Android |

Preview phía ngôn ngữ khác nên ghi lại `Spec version` mà nó đang implement để biết cần sync gì.

---

## 1. Luồng tổng quát

### 1.1 Điểm vào

SDUI là một nhánh của `CornerStone(zone)` (xem [integration-flows.md](integration-flows.md)). Có 2 cách bọc:

| Zone wrapper | Android | iOS | Lấy root node từ đâu |
|---|---|---|---|
| `{"type":"server_driven_widget", "data": …}` | `CornerStone.kt` → `ServerDrivenData.fromMap(data["data"] as? Map)` | `CornerStone.swift` `decodeSDUIData` | ⚠️ Android: `data` **phải là object**. iOS: object hoặc `[object]` (lấy phần tử đầu) |
| `{"type":"template_widget", "templateType":"SDUI_WIDGET", "data": …}` | `TemplateSwitcher.kt` `getServerDrivenData` | `TemplateView.swift` `TemplateDataExtractor.extractServerDrivenData` | Cả 2: object hoặc `[object]` (phần tử đầu); nếu parse thất bại thử tiếp `widget["data"]` |

👉 Khuyến nghị cho backend/preview: dùng `template_widget` + `SDUI_WIDGET` + `data: [rootNode]` (đây là dạng chạy được trên cả 2).

`isHomeFocused` (Android) được truyền từ `CornerStone(isFocused)` xuống mọi node để reset impression (§8). iOS dùng `FocusManager`.

### 1.2 Pipeline render một node (đệ quy)

```
JSON node
  │ 1. parse  → ServerDrivenData { type, style, property, value, onTap, trackTypes, expire_time }   (§2, §3)
  │ 2. tracking context: node.trackTypes.{tracking,trackify,itemTracking} ghi đè từng field của cha  (§8)
  │ 3. common style: size → background → clip → border → tap → padding                              (§4)
  │ 4. component theo `type`  (container/box/pager gọi lại pipeline cho từng child)                  (§6)
  │ 5. nếu node có tracking → gắn impression khi visible 100%                                        (§8)
  ▼
View / Composable
```

| Bước | Android | iOS |
|---|---|---|
| Renderer | `ServerDrivenUIRenderer(data, modifier, isHomeFocused)` | `ServerDriverUIRenderer(data)` |
| Dispatch | `when (data.type)` trong renderer | `data.type.uiType.renderUI(value, uiProp)` → `AnyView` |
| Common style | `Modifier.applyCommonStyle(...)` áp lên modifier truyền vào component | `.applyCommonStyle(style, onTap)` bọc **bên ngoài** view component |
| Tracking context | `SDUITrackingContext` (CompositionLocal) | `SDUITrackingContextModifier` (Environment) |
| Impression | `Modifier.trackVisibility(FULL, resetKey = isHomeFocused, isMiniApp = true)` | `InViewPort { … }` |

---

## 2. Schema của một node

### 2.1 Khung chung

```jsonc
{
  "type": "container",            // BẮT BUỘC — §2.2
  "style":    { … },              // optional — §4
  "property": { … },              // LUÔN GỬI (kể cả {}) — iOS bỏ node nếu thiếu (§3)
  "value":    "…" | { … },        // LUÔN GỬI — spacer/pageIndicator gửi "" (§3)
  "onTap":    { "actionType": "…", "actions": [ … ] },   // optional — §7
  "trackTypes": {                 // optional — §8
    "trackId": "uuid",
    "containerType": "widget" | "item",
    "tracking": { … }, "trackify": { … }, "itemTracking": { … }
  },
  "expire_time": 1813004156000    // optional — epoch **milliseconds**; số hoặc chuỗi số; -1 = không hết hạn
}
```

Key lạ bị **bỏ qua** (ví dụ `widgetId`, `onTap.title`, `onTap.ctaType`, `onTap.iconSource`, `actions[].ref_id`, `actions[].action_type`).

### 2.2 Danh sách `type`

| `type` (chuỗi, phân biệt hoa thường) | Kiểu `value` | Có children? | Mục |
|---|---|---|---|
| `text` | string | – | [6.1](#61-text) |
| `image` | string (URL) | – | [6.2](#62-image) |
| `spacer` | string (bỏ qua, gửi `""`) | – | [6.3](#63-spacer) |
| `tag` | string | – | [6.4](#64-tag) |
| `container` | `{ "children": [node] }` | ✓ | [6.5](#65-container) |
| `box` | `{ "children": [node] }` | ✓ (chồng lớp) | [6.6](#66-box) |
| `button` | `{ "title": string, … }` | – | [6.7](#67-button) |
| `pager` | `{ "children": [node] }` | ✓ (mỗi child = 1 trang) | [6.8](#68-pager) |
| `pageIndicator` | string (bỏ qua) | – | [6.9](#69-pageindicator) |
| `progressBar` | `{ currentValue, maxValue, subDes1?, subDes2? }` | – | [6.10](#610-progressbar) |

Đơn vị kích thước: **dp (Android) = pt (iOS)** = px CSS ở mật độ 1x.

---

## 3. Quy tắc parse & lỗi

| Tình huống | Android | iOS |
|---|---|---|
| `type` thiếu / không nằm trong §2.2 | node = `null` → **bị bỏ** (child bị bỏ, root → không render) | decode lỗi → child bị bỏ, root → không render |
| `property` **thiếu** | dùng `{}` → default | ⚠️ lỗi decode → **node bị bỏ** (trừ `button`). Đã kiểm chứng bằng JSONDecoder |
| `property` sai kiểu (không phải object) | dùng `{}` → default | ⚠️ node bị bỏ (trừ `button`: khoan dung → default) |
| `value` thiếu / sai kiểu ở type dạng string | dùng `""` | ⚠️ lỗi → node bị bỏ |
| `value` thiếu với container/box/pager/button/progressBar | node bị bỏ | node bị bỏ |
| `progressBar.value` thiếu `currentValue`/`maxValue` | node bị bỏ | node bị bỏ |
| `style` lỗi từng key | key đó = null | key đó = null (decode khoan dung từng key) |
| `trackTypes` sai kiểu | `null` | ⚠️ lỗi → **node bị bỏ** |
| `onTap` sai kiểu | `null` | `null` |
| Boolean dạng `0/1` | `fillMaxWidth/fillMaxHeight` chấp nhận | `fillMaxWidth/fillMaxHeight` chấp nhận; key bool khác thì không |
| Child lỗi trong `children` | chỉ bỏ child đó | chỉ bỏ child đó (decode khoan dung) |
| `expire_time` | parse number/string; `-1` → null; `now(ms) >= expire_time` ⇒ hết hạn | như Android |
| Child hết hạn | lọc khi parse (container/box/pager) | lọc khi render (container/box/pager) |
| **Root** hết hạn | ⚠️ không kiểm tra — vẫn render | ⚠️ không kiểm tra — vẫn render |

---

## 4. Common style

```jsonc
"style": {
  "width": 150, "height": 124,              // số, dp/pt
  "fillMaxWidth": true, "fillMaxHeight": 0, // bool hoặc 0/1
  "padding": { "all": 12, "top": 0, "left": 4, "right": 4, "bottom": 0 },  // từng cạnh ưu tiên hơn `all`
  "backgroundColor": "#FFFFFF",
  "cornerRadius": 12,
  "border": { "width": 1, "color": "#E8EAED" }   // thiếu width hoặc color → bỏ border
}
```

### 4.1 Thứ tự áp dụng (mô hình box)

Cả 2 nền tảng cùng **kích thước khung**: `width/height` là kích thước **ngoài** (đã gồm padding, giống CSS `box-sizing: border-box`);
nền, bo góc, viền nằm ở biên ngoài; padding nằm bên trong. Nhưng ⚠️ khác nhau ở 3 điểm (chi tiết + cách dựng web:
[sdui-preview.md §4](sdui-preview.md#4-common-style--khung-của-node)):
- **Đặt nội dung trong khung lớn hơn nó** (D24): Android trên-trái; iOS **giữa** (`.frame(width:height:)` mặc định `center`),
  trừ trục có `fillMax*` → trên-trái.
- **Vùng bấm** (D25): Android cả khung gồm padding; iOS chỉ chỗ có vẽ (cả khung nếu có `backgroundColor`, không thì chỉ
  pixel của nội dung con).
- **Cắt phần tràn** (D26): Android chỉ khi `cornerRadius > 0`; iOS luôn cắt.

| # | Bước | Android (`applyCommonStyle`, modifier ngoài → trong) | iOS (`CommonStyleModifier`, trong → ngoài) |
|---|---|---|---|
| 1 | fillMax | `fillMaxWidth()` / `fillMaxHeight()` | `.frame(maxWidth/maxHeight: .infinity, alignment: .topLeading)` |
| 2 | size | `size(w,h)` hoặc `width()`/`height()` | `.frame(width:, height:)` |
| 3 | background | `background(color, RoundedCornerShape(r))` | `.background(color)` |
| 4 | clip | `clip(shape)` nếu `r > 0` | `.clipShape(RoundedRectangle(r))` (luôn) |
| 5 | border | `border(w, color, shape)` | `.overlay(RoundedRectangle(r).strokeBorder(color, lineWidth: w))` (viền vẽ **bên trong** biên) |
| 6 | tap | `clickable { handleTap }` (có ripple) | `.onTapGesture { handleTap }` |
| 7 | padding | `padding(start=left ?: all, top, end=right ?: all, bottom)` | `.padding(EdgeInsets)` |

Ghi chú:
- Khi có cả `fillMaxWidth` và `width`: Android → `width` thắng (áp sau). iOS → frame `width` nằm trong frame `maxWidth: ∞` ⇒ view rộng tối đa nhưng nội dung cố định `width`, căn top-leading.
- Màu không parse được → bỏ background (Android) / trong suốt (iOS). Viền màu lỗi → viền trong suốt.
- `padding.all` chỉ là giá trị mặc định cho cạnh không khai báo.

---

## 5. Token: màu, typography, spacing

### 5.1 Chuỗi màu

| Định dạng | Android (`android.graphics.Color.parseColor`) | iOS (`Color(default:ofHex:)`) |
|---|---|---|
| `#RRGGBB` | ✓ | ✓ |
| `RRGGBB` (không `#`) | ✗ (lỗi → fallback) | ✓ |
| `#AARRGGBB` (8 ký tự, alpha **đứng đầu**) | ✓ | ⚠️ ✗ → fallback |
| Tên màu (`red`, `black`…) | ✓ | ✗ |

👉 **Chỉ dùng `#RRGGBB`** để chắc chắn giống nhau. Muốn trong suốt thì dùng `opacity` ở design khác — hiện SDUI chưa có.

### 5.2 Typography (`text.property.typography`)

Font SF Pro Text (Android: font mặc định của theme kits `SFProText`; iOS: font hệ thống). Android `vn.momo.kits.const.Typography`
qua `vn.momo.kits.components.Text`; iOS `text` dùng `Font` của `@momo-kits/native-kits` (`Typography/Typography.swift`), còn
`tag`/`progressBar`/`button` dùng `MomoText`.

| Giá trị JSON | Size | Weight | Line-height Android | Line-height iOS ⚠️ (D27) |
|---|---|---|---|---|
| `headlineDefaultBold` | 24 | bold | 34 | tự nhiên ≈ 28.6 |
| `headerDefaultBold` | 16 | bold | 22 | ≈ 19.1 |
| `headerSSemibold` | 14 | semibold | 20 | ≈ 16.7 |
| `headerXsSemibold` | 12 | semibold | 18 | ≈ 14.3 |
| `descriptionDefaultRegular` (**mặc định**) | 12 | regular | 18 | ≈ 14.3 |
| `descriptionXsRegular` | 10 | regular | 14 | ≈ 11.9 |
| `labelSMedium` | 12 | medium | 18 | ≈ 14.3 |
| `labelXsMedium` | 10 | medium | 14 | ≈ 11.9 |
| `actionDefaultBold` | 16 | bold | 22 | ≈ 19.1 |
| `actionSBold` | 14 | bold | 20 | ≈ 16.7 |
| `actionXsBold` | 12 | bold | 18 | ≈ 14.3 |

Giá trị khác → `descriptionDefaultRegular`. iOS `MomoText` đặt `lineSpacing = lineHeight − size` nên chữ nhiều dòng có
khoảng giữa dòng như Android, nhưng **dòng đơn** vẫn cao như cột iOS. Cỡ chữ phóng theo màn > 375 và cỡ chữ hệ thống
(công thức: [sdui-preview.md §3.2](sdui-preview.md#32-typography)).

### 5.3 Token màu/spacing dùng cứng trong component

Từ MoMo kits (`vn.momo.kits.const.Colors/Spacing`, iOS `MoMoUIKits`) — tên token giống nhau 2 bên:
`blue_08/blue_03, green_08/green_03, red_08/red_03, orange_08/orange_03, gold_09/gold_03, black_17, black_01, black_12`,
`Spacing.XXS`, `Spacing.S`. Preview cần map các token này theo bảng màu MoMo kits.

Hằng số khác: text mặc định `#303233`; page indicator active `#A50064`, inactive `#DFDFE6`; progress track `#F2F2F6`.

---

## 6. Component

Mỗi mục: **JSON → mặc định → cách dựng → khác biệt**. File: Android `ServerDrivenUI/UITypes/<Type>/`, iOS `ios/ServerDrivenUI/UITypes/<Type>/`.

### 6.1 `text`

```jsonc
{ "type": "text", "value": "Financial Products Widget",
  "property": { "typography": "headerDefaultBold", "color": "#303233", "lineLimit": 1,
                "textAlignment": "leading|center|trailing|right", "truncationMode": "tail|head|middle", "lineSpacing": 4 } }
```

| Key | Mặc định | Dựng |
|---|---|---|
| `typography` | `descriptionDefaultRegular` | §5.2 |
| `color` | `#303233` | màu chữ |
| `lineLimit` | không giới hạn | số dòng tối đa, cắt bằng `…` |
| `textAlignment` | leading | `center` → giữa; `trailing`/`right` → phải; khác → trái |
| `truncationMode` | tail | |
| `lineSpacing` | – | |

⚠️ Khác biệt:
- `truncationMode`: Android **luôn** cắt cuối (`Ellipsis`); iOS hỗ trợ `head`/`middle`.
- `lineSpacing`: Android đặt **line-height = lineSpacing (sp)**; iOS **cộng thêm** khoảng cách giữa dòng. Cùng một số cho kết quả khác nhau.
- `color` lỗi: Android → `#303233`; iOS → đen.
- Căn chữ **dòng đơn** (D28): Android khung chữ = khung node nên `textAlignment` luôn có tác dụng. iOS chữ chỉ rộng bằng
  nội dung, `textAlignment` chỉ căn giữa các dòng của chữ nhiều dòng: có `width` → chữ nằm **giữa** khung; `fillMaxWidth`
  → nằm **trái**; bất kể `textAlignment`.

### 6.2 `image`

```jsonc
{ "type": "image", "value": "https://…/logo.png", "style": { "width": 24, "height": 24 },
  "property": { "contentMode": "fit|fill|scaleAspectFill", "tintColor": "#A50064", "cornerRadius": 4, "aspectRatio": 1.5 } }
```

| Key | Mặc định | Dựng |
|---|---|---|
| `contentMode` | `fit` | `fill`/`scaleAspectFill` → cắt phủ kín (CSS `object-fit: cover`); khác → `contain` |
| `tintColor` | – | tô toàn bộ pixel không trong suốt bằng màu (template rendering) |
| `cornerRadius` | 0 | bo góc **riêng ảnh** (bên trong common style) |
| `aspectRatio` | – | width/height; khung giữ tỉ lệ (fit) |

Android: Coil `AsyncImage`. iOS: `ImageCached`. Không có placeholder/ảnh lỗi riêng. Nên luôn khai báo `style.width/height` — không có thì kích thước = kích thước ảnh tải về (khác nhau giữa 2 nền tảng).

⚠️ `tintColor` không parse được (D36): Android không tô; iOS tô màu trong suốt → **ảnh biến mất**.
`aspectRatio` cùng lúc với `width` + `height`: Android bỏ qua `aspectRatio`; iOS ảnh giữ tỉ lệ, căn giữa trong khung.

### 6.3 `spacer`

```jsonc
{ "type": "spacer", "value": "", "property": { "minLength": 0 } }
```

Khoảng trống co giãn, chiếm phần còn lại trong `row`/`column` cha (xem luật weight §6.5). `minLength` = kích thước tối thiểu.

| | Android | iOS |
|---|---|---|
| Co giãn | do container cha gán `weight(1f)` (có ngoại lệ, §6.5) | `Spacer` SwiftUI, `layoutPriority = 0` |
| `minLength` thiếu | 0 | khoảng mặc định của hệ thống (~8) ⚠️ |
| Trong `box`/`scrollRow`/`scrollColumn` | không co giãn (0 + minLength) | `Spacer` trong ZStack/ScrollView không co giãn rõ ràng |
| `minLength` áp cho | ⚠️ **cả 2 chiều** (`defaultMinSize(minLength, minLength)`) → spacer trong `row` làm hàng cao ít nhất `minLength` (D35) | chỉ trục chính |

### 6.4 `tag`

```jsonc
{ "type": "tag", "value": "Mới",
  "property": { "tagType": "info|success|error|warning|highlight", "backgroundColor": "#…", "textColor": "#…", "iconUrl": "https://…" } }
```

Dựng: hàng ngang `[icon 12×12]? + text`, cách nhau `Spacing.XXS`; padding ngang `Spacing.S`, dọc 1; bo góc `Spacing.S`;
chữ `labelSMedium`, 1 dòng.

| `tagType` | nền | chữ |
|---|---|---|
| `info` | blue_08 | blue_03 |
| `success` | green_08 | green_03 |
| `error` | red_08 | red_03 |
| `warning` | orange_08 | orange_03 |
| `highlight` | gold_09 | gold_03 |
| khác/thiếu | black_17 | black_01 |

`backgroundColor`/`textColor` ghi đè preset. ⚠️ Màu hex lỗi: Android quay về preset; iOS nền → trong suốt, chữ → đen.
⚠️ Chiều cao (D27): Android `18 + 2 = 20`; iOS `MomoText` dòng đơn ≈ `14.3 + 2 ≈ 16`.

### 6.5 `container`

```jsonc
{ "type": "container",
  "property": { "layout": "column|row|scrollColumn|scrollRow", "spacing": 8, "alignment": "…" },
  "value": { "children": [ … ] } }
```

| Key | Mặc định | Ý nghĩa |
|---|---|---|
| `layout` | `column` | kiểu xếp |
| `spacing` | Android `0` · ⚠️ iOS: khoảng mặc định hệ thống (~8) | khoảng cách giữa các child |
| `alignment` | đầu (top/leading) | căn theo **trục phụ**: `column`: `center` \| `trailing`/`right`; `row`: `center` \| `bottom`/`end`. Android `column` còn dùng `center`/`bottom`/`end` để căn **trục chính** (dồn nhóm child vào giữa/đáy) |

👉 Luôn gửi `spacing` (kể cả `0`) để 2 nền tảng giống nhau.

**Layout `row`** (Android `Row`, iOS `HStack`) — luật chia chỗ trên Android (preview nên làm theo, iOS đạt kết quả tương đương nhờ `layoutPriority`):

| Child | Android | iOS |
|---|---|---|
| `style.fillMaxWidth == true` | `weight(1f)` — chiếm hết phần còn lại | `maxWidth: ∞` |
| `spacer` | `weight(1f)` **trừ khi** hàng có ít nhất 1 container "co giãn được" (container không `width`, không `fillMaxWidth`) → khi đó spacer **không co giãn** | `Spacer`, ưu tiên thấp |
| `container` không `width`, không `fillMaxWidth` | `weight(1f, fill=false)` — nhận tối đa phần còn lại nhưng co theo nội dung | `layoutPriority 1` |
| `text` không `width` | `weight(1f, fill=false)` | `layoutPriority 1` |
| khác | kích thước tự nhiên | kích thước tự nhiên |

⚠️ Cách Compose chia `weight` (D29): mọi child có weight nhận **phần bằng nhau** của chỗ còn lại; `fill=false` chỉ cho
phép nhỏ hơn phần đó, chỗ dư **không** chia lại. Ví dụ `[text dài, spacer, icon]` (không có container co giãn) → text tối
đa ½ chỗ còn lại dù spacer không cần. iOS `HStack` cho text lấy đủ chỗ nó cần. Thuật toán đầy đủ:
[sdui-preview.md §5.1](sdui-preview.md#51-row).

**Layout `column`** (`Column` / `VStack`): child là `spacer` hoặc có `fillMaxHeight` → `weight(1f)` (đẩy các child sau xuống đáy nếu column có chiều cao cố định).

⚠️ Weight khi trục chính **không bị giới hạn** (D30, suy từ mã Compose `RowColumnMeasurePolicy`, cần xác nhận trên máy):
child có weight nhận `0`. Gặp khi `row` không `width` nằm trong `scrollRow` (text/container co giãn rộng 0), hoặc
`column` nằm trong feed / `scrollColumn` mà không có `height` (child `fillMaxHeight` cao 0, `spacer` chỉ còn `minLength`).
iOS: kích thước tự nhiên.

⚠️ `alignment` dọc của `column` (D31): Android `center` / `bottom` / `end` dồn nhóm child vào giữa / đáy cột; iOS không
có tác dụng (nhóm theo D24). iOS căn ngang (`center`/`trailing`) trong bề rộng child rộng nhất, không phải bề rộng khung.

**`scrollRow` / `scrollColumn`**: cuộn ngang/dọc, ẩn thanh cuộn (iOS), không áp weight — child nên có `width` (scrollRow) / `height` (scrollColumn).

### 6.6 `box`

```jsonc
{ "type": "box", "property": { "contentAlignment": "bottomEnd" }, "value": { "children": [ … ] } }
```

Các child **chồng lên nhau** (child sau nằm trên). Tất cả child căn theo `contentAlignment`:

| Giá trị | Vị trí |
|---|---|
| `topStart` (mặc định) | trên-trái |
| `topCenter` \| `top` | trên-giữa |
| `topEnd` | trên-phải |
| `centerStart` \| `start` | giữa-trái |
| `center` | giữa |
| `centerEnd` \| `end` | giữa-phải |
| `bottomStart` | dưới-trái |
| `bottomCenter` \| `bottom` | dưới-giữa |
| `bottomEnd` | dưới-phải |

Kích thước box = child lớn nhất (trừ khi style đặt size).

### 6.7 `button`

```jsonc
{ "type": "button",
  "property": { "ctaType": "BUTTON|TOGGLE", "actionType": "…", "actions": [ /* §7 */ ],
                "type": "primary|secondary|tonal|outline|danger|text|disabled",   // fallback nếu `value` không có
                "iconLeft": "url", "iconRight": "url", "color": "#hex" },          // fallback nếu `value` không có
  "value":    { "title": "Thu thập",
                "type": "outline", "iconLeft": "url", "iconRight": "url",         // đọc ở đây trước
                "color": "#hex", "description": "…" } }                           // giống `cta` template
```

Dựng: chuyển thành `CtaConfigType` rồi vẽ bằng `TemplateCtaContainer` (component CTA dùng chung của template).
Cả 2 nền tảng dựng **giống `cta` của template** (Android `createCtaConfig`, iOS `CtaConfigType.createFrom`):
- `ctaType` (không phân biệt hoa thường): `BUTTON` → `TemplateMainCta` (nút theo `type`); `TOGGLE` → `TemplateToggle`;
  `ICON` → không vẽ gì. **Thiếu / sai giá trị → `BUTTON`** (như template).
- `type` / `iconLeft` / `iconRight` / `color`: đọc `value` trước, rỗng thì đọc `property`. `description` đọc ở `value`.
- `actions`: parse **cùng luật với `onTap`** (§7) — thiếu / sai `actionType` → bỏ action đó.
- Bấm → chạy `actions` tuần tự (§7); trong lúc `CALL_API` hiện loading trên nút.
- Sau action: kết quả (`isSuccess = response có data`) điều khiển `TOGGLE`; item trả về từ `CALL_API` được giữ làm
  `currentData` cho lần bấm sau (tracking `app_info.item_*`, merge).
- Nếu item trả về có `cta` (có `title` hoặc `actions`) thì nút **vẽ và chạy `cta` đó** — giống item template
  (vd. "Thu thập" → "Dùng ngay" + `REDIRECT`); không có thì giữ CTA của node. State này gắn với payload của node: server
  gửi node mới (vd. Home reload) thì quay về CTA của node (Android `remember(nodeKey)`, iOS `.id(nodeKey)`).
- Tracking click: `positionSlot` = `itemTracking.position_slot` kế thừa (mặc định `-1`).

⚠️ Khác biệt còn lại:
- `type` thiếu (D32): Android → `TEXT`; iOS → `OUTLINE`. `type` lạ: Android → `TEXT`; iOS → `PRIMARY`.
- Kích thước nút SMALL (D33): Android cao **28** cố định, bo góc **8**; iOS cao theo nội dung ≈ 26.3, bo góc **6**.
  `title: ""`: Android vẽ nút rỗng; iOS không vẽ.
- `TOGGLE` (D34): Android không truyền modifier vào `TemplateToggle` → **mất `style`, `onTap`, impression** của node;
  khi loading Android không vẽ gì, iOS hiện spinner 20×20.
- `value.color`/`value.description` được đọc nhưng **không ảnh hưởng hình** trên cả 2 nền tảng (`TemplateMainCta` không dùng).
- iOS bọc nút bằng `.padding(0.5).fixedSize()` (kích thước theo nội dung).
- `CALL_API` chờ response rồi mới chạy action kế tiếp: iOS có (`withCheckedThrowingContinuation`); Android **chưa**
  (`ActionHandler` trả kết quả ngay sau khi gọi `onSubmit`) → với host trả callback bất đồng bộ, action sau `CALL_API`
  không chạy trên Android.

### 6.8 `pager`

```jsonc
{ "type": "pager",
  "property": { "showIndicator": true, "activeColor": "#A50064", "inactiveColor": "#DFDFE6",
                "indicatorBackgroundColor": "#000000", "alignmentIndicator": "bottomCenter",
                "paddingIndicator": { "left": 6, "right": 0, "top": 0, "bottom": 4 } },
  "value": { "children": [ /* mỗi child = 1 trang */ ] } }
```

Dựng: carousel vuốt ngang, mỗi child chiếm 1 trang. Không tự chạy, không lặp vòng. Nếu `showIndicator` và > 1 trang:
vẽ [pageIndicator](#69-pageindicator) bên trong "viên thuốc" nền `indicatorBackgroundColor` (mặc định đen ~20% alpha),
padding trong 6 (ngang) / 4 (dọc), bo góc 8, đặt chồng lên pager theo `alignmentIndicator` (bảng §6.6, mặc định **bottomCenter**),
cách mép theo `paddingIndicator`.

| | Android | iOS |
|---|---|---|
| Không có trang nào | không vẽ | TabView rỗng |
| Chiều rộng | luôn `fillMaxWidth` | theo frame cha |
| Chiều cao | theo trang hiện tại | ⚠️ TabView không tự co — **phải đặt `style.height`** |
| `paddingIndicator` thiếu | (6,4,6,4) | (top 4, left 6, bottom 4, right 6) |
| `paddingIndicator` có, thiếu cạnh | left 6, right 0, top 0, bottom 4 | ⚠️ left **4**, right 0, top 0, bottom 4 |
| `showIndicator` dạng 0/1 | ⚠️ không nhận (coi như `true`) | ⚠️ lỗi decode property |
| `indicatorBackgroundColor` mặc định | `#33000000` | `black.opacity(0.2)` (tương đương) |

### 6.9 `pageIndicator`

```jsonc
{ "type": "pageIndicator", "value": "", "property": { "total": 4, "activeIndex": 0, "activeColor": "#A50064", "inactiveColor": "#DFDFE6" } }
```

Hàng chấm cách nhau 4: chấm active = viên 12×4, inactive = 4×4, bo tròn. `total <= 1` → không vẽ.
Khi đứng riêng là tĩnh (không liên kết pager nào); `pager` tự tạo indicator động của nó.

### 6.10 `progressBar`

```jsonc
{ "type": "progressBar",
  "property": { "color": "#A50064", "barHeight": 4, "barWidth": 200 },
  "value": { "currentValue": 30, "maxValue": 100, "subDes1": "Đã chi 300k", "subDes2": "1tr" } }
```

Dựng (cột, khoảng cách 2):
1. Hàng `subDes1` (trái, cắt còn **23 ký tự**, 1 dòng) — `subDes2` (phải). Chữ `descriptionXsRegular`, màu `black_12`. Hàng luôn có mặt kể cả khi rỗng.
2. Thanh: track `#F2F2F6` bo 2, cao `barHeight` (mặc định 4), rộng `barWidth` hoặc full; phần đã chạy màu `color` (mặc định `black_12`),
   tỉ lệ = `clamp(current / max, 0, 1)` (max ≤ 0 → 0), **tối thiểu 2%**, animate từ 0 trong 800 ms ease-out.

Khác biệt nhỏ: Android `barWidth` là độ rộng cố định, thanh **sát trái**; iOS là `maxWidth`, thanh **căn giữa** cột
(`VStack` mặc định `center`) (D15). iOS không clamp dưới 0 (giá trị âm vẫn hiện 2%). `color` lỗi: Android `black_12`,
iOS đen (D9). `subDes1` cắt còn 23 ký tự + `"..."`: Android đếm UTF-16, iOS đếm ký tự hiển thị.

---

## 7. onTap & actions

`onTap` gắn được vào **mọi node** (bấm cả vùng frame, §4.1 bước 6). `button` có `property.actions` riêng (§6.7) nhưng chạy cùng cơ chế.

```jsonc
"onTap": {
  "actionType": "…",                      // optional, chỉ truyền tiếp vào CtaConfig
  "actions": [
    { "actionType": "REDIRECT", "featureCode": "hub_voucher_detail", "params": { "campaignId": "…" } },
    { "actionType": "CALL_API", "endpoint": "/api/…", "params": { … } }
  ]
}
```

Thực thi (`ActionHandler.handleActionsSerialize` / `TemplateActionHandler.handleActionsSerialize`): chạy **tuần tự**, action trước
thành công mới chạy action sau.

| `actionType` | Hành vi | Ra host qua |
|---|---|---|
| `REDIRECT` | track `click` → `onPress(refId = featureCode, params = params + {sourceFromForTracking:"service_widget"})` | `CornerstoneStore.onPress` |
| `CALL_API` | loading → `onSubmit({endpoint, params})` → track `click` kèm `requested_status` → nếu `response_status.code == 200` thành công | `CornerstoneStore.onSubmit` |

Tracking click dùng `tracking`/`trackify` **kế thừa** của node (§8) và `app_info { cta_type, cta_action_type, cta_endpoint, item_slot, … }`.

`actionType` của từng action (`onTap.actions` và `button.property.actions` dùng chung luật — Android `parseSDUIActionConfig`, iOS `CActionConfig`):
không phân biệt hoa thường; **thiếu hoặc sai giá trị → bỏ riêng action đó** (không đổi thành `CALL_API`, không bỏ cả `onTap`).
Preview không cần thực thi action — chỉ cần hiển thị vùng bấm.

---

## 8. Tracking & impression

```jsonc
"trackTypes": {
  "trackId": "5366ca63-…",           // dùng làm id chống trùng impression
  "containerType": "widget" | "item",
  "tracking":     { "id": "…", "type": "Disco", "data": "<base64>", … },
  "trackify":     { … },
  "itemTracking": { "item_id": "…", "position_slot": 0, … }
}
```

- **Kế thừa theo từng field**: node con không khai báo field nào thì lấy của tổ tiên gần nhất (`SDUITrackingResolver`).
- **Impression**: node có ít nhất 1 trong `tracking/trackify/itemTracking` → khi hiển thị **100%** trên màn hình bắn
  `onTrackEvent({action:"impression", tracking, trackify, itemTracking?})` với `impressionTrackingId = "<trackId>_100per"` (chống trùng trong `CornerstoneStore`; thiếu `trackId` → Android `"_100per"`, iOS `"_100per"` → mọi node không trackId dùng chung 1 id).
- `containerType == "widget"` → impression **không** gửi `itemTracking` (đại diện cả widget). `item` hoặc không khai báo → gửi.
- Reset impression: Android theo `resetKey = isHomeFocused` + `DataChangeManager` (chi tiết: memory *sdui-trackvisibility-arming*); iOS theo `FocusManager.isFocused || isMiniAppFocused` trong `InViewPort`.

Preview: không cần tracking.

---

## 9. Ví dụ đầy đủ có chú thích

Nguồn: `example/android/app/src/main/assets/dataJSON.json` (khối `SDUI_WIDGET` quanh dòng 3666 — "Financial Products Widget").
Các mẫu SDUI khác trong file đó: quanh dòng 3031, 4390, 4880; iOS: `example/ios/PreviewApp/sdkJSON.json`, `MockData.json`.

```text
template_widget / SDUI_WIDGET, data[0] =
container column, spacing 8, bg #FFFFFF, radius 12, padding 12            trackTypes: widget (tracking) → impression cả widget
├─ container row, spacing 12                                              ── HEADER
│  ├─ image 24×24 fill                                                    logo
│  ├─ container column, spacing 4                                         (Android: weight(1f, fill=false))
│  │  ├─ text headerDefaultBold #303233 1 dòng, fillMaxWidth             "Financial Products Widget"
│  │  └─ text descriptionDefaultRegular 1 dòng                           "Choose the product…"
│  ├─ spacer                                                             (Android: KHÔNG co giãn vì hàng có container co giãn được;
│  │                                                                      cột vẫn đẩy icon sang phải nhờ text fillMaxWidth)
│  └─ image 18×18 + onTap REDIRECT featureCode=promotion_hub             icon mũi tên → mở promotion hub
└─ container scrollRow, spacing 8, padding 0                              ── DÃY THẺ CUỘN NGANG
   ├─ container column 150×124, spacing 8, bg #FEF8FC, radius 12,        THẺ (item): onTap REDIRECT hub_voucher_detail,
   │  border 1 #E8EAED, padding 12, expire_time "1813004156000"          trackTypes item (itemTracking position_slot 0)
   │  ├─ text labelXsMedium #727272                                      "Personal Loan"
   │  ├─ text actionSBold #EB2F96                                        "Up to 100,000,000 VND"
   │  ├─ spacer minLength 0                                              co giãn → đẩy phần dưới xuống đáy thẻ (thẻ cao cố định 124)
   │  └─ container row, spacing 0, alignment bottom
   │     ├─ container column spacing 0
   │     │  ├─ container row spacing 4 alignment center: image 12×12 + text headerXsSemibold "Loan term"
   │     │  └─ text descriptionXsRegular #484848 "Flights + Hotel included"
   │     ├─ spacer minLength 0
   │     └─ image 40×40 fill                                             ảnh minh hoạ góc dưới-phải
   ├─ (thẻ 2 "Things To Do", position_slot 1)
   └─ (thẻ 3 "Trip Summary", position_slot 2)
```

Những key trong mẫu **không có tác dụng** với renderer hiện tại: `widgetId`, `onTap.title`, `onTap.ctaType`, `onTap.type`, `onTap.iconSource`,
`actions[].ref_id`, `actions[].action_type`, các `tracking` ở cấp zone ngoài `data` (zone tracking dùng cho template, không phải SDUI).
Các node trong mẫu không khai báo `onTap.actionType` — hợp lệ.

---

## 10. Bảng khác biệt Android ↔ iOS

Danh sách cần đồng bộ. Khi sửa xong một dòng → xoá dòng, bump PATCH, ghi Changelog.

| # | Vùng | Android | iOS | Gợi ý chuẩn |
|---|---|---|---|---|
| D1 | `server_driven_widget.data` là mảng | không render | render phần tử đầu | nhận cả hai |
| D2 | `container.spacing` thiếu | 0 | khoảng mặc định hệ thống | 0 |
| D3 | `spacer.minLength` thiếu | 0 | mặc định hệ thống | 0 |
| D6 | `text.truncationMode` | luôn tail | head/middle/tail | head/middle/tail |
| D7 | `text.lineSpacing` | = line-height | cộng thêm khoảng cách | chốt 1 nghĩa |
| D8 | Màu `#AARRGGBB`, không `#`, tên màu | `#AARRGGBB` ✓, tên ✓, không `#` ✗ | chỉ 6 ký tự (có/không `#`) | thống nhất `#RRGGBB` (+ `#RRGGBBAA`?) |
| D9 | Fallback màu lỗi (text/tag/progressBar) | về default/preset (`progressBar` → black_12) | đen/trong suốt (`progressBar` → đen) | về default/preset |
| D10 | `value` sai kiểu ở type dạng string | `""` | bỏ node | `""` |
| D11 | `trackTypes` sai kiểu | bỏ tracking | bỏ node | bỏ tracking |
| D12 | `pager` padding indicator thiếu cạnh `left` | 6 | 4 | 6 |
| D13 | `pager` chiều cao | theo nội dung | cần `style.height` | theo nội dung |
| D15 | `progressBar.barWidth` | width cố định, sát trái | maxWidth, căn giữa | width cố định, sát trái |
| D16 | Root `expire_time` | không kiểm tra | không kiểm tra | ẩn khi hết hạn? (cần chốt) |
| D17 | `fillMaxWidth` + `width` cùng lúc | width thắng | khung full, nội dung width | width thắng |
| D18 | Thiếu key `property` / `value` | dùng default / `""` | bỏ node | dùng default |
| D24 | Nội dung trong khung `width`/`height` lớn hơn nó (container, box, text, tag, button, trang pager) | trên-trái | giữa | trên-trái |
| D25 | Vùng bấm `onTap` | cả khung gồm padding | chỉ chỗ có vẽ (cả khung nếu có `backgroundColor`) | cả khung |
| D26 | Cắt nội dung tràn khung | chỉ khi `cornerRadius > 0` | luôn | chỉ khi `cornerRadius > 0` |
| D27 | Line-height chữ (`text`; dòng đơn của `tag`/`progressBar`/`button`) | theo kits (16 → 22) | tự nhiên của font (16 → ≈ 19.1) | theo kits |
| D28 | `textAlignment` với chữ dòng đơn | luôn theo `textAlignment` | `width` → giữa, `fillMaxWidth` → trái | theo `textAlignment` |
| D29 | `row`: chia chỗ cho text/container co giãn | mỗi child weight tối đa phần bằng nhau | theo nhu cầu (`HStack`) | theo nhu cầu |
| D30 | Weight khi trục chính không giới hạn (cần xác nhận trên máy) | child weight = 0 | kích thước tự nhiên | kích thước tự nhiên |
| D31 | `column` `alignment` `center`/`bottom`/`end` theo chiều dọc | dồn nhóm child | không tác dụng | dồn nhóm child |
| D32 | `button` `type` thiếu / lạ | `TEXT` / `TEXT` | `OUTLINE` / `PRIMARY` | chốt 1 giá trị |
| D33 | `button` kích thước, `title: ""` | cao 28, bo 8; vẽ nút rỗng | ≈ 26.3, bo 6; không vẽ | cao 28, bo 8; không vẽ |
| D34 | `button` `TOGGLE`: `style`/`onTap`/impression; loading | bị bỏ; không vẽ | áp dụng; spinner | áp dụng; spinner |
| D35 | `spacer.minLength` | min cả 2 chiều | chỉ trục chính | chỉ trục chính |
| D36 | `image.tintColor` không parse được | không tô | tô trong suốt (ảnh mất) | không tô |

---

## 11. Changelog

| Version | Ngày | Thay đổi | Người |
|---|---|---|---|
| 1.0.0 | 2026-10-19 | Bản đầu: tổng hợp từ code Android + iOS tại commit `0fa07a1d`; 10 component; bảng khác biệt D1–D18 | phuong.tran18 |
| 1.1.0 | 2026-10-23 | **Android + iOS** — `button` dựng giống `cta` template: thiếu/sai `ctaType` → `BUTTON` (trước: không vẽ; Android sửa luôn default `"BUTTON"` dạng chuỗi trong `TemplateCtaContainer`); `ctaType`/`actionType` không phân biệt hoa thường; `type/iconLeft/iconRight/color` đọc `value` rồi fallback `property`; thêm `color`/`description`; `actions` parse chung luật với `onTap` (thiếu/sai `actionType` → bỏ riêng action đó; trước: Android thành `CALL_API`, iOS thiếu → `CALL_API`, sai → bỏ cả `actions`/`onTap`); `TOGGLE` nhận `isSuccess`; giữ item trả về từ `CALL_API` làm `currentData` và vẽ/chạy `data.cta` nếu có ("Thu thập" → "Dùng ngay"); state reset khi payload node đổi; Android `positionSlot` theo `itemTracking.position_slot`. Cập nhật §6.7, §7; §10 đóng D4, D5, D14 (D19–D23 tạo rồi đóng trong cùng bản). MINOR vì chỉ thêm key optional và sửa payload thiếu/sai vốn không vẽ được; payload hợp lệ: lần vẽ đầu không đổi, sau `CALL_API` có `data.cta` thì nút đổi theo; Android tracking click đổi `app_info.item_slot` từ `-1` sang `position_slot` | phuong.tran18 |
| 1.1.1 | 2026-10-26 | **Chỉ tài liệu** (không đổi code) — đối chiếu lại toàn bộ `ServerDrivenUI/**` 2 nền tảng + MoMo kits: sửa §4.1 (trước ghi "cùng mô hình" — thực tế khác về căn nội dung trong khung, vùng bấm, cắt tràn); §5.2 thêm line-height Android/iOS và nguồn font; bổ sung khác biệt vào §6.1, §6.2, §6.3, §6.4, §6.5, §6.7, §6.10; §10 mở D24–D36, cập nhật D9, D15. Thêm [sdui-preview.md](sdui-preview.md) (công thức dựng cho tool preview) và quy tắc cập nhật nó ở §0.1 | phuong.tran18 |
