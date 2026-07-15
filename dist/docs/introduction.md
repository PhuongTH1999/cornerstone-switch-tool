# 📖 Cornerstone - Introduction

> Cornerstone (CNS) là **nền tảng Server-Driven UI (SDUI)** cung cấp nội dung động và render native widgets trên toàn bộ ứng dụng MoMo. Bộ công cụ này giúp bạn quản lý luồng (native / RN), xuất cấu hình plugin, sinh schema SDUI và tra cứu tài liệu tích hợp — tất cả ở một nơi.

---

## Cornerstone là gì?

**Cornerstone Native view** cho phép render các format quảng cáo/nội dung do hệ thống CNS build, trực tiếp bằng **native** (Android Compose / iOS SwiftUI) thay vì React Native, giúp tăng hiệu năng và độ ổn định hơn.

### Mục đích chuyển sang Native:

- **⚡ Hiệu năng cao hơn** — Render native components trực tiếp thay vì React Native
- **🔌 Truy cập API trực tiếp** — Kết nối trực tiếp đến API hệ thống mà không cần lớp trung gian
- **🛡️ Ổn định hơn** — Ít crash hơn và ổn định hơn so với các giải pháp web-based
- **📦 Bundle JS nhỏ hơn** — Giảm kích thước bundle bằng cách chuyển rendering sang native

---

## Tính năng chính

Cornerstone cung cấp toàn bộ toolkit cho SDUI:

### 1️⃣ **Trình tạo Component SDUI** 🎨
Tạo và quản lý UI components bằng JSON schema hoạt động natively trên Android và iOS.

### 2️⃣ **Quản lý Templates** 📚
Templates có sẵn cho product cards, ranking lists, content modules và custom layouts.

### 3️⃣ **Flow Rules Engine** 📋
Định nghĩa rules cho platform targeting, user segmentation, A/B testing và conditional delivery.

### 4️⃣ **Tích hợp Figma Plugin** 🎨
Export cấu hình plugin với nhiều platform flavors cho workflow design-to-code liền mạch.

### 5️⃣ **Kiểm soát truy cập theo Role** 👑
- **Owner** — Toàn quyền (quản lý users, settings)
- **Admin** — Quản lý features và deployment
- **Guest** — Chỉ xem (read-only access)

### 6️⃣ **Xác thực & Quản lý Users** 🔐
- JWT auth với username/password
- Google OAuth integration
- Auto-create user trên lần đăng nhập đầu tiên

---

## Định dạng Widget được hỗ trợ

Native view hiện tại hỗ trợ các định dạng **CNS-built** sau:

| Format | Mô tả |
|--------|-------|
| 📦 **Widget** | Widget chuẩn (trừ Decentralized) |
| 🎠 **Carousel Banner** | Banner cuộn ngang |
| 🎨 **Half Banner** | Banner 50% chiều rộng |
| 🏠 **Masthead Banner** | Banner header toàn chiều rộng |
| 📌 **Thin Banner** | Banner chiều cao tối thiểu |
| 🔔 **Floating Icon** | Icon cố định vị trí |
| 🪟 **POPUP** | Dialog modal |

> ⚠️ **Không hỗ trợ** format do bên thứ 3 tự build (vd: promotion widget, QLCT widget cũ).

---

## Tech Stack

### 🖥️ Backend (Go)
- **Go 1.20+** + **Gin Framework**
- **REST API** với JWT authentication
- **Supabase PostgreSQL** database
- **Row Level Security (RLS)** policies

### ⚛️ Frontend (React)
- **React 18** + **TypeScript**
- **React Router** cho navigation
- **Context API** cho state management
- **Vite** cho fast builds

### 🗄️ Database
- **PostgreSQL** (Supabase)
- **PostgREST API** cho auto-generated endpoints
- **RLS Policies** cho security
- **Real-time subscriptions**

---

## Bắt đầu nhanh

### 1. Setup Backend (3 phút)
```bash
cd backend-go
cp .env.example .env
# Edit .env với Supabase credentials
go mod download
make run
```
✅ Server chạy trên `http://localhost:8080`

### 2. Setup Frontend (3 phút)
```bash
cd ..
cp .env.example .env
npm install
npm run dev
```
✅ Frontend chạy trên `http://localhost:5173`

### 3. Đăng nhập & Test (1 phút)
```
Username: admin
Password: admin
```
✅ Xem Dashboard và khám phá tất cả tính năng

---

## Hỗ trợ & Quy trình

### Team Contact

| Vai trò | Người phụ trách |
|---------|-----------------|
| 👨‍💻 App Team | `tuan.pham1`, `phuong.tran18` |
| 📊 Product Owner | `hien.nguyen14`, `linh.vu1` |
| 🛠️ Platform Support | `huong.vu4`, `phuong.do2` |

### Quy trình tích hợp

📝 **Các team vui lòng:**
1. Lên kế hoạch tích hợp trước
2. Điền vào bảng **Cornerstone – Features**
3. Team Cornerstone sẽ sắp xếp resources theo phase

---

## Các tài liệu khác

- 🔌 **[Integration Guide](/?#/integrate)** — Hướng dẫn tích hợp vào Mini Apps
- 📡 **[API Reference](/?#/api)** — Tham chiếu API endpoints
- 🎨 **[SDUI Schema](/?#/sdui)** — Đặc tả cấu trúc dữ liệu SDUI
- 🗓️ **[Changelog](/?#/changelog)** — Lịch sử version

---

## Kế tiếp?

- ✅ Đã hiểu Cornerstone là gì
- 🔧 [Xem tài liệu Integration](/?#/integrate)
- 🚀 [Bắt đầu setup](/?#/changelog)
