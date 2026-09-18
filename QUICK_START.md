# Bắt đầu nhanh

Backend được chạy và quản lý riêng. Tại thư mục gốc frontend:

```bash
npm install
npm run dev
```

Mở `http://localhost:5173`.

- Development mặc định proxy `/api` tới `http://localhost:3000` qua `vite.config.ts`.
- Có thể đặt `VITE_API_URL` trong `.env.local` để gọi backend khác; bao gồm `/api` trong URL.
- Production mặc định dùng AWS Lambda trong `src/config/api.ts`.
- Build bằng `npm run build`; xem bản build bằng `npm run preview`.

Xem [hướng dẫn cấu hình](SETUP_GUIDE.md) để cấu hình API, đăng nhập Google và deploy.
