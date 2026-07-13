# Cornerstone Backend (Go)

REST API backend cho Cornerstone authentication & authorization system.

## Setup

### 1. Clone dependencies
```bash
cd backend-go
go mod download
```

### 2. Copy environment variables
```bash
cp .env.example .env
```

### 3. Fill in Supabase credentials
Edit `.env` với:
- `SUPABASE_URL` - Từ Supabase project settings
- `SUPABASE_KEY` - Anon key
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key

### 4. Run server
```bash
make run
# hoặc
go run main.go
```

Server sẽ chạy trên `http://localhost:8080`

## API Endpoints

### Authentication

#### Login (Username/Password)
```
POST /api/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "admin"
}

Response:
{
  "user": {
    "id": "...",
    "email": "admin@cornerstone.local",
    "username": "admin",
    "role": "admin"
  },
  "access_token": "eyJ...",
  "refresh_token": "eyJ...",
  "expires_in": 3600
}
```

#### Register (New User)
```
POST /api/auth/register
Content-Type: application/json

{
  "username": "john",
  "email": "john@mservice.com.vn",
  "password": "password123"
}
```

#### Google OAuth
```
POST /api/auth/google-callback
Content-Type: application/json

{
  "token": "google-id-token"
}
```

#### Refresh Token
```
POST /api/auth/refresh-token
Content-Type: application/json

{
  "refresh_token": "eyJ..."
}
```

### Protected Routes

Cần header:
```
Authorization: Bearer <access_token>
```

#### Get Current User
```
GET /api/user

Response:
{
  "id": "...",
  "username": "admin",
  "email": "admin@cornerstone.local",
  "role": "admin",
  "created_at": "...",
  "updated_at": "..."
}
```

#### Logout
```
POST /api/logout

Response:
{
  "message": "Logged out successfully"
}
```

## Default Credentials

- **Username:** admin
- **Password:** admin
- **Role:** admin

⚠️ **Change in production!**

## Database Schema

### users table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255),
  role VARCHAR(50) DEFAULT 'guest',
  google_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## Development

```bash
# Install dependencies
make install

# Run in development mode
make dev

# Build binary
make build

# Run tests
make test
```

## Project Structure

```
backend-go/
├── config/           # Configuration & Supabase client
├── handlers/         # HTTP request handlers
├── middleware/       # Auth & CORS middleware
├── models/          # Data models & request/response types
├── main.go          # Entry point
├── go.mod          # Go dependencies
├── Makefile        # Development commands
└── .env.example    # Environment template
```
