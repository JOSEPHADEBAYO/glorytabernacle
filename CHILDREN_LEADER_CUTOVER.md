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
| `GET` | `/api/admin/children/[id]` | Single child + check-in history (up to 500). |
| `PUT` | `/api/admin/children/[id]` | Partial update. |
| `DELETE` | `/api/admin/children/[id]` | Permanently remove a child (cascades check-ins). |
| `POST` | `/api/admin/children/[id]/check-in` | Sign a child in. Idempotent. |
| `POST` | `/api/admin/children/[id]/check-out` | Close the open check-in. Optional `{ performance }` body. |
| `PATCH` | `/api/admin/check-ins/[id]/performance` | Edit a performance note after the fact. |
| `POST` | `/api/admin/children/[id]/email-performance` | Email one child's performance report to the primary guardian. |
| `POST` | `/api/admin/children/email-performances` | Bulk-email reports for every child in a date range. |

All gated to `CHILDREN_LEADER` or `SUPER_ADMIN`.

### Authenticated (signed) child photos (17 May 2026 follow-up migration)

Children's and authorised-collectors' photos are no longer publicly viewable by URL. New uploads go to Cloudinary as `type: authenticated` assets; we store the `public_id` (`photoPublicId`) and generate a **signed delivery URL** on every read. Without the signature — which can't be computed without the Cloudinary API secret — the URL returns 401, so a leaked/shared link is useless. Everything else (gallery, events, books, tracts) stays publicly deliverable; only the `children/*` folders are locked down (driven by `isProtectedFolder()` in `lib/cloudinary.ts`).

Flow: the upload endpoints return `{ url: <signed>, publicId }`; the form persists the `publicId`; create/update/parent-register store `photoPublicId` (and null the raw `photoUrl`); the read endpoints (`/api/admin/children`, `/api/admin/children/[id]`, `/api/admin/check-ins`) call `resolvePhotoUrl()` to swap in a freshly-signed URL. The signature is deterministic, so it's cache-friendly and won't thrash `<next/image>`.

Schema: `Child.photoPublicId`, `AuthorisedCollector.photoPublicId`. Migration: `prisma/migrations/20260517140000_child_photo_authenticated/migration.sql`.

**Notes:** (1) Photos uploaded *before* this change remain public (`type: upload`); re-upload to secure them. (2) Signed URLs don't expire by default — for time-limited links, enable Cloudinary token-based auth and switch `signedChildImageUrl()` to use `auth_token`. (3) Requires the standard `CLOUDINARY_API_SECRET` env var (already set for uploads).

### Safeguarding concern log + DSL role (17 May 2026 follow-up migration)

A confidential safeguarding concern log with a strict need-to-know access model:

