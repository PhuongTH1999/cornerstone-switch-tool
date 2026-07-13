# 🚀 Quick Start Checklist

## Your Supabase Project
```
URL: https://cnwxfakyfdmlvdmkknvp.supabase.co
```

---

## ☑️ STEP 1: Get Supabase API Keys (2 min)

- [ ] Go to https://cnwxfakyfdmlvdmkknvp.supabase.co
- [ ] Click **Settings** (left sidebar)
- [ ] Click **API** tab
- [ ] Copy these 3 things:
  - `Project URL` (already know: https://cnwxfakyfdmlvdmkknvp.supabase.co)
  - `Anon Key` (Public) - keep it
  - `Service Role Key` (Secret!) - keep it safe
- [ ] Also get **Database Password** from Settings → Database

**Save them in a temp file!** ⬇️

---

## ☑️ STEP 2: Create Database Schema (2 min)

- [ ] Still in Supabase dashboard
- [ ] Left sidebar → **SQL Editor**
- [ ] Click **New Query**
- [ ] Open file: `supabase-schema.sql` (in project root)
- [ ] Copy ALL content → Paste into SQL Editor
- [ ] Click **Run** button
- [ ] ✅ Check: Tables `users` & `sessions` created
  - Go to **Table Editor** → see both tables

---

## ☑️ STEP 3: Setup Backend (Go) (3 min)

```bash
cd backend-go

# Create .env file
cp .env.example .env
```

Edit `backend-go/.env`:
```
PORT=8080

SUPABASE_URL=https://cnwxfakyfdmlvdmkknvp.supabase.co
SUPABASE_KEY=<PASTE_YOUR_ANON_KEY>
SUPABASE_SERVICE_ROLE_KEY=<PASTE_YOUR_SERVICE_ROLE_KEY>

JWT_SECRET=your-secret-key-min-32-chars
GOOGLE_CLIENT_ID=skip-for-now
GOOGLE_CLIENT_SECRET=skip-for-now

FRONTEND_URL=http://localhost:5173
ENVIRONMENT=development
```

Then run:
```bash
go mod download
make run
```

**Check:** Server says `🚀 Server running on http://localhost:8080`

Test with curl:
```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin"}'
```

Expected: Returns `access_token`

---

## ☑️ STEP 4: Setup Frontend (React) (3 min)

**In NEW terminal** (keep backend running):

```bash
# Go back to project root
cd ..

# Create .env file
cp .env.example .env
```

Edit `.env`:
```
VITE_API_URL=http://localhost:8080
VITE_GOOGLE_CLIENT_ID=skip-for-now
```

Then:
```bash
npm install
npm run dev
```

**Check:** Browser opens at `http://localhost:5173`

---

## ☑️ STEP 5: Test Login (1 min)

Browser should open http://localhost:5173 automatically

Login with:
- **Username:** `admin`
- **Password:** `admin`

✅ You should see **Welcome Dashboard**

---

## ✨ Success! What's Next?

- [x] Backend running ✅
- [x] Frontend running ✅
- [x] Login working ✅
- [ ] Google OAuth (optional - later)
- [ ] Integrate existing Flow Rules UI
- [ ] Integrate SDUI Builder
- [ ] Deploy to production

---

## 🔗 Important Files

| File | What |
|------|------|
| `backend-go/.env` | Backend secrets |
| `.env` | Frontend config |
| `supabase-schema.sql` | Database schema |
| `src/context/AuthContext.tsx` | User auth state |
| `src/pages/LoginPage.tsx` | Login UI |
| `src/pages/DashboardPage.tsx` | Main page |

---

## 🆘 Troubleshooting

### Backend won't connect to Supabase
```
Error: connection refused / timeout
```
- [ ] Check SUPABASE_URL is correct
- [ ] Check Service Role Key is correct (not Anon Key!)
- [ ] Check database schema was created

### Frontend shows blank page
```
Error: API is unreachable
```
- [ ] Check backend is running on port 8080
- [ ] Check VITE_API_URL in .env
- [ ] Check browser console for errors

### Login failed
```
Invalid credentials
```
- [ ] Make sure you're using `admin` / `admin`
- [ ] Check users table has data (query in Supabase SQL Editor)

### Port already in use
- React: Change port in `vite.config.ts` (line 7)
- Go: Change PORT in `backend-go/.env`

---

## 📞 Need Help?

Check these files:
- **Backend setup:** `backend-go/README.md`
- **Full setup:** `SETUP_GUIDE.md`
- **Supabase details:** `SUPABASE_SETUP.md`

---

**Estimated time: 15 minutes total** ⏱️

Good luck! 🎉
