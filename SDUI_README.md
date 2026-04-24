# Hướng Dẫn SDUI Cấu Trúc Giao Diện & Dữ Liệu (MoMo Native Widget)

Tài liệu này là đặc tả kỹ thuật (Specification) chuẩn của hệ thống Server-Driven UI (SDUI) dành riêng cho MoMo Native Widget (Android & iOS). Nó giải thích toàn bộ cấu trúc sơ đồ, các loại thành phần, khả năng tùy biến và cách liên kết dữ liệu.

**AI Agents / LLMs**: Hãy tuân thủ nghiêm ngặt chuẩn cấu trúc dưới đây khi tạo phản hồi sinh mã JSON `dataSchema`.

---

## 1. Cấu Trúc Khung Của `dataSchema`

Một widget có thể có nhiều biến thể hiển thị tùy thuộc vào loại dữ liệu truyền vào. Do đó, `dataSchema` được đặt ở cấp cao nhất cùng hàng với `data` và `templateType`. Các format phân biệt các dạng layout khác nhau (ví dụ: `content_info`, `content_ranking`, ...).

Bên trong `dataSchema`, cấu trúc cơ bản bao gồm `header` chung và các `content_*` (Key tự định nghĩa dựa trên biến thể item_type).

```json
"dataSchema": {
  "header": {
    "showHeader": false,
    "backgroundImage": ""
  },
  "content_info": {        // Tên key linh hoạt để map theo loại dữ liệu cụ thể (VD: "content", "content_info", "content_ranking")
    "value": {             // Gốc chứa toàn bộ quy tắc UI để render item này
      "modifier": { ... }, // Định dạng style bọc xung quanh Box
      "header": { ... },   // (Tùy chọn) Vùng HEADER trên cùng của Card
      "body": {            // Layout Root chứa UI Content
        "layout": "column",
        "modifier": { ... },
        "children": [ ... ]
      },
      "footer": { ... }    // (Tùy chọn) Vùng FOOTER dưới cùng của Card
    }
  }
}
```

---

## 2. Layout System (`layout`)

Layout đóng vai trò bao bọc và sắp xếp các thẻ con (`children`). Hệ thống hỗ trợ 2 dạng:

- `"layout": "row"`: Xếp con theo chiều ngang (trái sang phải). Tương đương `Row` (Compose) / `HStack` (SwiftUI).
- `"layout": "column"`: Xếp con theo chiều dọc (trên xuống dưới). Tương đương `Column` (Compose) / `VStack` (SwiftUI).

Cấu trúc một thẻ layout:

```json
{
  "layout": "row",
  "modifier": {
    // Alignment, spacing, padding, v.v..
  },
  "children": [
    // Components hoặc Layouts lồng nhau
  ]
}
```

---

## 3. Hệ Thống Bộ Biến Định Mức (`modifier`)

Thuộc tính `"modifier"` có thể nằm tại Root `value`, `body`, bên trong một block `"layout"`, hoặc ngay trên bản thân bất kỳ component nào.

### 3.1. Căn lề & Sắp xếp (Alignment & Arrangement)

- **`arrangement` (Main Axis - Trục chính):**
  - Trong `row` (Chiều ngang): `"start"`, `"center"`, `"end"`, `"spaceBetween"`, `"spaceAround"`, `"spaceEvenly"`.
  - Trong `column` (Chiều dọc): `"top"`, `"center"`, `"bottom"`, `"start"`, `"spaceBetween"`.
- **`alignment` (Cross Axis - Trục ngang/phụ/chéo):**
  - Trong `row` (Giữ vị trí dọc): `"top"`, `"center"`, `"bottom"`, `"start"`.
  - Trong `column` (Giữ vị trí ngang): `"start"`, `"center"`, `"end"`.

### 3.2. Kích thước (Size & Proportions)

| Khóa            | Loại      | Mô tả                                                                                                                                                                                   |
| :-------------- | :-------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `fillMaxWidth`  | `boolean` | Chiếm 100% không gian bề ngang (`true`).                                                                                                                                                |
| `fillMaxHeight` | `boolean` | Chiếm 100% không gian bề dọc (`true`).                                                                                                                                                  |
| `fillMaxSize`   | `boolean` | Chiếm 100% bề ngang lẫn dọc (`true`).                                                                                                                                                   |
| `width`         | `number`  | Chiều ngang fix cứng (px).                                                                                                                                                              |
| `height`        | `number`  | Chiều dọc fix cứng (px).                                                                                                                                                                |
| `weight`        | `number`  | Chỉ dùng khi nằm trong danh sách `children` của `layout`. Khối này sẽ giãn ra chiếm tỷ lệ dư thừa không gian. Cực kì quan trọng để đẩy component khác dạt lề (Ví dụ: Dùng `weight: 1`). |

