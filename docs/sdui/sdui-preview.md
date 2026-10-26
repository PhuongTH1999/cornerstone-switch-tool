# SDUI Preview — đặc tả renderer cho tool preview

| | |
|---|---|
| **Implement theo spec** | [sdui-spec.md](sdui-spec.md) `1.1.1` |
| **Cập nhật** | 2026-10-26 |
| **Đối chiếu với code** | branch `fix/button_sdui` (sau commit `cb6c8b4c`) · MoMo kits Android `0.168.1-beta.9` · `@momo-kits/native-kits` iOS (example app) |
| **Đối tượng** | Dev làm tool preview SDUI (web / ngôn ngữ khác) |

File này là **công thức dựng** (parse → layout → vẽ) cho một renderer thứ ba, viết sao cho kết quả trùng với app thật.
Mỗi quy tắc ghi rõ là **[chung]** (2 nền tảng giống nhau), hoặc tách **[A]** Android / **[I]** iOS khi 2 nền tảng
đang khác nhau. Mã khác biệt `Dxx` trỏ tới bảng §10 của spec.

Hợp đồng JSON (key, kiểu, mặc định) xem [sdui/README.md](sdui/README.md) và file từng component. File này không lặp lại
phần đó, chỉ mô tả **cách vẽ** chính xác.

---

## Mục lục

