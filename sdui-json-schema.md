# SDUI Widget — JSON Data Schema

> Tài liệu mô tả cấu trúc JSON cho **SDUI Widget** (Server-Driven UI) trong Cornerstone Native Widget.
> Dùng cho các team tạo/cập nhật data trả về cho client (Android & iOS).

---

## 1. Tổng quan

SDUI Widget cho phép server mô tả toàn bộ UI bằng JSON. Client (Android Compose / iOS SwiftUI)
sẽ tự render dựa trên cây node (`type` + `style` + `property` + `value`).

SDUI Widget được đóng gói bên trong một **zone** kiểu `template_widget` với `templateType = "SDUI_WIDGET"`.

```
zone (template_widget, SDUI_WIDGET)
 └─ data[0]              ← node SDUI gốc (thường là container)
     └─ value.children[] ← các node con (item, text, image, button, …)
```

---

## 2. Cấu trúc Zone (lớp ngoài cùng)

```jsonc
{
  "type": "template_widget",      // BẮT BUỘC — để client route vào template
  "templateType": "SDUI_WIDGET",  // BẮT BUỘC — phân biệt đây là SDUI widget
  "data": [ /* SDUI node, xem §4 */ ],
  "tracking": { /* tracking cấp zone, optional */ },
  "feedbackData": { /* config feedback, optional */ }
}
```

| Field          | Kiểu            | Bắt buộc | Mô tả                                                    |
|----------------|-----------------|----------|----------------------------------------------------------|
| `type`         | string          | ✅       | Luôn là `"template_widget"`.                             |
| `templateType` | string          | ✅       | Luôn là `"SDUI_WIDGET"`.                                  |
| `data`         | array \| object | ✅       | Chứa node SDUI gốc. Xem 2 shape ở §3.                    |
| `tracking`     | object          | ❌       | Tracking cấp widget/zone.                                |
| `feedbackData` | object          | ❌       | Cấu hình lý do feedback (ẩn widget, "không quan tâm"…).  |

---

## 3. Hai shape hợp lệ cho `data`

Client hỗ trợ **cả hai** dạng dưới đây (ưu tiên thử dạng 1 trước, fallback sang dạ 2):

### Shape A — Node SDUI trực tiếp (khuyến nghị)
Phần tử đầu tiên của `data` **chính là** node SDUI gốc:

```jsonc
"data": [
  {
    "type": "container",
    "style": { ... },
    "property": { "layout": "scrollRow", "spacing": 8 },
    "widgetId": "260615_Diep_test_SDUI_1",
    "trackTypes": { ... },
    "value": { "children": [ ... ] }
  }
]
```

### Shape B — Bọc trong `server_driven_widget`
Phần tử đầu tiên là một wrapper, node SDUI nằm dưới key `data`:

```jsonc
"data": [
  {
    "type": "server_driven_widget",
    "widgetId": "260615_Diep_test_SDUI_2",
    "data": {                      // ← node SDUI gốc nằm ở đây
      "type": "container",
      "style": { ... },
      "property": { "layout": "scrollRow", "spacing": 8 },
      "value": { "children": [ ... ] }
    }
  }
]
```

> `data` cũng có thể là **object** thay vì array (client xử lý cả hai), nhưng dạng array là chuẩn.

---

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

## 5. Các `type` được hỗ trợ

| `type`      | Ý nghĩa            | `property`              | `value`                  |
|-------------|--------------------|-------------------------|--------------------------|
| `container` | Layout chứa con    | layout, spacing, alignment | `{ "children": [...] }` |
| `text`      | Văn bản            | typography, color, …    | string                   |
| `image`     | Ảnh                | contentMode, …          | string (URL)             |
| `button`    | Nút CTA            | actionType, ctaType, actions | `{ "title": ... }`  |
| `tag`       | Nhãn/chip          | tagType, colors, iconUrl | string (nội dung)       |
| `spacer`    | Khoảng đệm co giãn | minLength               | `""`                     |