### 3.3. Hiển thị Ngoại Quan (Styling, Border, Background)

| Khóa              | Định dạng           | Mô tả                                                                                                                    |
| :---------------- | :------------------ | :----------------------------------------------------------------------------------------------------------------------- |
| `padding`         | `number` / `Object` | Cách lề bên trong thành phần. Nhận giá trị nguyên: `10` hoặc Object: `{"top": 4, "bottom": 4, "left": 10, "right": 10}`. |
| `backgroundColor` | `string`            | Tỉ lệ màu nền mã Hex (VD: `"#F9F9F9"`, `"#FFFFFF"`).                                                                     |
| `cornerRadius`    | `number`            | Độ cong góc bo viền (px).                                                                                                |
| `border`          | `Object`            | Có cấu trúc: `{"width": 1, "color": "#E8E8E8"}`. Khung viền ngoại.                                                       |

---

## 4. Các Loại UI Component Chuyên Ngành (`componentType`)

Danh sách các UI nodes cơ sở có thể xếp thả trong mảng `"children"`.

### 4.1 TEXT Component

Nhấn mạnh hiển thị ký tự văn bản. Cần trỏ tới trường dữ liệu qua `field` và định dạng qua `style`.

**[Tuyệt đối KHÔNG DÙNG]:** `width`, `height`, `backgroundColor` bên trong modifier của TEXT. Thành phần văn bản sẽ tự động co giãn theo nội dung và giới hạn bởi `maxLines`.

```json
{
  "componentType": "TEXT",
  "field": "name", // Hoặc "description", "titleInformation.content"
  "modifier": { "padding": { "bottom": 4 } },
  "style": {
    "typography": "labelXsMedium",
    "color": "#727272",
    "fontWeight": "500",
    "maxLines": 1
  }
}
```

**Danh sách `typography` cơ bản thiết kế App:**
`labelXsMedium`, `headerSSemibold`, `descriptionDefaultRegular`, `actionSBold`, `headerXsSemibold`, `descriptionXsRegular`.

### 4.2 ICON Component

Chuyên dụng để render các Logo, Hình ảnh dạng vuông tỷ lệ cố định.

```json
{
  "componentType": "ICON",
  "field": "icon", // Hoặc "titleInformation.icon", "quantityLabel.icon", "cardImage"
  "iconSize": 32, // Render ra 32x32 điểm ảnh
  "modifier": { "padding": { "right": 4 } }
}
```

### 4.3 CTA_BUTTON Component

Nút kêu gọi hành động mặc định. Hiện tại nút này đã **được cố định sẵn nguyên bản (fixed template) trên client**.

**[Quy tắc nghiêm ngặt]:** KHÔNG BAO GIỜ gán `padding`, `width`, `height` trực tiếp cho bản thân `CTA_BUTTON`. Bạn chỉ cần quan tâm nó nằm ở layout ngang hay dọc, và căn lề nó bằng `alignment`.

```json
{
  "componentType": "CTA_BUTTON",
  "modifier": { "alignment": "end" }
}
```

### 4.4 ITEM_LIST Component (Dynamic Array Rendering)

Chỉ đạo render theo mảng dữ liệu. Dùng cho thẻ có sub-list bên trong.

```json
{
  "componentType": "ITEM_LIST",
  "field": "items", // Array trong Data Item chứa các objects tương ứng
  "maxItems": 3, // Ràng buộc số dòng render tối đa
  "modifier": {
    "alignment": "start",
    "fillMaxHeight": true
  },
  "itemTemplate": {
    "layout": "row", // Kiến trúc lặp lại cho TỪNG ITEM của mảng
    "modifier": { "fillMaxWidth": true, "alignment": "center" },
    "children": [
      {
        "componentType": "ICON",
        "field": "icon",
        "iconSize": 16
      },
      {
        "componentType": "TEXT",
        "field": "label",
        "modifier": { "weight": 1 }
      },
      {
        "componentType": "TEXT",
        "field": "value",
        "style": { "typography": "headerXsSemibold", "color": "#303233" }
      }
    ]
  }
}
```

---

## 5. Liên Kết Trường Dữ Liệu (Data Binding Field)

Thuộc tính `"field"` có nhiệm vụ map Data Item Property vào Component UI. Component sẽ "đọc" giá trị để render ra. Chuẩn Model Object Property gồm:

