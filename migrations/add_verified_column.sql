-- Add verified column to users table
-- This migration adds a boolean 'verified' column to the users table
-- to track whether staff and organizer accounts have been verified by admin

-- Add verified column with default FALSE
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT FALSE;

-- Add index for better performance on verification queries
CREATE INDEX IF NOT EXISTS idx_users_verified ON users(verified);

-- Set existing admin users as verified (they don't need verification)
UPDATE users 
SET verified = TRUE 
WHERE role = 'admin';

-- Add comment to document the column
COMMENT ON COLUMN users.verified IS 'Whether the user account has been verified by admin (required for staff/organizer roles)';

-- Verification: Check if column was added successfully
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'users' AND column_name = 'verified';
