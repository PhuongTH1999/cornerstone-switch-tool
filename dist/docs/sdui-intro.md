# 🎨 SDUI là gì?

> Tài liệu này dành cho **PO, designer, marketing, QA** và bất kỳ ai muốn hiểu SDUI mà không cần biết lập trình. Nếu bạn là developer, xem thêm tab **Document** trong trang [SDUI](/sdui).

---

## SDUI trong một câu

**SDUI (Server-Driven UI)** nghĩa là: **giao diện do server "ra lệnh"**. Thay vì vẽ cứng giao diện vào trong app, chúng ta gửi cho app một **bản mô tả** ("ở đây có ảnh, bên dưới là dòng chữ, cuối cùng là nút bấm màu hồng"), và app MoMo tự vẽ đúng như mô tả đó.

### Ví dụ dễ hình dung 🍰

Hãy tưởng tượng app MoMo là một **thợ làm bánh** trong mỗi chiếc điện thoại:

- **Cách cũ:** Muốn đổi kiểu bánh, phải dạy lại thợ từ đầu → nghĩa là **phát hành phiên bản app mới**, chờ duyệt trên App Store / Google Play, chờ người dùng cập nhật. Mất nhiều ngày, thậm chí nhiều tuần.
- **Cách SDUI:** Thợ đã biết sẵn các **nguyên liệu cơ bản** (chữ, ảnh, nút, khung…). Mỗi lần muốn bánh mới, ta chỉ cần **gửi công thức mới** từ server. Thợ đọc công thức và làm ngay — **người dùng thấy giao diện mới gần như tức thì**, không cần cập nhật app.

---

## Vì sao MoMo dùng SDUI?

| Lợi ích | Ý nghĩa thực tế |
|---|---|
| 🚀 **Ra mắt nhanh** | Thay đổi banner, widget, card khuyến mãi mà không chờ release app |
| 🎯 **Linh hoạt theo chiến dịch** | Mỗi chiến dịch có thể có giao diện riêng, bật/tắt theo thời gian |
| 📱 **Một bản, hai nền tảng** | Một bản mô tả dùng chung cho cả **Android** và **iOS** |
| ⚡ **Mượt và ổn định** | App vẽ bằng công nghệ gốc của điện thoại (native), nhanh hơn và ít lỗi hơn |
| 🧪 **Thử nghiệm dễ dàng** | Dễ làm A/B test: cho các nhóm người dùng thấy các giao diện khác nhau |

---

## Giao diện được ghép từ "mảnh LEGO" 🧱

Mỗi giao diện SDUI được ghép từ **10 loại mảnh ghép** mà app đã biết sẵn:

| Mảnh ghép | Dùng để làm gì | Ví dụ |
|---|---|---|
| 📦 **Khung** (container) | Xếp các mảnh khác theo hàng ngang, cột dọc hoặc danh sách cuộn | Một hàng gồm nhiều thẻ voucher |
| 🗂️ **Hộp chồng** (box) | Đặt các mảnh chồng lên nhau | Chữ nằm đè lên ảnh nền |
| 🔤 **Chữ** (text) | Hiển thị nội dung chữ | "Giảm 50% cho đơn đầu tiên" |
| 🖼️ **Ảnh** (image) | Hiển thị hình ảnh, logo, icon | Logo thương hiệu |
| 🔘 **Nút bấm** (button) | Mở một màn hình khác hoặc thực hiện hành động | "Nhận ngay", "Xem chi tiết" |
| 🏷️ **Nhãn** (tag) | Nhãn nhỏ có màu nền | "HOT", "Mới" |
| ↔️ **Khoảng trống** (spacer) | Tạo khoảng cách giữa các mảnh | Đẩy nút bấm sang phải |
| 🎠 **Trang trượt** (pager) | Nhiều trang vuốt ngang | Carousel banner |
| ⚫ **Chấm trang** (pageIndicator) | Các chấm nhỏ cho biết đang ở trang nào | ● ○ ○ |
| 📊 **Thanh tiến độ** (progressBar) | Thể hiện tiến độ hoàn thành | "Đã hoàn thành 3/5 nhiệm vụ" |

**Ví dụ:** một thẻ ưu đãi được ghép từ Khung, Ảnh, Nhãn, Chữ, Khoảng trống và Nút bấm.

