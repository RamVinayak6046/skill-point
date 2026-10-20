-- Skill Point: Cloudflare D1 Database Schema
-- Provides ACID atomic daily quota management, assessment attempt state,
-- account authentication, and user data persistence with strict account isolation.
-- (₹0 recurring cost on Free Tier: 5M reads/day, 100k writes/day, 5GB storage)

CREATE TABLE IF NOT EXISTS daily_quota (
  day TEXT PRIMARY KEY,
  count INTEGER NOT NULL DEFAULT 0,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS assessment_attempts (
  attempt_id TEXT PRIMARY KEY,
  attempt_secret TEXT NOT NULL,
  user_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  completed_at INTEGER,
  score INTEGER
);

CREATE INDEX IF NOT EXISTS idx_assessment_attempts_status ON assessment_attempts(status);

-- -----------------------------------------------------------------------------
-- Users Table
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  salt TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- -----------------------------------------------------------------------------
-- User Sessions Table
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_sessions (
  token TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_user_sessions_user ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(token);

-- -----------------------------------------------------------------------------
-- User Records Table (Strictly isolated by user_id)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_records (
  user_id TEXT NOT NULL,
  data_key TEXT NOT NULL,
  data_value TEXT NOT NULL,
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (user_id, data_key),
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_user_records_user ON user_records(user_id);