- **Raise** a concern: any CHILDREN_LEADER or SUPER_ADMIN. A prominent red "Raise safeguarding concern" button sits at the top of `/dashboard/children` and opens a modal (who it's about — a registered child or "someone else/general" — type, when, what happened, action taken, who notified, MASH-referral flag). The form reminds the user to call 999 first if a child is in immediate danger.
- **View / manage** the log: SUPER_ADMIN, or any user flagged as a **Designated Safeguarding Lead (DSL)**. A new `/dashboard/safeguarding` page (gated server-side and in the API) lists concerns, filters by status (Open / Monitoring / Closed), and lets the DSL record resolution notes, toggle the MASH-referral flag, and change status. Closing stamps who closed it and when.
- The **DSL flag** is a boolean on the user account, toggled by a SUPER_ADMIN from `/dashboard/users` (new "Safeguarding Lead" column). It's orthogonal to role — a CHILDREN_LEADER can also be the DSL. The Safeguarding sidebar item only appears for DSL + Super Admin.

Concerns can optionally link to a registered child; the child's name is snapshotted so the record survives deletion and supports standalone concerns. Concern types: disclosure, physical, emotional, sexual, neglect, behavioural, online, allegation-against-an-adult, other.

Schema: `User.isDesignatedSafeguardingLead`; new `SafeguardingConcern` model + `ConcernType` / `ConcernStatus` enums. Migration: `prisma/migrations/20260517090000_safeguarding_concerns/migration.sql`.

Endpoints (all under `/api/admin/safeguarding-concerns`): `POST` raise (leader+admin), `GET` list + `GET [id]` + `PATCH [id]` (DSL+admin). Plus `PATCH /api/users/[id]/dsl` (super-admin only) to set the DSL flag.

### GDPR consent capture (16 May 2026 follow-up migration)

The registration form (admin modal + public `/parent/register`) now captures UK GDPR consent before a child can be saved. Four consent boxes — three mandatory (processing personal data, sharing medical/allergy info with leaders, emergency first aid / 999), one optional (photography & use of images) — plus a "consent given by" name field that auto-fills from the primary guardian. The Zod schema rejects a submission that doesn't carry the three mandatory consents.

On save we store the four flags plus `consentCapturedAt` (timestamp) and `consentByName` (text snapshot of who agreed). Editing a child re-stamps `consentCapturedAt` if any consent field changes. The All Children details and Pending tab show the consent status as green/grey badges with the name + date.

A public **`/privacy-notice`** page covers the UK GDPR Article 13/14 transparency requirements (who we are, what we collect, lawful basis, special-category consent, sharing, retention, data-subject rights, ICO complaints). It is linked from the consent section of the form. **The privacy notice is a template and should be reviewed by the church's data-protection lead or a solicitor before go-live.**

Schema: `Child` gains `consentDataProcessing`, `consentPhotography`, `consentMedicalInfoSharing`, `consentEmergencyTreatment`, `consentCapturedAt`, `consentByName`. Migration: `prisma/migrations/20260516220000_child_consent/migration.sql`.

### Authorised collectors (16 May 2026 follow-up migration)

Each child can have up to five named **authorised collectors** in addition to the primary guardian (who is implicitly authorised). The collectors fieldset is part of the shared ChildForm — name, relationship, optional phone, optional photo (Cloudinary upload), and optional notes — so it's available on both the admin modal and the public `/parent/register` page.

At sign-out, the SignOutModal now prompts the leader to pick who is collecting: the primary guardian, one of the named collectors, or an off-list "Someone else" override that requires a name, relationship, and a short reason. The chosen name + relationship is snapshotted onto the `ChildCheckIn` row (`collectedByName`, `collectedByRelationship`, `collectedFromList`, `collectionNotes`) so the audit trail survives later edits to the collectors list. Off-list pickups can be filtered server-side later by querying `collectedFromList=false` for DSL review.

Schema:
- new `AuthorisedCollector` model (FK to Child, cascade delete)
- `ChildCheckIn` gains `collectedByName`, `collectedByRelationship`, `collectedFromList`, `collectionNotes`

Migration: `prisma/migrations/20260516180000_authorised_collectors/migration.sql`.

The check-out endpoint validates that the collector details are present and that off-list collectors carry a reason; it returns 400 if either rule is broken.

### Pickup code + parent-submission approval (16 May 2026 follow-up migration)

Two safeguarding additions that close the most important gaps before go-live:

**Pickup code at sign-out.** Each check-in now generates a 6-digit numeric code that is stored on the `ChildCheckIn` row and emailed to the primary guardian. The sign-out modal requires that code before the Children Leader can close the check-in. A "Resend code" button is available on each live-attendance card and inside the sign-out modal in case the guardian can't find the email. New endpoints:

| Method | Path | Purpose |
| --- | --- | --- |
| `POST` | `/api/admin/children/[id]/resend-pickup-code` | Re-email the existing code on the open check-in. |

The check-in response now includes `emailSent` and `emailError` so the UI can flag failures immediately. Check-out now requires `{ code }` in the body and returns `422` if the code is wrong, `422` if no code is stored on the check-in (legacy rows or pre-rollout), and `409` if there's no open check-in.

**Approval gate for parent submissions.** The `Child` model has a new `approved` boolean (default `true` so every existing row stays visible). Submissions via `/parent/register` set `approved=false`. A new **Pending** tab in `/dashboard/children` lists pending submissions with full details and Approve / Reject actions. Children that are not yet approved cannot be signed in — the check-in endpoint returns `409` with a clear message.

| Method | Path | Purpose |
| --- | --- | --- |
| `POST` | `/api/admin/children/[id]/approve` | Flip `approved=true`. Idempotent. |

The admin list endpoint accepts `?status=pending` (only pending) or `?status=all` (everything); the default is approved-only.

Migration SQL: `prisma/migrations/20260516120000_pickup_code_and_approval/migration.sql`.

### Performance tracking (15 May 2026 follow-up migration)

`ChildCheckIn` gained two columns: `performance` (text, nullable) and `performanceUpdatedAt`. Hand-authored migration lives at `prisma/migrations/20260515220000_child_performance/migration.sql`.

The dashboard `/dashboard/children` now has a fourth tab — **Performance** — listing every child with a timeline of their check-ins and the teacher's notes. Notes can be edited inline. Each card has a "Send report" button (emails the primary guardian via the standard enterprise template), and there's a top-of-page "Email all guardians" button with a date-range selector (defaults to the current calendar month).

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