```sdui
{"type":"container","property":{"layout":"column","spacing":0},"style":{"fillMaxWidth":true,"padding":{"all":16}},"value":{"children":[
  {"type":"container","property":{"layout":"row","spacing":12,"alignment":"center"},"style":{"fillMaxWidth":true,"backgroundColor":"#FFFFFF","cornerRadius":12,"padding":{"all":12}},"value":{"children":[
    {"type":"image","property":{"contentMode":"fit"},"style":{"width":48,"height":48},"value":"/assets/sdui/brand-placeholder.png"},
    {"type":"container","property":{"layout":"column","spacing":4},"style":{"width":160},"value":{"children":[
      {"type":"tag","property":{"tagType":"highlight"},"value":"HOT"},
      {"type":"text","property":{"typography":"headerSSemibold"},"style":{"fillMaxWidth":true},"value":"Giảm 50.000đ"},
      {"type":"text","property":{"typography":"descriptionXsRegular","color":"#727272"},"style":{"fillMaxWidth":true},"value":"Cho đơn từ 100.000đ"}
    ]}},
    {"type":"spacer","property":{"minLength":0},"value":""},
    {"type":"button","property":{"ctaType":"BUTTON","actions":[{"actionType":"REDIRECT","featureCode":"voucher_detail"}]},"value":{"title":"Nhận","type":"primary"}}
  ]}}
]}}
```

> 💡 Vì app chỉ hiểu đúng 10 mảnh này, **mọi thiết kế cần được dựng từ các mảnh trên**. Nếu thiết kế cần một kiểu hiển thị đặc biệt chưa có, hãy trao đổi với App Team trước.

---

## Mỗi mảnh ghép gồm những gì và làm được gì? 🔍

Mỗi mảnh ghép có **nội dung** (thứ nó hiển thị) và các **tùy chỉnh** (cách nó hiển thị). Trong Editor, bấm chọn một mảnh trên bản xem trước, bảng thuộc tính bên phải sẽ hiện đúng các tùy chỉnh dưới đây.

### Tính năng chung — mảnh nào cũng có ✨

| Tính năng | Ý nghĩa |
|---|---|
| 📐 **Kích thước** | Đặt chiều rộng / chiều cao cố định, hoặc **giãn hết chiều ngang / chiều dọc** còn trống |
| 🎨 **Màu nền** | Tô màu nền cho mảnh |
| ⭕ **Bo góc** | Làm tròn các góc |
| 🔲 **Viền** | Thêm đường viền với độ dày và màu tùy chọn |
| ↕️ **Khoảng đệm (padding)** | Khoảng cách từ mép mảnh vào nội dung bên trong, chỉnh riêng từng cạnh hoặc cả 4 cạnh |
| 👆 **Bấm vào cả vùng** | Bấm vào bất kỳ mảnh nào cũng có thể **mở màn hình khác** hoặc **thực hiện một hành động** |
| 📈 **Đo lường (tracking)** | Ghi nhận khi người dùng **nhìn thấy** (hiện đủ 100% trên màn hình) và khi người dùng **bấm** |
| ⏰ **Hết hạn tự ẩn** | Đặt thời điểm hết hạn, sau thời điểm đó mảnh **tự ẩn đi**, ví dụ nhãn "Flash sale" chỉ hiện đến 24h (không áp dụng cho mảnh ngoài cùng) |

> 🎨 Màu luôn viết dạng mã 6 ký tự có dấu `#`, ví dụ `#A50064` (hồng MoMo). Không dùng tên màu như "red".

### 📦 Khung (container)
- **Gồm:** một danh sách các mảnh con.
- **Tùy chỉnh được:**
  - **Cách xếp:** cột dọc, hàng ngang, **danh sách cuộn dọc** hoặc **danh sách cuộn ngang**.
  - **Khoảng cách đều** giữa các mảnh con.
  - **Căn lề** các mảnh con: trái / giữa / phải (với cột), trên / giữa / dưới (với hàng).
- **Lưu ý:** Luôn nhập khoảng cách, kể cả khi bằng 0, vì iOS tự thêm khoảng cách mặc định nếu để trống.