---

## 6. Schema theo từng `type`

### 6.1. `container`
```jsonc
{
  "type": "container",
  "style": { ... },
  "property": {
    "layout": "column",   // "column" (mặc định) | "row" | "scrollColumn" | "scrollRow"
    "spacing": 8,          // number — khoảng cách giữa các con
    "alignment": "center"  // column: "left"/"leading" | "center" | "right"/"trailing"
                           // row:    "top" | "center" | "bottom"/"end"
  },
  "value": {
    "children": [ /* mảng node SDUI */ ]
  }
}
```
- `layout` thiếu → mặc định `"column"`.
- `scrollRow` / `scrollColumn` cho phép cuộn. Trong `scrollRow` nên đặt `style.width` cụ thể cho con (vì chiều ngang vô hạn).
- Trong `row`: con có `style.fillMaxWidth = true` (hoặc node `spacer`) sẽ giãn chiếm phần trống.

### 6.2. `text`
```jsonc
{
  "type": "text",
  "style": {},
  "property": {
    "typography": "headerSSemibold", // token design system — xem danh sách bên dưới
    "color": "#303233",              // hex
    "lineLimit": 1,                  // số dòng tối đa
    "textAlignment": "center",       // "left" | "center" | "right"
    "truncationMode": "tail",        // optional
    "lineSpacing": 2                 // optional, number
  },
  "value": "Giảm 50.000đ"            // string nội dung
}
```
> `typography` là **token** của design system. Các token đã gặp trong data thực tế:
> `labelXsMedium`, `labelSMedium`, `headerXsSemibold`, `headerSSemibold`, `headerDefaultBold`,
> `descriptionXsRegular`, `descriptionDefaultRegular`, `actionSBold`.
> Token không khớp sẽ rơi về style mặc định. Liên hệ team Design/Native để có danh sách đầy đủ.

### 6.3. `image`
```jsonc
{
  "type": "image",
  "style": { "width": 52, "height": 52, "cornerRadius": 26 },
  "property": {
    "contentMode": "fill",   // "fit" (mặc định) | "fill"
    "tintColor": "#727272",  // optional — bật template rendering (tô màu icon)
    "cornerRadius": 26,      // optional
    "aspectRatio": 1.5       // optional — tỉ lệ width/height
  },
  "value": "https://static.momocdn.net/app/icon/promotion/logo.png" // URL string
}
```

### 6.4. `button`
```jsonc
{
  "type": "button",
  "style": {},
  "property": {
    "actionType": "REDIRECT",   // optional
    "ctaType": "BUTTON",        // "BUTTON" | "TOGGLE" | "ICON"
    "color": "#303233",         // optional
    "actions": [                // mảng action chạy khi nhấn
      {
        "actionType": "REDIRECT", // "CALL_API" | "REDIRECT"
        "featureCode": "refund_handbook",
        "params": {},
        "endpoint": "..."         // dùng khi CALL_API
      }
    ]
  },
  "value": {
    "title": "Thu thập",        // text trên nút
    "type": "text",             // ButtonTypeTemplate: primary|secondary|tonal|outline|danger|text|disabled
    "iconLeft": "https://...",  // optional
    "iconRight": "https://..."  // optional
  }
}
```
> ⚠️ `property` của button **phải là object**. Xem cảnh báo §9.

### 6.5. `tag`
```jsonc
{
  "type": "tag",
  "style": {},
  "property": {
    "tagType": "highlight",      // "info" | "success" | "error" | "warning" | "highlight" → màu preset
    "backgroundColor": "#FFF3E0",// optional — override màu nền
    "textColor": "#E65100",      // optional — override màu chữ
    "iconUrl": "https://..."     // optional — icon đứng trước
  },
  "value": "HOT"                 // string nội dung tag
}
```

