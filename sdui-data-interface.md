# 🧩 SDUI Widget — Data Interface (JSON Contract)

> Định nghĩa **interface (hợp đồng dữ liệu)** của JSON cho SDUI Widget, viết bằng TypeScript
> để mô tả chính xác: field nào **bắt buộc / optional**, kiểu dữ liệu, và giá trị hợp lệ.
>
> - Diễn giải dễ hiểu (non-tech) → [SDUI Guide](./sdui-guide.md)
> - Mô tả schema kèm ví dụ → [SDUI JSON Schema](./sdui-json-schema.md)
>
> Quy ước: `?` = optional · `|` = một trong các giá trị · `// comment` = ghi chú.

---

## 1. Top-level — Zone

```ts
interface SDUIZone {
  type: "template_widget";          // BẮT BUỘC — cố định
  templateType: "SDUI_WIDGET";      // BẮT BUỘC — cố định
  data: SDUINodeData;               // BẮT BUỘC — node gốc (xem §2)
  tracking?: TrackingPayload;       // tracking cấp zone
  feedbackData?: FeedbackData;      // cấu hình feedback
}
```

### Hai shape hợp lệ cho `data`

```ts
// Client chấp nhận cả 4 dạng dưới đây; ưu tiên array.
type SDUINodeData =
  | SDUINode[]          // Shape A: phần tử[0] LÀ node SDUI gốc (khuyến nghị)
  | SDUIWrapper[]       // Shape B: phần tử[0] bọc node dưới key `data`
  | SDUINode            // node đơn (object)
  | SDUIWrapper;        // wrapper đơn (object)

interface SDUIWrapper {
  type: "server_driven_widget";
  widgetId?: string;
  data: SDUINode;       // node SDUI gốc nằm ở đây
}
```

---

## 2. Node — `SDUINode` (discriminated union theo `type`)

```ts
type SDUINode =
  | ContainerNode
  | TextNode
  | ImageNode
  | ButtonNode
  | TagNode
  | SpacerNode;

type SDUIType = "container" | "text" | "image" | "button" | "tag" | "spacer";
```

### Field dùng chung cho mọi node

```ts
interface BaseNode {
  type: SDUIType;               // BẮT BUỘC — discriminator
  style: CommonStyle;           // BẮT BUỘC — có thể là {} rỗng
  onTap?: TapAction;            // gắn action vào BẤT KỲ node nào (không chỉ button)
  trackTypes?: TrackTypes;      // tracking của node
  expire_time?: string | number; // timestamp ms; -1 hoặc bỏ trống = không hết hạn
  widgetId?: string;            // ID định danh (không ảnh hưởng render)
  // `property` và `value` được định nghĩa riêng theo từng type bên dưới.
}
```

> ⚠️ `property` **luôn phải là object**, không được là string. (Lỗi gửi `"property": "$cta"`
> dạng chuỗi sẽ mất dữ liệu — xem [Guide §8](./sdui-guide.md)).

---

## 3. Common Style — `CommonStyle`

```ts
interface CommonStyle {
  width?: number;               // dp (Android) / pt (iOS)
  height?: number;
  fillMaxWidth?: boolean;       // giãn hết chiều ngang còn lại (trong row)
  fillMaxHeight?: boolean;      // giãn hết chiều dọc còn lại (trong column)
  backgroundColor?: string;     // hex "#RRGGBB" | "#AARRGGBB"
  cornerRadius?: number;
  border?: Border;
  padding?: EdgePadding;
}

interface Border {
  width: number;                // BẮT BUỘC trong border
  color: string;                // BẮT BUỘC — hex
}

interface EdgePadding {
  all?: number;                 // dùng `all` HOẶC từng cạnh bên dưới
  top?: number;
  bottom?: number;
  left?: number;
  right?: number;
}
```

---

## 4. Node theo từng `type`

### 4.1 Container

```ts
interface ContainerNode extends BaseNode {
  type: "container";
  property?: ContainerProperty;
  value: ContainerValue;        // BẮT BUỘC
}

interface ContainerProperty {
  layout?: "column" | "row" | "scrollColumn" | "scrollRow"; // mặc định "column"
  spacing?: number;             // khoảng cách giữa các con
  alignment?: ContainerAlignment;
}

// column: căn ngang | row: căn dọc
type ContainerAlignment =
  | "left" | "leading" | "center" | "right" | "trailing"  // cho column
  | "top" | "bottom" | "end";                              // cho row

interface ContainerValue {
  children: SDUINode[];         // BẮT BUỘC — danh sách node con
}
```

### 4.2 Text

```ts
interface TextNode extends BaseNode {
  type: "text";
  property?: TextProperty;
  value: string;                // BẮT BUỘC — nội dung chữ
}

interface TextProperty {
  typography?: string;          // token Design System (xem §8)
  color?: string;               // hex
  lineLimit?: number;           // số dòng tối đa
  textAlignment?: "left" | "center" | "right";
  truncationMode?: string;      // vd "tail"
  lineSpacing?: number;
}
```

### 4.3 Image

```ts
interface ImageNode extends BaseNode {
  type: "image";
  property?: ImageProperty;
  value: string;                // BẮT BUỘC — URL ảnh
}

interface ImageProperty {
  contentMode?: "fit" | "fill"; // mặc định "fit"
  tintColor?: string;           // hex — bật template rendering (tô màu icon)
  cornerRadius?: number;
  aspectRatio?: number;         // tỉ lệ width/height
}
```

### 4.4 Button

