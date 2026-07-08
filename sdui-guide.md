# 📦 Hướng dẫn tạo nội dung SDUI Widget

> 🎯 **Tài liệu này dành cho ai?**
> Team **Backend (BE)**, **Product Owner (PO)**, **Vận hành**, và bất kỳ ai cần tạo/cập nhật
> nội dung hiển thị bằng SDUI Widget.
>
> Phần kỹ thuật chi tiết (cho dev) nằm ở [SDUI JSON Schema](./sdui-json-schema.md).

---

## 1. SDUI Widget là gì?

**SDUI** = *Server-Driven UI* = "giao diện do server điều khiển".

> 💡 **Hình dung đơn giản:** Thay vì lập trình viên phải code sẵn từng giao diện rồi chờ
> release app mới, thì **server gửi xuống một "bản vẽ"** (dạng JSON) mô tả: chỗ này là chữ gì,
> chỗ kia là hình nào, nút bấm dẫn đi đâu… App đọc bản vẽ đó và **tự dựng giao diện**.
>
> Giống như chơi **LEGO**: bạn ghép các khối có sẵn (chữ, hình, nút…) theo ý muốn,
> không cần đúc lại khối mới.

**Lợi ích:** đổi nội dung / bố cục **không cần update app** — chỉ cần đổi data ở server.

---

## 2. Một widget được lắp từ những "khối" nào?

Có **6 khối** cơ bản. Mọi giao diện đều ghép từ chúng:

| Khối (tên kỹ thuật) | Là gì | Hình dung |
|----------------------|-------|-----------|
| **Khung chứa** (`container`) | Hộp để xếp các khối khác vào trong | Cái khay/thẻ chứa nội dung |
| **Chữ** (`text`) | Một đoạn văn bản | "Giảm 50.000đ", "Highlands Coffee" |
| **Hình ảnh** (`image`) | Một tấm ảnh / logo / icon | Logo thương hiệu |
| **Nút bấm** (`button`) | Nút có thể nhấn | Nút "Thu thập" |
| **Nhãn** (`tag`) | Chip nhỏ làm nổi bật | "HOT", "MỚI" |
| **Khoảng trống** (`spacer`) | Khoảng đệm co giãn để đẩy các khối ra xa nhau | Phần trống đẩy nút sang phải |

> ℹ️ **INFO:** Một **khung chứa** có thể lồng nhiều khung chứa khác → tạo ra bố cục phức tạp
> (thẻ trong thẻ). Đây là cách dựng những card đẹp như khuyến mãi, insight chi tiêu…

---

## 3. Cách sắp xếp các khối (layout)

Mỗi **khung chứa** quyết định các khối bên trong nó xếp như thế nào:

| Kiểu xếp (`layout`) | Nghĩa là | Khi nào dùng |
|----------------------|----------|--------------|
| `column` | Xếp **dọc** từ trên xuống | Tiêu đề trên, mô tả dưới |
| `row` | Xếp **ngang** từ trái qua | Logo · chữ · nút trên một hàng |
| `scrollRow` | Xếp ngang và **vuốt ngang được** | Dãy card khuyến mãi vuốt qua lại |
| `scrollColumn` | Xếp dọc và **cuộn dọc được** | Danh sách dài |

Ngoài ra có **căn lề** (`alignment`): canh trái / giữa / phải (hoặc trên / giữa / dưới).

> 💡 **Ví dụ hình dung — 1 card khuyến mãi:**
> ```
> ┌─────────────────────────────────────┐
> │ (logo)  Highlands Coffee             │   ← hàng ngang (row)
> │         Giảm 50.000đ      [Thu thập] │
> └─────────────────────────────────────┘
> ```
> Card này = 1 khung chứa kiểu `row`, bên trong có: 1 hình + 1 khung chứa dọc (2 dòng chữ) + 1 nút.

---

## 4. Mỗi khối khai báo những gì?

Dưới đây là các thông tin (thuộc tính) thường dùng, giải thích bằng tiếng Việt:

### Chữ (text)
| Thuộc tính | Ý nghĩa |
|------------|---------|
| Nội dung | Đoạn chữ hiển thị |
| Kiểu chữ (`typography`) | Cỡ/độ đậm theo bộ Design System (vd tiêu đề, mô tả) |
| Màu chữ | Mã màu, vd `#303233` |
| Số dòng tối đa | Quá dài sẽ cắt bớt (…) |
| Căn lề | Trái / giữa / phải |

### Hình ảnh (image)
| Thuộc tính | Ý nghĩa |
|------------|---------|
| URL ảnh | Đường dẫn ảnh |
| Cách lấp đầy | `fit` (vừa khung) hoặc `fill` (lấp đầy, có thể cắt) |
| Bo góc | Bo tròn góc ảnh (vd làm avatar tròn) |

### Nút bấm (button)
| Thuộc tính | Ý nghĩa |
|------------|---------|
| Tiêu đề | Chữ trên nút, vd "Thu thập" |
| Hành động (`actions`) | Bấm vào thì làm gì: mở màn hình nào / gọi API nào |
| Kiểu nút | primary / outline / text … (style hiển thị) |

### Khung chứa (container)
| Thuộc tính | Ý nghĩa |
|------------|---------|
| Kiểu xếp | dọc / ngang / cuộn (xem §3) |
| Khoảng cách | Cách nhau bao nhiêu giữa các khối con |
| Nền, bo góc, viền, padding | Trang trí cho cái thẻ |

> ℹ️ **Trang trí dùng chung (mọi khối đều có):** màu nền, bo góc, viền, padding (lề trong),
> chiều rộng/cao. Màu luôn ghi dạng mã hex `#RRGGBB`.

---

## 5. Đo lường / Tracking (quan trọng cho PO & BE)

Mỗi khối có thể gắn thông tin tracking để đo hiển thị (impression) và tương tác.

Có **2 cấp**, phân biệt bằng `containerType`:

| Cấp | `containerType` | Gắn ở đâu | Ý nghĩa |
|-----|------------------|-----------|---------|
| **Cả widget** | `"widget"` | Khung chứa ngoài cùng | Đo "widget này được nhìn thấy" |
| **Từng item** | `"item"` | Mỗi card con | Đo "card này được nhìn thấy / được bấm" |

> ⚠️ **LƯU Ý cho BE:** Đặt đúng cấp rất quan trọng cho báo cáo.
> - Khung **ngoài cùng** → `containerType: "widget"`.
> - Mỗi **card con** → `containerType: "item"` (kèm thông tin `itemTracking` riêng như vị trí, item_id).
>
> Phần `tracking`/`trackify` cấp widget khai 1 lần ở ngoài; card con **tự kế thừa**, chỉ cần khai
> thêm `itemTracking` của riêng nó.

---

## 6. Hết hạn nội dung (`expire_time`)

Mỗi card có thể đặt **thời điểm hết hạn** (timestamp mili-giây).

- Tới giờ đó → card **tự động biến mất** khỏi widget.
- Các card khác **vẫn hiển thị bình thường** (chỉ ẩn card hết hạn).
- Không đặt (hoặc đặt `-1`) → **không bao giờ hết hạn**.

> 💡 Dùng cho ưu đãi có thời hạn: hết hạn là tự ẩn, không cần can thiệp thủ công.

---

## 7. Cho phép bấm vào (action)

Không chỉ **nút** mới bấm được. Có thể gắn hành động (`onTap`) lên:
- **Cả một card** (khung chứa) → bấm đâu cũng vào.
- **Một icon/hình** → vd icon "xem thêm" ở góc.

Hành động thường là: **mở một màn hình** (REDIRECT) hoặc **gọi một API** (CALL_API).

---

## 8. ✅ Checklist trước khi gửi data — ⚠️ Lỗi hay gặp

