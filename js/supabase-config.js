// ============================================================================
// Supabase config cho thư viện schema chia sẻ.
//
// CÁCH BẬT (1 lần, ~5 phút) — xem hướng dẫn chi tiết trong docs/supabase-setup.md:
//   1. Tạo project free tại https://supabase.com
//   2. SQL Editor → chạy đoạn SQL trong docs/supabase-setup.md (tạo bảng `schemas` + policy)
//   3. Settings → API → copy "Project URL" và "anon public" key, dán vào 2 dòng dưới.
//   4. Commit file này & redeploy → mọi người dùng chung 1 DB, edit là thấy ngay.
//
// anon key là key CÔNG KHAI (an toàn để nhúng vào JS / commit). Quyền ghi được
// kiểm soát bằng Row Level Security policy ở Supabase, không phải bằng key.
//
// Để TRỐNG (giữ nguyên YOUR_...) → app tự chạy bằng localStorage trên máy từng người.
// ============================================================================
window.SUPABASE_URL = 'https://iwjtrafbyipovdepbqqg.supabase.co';
window.SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml3anRyYWZieWlwb3ZkZXBicXFnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIzNTY3NTksImV4cCI6MjA5NzkzMjc1OX0.5O7Sphv-1dXu1GykZX0jlKSOhp8faJOd1ODeBM59Drw';
