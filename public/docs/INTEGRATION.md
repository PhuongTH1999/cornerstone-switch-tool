# 🔌 Tích hợp Cornerstone Native vào Mini App

> Tài liệu mô tả luồng tích hợp **CNS Native view** trên các **Mini App**.
> Phần tích hợp CNS Native view trên Native App (Home, Tab Me, KQGD…) hiện **chưa có thông tin chi tiết**.

---

## I. Thông tin chung

Native view tạm thời chỉ hỗ trợ các **format CNS build** (banner & widget):

- **Widget** (trừ Decentralized widget)
- **Carousel banner**
- **Half banner**
- **Masthead banner**
- **Thin banner**
- **Floating icon**
- **POPUP**

> ⚠️ **Không hỗ trợ** các format do bên thứ 3 tự build (vd: promotion widget, QLCT widget cũ).

**Mục đích chuyển sang native:**

- Tăng performance
- Truy cập trực tiếp API hệ thống
- Ổn định và ít crash hơn
- Giảm thời gian load và size bundle JS

**PIC hỗ trợ:**

| Vai trò | Người phụ trách |
|---------|-----------------|
| App | `tuan.pham1`, `phuong.tran18` |
| PO | `hien.nguyen14`, `linh.vu1` |
| PCS | `huong.vu4`, `phuong.do2` |

> 📝 Các team vui lòng điền kế hoạch tích hợp vào **Cornerstone – Features** trước khi tích hợp để team Cornerstone sắp xếp resource support theo phase.

---

## II. Mô tả chi tiết

### Yêu cầu version app

| Version app | Package | Version package |
|-------------|---------|-----------------|
| **V5** | `@momo-platform/cornerstone-native` | `1.0.4-cns-rc.9` |

---

## III. Import component

```tsx
import { CornerStoneNative, TemplateWidgetType } from '@momo-platform/cornerstone-native';
```

### 1. Đầu vào (Props) — `CornerStoneNativeProps`

| Tên Prop | Kiểu dữ liệu | Bắt buộc | Mô tả |
|----------|--------------|:--------:|-------|
| `params` | `ParamsTypes` | ✅ | Tham số cấu hình (xem bảng bên dưới). |
| `styleContainer` | `StyleProp<ViewStyle>` | — | **Chỉ áp dụng v5.** Default CNS native Margin = `12 × 4` hướng; nếu truyền trường này sẽ override về `0 × 4`. |
| `onViewSuccess` | `(res: DataSuccess) => void` | — | Callback khi widget/mini-app tải & hiển thị thành công. Trả về `DataSuccess`. |
| `onViewFailed` | `(err: DataError) => void` | — | Callback khi xảy ra lỗi lúc tải/hiển thị widget. Trả về `DataError`. |

### `ParamsTypes`

| Tên trường | Kiểu dữ liệu | Bắt buộc | Mô tả |
|------------|--------------|:--------:|-------|
| `blockId` | `string` | — | Filter `blockId` để lấy item của response (nếu chỉ dùng Floating Icon thì không cần). |
| `isShowSkeleton` | `boolean` | — | Hiển thị skeleton loading khi chờ tải nội dung. **Default: `false`.** |
| `type` | `string` \| `TemplateWidgetType` | — | Loại UI; nên dùng `type` đã định nghĩa sẵn (`import { TemplateWidgetType }`). |
| `showFloatingIcon` | `boolean` | — | Show floating icon. **Default: `false`.** |
| `refId` | `string` | — | — |
| `serviceId` | `string` | — | — |
| `tagObserver` | `string` | — | *(Chỉ áp dụng v4).* |
| `styles` | `StyleProp<ViewStyle>` | — | *(Chỉ áp dụng v4).* |
| `featureCode` | `string` | — | *(Chỉ áp dụng v4).* |
| `index` | `number` | — | *(Chỉ áp dụng v4).* |

### 2. Ví dụ

**Template Widget (None Floating Icon)** và **Template Floating Icon** — dùng `type` từ `TemplateWidgetType`.

**Custom UI Native** (platform 5.8+) hỗ trợ `background color` và `item spacing` dọc — truyền thêm vào `nativeUIConfig`:

```tsx
<CornerStoneWidget
  params={{
    nativeUIConfig: {
      widgetUIBackground: '#ffff00', // Dùng mã Hex
      spacing: 40,
    },
  }}
  styleContainer={{
    marginHorizontal: 12, // Nên dùng margin cho native
    marginVertical: 12,   // Nên dùng margin cho native
  }}
/>
```

---

## IV. Monitoring & Metrics

- **Grafana — Cornerstone Key Metrics (E2E services):**
  https://app-graf.mservice.io/d/ff33e19b-572b-49bf-8b16-7c9f93acd844/corner-stone-key-metrics?orgId=1
- **Grafana — Time to load** CNS native & CNS widget.

> 📊 Lịch sử version xem ở tab **Changelog** trong Cornerstone tool.

---

## V. Troubleshooting

### Widget không hiển thị
- Check `blockId` có match với response
- Verify `type` prop là từ `TemplateWidgetType`
- Xem console log cho error messages

### Performance issues
- Kiểm tra `isShowSkeleton` để show loading state
- Validate API response có đúng format
- Monitor Grafana dashboard

### Version mismatch
- Ensure app version ≥ V5 cho `cornerstone-native` >= 1.0.4-cns-rc.9
- Update package: `npm install @momo-platform/cornerstone-native@latest`
