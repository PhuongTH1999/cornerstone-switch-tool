-- ============================================
-- Add Owner Role & User Management
-- ============================================

-- Update users table to support owner role
-- (if role column exists, it already supports: admin, guest, owner)

-- Create user_roles table (mapping table for owners to manage users)
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  managed_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  assigned_role VARCHAR(50) NOT NULL DEFAULT 'guest', -- admin or guest
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(owner_id, managed_user_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_roles_owner_id ON user_roles(owner_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_managed_user_id ON user_roles(managed_user_id);

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_user_roles_updated_at ON user_roles;
CREATE TRIGGER update_user_roles_updated_at BEFORE UPDATE
  ON user_roles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert owner user (optional - for testing)
INSERT INTO users (username, email, password_hash, role)
VALUES (
  'owner',
  'owner@cornerstone.local',
  '$2a$12$nOUIs5kJ7naTuTFkBy1He.4Zg.LwwJXxDIsqk8RRkKasdvJ4lqXXK', -- password: admin
  'owner'
)
ON CONFLICT (username) DO NOTHING;

-- ============================================
-- Comments
-- ============================================

COMMENT ON TABLE user_roles IS 'Mapping table for owners to manage user roles and permissions';
COMMENT ON COLUMN user_roles.owner_id IS 'The owner user ID';
COMMENT ON COLUMN user_roles.managed_user_id IS 'The user being managed';
COMMENT ON COLUMN user_roles.assigned_role IS 'Role assigned by owner (admin or guest)';