- `"name"`, `"description"`, `"subDescription"`, `"icon"`, `"cardImage"`: Các trường root level phổ thông của thẻ.
- `"titleInformation.content"`, `"titleInformation.icon"`: Dữ liệu phân mảnh của tag tiêu đề.
- `"quantityLabel.content"`, `"quantityLabel.icon"`: Dữ liệu phân mảnh của label số lượng (Góc Bottom Left).
- `"items"`: Dùng map cho danh sách chi tiết (List Ranking). Trong `itemTemplate`, các `.field` con tự tham chiếu theo model của RankingItem, VD như `"label"`, `"value"`, `"icon"`.

---

## 6. Mẫu Cấu Trúc Khái Quát Cho AI Tạo Template Mới

Ví dụ dưới đây là template chuẩn để vẽ lên chiếc thẻ thông tin cá nhân.

- Khung có viền và độ rộng bề cứng.
- Nằm trong 1 cột lớn.
- Chữ nhỏ ở trên.
- Một Row chứa Icon mảng trái, tiêu đề chính.
- Row cuối bao gồm (Chữ số lượng phụ `Top/Left`, Logo to `Bottom/Right`). Chữ số lượng phụ bị ép sát viền bên trái bởi modifier `weight: 1`.

```json
{
  "layout": "column",
  "modifier": {
    "width": 150,
    "height": 124,
    "cornerRadius": 8,
    "padding": 12,
    "border": { "width": 1, "color": "#e0e0e0" }
  },
  "children": [
    {
      "componentType": "TEXT",
      "field": "description",
      "modifier": { "padding": { "bottom": 4 } },
      "style": { "typography": "labelXsMedium", "color": "#303233" }
    },
    {
      "layout": "row",
      "modifier": { "alignment": "center", "padding": { "bottom": 8 } },
      "children": [
        {
          "componentType": "ICON",
          "field": "titleInformation.icon",
          "iconSize": 16,
          "modifier": { "padding": { "right": 4 } }
        },
        {
          "componentType": "TEXT",
          "field": "titleInformation.content",
          "style": { "typography": "actionSBold", "color": "#303233" }
        }
      ]
    },
    {
      "layout": "row",
      "modifier": {
        "alignment": "bottom",
        "arrangement": "spaceBetween",
        "fillMaxWidth": true,
        "fillMaxHeight": true // Phải đẩy hết đáy dư
      },
      "children": [
        {
          "layout": "column",
          "modifier": { "weight": 1 }, // Kéo dạt Label qua trái, Logo áp sang phải
          "children": [
            {
              "componentType": "TEXT",
              "field": "quantityLabel.content",
              "style": { "typography": "headerXsSemibold", "color": "#2FB350" }
            }
          ]
        },
        { "componentType": "ICON", "field": "cardImage", "iconSize": 40 }
      ]
    }
  ]
}
```

**Nguyên Tắc Quan Trọng (Cho Generative Agents):**

1. **Tuyệt đối phân biệt `alignment` (căn lề) và `arrangement` (sắp xếp).** Column thì arrangement quyết định top-bottom, alignment quyết định left-right. Row làm ngược lại.
2. **Luật dùng `width` / `height` cứng:** Phải HẠN CHẾ TỐI ĐA việc gán `width` và `height` bừa bãi. Chỉ sử dụng kích thước tĩnh (Ví dụ `width: 150`) khi khối UI thực sự là một cái Card đóng khung cứng ngắc hoắc một cục Icon. Những thứ còn lại tự cho nó co giãn.
3. **Luật dùng `fillMaxWidth` / `fillMaxHeight` và `padding`:** 
   - Dùng `padding` để tạo khoảng thở (thụt lề) ở mép thẻ.
   - Khi cần 2 cụm chi tiết nằm xa nhau tận 2 bên mép (Ví dụ: Chữ bên trái, Nút bấm bên phải), Wrapper chứa chúng phải được thiết lập `fillMaxWidth: true` hòng chiếm hết không gian, sau đó dùng `arrangement: "spaceBetween"`.
4. **Biến Dạng Kích Thước Component:** TEXT và CTA_BUTTON là các UI nguyên bản, hệ thống sẽ tự đo đạc. Tuyệt đối KHÔNG tạo `width`, `height`, `padding`, `backgroundColor` trên bản thân TEXT và CTA_BUTTON trừ định dạng chữ `style`. CTA_BUTTON chỉ cần alignment là đủ.
5. Muốn đẩy một thành phần cụ thể sang mép: Wrapper = `row`, Item1 (Left) có `modifier: { weight: 1 }`, Item 2 (Right) sẽ bị đẩy sát lề vô cùng tự nhiên.