### 6.6. `spacer`
```jsonc
{
  "type": "spacer",
  "style": {},
  "property": { "minLength": 0 }, // optional — khoảng tối thiểu
  "value": ""                     // luôn là chuỗi rỗng
}
```
- Trong `row`/`column`, `spacer` giãn để đẩy các phần tử ra hai phía (giống `Spacer()` SwiftUI / `weight(1f)` Compose).

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

## 9. ⚠️ Quy tắc & lỗi thường gặp (QUAN TRỌNG)

1. **`property` phải là JSON object, KHÔNG được là string.**
   Sai (sẽ làm hỏng render trên iOS / mất action):
   ```jsonc
   "property": "{actions=[{actionType=REDIRECT, featureCode=refund_handbook}], ctaType=BUTTON}"
   ```
   Đúng:
   ```jsonc
   "property": { "ctaType": "BUTTON", "actions": [ { "actionType": "REDIRECT", "featureCode": "refund_handbook" } ] }
   ```
   > Client đã được làm "lenient" để không trắng cả widget khi gặp lỗi này, nhưng dữ liệu trong
   > `property` (vd `actions`) sẽ **bị mất** nếu gửi sai dạng. Luôn gửi object.

   **Lỗi hay gặp khi dùng biến template**: đặt biến trong dấu nháy biến nó thành **string**.
   ```jsonc
   "property": "$cta"   // ❌ SAI — sau khi thay thế vẫn là string
   "property": $cta     // ✅ ĐÚNG — thay thế bằng object {ctaType, actions, ...}
   ```
   Tương tự cho `onTap`: dùng `"onTap": $cta` (không nháy), không dùng `"onTap": "$cta"`.

2. **`type` phải thuộc danh sách hỗ trợ** (`container/text/image/button/tag/spacer`).
   Node có `type` lạ sẽ bị bỏ qua (drop riêng node đó, không làm hỏng cây).

3. **`style` luôn phải có** (tối thiểu `{}`).

4. **Màu**: chuỗi hex hợp lệ (`#RRGGBB`/`#AARRGGBB`).

5. **`image.value` / `text.value` / `tag.value`** là **string**; **`container.value` / `button.value`** là **object**.

6. Trong `scrollRow`, hãy đặt `style.width` cụ thể cho mỗi card con.

---

## 9b. Biến template (`$variable`) khi author data

Các template data thường viết dưới dạng có **biến** để backend thay thế runtime:

| Biến             | Thay bằng                          | Lưu ý                                   |
|------------------|------------------------------------|------------------------------------------|
| `$widgetId`      | ID widget (string)                 | đặt trong nháy: `"widgetId": "$widgetId"`|
| `$image`         | URL ảnh (string)                   | đặt trong nháy: `"value": "$image"`      |
| `$Brand name`    | Tên thương hiệu (string)           | trong nháy                               |
| `$Gift prefix`   | Tiêu đề ưu đãi (string)            | trong nháy                               |
| `$cta`           | **Object** property của button/onTap | **KHÔNG** nháy: `"property": $cta`     |
| `$expire_time`   | Timestamp (number/string)          | `"expire_time": $expire_time`            |

> Nguyên tắc: biến cho **giá trị string** → để trong `"..."`; biến cho **object/number** → để trần (không nháy). Xem §9 mục 1.

---

## 9c. Các layout pattern mẫu (tham khảo)

| Pattern               | Mô tả                                                            | Đặc điểm                                    |
|-----------------------|------------------------------------------------------------------|---------------------------------------------|
| **Horizontal Full**   | Card cuộn ngang: ảnh + 2 dòng text + button trên cùng 1 `row`.   | item rộng `305`, `layout:row`               |
| **Horizontal No-Desc**| Card cuộn ngang: ảnh + tên (cột trái) · tiêu đề + mô tả + button (cột phải). | item rộng `235`, lồng `column` trong `row`  |
| **Insight**           | Cột dọc: header (text + spacer + icon `onTap`) rồi `scrollRow` các card chỉ số; mỗi card `onTap` mở chi tiết. | dùng `onTap` ở container & image, nhiều typography |

