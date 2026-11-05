-- Migration 0005: Add google_id and allow nullable hashed_password for social login.
ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id TEXT UNIQUE;
ALTER TABLE users ALTER COLUMN hashed_password DROP NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users (google_id);
