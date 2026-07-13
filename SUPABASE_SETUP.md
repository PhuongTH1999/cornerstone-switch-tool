# Supabase Setup - Step by Step

## Project Details
- **URL:** https://cnwxfakyfdmlvdmkknvp.supabase.co
- **Project ID:** cnwxfakyfdmlvdmkknvp

## Step 1: Lấy API Keys

### 1.1 Vào Supabase Dashboard
- URL: https://cnwxfakyfdmlvdmkknvp.supabase.co
- Hoặc vào https://app.supabase.com → chọn project

### 1.2 Lấy API Keys
1. Left sidebar → **Settings**
2. Click **API** tab
3. Copy các keys:

```
SUPABASE_URL = https://cnwxfakyfdmlvdmkknvp.supabase.co

SUPABASE_KEY (Anon Key) = 
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (copy từ dashboard)

SUPABASE_SERVICE_ROLE_KEY = 
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (copy từ dashboard)
```

> ⚠️ **Cẩn thận:** Service Role Key là Secret - đừng commit lên Git!

---

## Step 2: Tạo Database Schema

### 2.1 Vào SQL Editor
1. Left sidebar → **SQL Editor**
2. Click **New Query** button

### 2.2 Copy & Paste SQL Schema
1. Copy toàn bộ nội dung từ file **`supabase-schema.sql`** trong project
2. Paste vào SQL Editor
3. Click **Run** button (hoặc Ctrl+Enter)

✅ Schema sẽ được tạo (users, sessions tables, indexes, policies)

### 2.3 Verify
Kiểm tra tables được tạo:
1. Left sidebar → **Table Editor**
2. Bạn sẽ thấy:
   - `users` table
   - `sessions` table

---

## Step 3: Setup Backend

### 3.1 Tạo file `.env` trong `backend-go/`
```bash
cd backend-go
cp .env.example .env
```

### 3.2 Edit `.env`
```
PORT=8080

SUPABASE_URL=https://cnwxfakyfdmlvdmkknvp.supabase.co
SUPABASE_KEY=<paste-your-anon-key-here>
SUPABASE_SERVICE_ROLE_KEY=<paste-your-service-role-key-here>

JWT_SECRET=your-secret-key-at-least-32-chars-long
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

FRONTEND_URL=http://localhost:5173
ENVIRONMENT=development
```

### 3.3 Download dependencies & Run
```bash
go mod download
make run
```

Server sẽ chạy trên `http://localhost:8080`

### 3.4 Test API
```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin"}'

# Nếu thành công sẽ return access_token
```

---

## Step 4: Setup Frontend

### 4.1 Tạo file `.env` trong project root
```bash
cp .env.example .env
```

### 4.2 Edit `.env`
```
VITE_API_URL=http://localhost:8080
VITE_GOOGLE_CLIENT_ID=your-google-client-id
```

### 4.3 Install & Run
```bash
npm install
npm run dev
```

Frontend sẽ chạy trên `http://localhost:5173`

---

## Step 5: Test Login

1. Mở browser → http://localhost:5173
2. Login:
   - **Username:** admin
   - **Password:** admin
3. ✅ Bạn sẽ được chuyển đến Dashboard

---

## Troubleshooting

### "Connection refused" (backend không connect Supabase)
- Kiểm tra `SUPABASE_URL` và `SUPABASE_SERVICE_ROLE_KEY` đúng
- Kiểm tra database schema được tạo (xem Step 2.3)

### "Table users does not exist"
- SQL schema chưa được run
- Vào Step 2 và run SQL lại

### React không connect đến backend
- Kiểm tra backend chạy trên port 8080
- Kiểm tra `VITE_API_URL` đúng

### CORS error
- Kiểm tra `FRONTEND_URL` trong backend `.env`

---

## Database Structure

### users table
```
id              → UUID (primary key)
username        → VARCHAR (unique)
email           → VARCHAR (unique)
password_hash   → VARCHAR (for regular login)
role            → VARCHAR (admin or guest)
google_id       → VARCHAR (for Google OAuth)
created_at      → TIMESTAMP
updated_at      → TIMESTAMP
```

### Default Users
- **admin/admin** → role: admin
- **guest/password** → role: guest

---

## Next: Google OAuth Setup

1. Tạo Google OAuth credentials (optional)
2. Copy Client ID & Secret vào `.env`
3. Implement OAuth flow trong React

---

Làm xong bước này chưa? 😊