**Ví dụ:** một cột dọc gồm tiêu đề và một danh sách cuộn ngang (vuốt ngang để xem thêm thẻ).

```sdui
{"type":"container","property":{"layout":"column","spacing":12},"style":{"fillMaxWidth":true,"backgroundColor":"#FFFFFF","padding":{"all":16}},"value":{"children":[
  {"type":"text","property":{"typography":"headerDefaultBold"},"value":"Ưu đãi hôm nay"},
  {"type":"container","property":{"layout":"scrollRow","spacing":8},"value":{"children":[
    {"type":"container","property":{"layout":"column","spacing":4},"style":{"width":120,"backgroundColor":"#FFF0F7","cornerRadius":8,"padding":{"all":12}},"value":{"children":[
      {"type":"text","property":{"typography":"headerSSemibold","color":"#A50064"},"style":{"fillMaxWidth":true},"value":"-20%"},
      {"type":"text","property":{"typography":"descriptionXsRegular"},"style":{"fillMaxWidth":true},"value":"Cà phê"}]}},
    {"type":"container","property":{"layout":"column","spacing":4},"style":{"width":120,"backgroundColor":"#FFF0F7","cornerRadius":8,"padding":{"all":12}},"value":{"children":[
      {"type":"text","property":{"typography":"headerSSemibold","color":"#A50064"},"style":{"fillMaxWidth":true},"value":"-30%"},
      {"type":"text","property":{"typography":"descriptionXsRegular"},"style":{"fillMaxWidth":true},"value":"Xem phim"}]}},
    {"type":"container","property":{"layout":"column","spacing":4},"style":{"width":120,"backgroundColor":"#FFF0F7","cornerRadius":8,"padding":{"all":12}},"value":{"children":[
      {"type":"text","property":{"typography":"headerSSemibold","color":"#A50064"},"style":{"fillMaxWidth":true},"value":"-50%"},
      {"type":"text","property":{"typography":"descriptionXsRegular"},"style":{"fillMaxWidth":true},"value":"Đồ ăn"}]}},
    {"type":"container","property":{"layout":"column","spacing":4},"style":{"width":120,"backgroundColor":"#FFF0F7","cornerRadius":8,"padding":{"all":12}},"value":{"children":[
      {"type":"text","property":{"typography":"headerSSemibold","color":"#A50064"},"style":{"fillMaxWidth":true},"value":"-10%"},
      {"type":"text","property":{"typography":"descriptionXsRegular"},"style":{"fillMaxWidth":true},"value":"Mua sắm"}]}}
  ]}}
]}}
```

### 🗂️ Hộp chồng (box)
- **Gồm:** một danh sách các mảnh con, xếp **chồng lên nhau**, mảnh sau nằm trên.
- **Tùy chỉnh được:** **9 vị trí** đặt nội dung: trên / giữa / dưới × trái / giữa / phải.
- **Dùng khi:** cần đặt chữ hoặc nhãn đè lên ảnh, gắn huy hiệu vào góc thẻ.

**Ví dụ:** cùng một ảnh, nhãn được đặt đè lên ở 3 vị trí khác nhau: trên-phải, giữa, dưới-giữa.

```sdui
{"type":"container","property":{"layout":"row","spacing":16},"style":{"fillMaxWidth":true,"backgroundColor":"#FFFFFF","padding":{"all":16}},"value":{"children":[
  {"type":"box","property":{"contentAlignment":"topEnd"},"style":{"width":84,"height":84},"value":{"children":[
    {"type":"image","property":{"contentMode":"fit"},"style":{"width":84,"height":84},"value":"/assets/sdui/brand-placeholder.png"},
    {"type":"tag","property":{"tagType":"error"},"value":"HOT"}
  ]}},
  {"type":"box","property":{"contentAlignment":"center"},"style":{"width":84,"height":84},"value":{"children":[
    {"type":"image","property":{"contentMode":"fit"},"style":{"width":84,"height":84},"value":"/assets/sdui/brand-placeholder.png"},
    {"type":"tag","property":{"tagType":"info"},"value":"Mới"}
  ]}},
  {"type":"box","property":{"contentAlignment":"bottomCenter"},"style":{"width":84,"height":84},"value":{"children":[
    {"type":"image","property":{"contentMode":"fit"},"style":{"width":84,"height":84},"value":"/assets/sdui/brand-placeholder.png"},
    {"type":"tag","property":{"tagType":"success"},"value":"-20%"}
  ]}}
]}}
```

