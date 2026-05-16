# Children's Ministry cut-over — hand-off

**Date:** 15 May 2026
**Change:** Parent self-service Google OAuth flow → staff-managed model run by a new `CHILDREN_LEADER` role.

## What changed

### Auth model
- Parents no longer log in. `/parents/login`, `/parents`, `/parents/children/*` and `/api/parents/*` have all been deleted.
- A new `CHILDREN_LEADER` role exists. Children Leaders use the standard staff email/password login at `/login`, and on first login they are forced through the existing 2FA password-change flow (`mustChangePassword = true` is set by `/api/auth/create-user`, same as Content Editors).
- The YOUTH Google OAuth flow is unchanged — youth members still sign in via `/youth/login`.

### Database
- New role: `UserRole.CHILDREN_LEADER`
- `PARENT` role is retained in the enum for historical integrity (existing `ChildCheckIn.signedInById` rows must continue to resolve), but is **deprecated** — no new code path assigns it.
- New columns on `Child`: `primaryGuardianName` (required), `primaryGuardianPhone` (required), `primaryGuardianEmail` (optional).
- The `_ParentToChild` join table has been dropped.

### Permissions
- `CHILDREN_ADMIN_ROLES = ['SUPER_ADMIN', 'CHILDREN_LEADER']`. The Children Leader plus a Super Admin are the only roles that can view or modify children, check in, or check out. Content Editors and Viewers no longer see this section.

### UI
- `/dashboard/children` is the Children Leader's workspace — three tabs:
  - **Live attendance** — live board polling every 5 s, with a per-card "Sign out" button.
  - **All children** — paginated roster, **Register a child** button, per-row Sign-in / Sign-out / Edit / Delete actions, and details expansion.
  - **Analytics** — Sunday + monthly trends, unchanged.
- The register / edit modal collects child details, primary-guardian (name + phone + optional email) and emergency contact (name + phone + relationship).

### API
| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/admin/children` | Paginated list (search by name or guardian). |
| `POST` | `/api/admin/children` | Register a new child. |
| `GET` | `/api/admin/children/[id]` | Single child + last 20 check-ins. |
| `PUT` | `/api/admin/children/[id]` | Partial update. |
| `DELETE` | `/api/admin/children/[id]` | Permanently remove a child (cascades check-ins). |
| `POST` | `/api/admin/children/[id]/check-in` | Sign a child in. Idempotent. |
| `POST` | `/api/admin/children/[id]/check-out` | Close the open check-in. |

All gated to `CHILDREN_LEADER` or `SUPER_ADMIN`.

## Commands to run

From the project root, on the server (or locally before deploying):

```bash
# 1. Apply the new migration. Hand-authored SQL lives in
#    prisma/migrations/20260515200000_children_leader_role/migration.sql
npx prisma migrate deploy

# 2. Regenerate the Prisma client so the new role + Child columns are typed.
npx prisma generate

# 3. Restart the Next.js server.
npm run build && npm run start
```

If you prefer to run the migration manually inside a psql session:

```bash
psql "$DATABASE_URL" -f prisma/migrations/20260515200000_children_leader_role/migration.sql
```

## What the migration does

1. Adds `CHILDREN_LEADER` to the `UserRole` enum.
2. Adds three columns (`primaryGuardianName`, `primaryGuardianPhone`, `primaryGuardianEmail`) to `Child` as nullable.
3. Backfills the new guardian columns from the existing `_ParentToChild` rows — for each child, the lowest-id linked parent's name, phone, and email are used. If no parent is linked, the child's emergency-contact name/phone is copied across as a fallback so the `NOT NULL` constraint can be enforced.
4. Enforces `NOT NULL` on `primaryGuardianName` and `primaryGuardianPhone`.
5. Drops the `_ParentToChild` join table.

Existing `PARENT` `User` rows are **not** touched. They can't log in anymore (the routes are gone), and `ChildCheckIn` history that points to them stays valid because of the `ON DELETE RESTRICT` FK.

## Creating the Children Leader user

1. Sign in as a Super Admin.
2. Go to `/dashboard/users` → **Create User**.
3. Fill name, email, optional phone, a one-time password (≥ 8 chars), and pick **Head of Children Department** from the position dropdown.
4. Click create. The new user receives a welcome email with their one-time password.
5. On first login, they are redirected to `/dashboard/settings` and walked through the 2FA + new-password flow before they can use the dashboard.

## Smoke test checklist

After the migration runs, click through each item to confirm the cut-over is clean:

- [ ] Sign in as the new Children Leader → land on `/dashboard/settings`, complete password change → land on `/dashboard`.
- [ ] Open `/dashboard/children` → Live attendance, All children, Analytics tabs all render.
- [ ] Click **Register a child** → submit form → child appears in the roster.
- [ ] On the roster row, click **Sign in** → child appears in the Live attendance tab; **Currently signed in** counter increments.
- [ ] Click **Sign out** (on either the live card or the roster row) → child disappears from Live attendance; status returns to "Not in".
- [ ] Edit the child → change a value → confirm it persists.
- [ ] Delete the child → confirmation modal appears → child is removed from the roster.
- [ ] Sign in as a Content Editor → visit `/dashboard/children` → redirected back to `/dashboard` (role gate working).
- [ ] Visit `/parents/login` → 404 (route removed).
- [ ] Visit `/youth/login` → still works (Google OAuth for Youth is untouched).

## Rollback

If something goes wrong:

```bash
# Mark the migration as rolled-back. You'll then need to manually restore
# the _ParentToChild table from a backup and drop the new columns + role.
npx prisma migrate resolve --rolled-back 20260515200000_children_leader_role
```

Because the SQL drops a table and adds an enum value (Postgres does not allow removing enum values once added), a full rollback requires restoring the relevant tables from a pre-migration dump. Take a backup before running `migrate deploy` on production.
