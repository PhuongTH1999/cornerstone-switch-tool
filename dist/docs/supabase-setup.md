# Bật thư viện schema chia sẻ (Supabase — free)

Khi chưa cấu hình, schema được lưu trong `localStorage` của từng máy (không chia sẻ).
Làm 1 lần các bước dưới để mọi người dùng chung 1 DB — edit/save/xoá là người khác
load lại thấy ngay, **không cần commit hay redeploy**.

## 1. Tạo project Supabase
1. Vào https://supabase.com → đăng nhập → **New project** (chọn region gần VN, vd Singapore).
2. Đặt mật khẩu DB (không cần dùng tới ở app), đợi project khởi tạo ~1 phút.

## 2. Tạo bảng + policy
Vào **SQL Editor** → **New query** → dán đoạn dưới → **Run**:

```sql
create table if not exists public.schemas (
  id   uuid primary key default gen_random_uuid(),
  name text not null,
  tree jsonb not null,
  ts   bigint not null default (extract(epoch from now()) * 1000)::bigint,
  created_at timestamptz default now()
);

-- Bật Row Level Security và cho phép đọc/ghi qua anon key.
-- (Tool nội bộ — ai có link đều thao tác được. Cần chặt hơn thì thêm auth sau.)
alter table public.schemas enable row level security;

create policy "anon read"   on public.schemas for select using (true);
create policy "anon insert" on public.schemas for insert with check (true);
create policy "anon update" on public.schemas for update using (true) with check (true);
create policy "anon delete" on public.schemas for delete using (true);
```

## 3. Lấy key, dán vào app
1. **Project Settings → API**.
2. Copy **Project URL** và **anon public** key.
3. Mở `js/supabase-config.js`, thay 2 dòng:

```js
window.SUPABASE_URL = 'https://xxxxxxxx.supabase.co';
window.SUPABASE_ANON_KEY = 'eyJhbGciOi...';   // anon public key
```

4. Commit `js/supabase-config.js` & redeploy (`npm run deploy`).

Xong — badge trong mục **Saved schemas** sẽ hiện 🌐 *Chia sẻ (Supabase)*.

## Ghi chú
- **anon key là key công khai**, an toàn để commit/nhúng vào JS. Quyền ghi do RLS policy
  ở trên kiểm soát, không phải do key.
- Muốn nạp sẵn schema có sẵn: bấm **⬇ Export JSON** trong app để lấy file, rồi import dữ liệu
  vào bảng `schemas` qua Supabase Table Editor (hoặc dùng `Save` từng cái).
- Nếu để key dạng `YOUR_...`, app tự chạy chế độ local (localStorage) — không lỗi.