Cả 3 đều là `template_widget` / `SDUI_WIDGET`, `containerType:"widget"` ở node gốc và `"item"` ở từng card con.

---

## 10. Ví dụ đầy đủ

### 10.1. Card khuyến mãi cuộn ngang (Shape A)
```jsonc
{
  "type": "template_widget",
  "templateType": "SDUI_WIDGET",
  "data": [
    {
      "type": "container",
      "style": { "padding": { "all": 0 } },
      "property": { "layout": "scrollRow", "spacing": 8 },
      "widgetId": "260615_Diep_test_SDUI_1",
      "trackTypes": {
        "containerType": "widget",
        "trackId": "229c1d5f-...",
        "tracking": { "id": "a0ae27a9-...", "type": "Disco", "data": "<base64>" }
      },
      "value": {
        "children": [
          {
            "type": "container",
            "style": {
              "backgroundColor": "#FFFFFF", "cornerRadius": 12,
              "border": { "width": 1, "color": "#E8EAED" },
              "padding": { "all": 12 }, "width": 305
            },
            "property": { "layout": "row", "spacing": 10, "alignment": "center" },
            "expire_time": "1813004156000",
            "trackTypes": {
              "containerType": "item",
              "trackId": "fe7aec35-...",
              "itemTracking": { "item_id": "...#0", "position_slot": 0, "position_zone": 4 }
            },
            "value": {
              "children": [
                {
                  "type": "image",
                  "style": { "width": 52, "height": 52, "cornerRadius": 26 },
                  "property": { "contentMode": "fill" },
                  "value": "https://static.momocdn.net/app/icon/promotion/logo.png"
                },
                {
                  "type": "container",
                  "style": { "fillMaxWidth": true },
                  "property": { "layout": "column", "spacing": 2, "alignment": "left" },
                  "value": {
                    "children": [
                      {
                        "type": "text",
                        "style": {},
                        "property": { "typography": "labelXsMedium", "color": "#727272", "lineLimit": 1 },
                        "value": "Highlands Coffee"
                      },
                      {
                        "type": "text",
                        "style": {},
                        "property": { "typography": "headerSSemibold", "color": "#303233", "lineLimit": 1 },
                        "value": "Giảm 50.000đ cho hóa đơn từ 150.000đ"
                      }
                    ]
                  }
                },
                {
                  "type": "button",
                  "style": {},
                  "property": {
                    "ctaType": "BUTTON",
                    "color": "#303233",
                    "actions": [ { "actionType": "REDIRECT", "featureCode": "refund_handbook", "params": {} } ]
                  },
                  "value": { "title": "Thu thập", "type": "text" }
                }
              ]
            }
          }
        ]
      }
    }
  ],
  "tracking": { "id": "5066651e-...", "type": "Disco", "data": "<base64>" },
  "feedbackData": {
    "isTooltips": false,
    "feedbackConfig": {
      "reasons": [
        { "id": "ads_annoyance", "label": "Tôi cảm thấy phiền bởi quảng cáo" },
        { "id": "used_service", "label": "Tôi đã dùng dịch vụ này rồi" }
      ]
    }
  }
}
```

### 10.2. Dùng `spacer` đẩy nút sang phải (trong `row`)
```jsonc
{
  "type": "container",
  "style": { "fillMaxWidth": true },
  "property": { "layout": "row", "spacing": 0 },
  "value": {
    "children": [
      { "type": "spacer", "style": {}, "property": {}, "value": "" },
      { "type": "button", "style": {}, "property": { "ctaType": "BUTTON" }, "value": { "title": "Thu thập" } }
    ]
  }
}
```