0. [Nguyên tắc của tool](#0-nguyên-tắc-của-tool)
1. [Đầu vào: bóc zone](#1-đầu-vào-bóc-zone)
2. [Parse: node nào được vẽ](#2-parse-node-nào-được-vẽ)
3. [Token: màu, chữ, khoảng cách](#3-token-màu-chữ-khoảng-cách)
4. [Common style → khung của node](#4-common-style--khung-của-node)
5. [Layout container (row / column / scroll)](#5-layout-container)
6. [Từng component](#6-từng-component)
7. [Tương tác trong preview](#7-tương-tác-trong-preview)
8. [Cảnh báo (lint) tool nên hiện](#8-cảnh-báo-lint-tool-nên-hiện)
9. [Bộ test đối chiếu với máy thật](#9-bộ-test-đối-chiếu-với-máy-thật)

---

## 0. Nguyên tắc của tool

| # | Quy tắc |
|---|---|
| P1 | Có công tắc **`platform: "android" \| "ios"`**. Mọi quy tắc [A]/[I] dưới đây chọn nhánh theo công tắc. Nên có chế độ **so sánh** vẽ 2 bản cạnh nhau. |
| P2 | Đơn vị: **1 dp = 1 pt = 1 px CSS**. Khung mô phỏng rộng **375** (màn chuẩn của kits). |
| P3 | **Không** mô phỏng phóng chữ: ở màn rộng 375 và cỡ chữ hệ thống mặc định, cả 2 nền tảng dùng đúng cỡ chữ gốc. (Máy rộng hơn 375 thì chữ to lên tới +5, xem §3.2.) |
| P4 | Font: **SF Pro Text** cho cả 2 (Android kits mặc định `SFProText`, iOS font hệ thống). Web fallback: `-apple-system, "SF Pro Text", system-ui, sans-serif`. |
| P5 | Không chạy action thật, không bắn tracking. Chỉ hiện vùng bấm và log action (§7). |
| P6 | Chỗ nào ghi **≈** là giá trị xấp xỉ (do engine layout khác nhau). Các mục còn lại lấy đúng số từ code. |

---

## 1. Đầu vào: bóc zone

```text
input = zone JSON
if input.type == "template_widget" && input.templateType == "SDUI_WIDGET":
    root = input.data là mảng ? input.data[0] : input.data          [chung]
    nếu parse(root) thất bại: thử input.data["data"]                  [chung]
elif input.type == "server_driven_widget":
    [A] root = input.data (phải là object; mảng → không vẽ gì)        (D1)
    [I] root = input.data là mảng ? input.data[0] : input.data
else:
    root = input   // tool cho phép dán thẳng một node
```

- **Root không bị kiểm tra `expire_time`** [chung] (D16). Child thì có (§2).
- JSON có dấu phẩy thừa: [A] vẫn đọc được (parser của bridge), [I] hỏng cả cây. Tool nên parse **nghiêm** (JSON chuẩn)
  và báo lỗi.

---

## 2. Parse: node nào được vẽ

`parse(node, platform) → Node | null`. Trả `null` = node (và cả nhánh con) **không vẽ**, không chiếm chỗ.

| Kiểm tra | [A] | [I] |
|---|---|---|
| `type` thiếu / không thuộc 10 giá trị (phân biệt hoa thường) | null | null |
| `property` thiếu hoặc không phải object | dùng `{}` | **null** (trừ `button` → `{}`) (D18) |
| Một key trong `property` sai kiểu (vd `"lineLimit": "1"`) | bỏ key đó | **null** — trừ `container` và `button` (đọc khoan dung từng key) |
| `value` của `text/image/tag/spacer/pageIndicator` thiếu / không phải chuỗi | `""` | **null** (D10) |
| `value` của `container/box/pager/button/progressBar` không phải object | null | null |
| `progressBar.value` thiếu `currentValue` hoặc `maxValue` (số) | null | null |
| `style` | khoan dung từng key (key sai kiểu = bỏ key) | như [A] |
| `style.fillMaxWidth/fillMaxHeight` = `0/1` | nhận | nhận |
| `style.border` thiếu `width` hoặc `color` | bỏ viền | bỏ viền |
| `trackTypes` không phải object, hoặc `tracking/trackify/itemTracking` không phải object | bỏ tracking | **null** (D11) |
| `onTap` sai kiểu | bỏ onTap | bỏ onTap |
| `onTap.actions[i]` thiếu / sai `actionType` (`REDIRECT`, `CALL_API`, không phân biệt hoa thường) | bỏ action đó | bỏ action đó |
| `pager.property.showIndicator` không phải bool | coi như `true` | **null** |
| `children` thiếu / không phải mảng | `[]` | `[]` |
| Child lỗi trong `children` | bỏ child đó | bỏ child đó |
| Child có `expire_time` (số ms hoặc chuỗi số; `-1` = không hết hạn) và `now >= expire_time` | bỏ child | bỏ child |

Danh sách key `property` từng type: xem file component trong [sdui/](sdui/README.md).

---

## 3. Token: màu, chữ, khoảng cách

### 3.1 Parse chuỗi màu

| Chuỗi | [A] `Color.parseColor` | [I] `Color(default:ofHex:)` |
|---|---|---|
| `#RRGGBB` | ✓ | ✓ |
| `RRGGBB` | ✗ | ✓ |
| `#AARRGGBB` (alpha đứng đầu) | ✓ | ✗ |
| tên màu (`red`, `gray`…) | ✓ | ✗ |
| `#RGB` | ✗ | ✗ |

Khi màu **không parse được**, mỗi chỗ có fallback riêng — tool phải dùng đúng bảng này:

| Chỗ dùng | [A] | [I] |
|---|---|---|
| `style.backgroundColor` | không có nền | trong suốt |
| `style.border.color` | viền trong suốt | viền trong suốt |
| `text.color` | `#303233` | **đen `#000000`** |
| `tag.backgroundColor` / `tag.textColor` | màu preset theo `tagType` | nền **trong suốt** / chữ **đen** |
| `image.tintColor` | không tô | tô **trong suốt** → ảnh biến mất (D36) |
| `pageIndicator/pager` `activeColor`, `inactiveColor` | `#A50064` / `#DFDFE6` | trong suốt |
| `pager.indicatorBackgroundColor` | `#33000000` | trong suốt |
| `progressBar.color` | `#727272` | **đen** |

### 3.2 Typography

Cỡ chữ và weight giống nhau 2 bên. **Line-height khác nhau** (D27):

| `typography` | size | weight (CSS) | line-height [A] (kits) | line-height [I] ≈ (SF, `1.193 × size`) |
|---|---|---|---|---|
| `headlineDefaultBold` | 24 | 700 | 34 | 28.6 |
| `headerDefaultBold` | 16 | 700 | 22 | 19.1 |
| `headerSSemibold` | 14 | 600 | 20 | 16.7 |
| `headerXsSemibold` | 12 | 600 | 18 | 14.3 |
| `descriptionDefaultRegular` (**mặc định**, cả giá trị lạ) | 12 | 400 | 18 | 14.3 |
| `descriptionXsRegular` | 10 | 400 | 14 | 11.9 |
| `labelSMedium` | 12 | 500 | 18 | 14.3 |
| `labelXsMedium` | 10 | 500 | 14 | 11.9 |
| `actionDefaultBold` | 16 | 700 | 22 | 19.1 |
| `actionSBold` | 14 | 700 | 20 | 16.7 |
| `actionXsBold` | 12 | 700 | 18 | 14.3 |

- [A] mọi chữ SDUI đi qua `vn.momo.kits.components.Text` → line-height cố định theo bảng.
- [I] `text` dùng SwiftUI `Text` + `Font` → line-height tự nhiên của font. `tag`, `progressBar`, `button` dùng
  `MomoText` (`lineSpacing = lineHeight − size`): **dòng đơn** vẫn cao như cột [I]; nhiều dòng thì khoảng giữa các dòng
  bằng cột [A].
- Phóng chữ (không mô phỏng trong preview, chỉ để biết; `w` = cạnh ngắn màn hình, `f` = cỡ chữ hệ thống, chỉ tính khi
  `w > 375` / `f > 1`): [A] `max(min(size × w/375, size + 5), min(size × f, size × 1.5))`, áp cả line-height;
  [I] `text`: `s = min(size × w/375, size + 5)` rồi `min(s × f, s × 1.2)`.

### 3.3 Màu token (MoMo kits, giống nhau 2 bên)

| Token | Hex | Token | Hex |
|---|---|---|---|
| `black_01` | `#FFFFFF` | `blue_03` / `blue_08` | `#007AFF` / `#CCE4FF` |
| `black_04` | `#E8E8E8` | `green_03` / `green_08` | `#34C759` / `#D6F4DE` |
| `black_08` | `#C6C6C6` | `red_03` / `red_08` | `#F5222D` / `#FDD3D5` |
| `black_12` | `#727272` | `orange_03` / `orange_08` | `#FA541C` / `#FEDDD2` |
| `black_17` | `#303233` | `gold_03` / `gold_09` | `#FA8C16` / `#FEF3E7` |
| `pink_03` (primary theme) | `#EB2F96` | `pink_09` (tonal) | `#FDEAF4` |

Theme sáng mặc định: nền surface `#FFFFFF`, nền disable `#EBEBF2`, chữ default `#303233`, chữ disable `#C6C6C6`,
viền default `#E8E8E8`. Host có thể đổi theme (primary) — preview dùng bảng này.

### 3.4 Spacing

`XXS = 2`, `XS = 4`, `S = 8`, `M = 12`, `L = 16`, `XL = 24`, `XXL = 32` (giống nhau 2 bên).

---

## 4. Common style → khung của node

### 4.1 Mô hình hộp [chung]

Một node = **khung ngoài** bọc **nội dung component**:

```text
┌ khung ngoài: width/height (đã gồm padding, như box-sizing: border-box) ─┐
│ nền (backgroundColor) + bo góc (cornerRadius) + viền vẽ PHÍA TRONG biên  │
│   ┌ padding ───────────────────────────────────────────────────────┐    │
│   │ nội dung component                                             │    │
│   └────────────────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────────────┘
```

- `padding`: cạnh riêng (`top/left/right/bottom`) thắng `all`; `all` là mặc định cho cạnh không khai báo.
- Viền **không** cộng thêm kích thước, vẽ đè lên nội dung (giống `box-shadow: inset 0 0 0 Wpx color` hoặc
  `outline` với `outline-offset: -W`).
- `fillMaxWidth` = rộng hết chỗ cha cho (trong `row`: xem §5.1). `fillMaxHeight` tương tự theo chiều dọc.

### 4.2 Đặt nội dung trong khung (D24)

Khi khung **lớn hơn** nội dung (do `width`/`height` cố định):

| | [A] | [I] |
|---|---|---|
| Vị trí nội dung | **trên-trái** (rồi theo alignment riêng của component) | **giữa** khung (SwiftUI `.frame` mặc định `center`) |
| Ngoại lệ | — | trục có `fillMaxWidth`/`fillMaxHeight` (mà không có `width`/`height` cùng trục) → trên-trái |

Ghi chú [I]: nội dung "tham lam" tự lấp đầy khung nên không thấy bị căn giữa — đó là `container` có `spacer` hoặc child
`fillMax*` theo trục chính, `pager`, `progressBar`, ảnh có `width`+`height`. Các trường hợp **thấy rõ khác biệt**:
`text` ngắn có `width`; `container`/`box` có `width`/`height` mà child nhỏ hơn; `tag`/`button` có `width`.

Cài đặt trên web:

```css
.node        { box-sizing: border-box; display: flex; }        /* khung ngoài */
.node.a      { justify-content: flex-start; align-items: flex-start; }
.node.i      { justify-content: center;     align-items: center; }
.node.i.fmw  { justify-content: flex-start; }  /* fillMaxWidth, không có width */
.node.i.fmh  { align-items: flex-start; }      /* fillMaxHeight, không có height */
```

### 4.3 `fillMaxWidth` + `width` cùng lúc (D17)

- [A] `width` thắng: khung rộng `width`.
- [I] khung `width` nằm bên trái trong một khung rộng hết; **nền, bo góc, viền, vùng bấm phủ cả khung rộng hết**,
  nội dung rộng `width`.

### 4.4 Cắt phần tràn (D26)

- [A] chỉ cắt (`overflow: hidden`) khi `cornerRadius > 0`.
- [I] **luôn** cắt theo khung (kể cả `cornerRadius` 0).

### 4.5 Vùng bấm `onTap` (D25)

- [A] toàn bộ khung ngoài, gồm padding (có ripple).
- [I] chỉ chỗ **có vẽ**: nếu node có `backgroundColor` hợp lệ → cả khung; nếu không → chỉ phần pixel của nội dung con
  (chữ, ảnh, nền của con). Padding và khoảng trống không bấm được.

Tool nên tô vùng bấm khi hover theo đúng nền tảng đang chọn.

---

## 5. Layout container

`property.layout`: `column` (mặc định, cả giá trị lạ) · `row` · `scrollRow` · `scrollColumn`.
`spacing`: [A] thiếu → `0`; [I] thiếu → khoảng mặc định của SwiftUI (≈ 8, tuỳ cặp view) (D2). `spacing` áp **giữa mọi
cặp child kề nhau, kể cả `spacer`** [chung].

### 5.1 `row`

**[A] — thuật toán Compose `Row` + `weight` (cài đúng như sau):**

```text
weightableContainer = có child c: c.type=="container" && c.style.width==null && c.style.fillMaxWidth!=true
cho mỗi child:
  fillMaxWidth == true                               → W(fill=true)
  type == "spacer"                                   → weightableContainer ? FIXED : W(fill=true)
  type == "container" && !width && !fillMaxWidth     → W(fill=false)
  type == "text" && !width                           → W(fill=false)
  còn lại                                             → FIXED (kích thước tự nhiên; spacer FIXED = minLength ?? 0)

fixed     = Σ rộng tự nhiên các FIXED + spacing × (số child − 1)
remaining = (row bị giới hạn chiều ngang) ? max(0, maxWidth − fixed) : 0      ← xem D30
share     = remaining / số child W
W(fill=true)  → rộng đúng share
W(fill=false) → đo với maxWidth = share; rộng = min(tự nhiên, share); text xuống dòng / cắt trong share
xếp từ trái sang, chỗ dư nằm cuối hàng
```

Hệ quả cần thấy được trong preview (D29): hàng `[text dài, spacer, icon]` → text bị giới hạn ở **½ chỗ còn lại** dù
spacer không cần chỗ; hàng `[text, text]` → mỗi text tối đa ½.

**[I] — `HStack` + `layoutPriority`** (≈ trên web):

| Child | CSS flex |
|---|---|
| `spacer` | `flex: 1 1 0; min-width: <minLength ?? 8>px` |
| `fillMaxWidth == true` | `flex: 1 1 0; min-width: 0` |
| còn lại | `flex: 0 1 auto; min-width: 0` (co lại khi thiếu chỗ; text cắt / xuống dòng) |

Căn dọc các child (`alignment`) [chung]: `center` → giữa; `bottom` \| `end` → đáy; khác → đỉnh (CSS `align-items`).

### 5.2 `column`

- [A] child là `spacer` hoặc `fillMaxHeight == true` → `weight(1f)` (fill): chia đều chiều cao còn lại **nếu cột bị
  giới hạn chiều cao** (cột có `height`, hoặc nằm trong khung có chiều cao); không giới hạn → các child này cao `0`
  (spacer chỉ còn `minLength`) (D30).
- [I] `spacer` co giãn chiếm chỗ dư (min `minLength ?? 8`); `fillMaxHeight` → `maxHeight: ∞`. Trong khung không giới hạn
  chiều cao: chiều cao tự nhiên.
- Căn ngang các child (`alignment`) [chung]: `center` → giữa; `trailing` \| `right` → phải; khác → trái.
  ⚠️ [I] căn trong bề rộng của **child rộng nhất**, không phải bề rộng khung (D24).
- Căn dọc cả nhóm (D31): [A] `center` → giữa cột, `bottom` \| `end` → đáy cột (chỉ thấy khi cột cao hơn nội dung).
  [I] không có tác dụng (nhóm theo §4.2: có `height` → giữa; không → đỉnh).

### 5.3 `scrollRow` / `scrollColumn` [chung]

- Cuộn ngang / dọc, ẩn thanh cuộn (`overflow-x: auto; scrollbar-width: none`).
- Không áp weight: mọi child kích thước tự nhiên, `spacer` = `minLength` ([I] không có → ≈ 8).
- Child nên có `width` (scrollRow) / `height` (scrollColumn). ⚠️ [A] một `row` không có `width` nằm trong `scrollRow` →
  text/container con của nó rộng `0` (D30).

---

## 6. Từng component

Mỗi component vẽ **bên trong** khung ở §4.

### 6.1 `text`

| Thuộc tính | Cách vẽ |
|---|---|
| font | §3.2 theo `typography`; màu `color` (fallback §3.1) |
| `lineLimit` | [chung] số dòng tối đa, cắt bằng `…` (`-webkit-line-clamp`); không có = không giới hạn |
| `truncationMode` | [A] luôn cắt cuối. [I] `head` → `…` đầu, `middle` → `…` giữa, khác → cuối (D6) |
| `lineSpacing` | [A] **thay** line-height = `lineSpacing`. [I] line-height (cột [I] §3.2) **+ `lineSpacing`** giữa các dòng (D7) |
| `textAlignment` | `center` → giữa; `trailing` \| `right` → phải; khác → trái |

Căn chữ dòng đơn (D28) — chỉ cài đúng thì preview mới khớp:
- [A] khung chữ = khung node → `text-align` theo `textAlignment` luôn có tác dụng khi khung rộng hơn chữ.
- [I] chữ chỉ rộng bằng nội dung; `textAlignment` chỉ căn **giữa các dòng** của chữ nhiều dòng. Chữ dòng đơn:
  có `width` → **giữa** khung (§4.2); `fillMaxWidth` → **trái**; bất kể `textAlignment`.

Web: [A] `<div style="text-align:…">`; [I] `<span style="display:inline-block; text-align:…">` đặt trong khung §4.2.

### 6.2 `image`

| Thuộc tính | Cách vẽ [chung] |
|---|---|
| `value` | URL; không có placeholder / ảnh lỗi (khung trống) |
| `contentMode` | `fill` \| `scaleAspectFill` → `object-fit: cover`; khác → `contain` |
| `aspectRatio` | rộng/cao; có `width` không có `height` → cao = `width / aspectRatio` |
| `cornerRadius` | bo góc riêng ảnh, bên trong padding |
| `tintColor` | tô mọi pixel không trong suốt bằng màu (CSS `mask-image: url(...)` + `background-color`) |

- Luôn khai báo `style.width`/`height`; thiếu thì [A] lấy kích thước ảnh tải về (px → dp theo mật độ máy), [I] tuỳ
  `ImageCached` — preview vẽ kích thước gốc và **cảnh báo**.
- Không gửi `aspectRatio` cùng lúc `width` + `height`: [A] bỏ qua `aspectRatio`; [I] ảnh giữ tỉ lệ, căn giữa trong khung.

### 6.3 `spacer`

- Kích thước: do container cha quyết định (§5). `minLength` = độ dài tối thiểu theo trục chính.
- [A] `minLength` đặt min cho **cả 2 chiều** (`defaultMinSize(minLength, minLength)`) → trong `row`, spacer `minLength: 16`
  làm hàng cao ít nhất 16 (D35). [I] chỉ theo trục chính.
- Trong `box`: [A] `0 × 0` (+ minLength); [I] không chiếm chỗ đáng kể.

### 6.4 `tag`

```text
[icon 12×12]? ─2─ text ;  padding ngang 8, dọc 1 ;  bo góc 8 ;  chữ labelSMedium, 1 dòng, cắt cuối
```

| `tagType` | nền | chữ |
|---|---|---|
| `info` | `#CCE4FF` | `#007AFF` |
| `success` | `#D6F4DE` | `#34C759` |
| `error` | `#FDD3D5` | `#F5222D` |
| `warning` | `#FEDDD2` | `#FA541C` |
| `highlight` | `#FEF3E7` | `#FA8C16` |
| khác / thiếu | `#303233` | `#FFFFFF` |

- `backgroundColor`/`textColor` ghi đè preset (fallback khi lỗi: §3.1).
- `iconUrl` rỗng / không có → không có icon và không có khoảng 2.
- Chiều cao (D27): [A] `18 + 2 = 20`; [I] ≈ `14.3 + 2 ≈ 16`.

### 6.5 `box`

- Child chồng lên nhau theo thứ tự (child sau nằm trên). Mọi child căn theo `contentAlignment`:
  `topStart` (mặc định, cả giá trị lạ) · `topCenter`\|`top` · `topEnd` · `centerStart`\|`start` · `center` ·
  `centerEnd`\|`end` · `bottomStart` · `bottomCenter`\|`bottom` · `bottomEnd`.
- Kích thước box = child lớn nhất theo từng chiều, trừ khi `style` đặt kích thước.
- Khi `style` đặt kích thước lớn hơn mọi child (D24): [A] căn theo `contentAlignment` **trong cả khung**;
  [I] căn trong vùng bằng child lớn nhất, vùng đó nằm **giữa** khung.
- Web: CSS grid `grid-template-areas: "a"`, mọi child `grid-area: a` + `justify-self/align-self`.

### 6.6 `button`

Dựng `cta` (giống `cta` của template): xem chi tiết trong [sdui/button.md](sdui/button.md).

- `ctaType` (không phân biệt hoa thường): `TOGGLE` → công tắc; `ICON` → không vẽ; còn lại / thiếu → nút.
- `type`/`iconLeft`/`iconRight`: lấy `value` trước, rỗng thì lấy `property`.
- Nút không có `title`: không vẽ. `title: ""`: [A] vẽ nút rỗng; [I] không vẽ (D33).

`type` → kiểu nút (D32):

| `type` (không phân biệt hoa thường) | Nền | Chữ | Viền 1px |
|---|---|---|---|
| `primary` | `#EB2F96` | `#FFFFFF` | — |
| `secondary` | `#FFFFFF` | `#303233` | `#E8E8E8` |
| `tonal` | `#FDEAF4` | `#EB2F96` | — |
| `outline` | `#FFFFFF` | `#EB2F96` | `#EB2F96` |
| `danger` | `#F5222D` | `#FFFFFF` | — |
| `text` | trong suốt | `#EB2F96` | — |
| `disabled` | `#EBEBF2` | `#C6C6C6` | — ([I] cả nút `opacity: .75`) |
| **thiếu** | [A] như `text` · [I] như `outline` | | |
| **giá trị lạ** | [A] như `text` · [I] như `primary` | | |

Kích thước nút (size SMALL của kits, D33):

| | [A] | [I] |
|---|---|---|
| Cao | **28** cố định | ≈ `6 + 14.3 + 6 ≈ 26.3`, cộng viền ngoài `0.5` mỗi phía → ≈ 27.3 |
| Padding ngang | 8 | 8 (+0.5) |
| Bo góc | **8** | **6** |
| Chữ | `actionXsBold`, 1 dòng | như [A] |
| Icon | 16×16, cách chữ 4 | như [A] |
| Rộng | theo nội dung | theo nội dung (`.fixedSize()`) |

- `value.color`, `value.description`: được đọc nhưng **không ảnh hưởng hình** (cả 2).
- Đang loading (`CALL_API`): [A] nền `opacity .75` + spinner của kits; [I] spinner thay icon trái.
- `TOGGLE` (D34): công tắc hệ thống, trạng thái ban đầu tắt. [A] **bỏ qua toàn bộ `style`, `onTap`, impression** của node
  (modifier không được truyền vào toggle); [I] áp bình thường.

### 6.7 `pager`

- Carousel vuốt ngang, mỗi child 1 trang rộng bằng pager; không tự chạy, không lặp. Không có trang → [A] không vẽ, [I] khung rỗng.
- Rộng: [A] luôn rộng hết chỗ cha cho; [I] theo khung cha. Cao: [A] theo trang đang hiện; [I] chiếm hết chiều cao được
  cho → **phải có `style.height`** (D13).
- Nội dung trang nhỏ hơn trang: [A] trên-trái; [I] giữa (D24).
- Indicator khi `showIndicator != false` và ≥ 2 trang: §6.8 với `total = số trang`, `activeIndex = trang hiện tại`, bọc
  trong viên nền `indicatorBackgroundColor` (mặc định đen 20%), padding trong 6 ngang / 4 dọc, bo góc 8; đặt chồng lên
  pager theo `alignmentIndicator` (giá trị như `box`, mặc định `bottomCenter`), cách mép `paddingIndicator`:

| `paddingIndicator` | [A] (left, top, right, bottom) | [I] |
|---|---|---|
| không gửi | 6, 4, 6, 4 | 6, 4, 6, 4 |
| gửi nhưng thiếu cạnh | thiếu left → **6**, right → 0, top → 0, bottom → 4 | thiếu left → **4** (D12), còn lại như [A]; số âm → 0 |

### 6.8 `pageIndicator`

Hàng chấm cách nhau 4, căn giữa dọc: chấm active `12×4`, inactive `4×4`, bo tròn (capsule). `total <= 1` → không vẽ.
Màu mặc định active `#A50064`, inactive `#DFDFE6`. Đứng riêng thì tĩnh.

### 6.9 `progressBar`

```text
cột, khoảng cách 2
├─ hàng: subDes1 (trái) ··· subDes2 (phải)       chữ descriptionXsRegular #727272; hàng luôn có, kể cả rỗng
└─ thanh: track #F2F2F6 bo 2, cao barHeight (4); phần chạy màu `color` (#727272) bo 2
```

- `subDes1` dài hơn **23 ký tự** → 23 ký tự đầu + `"..."` (3 dấu chấm). [A] đếm theo UTF-16, [I] theo ký tự hiển thị
  (khác nhau với tiếng Việt tổ hợp / emoji). [A] `subDes1` 1 dòng.
- Tỉ lệ = `clamp(currentValue / maxValue, 0, 1)` (`maxValue <= 0` → 0), vẽ **tối thiểu 2%**. Animate từ 0 trong
  800 ms ease-out (preview có thể tắt animation).
- `barWidth` (D15): [A] thanh rộng đúng `barWidth`, **sát trái**; [I] thanh rộng `barWidth` (tối đa), **căn giữa** cột.
  Không có `barWidth` → rộng hết.

---

## 7. Tương tác trong preview

| Hành vi | Preview nên làm |
|---|---|
| `onTap` | Tô vùng bấm theo §4.5; bấm → log `actions` đã lọc (bỏ action thiếu/sai `actionType`), chạy tuần tự giả lập |
| `REDIRECT` | Log `featureCode` + `params` (+ `sourceFromForTracking: "service_widget"`) |
| `CALL_API` | Log `endpoint` + `params`; cho người dùng chọn kết quả giả: thất bại / thành công không `cta` / thành công có `cta` → nút đổi sang `cta` trả về (§6.6) |
| `pager` | Vuốt / nút chuyển trang; indicator cập nhật |
| Tracking | Chỉ hiện panel thông tin: `trackId`, tracking kế thừa của node đang chọn, cảnh báo §8 |

---

## 8. Cảnh báo (lint) tool nên hiện

Mỗi cảnh báo kèm đường dẫn node (vd `root.children[1].children[0]`).

| Mức | Điều kiện | Lý do |
|---|---|---|
| ❌ | Node [I] trả `null` mà [A] vẫn vẽ (§2) | Mất node trên iOS |
| ❌ | Màu không phải `#RRGGBB` | §3.1 |
| ❌ | `row` / `container` không `width` nằm trong `scrollRow`, chứa `text`/`container` co giãn | [A] rộng 0 (D30) |
| ❌ | `fillMaxHeight` / `spacer` trong `column` không bị giới hạn chiều cao | [A] cao 0 (D30) |
| ❌ | `pager` không có `style.height` | [I] (D13) |
| ⚠️ | Thiếu `property` hoặc `value` | D18, D10 |
| ⚠️ | `container` không gửi `spacing` | D2 |
| ⚠️ | `spacer` không gửi `minLength` | D3 |
| ⚠️ | `image` không có `width`/`height` | §6.2 |
| ⚠️ | `button` không gửi `type`, hoặc `type` lạ | D32 |
| ⚠️ | `button` `ctaType: TOGGLE` có `style`/`onTap`/`trackTypes` | D34 |
| ⚠️ | `text` có `textAlignment` khác trái + (`width` hoặc `fillMaxWidth`) + `lineLimit: 1` | D28 |
| ⚠️ | `row` có ≥ 2 child co giãn ([A] W) | D29 |
| ⚠️ | Node có `width`/`height` lớn hơn nội dung (container, box, text, tag) | D24 |
| ⚠️ | `onTap` trên node không có `backgroundColor` | D25 |
| ⚠️ | `truncationMode` khác `tail`, có `lineSpacing` | D6, D7 |
| ⚠️ | `progressBar.barWidth` | D15 |
| ⚠️ | `trackTypes` không có `trackId` | spec §8 |
| ℹ️ | Root có `expire_time` | Root không bị kiểm tra (D16) |
| ℹ️ | Key không dùng (`widgetId`, `onTap.title`, `actions[].ref_id`…) | spec §2.1 |

---

## 9. Bộ test đối chiếu với máy thật

Trước khi coi preview là "khớp", chụp từng payload dưới đây trên 1 máy Android + 1 iPhone rộng 375 (cỡ chữ mặc định) và
so pixel với preview. Mục đánh dấu 🔎 là hành vi suy ra từ mã nguồn engine layout, **cần xác nhận trên máy**.

| # | Payload | Kiểm tra |
|---|---|---|
| T1 | Mẫu "Financial Products Widget" (`example/android/app/src/main/assets/dataJSON.json`, quanh dòng 3666) | Toàn bộ — mẫu chuẩn |
| T2 | `container` column `width 150, height 124`, 1 `text` ngắn | D24: [A] trên-trái, [I] giữa |
| T3 | `text` ngắn `width 200`, `textAlignment: "leading"`; và `fillMaxWidth` + `"center"` | D28 |
| T4 | `row`: `[text dài, spacer, image 16×16]`, không `lineLimit` | D29 🔎: [A] text ≤ ½ chỗ còn lại |
| T5 | `scrollRow` > `row` (không `width`) > `text` | D30 🔎 |
| T6 | root `column` (trong feed Home) có child `fillMaxHeight` | D30 🔎 |
| T7 | `column` có `height 200`, `alignment: "bottom"` | D31 |
| T8 | `button` không `type`; `type: "abc"`; `title: ""` | D32, D33 |
| T9 | `button` `ctaType: "TOGGLE"` + `style.backgroundColor` + `onTap` | D34 |
| T10 | `tag` 5 `tagType` + 1 không có | Màu §6.4, chiều cao D27 |
| T11 | `text` mỗi `typography`, 3 dòng, có / không `lineSpacing: 4` | D27, D7 |
| T12 | `container` có `onTap`, không `backgroundColor`, padding 16; bấm vào vùng padding | D25 |
| T13 | `container` `width 100` (radius 0) chứa `text` dài 1 dòng không `lineLimit` | D26: [I] bị cắt, [A] tràn |
| T14 | `pager` 3 trang, có / không `paddingIndicator.left` | D12, D13 |
| T15 | `progressBar` `barWidth 200` trong khung rộng 343 | D15 |
| T16 | `image` `tintColor: "#FFF"` | D36 |
| T17 | `row` chứa `spacer` `minLength: 24` và child cao 12 | D35 |

Khi có kết quả: cập nhật bảng §10 của [sdui-spec.md](sdui-spec.md) (bỏ 🔎) và file này.
