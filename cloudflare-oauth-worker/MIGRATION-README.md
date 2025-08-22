# Migration: Add bannedAt Property

This migration adds a `bannedAt` timestamp property to all existing users in the system.

## What it does

- Adds `bannedAt: null` to all existing users (indicating they are not banned)
- Changes the frontend logic from checking `banned: true` to checking `bannedAt` timestamp
- Provides rollback capability if needed

## How to run

1. **Deploy the updated worker first** (with the new `update-all-users` endpoint):
   ```bash
   cd cloudflare-oauth-worker
   wrangler deploy
   ```

2. **Run the migration**:
   ```bash
   wrangler migration apply
   ```

3. **Verify the migration**:
   - Check the worker logs to see the migration output
   - The reports page should now filter by `bannedAt` instead of `banned`

## Rollback (if needed)

If you need to rollback the migration:

```bash
wrangler migration rollback
```

## Frontend Changes

The frontend has been updated to:
- Filter banned users by `bannedAt && typeof user.bannedAt === 'string'`
- Display the ban date in the banned users section
- Show "Banned on: [date]" for each banned user

## Backend Changes

- Added `update-all-users` endpoint to support migrations
- The migration script fetches all users, adds `bannedAt: null`, and saves them back

## Notes

- Users with `bannedAt: null` are considered not banned
- Users with `bannedAt: "2024-01-01T00:00:00.000Z"` are considered banned
- The migration is safe to run multiple times (idempotent)
- All existing users will have `bannedAt: null` after migration 