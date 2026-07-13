-- ============================================
-- Cornerstone Authentication Schema
-- ============================================

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255),
  role VARCHAR(50) DEFAULT 'guest', -- admin, guest
  google_id VARCHAR(255) UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create sessions table for refresh tokens
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  refresh_token VARCHAR(500) NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_refresh_token ON sessions(refresh_token);

-- Create or replace function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for users table
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE
  ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Policies (Row Level Security)
-- ============================================

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

-- Users can view their own data
CREATE POLICY "Users can view own data"
  ON users FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own data
CREATE POLICY "Users can update own data"
  ON users FOR UPDATE
  USING (auth.uid() = id);

-- Sessions policy - users can view their own sessions
CREATE POLICY "Users can view own sessions"
  ON sessions FOR SELECT
  USING (auth.uid() = user_id);

-- ============================================
-- Initial Data (Optional)
-- ============================================

-- Seed admin user (password hash example - change in production)
-- In production, generate proper bcrypt hash
INSERT INTO users (username, email, password_hash, role)
VALUES (
  'admin',
  'admin@cornerstone.local',
  '$2a$12$nOUIs5kJ7naTuTFkBy1He.4Zg.LwwJXxDIsqk8RRkKasdvJ4lqXXK', -- bcrypt hash of 'admin'
  'admin'
)
ON CONFLICT (username) DO NOTHING;

-- Insert a sample guest user
INSERT INTO users (username, email, password_hash, role)
VALUES (
  'guest',
  'guest@mservice.com.vn',
  '$2a$12$nOUIs5kJ7naTuTFkBy1He.4Zg.LwwJXxDIsqk8RRkKasdvJ4lqXXK', -- bcrypt hash of 'password'
  'guest'
)
ON CONFLICT (username) DO NOTHING;

-- ============================================
-- Stored Procedures
-- ============================================

-- Function to verify user credentials
CREATE OR REPLACE FUNCTION verify_user_credentials(
  p_username VARCHAR,
  p_password_hash VARCHAR
)
RETURNS TABLE (
  user_id UUID,
  user_role VARCHAR,
  user_email VARCHAR
) AS $$
BEGIN
  RETURN QUERY
  SELECT u.id, u.role, u.email
  FROM users u
  WHERE u.username = p_username
    AND u.password_hash = p_password_hash;
END;
$$ LANGUAGE plpgsql;

-- Function to get or create user from Google
CREATE OR REPLACE FUNCTION get_or_create_google_user(
  p_google_id VARCHAR,
  p_email VARCHAR,
  p_username VARCHAR
)
RETURNS TABLE (
  user_id UUID,
  user_role VARCHAR,
  is_new BOOLEAN
) AS $$
DECLARE
  v_user_id UUID;
  v_is_new BOOLEAN := FALSE;
BEGIN
  -- Try to find existing user
  SELECT id INTO v_user_id FROM users WHERE google_id = p_google_id;

  -- If not found, create new user
  IF v_user_id IS NULL THEN
    INSERT INTO users (google_id, email, username, role)
    VALUES (p_google_id, p_email, p_username, 'guest')
    RETURNING id INTO v_user_id;
    v_is_new := TRUE;
  END IF;

  RETURN QUERY
  SELECT v_user_id, role, v_is_new FROM users WHERE id = v_user_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Comments
-- ============================================

COMMENT ON TABLE users IS 'User accounts with authentication details';
COMMENT ON TABLE sessions IS 'User refresh tokens for long-lived sessions';
COMMENT ON COLUMN users.role IS 'User role: admin (full access) or guest (limited access)';
COMMENT ON COLUMN users.google_id IS 'Google OAuth ID for social login';
COMMENT ON COLUMN sessions.refresh_token IS 'JWT refresh token for obtaining new access tokens';