> ✅ **CHECKLIST**
> - [ ] Có `type: "template_widget"` và `templateType: "SDUI_WIDGET"` ở ngoài cùng.
> - [ ] Khung ngoài cùng có `containerType: "widget"`, mỗi card con có `containerType: "item"`.
> - [ ] Mọi ảnh có URL hợp lệ; mọi màu ghi dạng `#RRGGBB`.
> - [ ] Card có thời hạn thì đặt `expire_time`.
> - [ ] Nút/card cần bấm được thì có `actions`/`onTap` trỏ đúng nơi.

> ⚠️ **LỖI THƯỜNG GẶP NHẤT — sai dấu nháy ở biến**
> Khi dùng biến template, **giá trị là chữ thì để trong nháy, là khối thông tin (object) thì KHÔNG nháy.**
>
> | | Sai ❌ | Đúng ✅ |
> |---|---|---|
> | Cấu hình nút | `"property": "$cta"` | `"property": $cta` |
> | Hành động | `"onTap": "$cta"` | `"onTap": $cta` |
> | URL ảnh (là chữ) | `"value": $image` | `"value": "$image"` |
>
> 👉 Đặt sai có thể làm **mất hành động của nút**, hoặc nặng hơn là **không hiển thị được widget**.

---

## 9. Màu sắc & kiểu chữ

- **Màu:** mã hex, ví dụ `#FFFFFF` (trắng), `#303233` (đen text), `#727272` (xám phụ).
- **Kiểu chữ (typography):** dùng **token của Design System**, không tự đặt cỡ tùy ý.
  Một số token đã dùng thực tế: `headerSSemibold`, `headerDefaultBold`, `labelXsMedium`,
  `labelSMedium`, `descriptionDefaultRegular`, `descriptionXsRegular`, `actionSBold`.

> ℹ️ Cần danh sách token đầy đủ và bảng màu chuẩn → liên hệ **team Design / Native**.

---

## 10. Các mẫu layout có sẵn

| Mẫu | Mô tả | Dùng cho |
|-----|-------|----------|
| **Horizontal Full** | Dãy card vuốt ngang: logo + 2 dòng chữ + nút trên cùng 1 hàng | Khuyến mãi gọn |
| **Horizontal No-Desc** | Card vuốt ngang: logo + tên bên trái, tiêu đề + mô tả + nút bên phải | Khuyến mãi có mô tả |
| **Insight** | Tiêu đề + icon "xem thêm" ở trên, rồi dãy card chỉ số vuốt ngang; bấm card mở chi tiết | Insight chi tiêu, gợi ý |

> 👉 File mẫu JSON cụ thể: hỏi team Native để lấy template (`json_horizontal_full`,
> `json_non_des`, `json_insight`).

---

## 11. Thuật ngữ nhanh (cho người mới)

| Từ | Nghĩa dễ hiểu |
|----|----------------|
| **SDUI** | Giao diện do server gửi xuống bằng "bản vẽ" JSON |
| **Widget** | Một khối giao diện trên màn hình (vd dãy card khuyến mãi) |
| **Node / khối** | Một thành phần nhỏ: chữ, hình, nút… |
| **Container / khung chứa** | Hộp để xếp các khối khác vào |
| **Layout** | Cách sắp xếp (dọc / ngang / cuộn) |
| **Property** | Cấu hình của một khối (màu, cỡ chữ, hành động…) |
| **Impression** | Lần widget/card được người dùng nhìn thấy (để đo lường) |
| **Tracking** | Thông tin gắn kèm để thống kê hiển thị & tương tác |
| **Expire time** | Thời điểm card tự hết hạn và ẩn đi |
| **CTA / action** | Hành động khi bấm (mở màn hình / gọi API) |
| **Template variable** (`$...`) | Chỗ trống để backend điền nội dung thật lúc chạy |

---

## 12. Dành cho Developer

Chi tiết kỹ thuật (kiểu dữ liệu chính xác, toàn bộ field, cách parse, ví dụ JSON đầy đủ,
quy tắc validate) xem tại 👉 **[SDUI JSON Schema (technical)](./sdui-json-schema.md)**.
