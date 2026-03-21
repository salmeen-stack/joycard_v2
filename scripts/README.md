# Database Scripts

This directory contains scripts for managing the Joycard database.

## User Verification Scripts

### check-user-verification.js
**Purpose**: Check the current database structure and user verification status

**Usage**:
```bash
node scripts/check-user-verification.js
```

**What it does**:
- Checks if the `users` table exists and shows its structure
- Verifies if the `verified` column exists
- Shows current verification status of all users
- Identifies any non-admin users that are incorrectly verified
- Provides a summary of user counts by role and verification status

### fix-user-verification.js
**Purpose**: Fix user verification issues and enforce correct verification rules

**Usage**:
```bash
node scripts/fix-user-verification.js
```

**What it does**:
- Ensures the `verified` column exists in the users table
- Creates an index for faster verification lookups
- Unverifies all non-admin users (organizers and staff)
- Verifies all admin users
- Shows the final verification status

## Verification Rules

The Joycard system follows these verification rules:

- **Admin users**: Auto-verified ✅
- **Organizer users**: Require manual verification ❌
- **Staff users**: Require manual verification ❌

## Important Notes

1. **Auto-verification logic**: Only admins are auto-verified when created via the admin API
2. **Manual verification**: Organizers and staff must be manually verified by an admin
3. **Database schema**: The `verified` column defaults to `FALSE` for new users
4. **Security**: This prevents unauthorized access by ensuring only approved users can access the system

## Running Scripts

Make sure your `.env.local` file contains the correct `DATABASE_URL` before running any scripts.

```bash
# Check current status
node scripts/check-user-verification.js

# Fix any issues
node scripts/fix-user-verification.js
```
