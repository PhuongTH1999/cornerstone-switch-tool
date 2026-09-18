# Thiết lập Cornerstone Frontend

Repository này chứa frontend React + TypeScript dùng Vite. Backend được quản lý
và triển khai riêng; không cần cài runtime hoặc database backend để build frontend.

## Chạy development

Cài Node.js tương thích Vite 5 và npm, sau đó chạy tại thư mục gốc:

```bash
npm install
npm run dev
```

Frontend chạy tại `http://localhost:5173`.

## Cấu hình API

Cấu hình nằm trong `src/config/api.ts`:

- Development: mặc định gọi `/api`, được Vite proxy tới `http://localhost:3000`.
  Backend này chạy riêng; thay target trong `vite.config.ts` nếu cần.
- Production: mặc định gọi
  `https://yepswakp3nxo4qoeynn74xhnt40wqlia.lambda-url.us-east-1.on.aws/api`.
- `VITE_API_URL`: ghi đè base URL API, bao gồm `/api`.
  Giá trị `/api` chỉ sử dụng proxy khi development; production dùng URL AWS mặc định.
- `VITE_REGISTRY_API_URL`: tùy chọn API cho version/changelog; mặc định dùng API chung.
- `VITE_GOOGLE_CLIENT_ID`: Google OAuth client ID cho đăng nhập Google.

Đặt biến trong `.env.local` hoặc môi trường build của nền tảng deploy. Biến `VITE_*`
được nhúng vào frontend, không dùng để lưu secrets. Khởi động lại dev server hoặc
build/deploy lại sau khi thay đổi biến môi trường.

Khi gọi trực tiếp backend khác origin, backend phải cấu hình CORS cho domain frontend,
method và header đang dùng, bao gồm `Content-Type` và `Authorization`.
Response chỉ được có một giá trị `Access-Control-Allow-Origin` hợp lệ.

## Build và deploy

```bash
npm run build
npm run preview
```

Output nằm trong `dist/`. Cấu hình Vercel có sẵn trong `vercel.json`.
Dùng `npm run deploy` khi muốn triển khai production lên Vercel.

## Kiểm tra lỗi

- Development không gọi được `/api`: kiểm tra backend riêng và target proxy trong `vite.config.ts`.
- Production gọi sai server: kiểm tra `VITE_API_URL` trong môi trường build rồi deploy lại.
- CORS: sửa cấu hình ở backend hoặc AWS Function URL, tránh trả header CORS trùng nhau.
- Đăng nhập: dùng tài khoản do backend hiện tại cấp.