### 🔤 Chữ (text)
- **Gồm:** nội dung chữ.
- **Tùy chỉnh được:**
  - **11 kiểu chữ** theo chuẩn MoMo, từ tiêu đề lớn (24) đến chữ mô tả nhỏ (10).
  - **Màu chữ.**
  - **Số dòng tối đa:** dài hơn thì tự cắt và thêm dấu `…`.
  - **Căn lề:** trái / giữa / phải.
  - **Khoảng cách giữa các dòng.**
- **Lưu ý:**
  - Trên iOS có thể chọn vị trí dấu `…` (đầu / giữa / cuối); Android luôn để ở cuối.
  - Chữ **chỉ có 1 dòng** có thể căn lề khác nhau giữa Android và iOS. Muốn căn giữa chắc chắn trên cả 2, hãy đặt chữ vào một **Khung** có căn giữa.

**Ví dụ:** các kiểu chữ khác nhau, chữ màu và chữ dài bị cắt còn 1 dòng.

```sdui
{"type":"container","property":{"layout":"column","spacing":8},"style":{"fillMaxWidth":true,"backgroundColor":"#FFFFFF","padding":{"all":16}},"value":{"children":[
  {"type":"text","property":{"typography":"headlineDefaultBold"},"value":"1.250.000đ"},
  {"type":"text","property":{"typography":"headerDefaultBold"},"value":"Tiêu đề widget"},
  {"type":"text","property":{"typography":"descriptionDefaultRegular"},"value":"Chữ mô tả mặc định"},
  {"type":"text","property":{"typography":"labelSMedium","color":"#A50064"},"value":"Chữ màu hồng MoMo"},
  {"type":"text","property":{"typography":"descriptionDefaultRegular","lineLimit":1},"value":"Đây là một dòng chữ rất dài, vượt quá một dòng nên sẽ bị cắt bớt và thêm dấu ba chấm ở cuối"}
]}}
```

### 🖼️ Ảnh (image)
- **Gồm:** đường link của ảnh.
- **Tùy chỉnh được:**
  - **Cách hiển thị:** **vừa khung** (thấy trọn ảnh) hoặc **phủ kín khung** (cắt bớt phần thừa).
  - **Tô một màu** cho icon đơn sắc, ví dụ đổi icon đen thành hồng.
  - **Bo góc riêng cho ảnh.**
  - **Giữ tỉ lệ khung**, ví dụ 16:9.
- **Lưu ý:** **Luôn đặt kích thước** cho ảnh, nếu không giao diện có thể bị "nhảy" khi ảnh tải xong. Lúc ảnh đang tải hoặc tải lỗi, khung để trống.

**Ví dụ:** cùng một ảnh hiển thị theo 3 cách: vừa khung, tô màu hồng, phủ kín khung chữ nhật có bo góc (phần thừa bị cắt).

```sdui
{"type":"container","property":{"layout":"row","spacing":16,"alignment":"center"},"style":{"fillMaxWidth":true,"backgroundColor":"#FFFFFF","padding":{"all":16}},"value":{"children":[
  {"type":"image","property":{"contentMode":"fit"},"style":{"width":56,"height":56},"value":"/assets/sdui/brand-placeholder.png"},
  {"type":"image","property":{"contentMode":"fit","tintColor":"#A50064"},"style":{"width":56,"height":56},"value":"/assets/sdui/brand-placeholder.png"},
  {"type":"image","property":{"contentMode":"fill","cornerRadius":8},"style":{"width":140,"height":56},"value":"/assets/sdui/brand-placeholder.png"}
]}}
```

### 🔘 Nút bấm (button)
- **Gồm:** chữ trên nút, icon bên trái / bên phải (tùy chọn).
- **Tùy chỉnh được:**
  - **7 kiểu nút** theo chuẩn MoMo: chính (hồng), phụ, nền nhạt, viền, cảnh báo, chỉ chữ, vô hiệu.
  - **Hành động khi bấm:**
    - **Mở màn hình khác** trong app.
    - **Gửi yêu cầu lên hệ thống**, ví dụ nhận voucher, đăng ký tham gia.
    - Có thể **xếp nhiều hành động nối tiếp**: hành động sau chỉ chạy khi hành động trước thành công.
  - **Dạng công tắc bật / tắt**, đổi trạng thái theo kết quả hành động.