```ts
interface ButtonNode extends BaseNode {
  type: "button";
  property?: ButtonProperty;
  value: ButtonValue;           // BẮT BUỘC
}

interface ButtonProperty {
  actionType?: string;
  ctaType?: "BUTTON" | "TOGGLE" | "ICON";
  color?: string;               // hex
  actions?: ActionConfig[];     // hành động khi nhấn
}

interface ButtonValue {
  title?: string;               // text trên nút
  type?: ButtonStyle;           // style hiển thị
  iconLeft?: string;            // URL
  iconRight?: string;           // URL
}

type ButtonStyle =
  | "primary" | "secondary" | "tonal"
  | "outline" | "danger" | "text" | "disabled"; // mặc định "primary"
```

### 4.5 Tag

```ts
interface TagNode extends BaseNode {
  type: "tag";
  property?: TagProperty;
  value: string;                // BẮT BUỘC — nội dung tag
}

interface TagProperty {
  tagType?: "info" | "success" | "error" | "warning" | "highlight"; // màu preset
  backgroundColor?: string;     // hex — override màu nền
  textColor?: string;           // hex — override màu chữ
  iconUrl?: string;             // icon đứng trước
}
```

### 4.6 Spacer

```ts
interface SpacerNode extends BaseNode {
  type: "spacer";
  property?: SpacerProperty;
  value: "";                    // luôn là chuỗi rỗng
}

interface SpacerProperty {
  minLength?: number;           // khoảng tối thiểu; nil = mặc định hệ thống
}
```

---

## 5. Action — `TapAction` & `ActionConfig`

```ts
// Dùng cho cả `onTap` (mọi node) và `button.property.actions`
interface TapAction {
  actionType?: string;
  actions: ActionConfig[];      // BẮT BUỘC nếu có onTap
}

interface ActionConfig {
  actionType: "CALL_API" | "REDIRECT"; // BẮT BUỘC
  featureCode?: string;         // dùng khi REDIRECT
  endpoint?: string;            // dùng khi CALL_API
  params?: Record<string, any>;
}
```

---

## 6. Tracking — `TrackTypes` & `TrackingPayload`

```ts
interface TrackTypes {
  containerType?: "widget" | "item"; // "widget" = node cha · "item" = node con
  trackId?: string;
  tracking?: TrackingPayload;        // cấp widget — card con tự kế thừa
  trackify?: Record<string, any>;
  itemTracking?: Record<string, any>; // riêng từng item (position_slot, item_id, …)
}

interface TrackingPayload {
  id?: string;
  type?: string;                // vd "Disco"
  data?: string;                // base64-encoded payload
  trackifyData?: string;
  extra_data?: Record<string, any>;
}
```

> **Quy tắc impression theo `containerType`:**
> - `"widget"` → impression cấp widget, **KHÔNG** kèm `itemTracking`.
> - `"item"` (hoặc không khai) → impression cấp item, **CÓ** kèm `itemTracking`.

---

## 7. Feedback — `FeedbackData`

```ts
interface FeedbackData {
  isTooltips?: boolean;
  feedbackConfig?: {
    reasons: FeedbackReason[];
  };
}

interface FeedbackReason {
  id: string;                   // vd "ads_annoyance"
  label: string;                // vd "Tôi cảm thấy phiền bởi quảng cáo"
}
```

---

## 8. Enum / giá trị hợp lệ (tóm tắt)

| Field | Kiểu | Giá trị hợp lệ | Mặc định |
|-------|------|----------------|----------|
| `SDUIZone.type` | string | `template_widget` | — |
| `SDUIZone.templateType` | string | `SDUI_WIDGET` | — |
| `SDUINode.type` | string | `container` `text` `image` `button` `tag` `spacer` | — |
| `ContainerProperty.layout` | string | `column` `row` `scrollColumn` `scrollRow` | `column` |
| `ImageProperty.contentMode` | string | `fit` `fill` | `fit` |
| `ButtonProperty.ctaType` | string | `BUTTON` `TOGGLE` `ICON` | — |
| `ButtonValue.type` | string | `primary` `secondary` `tonal` `outline` `danger` `text` `disabled` | `primary` |
| `ActionConfig.actionType` | string | `CALL_API` `REDIRECT` | — |
| `TagProperty.tagType` | string | `info` `success` `error` `warning` `highlight` | — |
| `TrackTypes.containerType` | string | `widget` `item` | — |
| `expire_time` | string \| number | timestamp ms; `-1` = không hết hạn | — |
| `typography` | string (token) | `labelXsMedium` `labelSMedium` `headerXsSemibold` `headerSSemibold` `headerDefaultBold` `descriptionXsRegular` `descriptionDefaultRegular` `actionSBold` … | — |

> ℹ️ `typography` là token Design System — danh sách trên là các token đã gặp thực tế,
> không phải toàn bộ. Liên hệ team Design/Native để có danh sách đầy đủ.

---

## 9. Ghi chú tương thích (cho dev)

- **`property` phải là object.** Client iOS dùng strict decoding; nếu `property` là string,
  node đó sẽ dùng giá trị rỗng (đã làm lenient để không sập widget) nhưng **mất** dữ liệu trong đó.
- **Node hỏng được bỏ qua riêng lẻ**, không làm sập cả cây: một child không decode được sẽ bị
  drop, các node còn lại vẫn render.
- **`expire_time`** nhận cả string lẫn number; client tự parse về số mili-giây.
- **Field lạ** (không có trong interface) sẽ bị bỏ qua an toàn — không gây lỗi.
