# Cornerstone - Full Stack Setup Guide 🚀

Complete setup instructions for Cornerstone with React Frontend + Go Backend + Supabase.

## Architecture

```
┌─────────────────┐         ┌──────────────────┐         ┌───────────────┐
│  React Frontend │────────▶│   Go Backend     │────────▶│  Supabase DB  │
│  (Port 5173)    │         │  (Port 8080)     │         │  (PostgreSQL) │
└─────────────────┘         └──────────────────┘         └───────────────┘
```

## Prerequisites

- Node.js 18+
- Go 1.21+
- PostgreSQL (via Supabase)

## Step 1: Supabase Setup

### 1.1 Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Click "New Project"
3. Fill in project details
4. Copy credentials:
   - Project URL (API URL)
   - Anon Key (Public)
   - Service Role Key (Private)

### 1.2 Create Database Schema
1. Go to SQL Editor in Supabase dashboard
2. Copy all SQL from `supabase-schema.sql`
3. Paste and run in SQL Editor
4. ✅ Tables created: `users`, `sessions`

### 1.3 Setup Authentication Policies
- RLS (Row Level Security) is already configured in schema
- Users can only access their own data

---

## Step 2: Backend (Go) Setup

### 2.1 Navigate to backend folder
```bash
cd backend-go
```

### 2.2 Install dependencies
```bash
go mod download
go mod tidy
```

### 2.3 Configure environment
```bash
cp .env.example .env
```

Edit `.env` with your Supabase credentials:
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
JWT_SECRET=your-secret-key-min-32-chars
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

### 2.4 Run backend
```bash
make run
# or
go run main.go
```

Server runs on: `http://localhost:8080`

### 2.5 Test API
```bash
# Login with default credentials
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin"}'
```

---

## Step 3: Frontend (React) Setup

### 3.1 Navigate to project root
```bash
cd ..
```

### 3.2 Configure environment
```bash
cp .env.example .env
```

Edit `.env`:
```
VITE_API_URL=http://localhost:8080
VITE_GOOGLE_CLIENT_ID=your-google-client-id
```

### 3.3 Install dependencies
```bash
npm install
```

### 3.4 Start dev server
```bash
npm run dev
```

Frontend runs on: `http://localhost:5173`

### 3.5 Login
- Username: `admin`
- Password: `admin`
- Role: `admin` ✨

---

## Step 4: Google OAuth Setup (Optional)

### 4.1 Create Google OAuth Credentials
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create new project
3. Enable "Google+ API"
4. Go to Credentials → Create OAuth 2.0 Client ID
5. Application type: "Web application"
6. Authorized redirect URIs:
   - `http://localhost:5173/auth/google/callback` (dev)
   - `https://your-domain.com/auth/google/callback` (production)

### 4.2 Update Backend & Frontend
Backend (`.env`):
```
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-secret
```

Frontend (`.env`):
```
VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
```

---

## API Endpoints

### Authentication

#### Login
```
POST /api/auth/login
{
  "username": "admin",
  "password": "admin"
}

Response:
{
  "user": { "id": "...", "username": "admin", "role": "admin" },
  "access_token": "eyJ...",
  "refresh_token": "eyJ...",
  "expires_in": 3600
}
```

#### Register
```
POST /api/auth/register
{
  "username": "john",
  "email": "john@mservice.com.vn",
  "password": "password123"
}
```

#### Google Callback (TBD)
```
POST /api/auth/google-callback
{ "token": "google-id-token" }
```

#### Refresh Token
```
POST /api/auth/refresh-token
{ "refresh_token": "eyJ..." }
```

### Protected Routes
All require `Authorization: Bearer <access_token>` header

```
GET /api/user              # Get current user info
POST /api/logout           # Logout
```

---

## Useful Commands

### Frontend
```bash
npm run dev          # Start dev server
npm run build        # Build for production
npm run type-check   # TypeScript check
```

### Backend
```bash
make run            # Run server
make build          # Build binary
make test           # Run tests
```

### Build Figma Plugin (Optional)
```bash
npm run plugin:build    # Build Figma plugin code.js
npm run plugin:watch    # Watch mode
```

---

## Project Structure

```
cornerstone/
├── src/
│   ├── main.tsx                 # React entry point
│   ├── App.tsx
│   ├── pages/                   # Page components
│   │   ├── LoginPage.tsx
│   │   └── DashboardPage.tsx
│   ├── components/              # Reusable components
│   │   ├── Navbar.tsx
│   │   ├── ProtectedRoute.tsx
│   ├── context/                 # React context
│   │   └── AuthContext.tsx
│   ├── styles/                  # CSS modules
│   │   ├── main.css
│   │   ├── login.css
│   │   ├── dashboard.css
│   │   └── navbar.css
│   └── code.ts                  # Figma plugin (unchanged)
│
├── backend-go/
│   ├── main.go
│   ├── config/
│   ├── handlers/
│   ├── middleware/
│   ├── models/
│   ├── go.mod
│   └── Makefile
│
├── index-react.html             # React HTML entry
├── vite.config.ts               # Vite bundler config
├── package.json                 # Dependencies
├── supabase-schema.sql          # Database schema
└── SETUP_GUIDE.md               # This file
```

---

## Troubleshooting

### React app can't connect to backend
- Ensure Go backend is running on `http://localhost:8080`
- Check CORS is enabled in backend
- Verify `VITE_API_URL` in `.env`

### Supabase connection fails
- Verify `SUPABASE_URL` and keys in backend `.env`
- Check database schema is created
- Ensure service role key is used (not anon key)

### Google OAuth not working
- Check Google Client ID is correct
- Verify redirect URI matches in Google Cloud Console
- Ensure backend has Google credentials

### Port conflicts
- React: Change port in `vite.config.ts`
- Go: Change port in `backend-go/.env` (PORT)

---

## Next Steps

1. ✅ Database created (Supabase)
2. ✅ Backend running (Go API)
3. ✅ Frontend running (React)
4. 🔄 Implement Google OAuth flow
5. 🔄 Integrate existing Flow Rules UI
6. 🔄 Integrate SDUI Builder
7. 🔄 Deploy to production

---

## Security Notes

⚠️ **Before production:**
- Change `JWT_SECRET` to strong random value
- Use environment variables (never commit secrets)
- Enable HTTPS
- Set proper CORS origins
- Use real password hashing (bcrypt)
- Implement rate limiting
- Setup database backups

---

## Support

- Backend: `backend-go/README.md`
- Frontend: Check React component comments
- Database: `supabase-schema.sql`

Happy coding! 🎉