- **Lưu ý:** Nút có kích thước nhỏ, vừa với chữ, không kéo dài hết chiều ngang. Màu nút đi theo kiểu nút, không chọn màu tự do. Nút không có chữ sẽ không hiển thị.

**Ví dụ:** các kiểu nút thường dùng.

```sdui
{"type":"container","property":{"layout":"column","spacing":12},"style":{"fillMaxWidth":true,"backgroundColor":"#FFFFFF","padding":{"all":16}},"value":{"children":[
  {"type":"container","property":{"layout":"row","spacing":8},"value":{"children":[
    {"type":"button","property":{"ctaType":"BUTTON","actions":[{"actionType":"REDIRECT","featureCode":"voucher_detail"}]},"value":{"title":"Nhận ngay","type":"primary"}},
    {"type":"button","property":{"ctaType":"BUTTON","actions":[{"actionType":"REDIRECT","featureCode":"voucher_detail"}]},"value":{"title":"Phụ","type":"secondary"}},
    {"type":"button","property":{"ctaType":"BUTTON","actions":[{"actionType":"REDIRECT","featureCode":"voucher_detail"}]},"value":{"title":"Nền nhạt","type":"tonal"}}
  ]}},
  {"type":"container","property":{"layout":"row","spacing":8},"value":{"children":[
    {"type":"button","property":{"ctaType":"BUTTON","actions":[{"actionType":"REDIRECT","featureCode":"voucher_detail"}]},"value":{"title":"Viền","type":"outline"}},
    {"type":"button","property":{"ctaType":"BUTTON","actions":[{"actionType":"REDIRECT","featureCode":"voucher_detail"}]},"value":{"title":"Chỉ chữ","type":"text"}},
    {"type":"button","property":{"ctaType":"BUTTON","actions":[]},"value":{"title":"Vô hiệu","type":"disabled"}}
  ]}}
]}}
```

### 🏷️ Nhãn (tag)
- **Gồm:** chữ trên nhãn, icon nhỏ bên trái (tùy chọn).
- **Tùy chỉnh được:**
  - **5 bộ màu có sẵn:** 🔵 thông tin, 🟢 thành công, 🔴 lỗi, 🟠 cảnh báo, 🟡 nổi bật. Không chọn thì nhãn màu xám.
  - **Tự chọn màu nền và màu chữ** nếu không muốn dùng bộ màu có sẵn.

**Ví dụ:** 5 bộ màu có sẵn, nhãn mặc định (xám) và nhãn tự chọn màu.

```sdui
{"type":"container","property":{"layout":"column","spacing":8},"style":{"fillMaxWidth":true,"backgroundColor":"#FFFFFF","padding":{"all":16}},"value":{"children":[
  {"type":"container","property":{"layout":"row","spacing":8},"value":{"children":[
    {"type":"tag","property":{"tagType":"info"},"value":"Thông tin"},
    {"type":"tag","property":{"tagType":"success"},"value":"Thành công"},
    {"type":"tag","property":{"tagType":"error"},"value":"Lỗi"},
    {"type":"tag","property":{"tagType":"warning"},"value":"Cảnh báo"}
  ]}},
  {"type":"container","property":{"layout":"row","spacing":8},"value":{"children":[
    {"type":"tag","property":{"tagType":"highlight"},"value":"Nổi bật"},
    {"type":"tag","property":{},"value":"Mặc định"},
    {"type":"tag","property":{"backgroundColor":"#A50064","textColor":"#FFFFFF"},"value":"Tự chọn màu"}
  ]}}
]}}
```

### ↔️ Khoảng trống (spacer)
- **Gồm:** không có nội dung, chỉ chiếm chỗ.
- **Tùy chỉnh được:** **độ dài tối thiểu.**
- **Cách hoạt động:**
  - Trong hàng ngang hoặc cột dọc, khoảng trống **tự giãn** để đẩy các mảnh khác ra xa, ví dụ đẩy nút bấm sát lề phải.
  - Trong danh sách cuộn hoặc hộp chồng thì **không giãn**.
