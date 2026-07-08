# 📖 Introduction

> Cornerstone (CNS) là hệ thống hiển thị **banner & widget** trên MoMo. Bộ công cụ này giúp bạn quản lý luồng (native / RN), xuất cấu hình plugin, sinh schema SDUI và tra cứu tài liệu tích hợp — tất cả ở một nơi.

---

## Cornerstone là gì?

**Cornerstone Native view** cho phép render các format quảng cáo/nội dung do hệ thống CNS build, trực tiếp bằng **native** (Android Compose / iOS SwiftUI) thay vì React Native, giúp tăng hiệu năng và độ ổn định.

## Công cụ này làm gì?

- **Integrate** — hướng dẫn tích hợp `@momo-platform/cornerstone-native` vào Mini App (props, ví dụ, version).
- **API** — tham chiếu API lấy layout (v5).
- **SDUI** — sinh & tra cứu `dataSchema` cho Server-Driven UI (Generator + tài liệu + templates).
- **Tools** — quản lý rule chuyển luồng native/RN, xuất JSON config, đóng gói Figma plugin.
- **Changelog** — lịch sử version package Cornerstone.

## Format được hỗ trợ

Native view tạm thời chỉ hỗ trợ các format **CNS build**:

- Widget (trừ Decentralized widget)
- Carousel banner · Half banner · Masthead banner · Thin banner
- Floating icon · POPUP

> ⚠️ **Không hỗ trợ** format do bên thứ 3 tự build (vd: promotion widget, QLCT widget cũ).

## Vì sao chuyển sang Native?

- Tăng performance
- Truy cập trực tiếp API hệ thống
- Ổn định và ít crash hơn
- Giảm thời gian load và size bundle JS

## Hỗ trợ & quy trình

| Vai trò | Người phụ trách |
|---------|-----------------|
| App | `tuan.pham1`, `phuong.tran18` |
| PO | `hien.nguyen14`, `linh.vu1` |
| PCS | `huong.vu4`, `phuong.do2` |

> 📝 Các team vui lòng điền kế hoạch tích hợp vào **Cornerstone – Features** trước khi tích hợp để team Cornerstone sắp xếp resource support theo phase.