### 10.3. Insight — card chỉ số, cả card & icon header bấm được (`onTap`)
```jsonc
{
  "type": "template_widget",
  "templateType": "SDUI_WIDGET",
  "data": [
    {
      "type": "container",
      "style": { "backgroundColor": "#FFFFFF", "cornerRadius": 12, "padding": { "all": 12 } },
      "property": { "layout": "column", "spacing": 8 },
      "trackTypes": { "containerType": "widget" },
      "value": {
        "children": [
          {
            "type": "container",
            "style": {},
            "property": { "layout": "row", "spacing": 8 },
            "value": {
              "children": [
                { "type": "text", "style": {}, "property": { "typography": "headerDefaultBold", "color": "#303233", "lineLimit": 1 }, "value": "Có thể bạn quan tâm" },
                { "type": "spacer", "style": {}, "property": {}, "value": "" },
                {
                  "type": "image",
                  "style": { "width": 22, "height": 22 },
                  "property": { "contentMode": "fill" },
                  "onTap": { "actions": [ { "actionType": "REDIRECT", "featureCode": "see_more" } ] },
                  "value": "https://static.momocdn.net/app/icon/promotion/icon.png"
                }
              ]
            }
          },
          {
            "type": "container",
            "style": {},
            "property": { "layout": "scrollRow", "spacing": 8 },
            "value": {
              "children": [
                {
                  "type": "container",
                  "style": { "backgroundColor": "#FFFFFF", "cornerRadius": 12, "border": { "width": 1, "color": "#E8EAED" }, "padding": { "all": 12 }, "width": 150 },
                  "property": { "layout": "column", "spacing": 8 },
                  "onTap": { "actions": [ { "actionType": "REDIRECT", "featureCode": "spending_insight" } ] },
                  "expire_time": "1813004156000",
                  "trackTypes": { "containerType": "item" },
                  "value": {
                    "children": [
                      { "type": "text", "style": { "fillMaxWidth": true }, "property": { "typography": "labelXsMedium", "color": "#727272", "lineLimit": 1 }, "value": "Ngân sách" },
                      { "type": "spacer", "style": {}, "property": { "minLength": 14 }, "value": "" },
                      { "type": "text", "style": {}, "property": { "typography": "headerXsSemibold", "color": "#303233", "lineLimit": 1 }, "value": "Còn 274.673đ" },
                      { "type": "text", "style": {}, "property": { "typography": "descriptionXsRegular", "color": "#727272", "lineLimit": 1 }, "value": "Chi trong 25 ngày tới" }
                    ]
                  }
                }
              ]
            }
          }
        ]
      }
    }
  ]
}
```

---

## 11. Bảng tóm tắt nhanh (cheat-sheet)

| Mục                    | Giá trị hợp lệ                                                       |
|------------------------|----------------------------------------------------------------------|
| Zone `type`            | `template_widget`                                                    |
| Zone `templateType`    | `SDUI_WIDGET`                                                        |
| Node `type`            | `container`, `text`, `image`, `button`, `tag`, `spacer`             |
| `container.layout`     | `column`, `row`, `scrollColumn`, `scrollRow`                        |
| `alignment` (column)   | `left`/`leading`, `center`, `right`/`trailing`                      |
| `alignment` (row)      | `top`, `center`, `bottom`/`end`                                     |
| `image.contentMode`    | `fit`, `fill`                                                       |
| `button.ctaType`       | `BUTTON`, `TOGGLE`, `ICON`                                          |
| `button.value.type`    | `primary`, `secondary`, `tonal`, `outline`, `danger`, `text`, `disabled` |
| `actionType`           | `CALL_API`, `REDIRECT`                                             |
| `tag.tagType`          | `info`, `success`, `error`, `warning`, `highlight`                 |
| `containerType`        | `widget` (cha), `item` (con)                                       |
| `expire_time`          | timestamp ms (string/number); `-1` = không hết hạn                  |
| `onTap`                | object `{ actionType?, actions: [...] }` — gắn trên node bất kỳ     |
| typography tokens      | `labelXsMedium`, `labelSMedium`, `headerXsSemibold`, `headerSSemibold`, `headerDefaultBold`, `descriptionXsRegular`, `descriptionDefaultRegular`, `actionSBold` |