- **Lưu ý:**
  - Muốn các mảnh cách nhau **đều** thì dùng "khoảng cách" của Khung, không dùng nhiều khoảng trống.
  - Nếu trong hàng có **chữ**, Android có thể chia chỗ trống cho cả chữ nên khoảng trống không đẩy được hết sang lề. Hãy kiểm tra bằng chế độ **So sánh** trong Editor.

**Ví dụ:** khoảng trống ở giữa đẩy logo sát lề trái và nút "Xem tất cả" sát lề phải.

```sdui
{"type":"container","property":{"layout":"row","spacing":0,"alignment":"center"},"style":{"fillMaxWidth":true,"backgroundColor":"#FFFFFF","padding":{"all":16}},"value":{"children":[
  {"type":"image","property":{"contentMode":"fit"},"style":{"width":32,"height":32},"value":"/assets/sdui/brand-placeholder.png"},
  {"type":"spacer","property":{"minLength":8},"value":""},
  {"type":"button","property":{"ctaType":"BUTTON","actions":[{"actionType":"REDIRECT","featureCode":"promotion_list"}]},"value":{"title":"Xem tất cả","type":"text"}}
]}}
```

### 🎠 Trang trượt (pager)
- **Gồm:** nhiều trang, mỗi mảnh con là một trang.
- **Tùy chỉnh được:**
  - **Bật / tắt hàng chấm** chỉ trang. Chấm chỉ hiện khi có từ 2 trang trở lên.
  - **Màu chấm** đang chọn / chưa chọn, **màu nền** của hàng chấm.
  - **Vị trí hàng chấm:** 9 vị trí như Hộp chồng, mặc định ở giữa phía dưới.
  - **Khoảng cách** từ hàng chấm đến mép.
- **Lưu ý:** Người dùng **vuốt tay** để chuyển trang, trang **không tự chạy** và **không quay vòng** về trang đầu. **Bắt buộc đặt chiều cao.**

**Ví dụ:** banner 3 trang, hàng chấm ở giữa phía dưới (vuốt ngang để chuyển trang).

```sdui
{"type":"container","property":{"layout":"column","spacing":0},"style":{"fillMaxWidth":true,"backgroundColor":"#FFFFFF","padding":{"all":16}},"value":{"children":[
  {"type":"pager","property":{"showIndicator":true,"alignmentIndicator":"bottomCenter","paddingIndicator":{"top":4,"left":6,"right":6,"bottom":8}},"style":{"fillMaxWidth":true,"height":120,"cornerRadius":12},"value":{"children":[
    {"type":"box","property":{"contentAlignment":"center"},"style":{"width":343,"height":120,"backgroundColor":"#A50064"},"value":{"children":[
      {"type":"text","property":{"typography":"headerDefaultBold","color":"#FFFFFF"},"value":"Trang 1"}]}},
    {"type":"box","property":{"contentAlignment":"center"},"style":{"width":343,"height":120,"backgroundColor":"#0068FF"},"value":{"children":[
      {"type":"text","property":{"typography":"headerDefaultBold","color":"#FFFFFF"},"value":"Trang 2"}]}},
    {"type":"box","property":{"contentAlignment":"center"},"style":{"width":343,"height":120,"backgroundColor":"#00A86B"},"value":{"children":[
      {"type":"text","property":{"typography":"headerDefaultBold","color":"#FFFFFF"},"value":"Trang 3"}]}}
  ]}}
]}}
```

### ⚫ Chấm trang (pageIndicator)
- **Gồm:** một hàng chấm nhỏ.
- **Tùy chỉnh được:**
  - **Tổng số chấm.**
  - **Chấm nào đang được chọn.**
  - **Màu chấm** đang chọn / chưa chọn.
- **Lưu ý:** Đây là hàng chấm **đứng yên**, không tự đổi khi vuốt. Nếu cần chấm đi theo trang, dùng chấm có sẵn của Trang trượt.

**Ví dụ:** 5 chấm, chấm thứ 2 đang được chọn.

