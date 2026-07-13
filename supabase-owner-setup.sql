-- ============================================
-- Owner User Setup
-- ============================================

-- Delete existing owner if any
DELETE FROM users WHERE username = 'owner';

-- Create owner user with same hash as admin (password: admin)
INSERT INTO users (username, email, password_hash, role)
VALUES (
  'owner',
  'owner@cornerstone.local',
  '$2a$12$nOUIs5kJ7naTuTFkBy1He.4Zg.LwwJXxDIsqk8RRkKasdvJ4lqXXK',
  'owner'
);

-- Verify
SELECT * FROM users WHERE username = 'owner';