```sdui
{"type":"container","property":{"layout":"column","spacing":0},"style":{"fillMaxWidth":true,"backgroundColor":"#FFFFFF","padding":{"all":16}},"value":{"children":[
  {"type":"pageIndicator","property":{"total":5,"activeIndex":1,"activeColor":"#A50064","inactiveColor":"#DFDFE6"},"value":""}
]}}
```

### 📊 Thanh tiến độ (progressBar)
- **Gồm:**
  - **Giá trị hiện tại** và **giá trị tối đa**, ví dụ 3 / 5.
  - Hai dòng chữ nhỏ phía trên thanh, một bên trái, một bên phải.
- **Tùy chỉnh được:**
  - **Màu** phần đã hoàn thành.
  - **Độ dày** của thanh.
  - **Độ rộng** của thanh.
- **Lưu ý:**
  - Thanh **chạy hiệu ứng** từ 0 lên khi hiện ra và luôn hiện một chút màu, kể cả khi tiến độ là 0.
  - Dòng chữ bên trái tối đa **23 ký tự**.
  - Trên Android, thanh có độ rộng cố định nằm sát trái; trên iOS, thanh nằm giữa.

**Ví dụ:** tiến độ 3/5 nhiệm vụ, màu hồng.

```sdui
{"type":"container","property":{"layout":"column","spacing":0},"style":{"fillMaxWidth":true,"backgroundColor":"#FFFFFF","padding":{"all":16}},"value":{"children":[
  {"type":"progressBar","property":{"color":"#A50064","barHeight":6},"style":{"fillMaxWidth":true},"value":{"currentValue":3,"maxValue":5,"subDes1":"Hoàn thành 3/5","subDes2":"Còn 2 nhiệm vụ"}}
]}}
```

> 💡 **Nội dung động** (xem phần bên dưới) chỉ gắn được vào 4 mảnh: **Chữ, Ảnh, Nhãn, Nút bấm**.

---

## Quy trình làm một giao diện SDUI trên công cụ này

```text
 ✏️ Thiết kế     →   🔄 Chuyển đổi    →   🛠️ Chỉnh sửa    →   💾 Lưu    →   📱 Xem trên điện thoại
  (Figma)          (Figma migration)      (Editor)       (Template)      (QR Mini App)
```

### Bước 1 — Thiết kế trên Figma ✏️
Designer vẽ giao diện trên Figma như bình thường, ưu tiên dùng các thành phần có sẵn của MoMo Design.

### Bước 2 — Chuyển thiết kế sang SDUI 🔄
Vào trang **SDUI → Figma migration**. Công cụ sẽ đọc thiết kế và **tự động chuyển** thành bản mô tả SDUI. Nếu thiếu màu, ảnh hoặc khoảng cách, công cụ sẽ hiện **cảnh báo** để bạn bổ sung.

👉 Hướng dẫn chi tiết từng bước có ngay trong tab Figma migration ("Hướng dẫn: Figma → MoMo Design → SDUI").

### Bước 3 — Chỉnh sửa trong Editor 🛠️
Bấm **Open in Editor** để mở trình chỉnh sửa. Tại đây bạn có thể:

- 👀 **Xem trước** giao diện trên khung **Android** và **iOS**, hoặc đặt **cạnh nhau để so sánh**.
- 🖱️ **Bấm vào bất kỳ phần nào** trên bản xem trước để chọn và sửa: đổi chữ, đổi màu, đổi ảnh, chỉnh khoảng cách…
- ➕ **Thêm / xoá / sắp xếp** các mảnh ghép ở bảng **Layers** bên trái.
- ↶ **Undo / Redo** khi lỡ tay.
- ⚠️ Xem **cảnh báo** (❌ lỗi, ⚠️ cần chú ý, ℹ️ thông tin) — bấm vào cảnh báo để biết chính xác phần nào có vấn đề.

### Bước 4 — Lưu thành Template 💾
Đặt tên rồi bấm **Save schema**. Giao diện được lưu vào **Thư viện SDUI Templates**, dùng chung cho cả team — ai cũng có thể mở ra xem, chỉnh sửa hoặc **Save as copy** để tạo phiên bản mới.

### Bước 5 — Xem trên điện thoại thật 📱
Sau khi lưu, bấm **Mini App QR** để tạo mã QR. Mở app MoMo và **quét mã** để xem giao diện hiển thị thật trên điện thoại của bạn.

> ⚠️ Bản xem trước trên web là **mô phỏng**. Luôn kiểm tra lại trên **điện thoại thật** (cả Android và iOS) trước khi đưa ra người dùng. Những chỗ có **viền đỏ nét đứt** trên bản xem trước là phần công cụ chưa chắc chắn — cần đặc biệt kiểm tra.

---

## Nội dung động — "chỗ trống điền sau" ✍️

Nhiều giao diện cần hiển thị **thông tin riêng cho từng người**, ví dụ tên người dùng, số tiền hoàn, số voucher còn lại…

Thay vì gõ cứng, bạn có thể biến một dòng chữ, ảnh, nhãn hoặc nút bấm thành **"chỗ trống"** (gọi là **dynamic field** / **Variable**). Khi app hiển thị, hệ thống sẽ **tự điền dữ liệu thật** của từng người vào chỗ trống đó.

| Thiết kế | Người dùng A thấy | Người dùng B thấy |
|---|---|---|
| "Chào **{tên}**, bạn có **{số}** voucher" | "Chào **Lan**, bạn có **3** voucher" | "Chào **Minh**, bạn có **1** voucher" |

> 💡 Tên các "chỗ trống" cần **thống nhất với team Backend** để hệ thống biết điền dữ liệu nào vào đâu.

---

## Từ điển nhanh 📘

| Thuật ngữ | Nghĩa dễ hiểu |
|---|---|
| **SDUI** | Server-Driven UI — giao diện do server gửi bản mô tả, app tự vẽ |
| **Schema / JSON** | "Công thức" mô tả giao diện, dạng văn bản mà máy đọc được |
| **Template** | Một giao diện đã lưu trong thư viện, có thể dùng lại |
| **Component** | Một "mảnh LEGO" (chữ, ảnh, nút…) |
| **Native** | Vẽ bằng công nghệ gốc của điện thoại (Android / iOS), nhanh và mượt |
| **Preview** | Bản xem trước trên trình duyệt |
| **Dynamic field / Variable** | "Chỗ trống" được tự điền dữ liệu riêng của từng người dùng |
| **Lint / Cảnh báo** | Công cụ tự kiểm tra và báo những chỗ có thể hiển thị sai |
| **Widget** | Một khối giao diện nhỏ, thường nằm trên trang chủ MoMo |

---

## Câu hỏi thường gặp ❓

**Tôi không biết code, có dùng được công cụ này không?**
Có. Bạn có thể đi trọn quy trình Figma → Editor → Lưu → Quét QR mà không cần viết code. Phần "công thức" (JSON) được công cụ tự tạo ra.

**Sửa template xong thì người dùng thấy ngay chưa?**
Chưa. Lưu template chỉ lưu vào thư viện của công cụ. Để đưa ra người dùng thật, template cần được cấu hình vào chiến dịch/vị trí hiển thị qua quy trình của team Cornerstone.

**Vì sao Android và iOS trông hơi khác nhau?**
Mỗi hệ điều hành có cách vẽ riêng nên đôi khi có chênh lệch nhỏ. Hãy dùng chế độ **So sánh** trong Editor và kiểm tra trên máy thật.

**Thiết kế của tôi có kiểu hiển thị đặc biệt không ghép được từ 10 mảnh trên?**
Liên hệ App Team để đánh giá. Mảnh ghép mới cần được thêm vào app và phát hành phiên bản mới thì mới dùng được.

**Template cũ có dùng được trên app phiên bản cũ không?**
Được, miễn là template chỉ dùng những mảnh ghép mà phiên bản app đó đã hỗ trợ.

---

## Cần hỗ trợ? 🙋

| Vai trò | Người phụ trách |
|---|---|
| 👨‍💻 App Team | `tuan.pham1`, `phuong.tran18` |
| 📊 Product Owner | `hien.nguyen14`, `linh.vu1` |
| 🛠️ Platform Support | `huong.vu4`, `phuong.do2` |

📝 Vui lòng **lên kế hoạch trên bảng Cornerstone – Features** trước khi bắt đầu để team sắp xếp resources hiệu quả.

👉 Bắt đầu ngay: mở trang **[SDUI](/sdui)**.
