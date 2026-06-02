# Go-Live Checklist — RCCG Glory Tabernacle, Barnstaple

**Compiled:** 21 May 2026
**Stack:** Next.js 16 · React 19 · Prisma 7 (PostgreSQL) · NextAuth v4 (youth Google sign-in) · Resend · Cloudinary · web-push

This is the single, ordered checklist for taking the site live. It consolidates the three feature hand-off docs (`CHILDREN_LEADER_CUTOVER.md`, `YOUTH_PUSH_NOTIFICATIONS.md`, `RIGHT_TO_ERASURE.md`) plus an audit of every environment variable the code actually reads. Work top to bottom.

---

## 0. Before you start

- [ ] **Take a full database backup.** Several migrations add Postgres enum values and drop tables (e.g. `_ParentToChild`). Enum values cannot be removed once added, so a rollback needs a restore from a dump.
- [ ] Confirm you are deploying the intended branch / commit.
- [ ] Confirm `.env` and `.env.local` are **gitignored** and that no secrets are committed.

---

## 1. Install & build

```bash
npm install        # resolves cleanly on next-auth v4; web-push is already a dependency
npm run build      # runs `prisma generate` then `next build`
```

- [ ] `npm install` completes without peer-dependency errors (the project pins `next-auth@^4.24.14`).
- [ ] `npm run build` succeeds (this also regenerates the Prisma client; `postinstall` does too).
- [ ] *(Optional)* `npm test` — the Vitest suite passes.

---

## 2. Database migrations

```bash
npx prisma migrate deploy   # apply all pending migrations
npx prisma generate         # regenerate the typed client (also run by build)
```

- [ ] `prisma migrate deploy` reports all 32 migrations applied; the latest is `20260518090000_erasure_requests`.
- [ ] Restart the server after generating the client (`npm run start`).

Key migrations to be aware of (irreversible / data-touching):

- `20260515200000_children_leader_role` — adds `CHILDREN_LEADER`, backfills guardian columns, **drops `_ParentToChild`**.
- `20260517160000_add_youth_leader_role` + `..160100_migrate_youth_leaders` — adds `YOUTH_LEADER`, re-labels mis-tagged leaders.
- `20260517170000_push_subscriptions`, `20260516120000_pickup_code_and_approval`, `20260516180000_authorised_collectors`, `20260516220000_child_consent`, `20260517090000_safeguarding_concerns`, `20260517140000_child_photo_authenticated`, `20260518090000_erasure_requests`.

---

## 3. Environment variables

Set these in your hosting provider (Vercel project settings) **and** locally in `.env.local`.

### Required — the app will not work correctly without these

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection string. |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name (image/PDF uploads). |
| `CLOUDINARY_API_KEY` | Cloudinary uploads. |
| `CLOUDINARY_API_SECRET` | Cloudinary uploads **and** signing of authenticated children's photos. |
| `RESEND_API_KEY` | All transactional email. |
| `NOTIFICATION_FROM_EMAIL` | "From" address — **must be on a verified Resend domain** in production (e.g. `RCCG Glory Tabernacle, Barnstaple <notifications@glorytabernacle.co.uk>`). |
| `CRON_SECRET` | Bearer token protecting the cron routes. Used now by Railway scheduler (see `RAILWAY_CRON_SETUP.md`). |
| `GOOGLE_CLIENT_ID` | Youth portal Google sign-in. |
| `GOOGLE_CLIENT_SECRET` | Youth portal Google sign-in. |
| `NEXTAUTH_SECRET` | **Signs NextAuth JWTs. Read internally by NextAuth, so it never appears in app code — easy to forget.** Generate with `openssl rand -base64 32`. |
| `NEXTAUTH_URL` | NextAuth base/callback URL (your production URL). |
| `VAPID_PUBLIC_KEY` | Youth web-push (server). |
| `VAPID_PRIVATE_KEY` | Youth web-push (server). |
| `VAPID_SUBJECT` | Contact URI for push — a `mailto:` address or `https://` URL (e.g. `mailto:admin@glorytabernacle.co.uk`). **Not** notification text. |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Youth web-push (browser). **Must be identical to `VAPID_PUBLIC_KEY`.** |

### Recommended — features degrade or links break if unset

| Variable | If unset… |
| --- | --- |
| `SITE_URL` | Email dashboard/reminder links fall back to hardcoded domains. Set to your production URL. |
| `NEXT_PUBLIC_SITE_URL` | Fallback base URL for erasure-digest / broadcast emails. |
| `NEXT_PUBLIC_APP_URL` | **Welcome-email login link falls back to `http://localhost:3000`** — new staff would get a localhost link. Set to your production URL. |
| `ADMIN_NOTIFICATION_EMAIL` | Group-join notifications have no admin recipient. |
| `EMAIL_LOGO_URL` | Broadcast emails use the default logo URL. |

- [ ] All **required** variables set in the hosting environment.
- [ ] All **recommended** variables set (see audit note below about the base-URL variables — set them all to the same value).

---

## 4. Third-party service setup

- [ ] **PostgreSQL** database provisioned; `DATABASE_URL` points at it.
- [ ] **Cloudinary** account configured; the API secret is set (required to deliver signed children's photos — without it those images 401).
- [ ] **Resend**: sending domain verified; `NOTIFICATION_FROM_EMAIL` uses that domain.
- [ ] **Google OAuth** (youth login): in the Google Cloud console, add the authorised redirect URI `https://<your-domain>/api/auth/callback/google` (and the `http://localhost:3000/...` equivalent for dev).
- [ ] **VAPID keys** generated once with `npx web-push generate-vapid-keys` and the public key copied into **both** VAPID public-key variables.

---

## 5. Cron jobs (Railway)

Scheduling has moved from Vercel Cron to **Railway**. The Next.js app
itself stays on Vercel; Railway is the scheduler, making authenticated HTTPS
calls to the same `/api/cron/*` endpoints. `vercel.json` ships empty (`{}`).
See `RAILWAY_CRON_SETUP.md` for the exact Railway commands and schedules.

| Path | Schedule (UTC) | What it does |
| --- | --- | --- |
| `/api/cron/send-event-notifications` | `*/5 * * * *` (every 5 min) | Sends due event reminder emails. |
| `/api/cron/erasure-reminders` | `0 8 * * 1` (Mondays 08:00) | Weekly digest of the pending right-to-erasure queue; flags requests > 21 days as overdue. |

The previous Mount Up daily-email cron has been **removed**. Mount Up
reminders are now a manual Web-Push notification — Super Admin clicks "Send
reminder now" on `/dashboard`, push goes to every subscriber who opted in
from the public site.

- [ ] `CRON_SECRET` set in the Railway environment so the crons authorise.
- [ ] Railway crons configured per `RAILWAY_CRON_SETUP.md` and "Run now"
      executed once on each to confirm they reach the production URL.
- [ ] *(Optional)* Manually test the endpoints:

```bash
curl -i -X POST -H "Authorization: Bearer $CRON_SECRET" https://<your-domain>/api/cron/erasure-reminders
curl -i -X POST -H "Authorization: Bearer $CRON_SECRET" https://<your-domain>/api/cron/send-event-notifications
```

---

## 6. Create the first users

- [ ] A **Super Admin** account exists and can sign in at `/login`.
- [ ] Create the **Children Leader**: `/dashboard/users` → Create User → position **Head of Children Department** → role becomes `CHILDREN_LEADER`. They get a welcome email with a one-time password and are forced through the password-change flow on first login.
- [ ] Create the **Youth Leader**: position **Head of Youth Department** → role becomes `YOUTH_LEADER` (not `YOUTH`).
- [ ] Set the **Designated Safeguarding Lead (DSL)** flag on whoever owns safeguarding: `/dashboard/users` → "Safeguarding Lead" column. Only the DSL + Super Admin see `/dashboard/safeguarding`.

---

## 7. Pre-launch content & legal

- [ ] **Privacy notice** (`/privacy-notice`) reviewed by the church's data-protection lead or a solicitor — it ships as a template and must be signed off before go-live.
- [ ] Right-to-erasure flow understood: requests land in **Dashboard → Children → Data requests**; a human verifies identity before erasing; safeguarding concerns are retained even when a child is erased.
- [ ] `Acceptance Criteria.docx` reviewed/signed off with the client.

---

## 8. Smoke tests (run on the live environment)

**Core / staff**
- [ ] Super Admin signs in at `/login`.
- [ ] Children Leader: first login → forced password change → reaches `/dashboard`.
- [ ] `/dashboard/children` — Live attendance, All children, Analytics, Performance, Pending tabs all render.
- [ ] Register a child → appears in roster; **Sign in** → shows in Live attendance and increments the counter.
- [ ] Content Editor visiting `/dashboard/children` is redirected (role gate works).
- [ ] `/parents/login` returns 404 (legacy route removed).

**Children safeguarding**
- [ ] On **Sign in**, the primary guardian receives the 6-digit pickup code email; **Sign out** requires that code; "Resend code" works.
- [ ] Sign-out collector picker records who collected (guardian / named collector / off-list with reason).
- [ ] Public `/parent/register` submission lands in **Pending** and cannot be signed in until approved.
- [ ] Registration form blocks save unless the three mandatory consent boxes are ticked.
- [ ] Raise a safeguarding concern → visible only to DSL + Super Admin on `/dashboard/safeguarding`.
- [ ] A child photo URL without the signature returns 401 (authenticated delivery working).

**Youth + push**
- [ ] `/youth/login` Google sign-in works and lands on `/youth`.
- [ ] Youth taps **Turn on reminders**, accepts permission → "Reminders are on" (use Android/desktop, or iOS 16.4+ added to Home Screen).
- [ ] Youth checks in → leader clicks **Remind checked-in youth to sign out** in Dashboard → Youth Ministry → push received; tapping it opens `/youth`.

**Email**
- [ ] A test transactional email (e.g. welcome email or an event reminder) arrives with correct branding and **production** (non-localhost) links.

**Erasure cron**
- [ ] With a pending erasure request, hitting `/api/cron/erasure-reminders` emails the Children Leaders + Super Admins.

---

## 9. Post-launch / ongoing

- [ ] Keep the **erasure queue** clear — UK GDPR requires responding within **one month**; the weekly digest flags requests older than 21 days.
- [ ] Note: there is **no automated retention purge** — erasure happens only when a leader actions a request.
- [ ] Photos uploaded *before* the authenticated-photo migration remain public; re-upload to secure them if needed.

---

## Appendix — environment-variable audit findings

A scan of every `process.env.*` reference in the codebase. **Variable names are internally consistent — no typos or mismatches** (e.g. `CRON_SECRET`, `RESEND_API_KEY`, `NOTIFICATION_FROM_EMAIL` are spelled identically everywhere they're used). Two things are worth acting on:

1. **Base URL is read from several different variables, with different hardcoded fallbacks.** This is the most important fix — set them all to the same production URL to avoid wrong/localhost links in emails:
   - Welcome email login link → `NEXT_PUBLIC_APP_URL` (fallback `http://localhost:3000`).
   - ~~Mount Up email reminder~~ — removed; Mount Up is now a Web-Push notification, not an email, so this base-URL fallback no longer matters.
   - Erasure digest & broadcast emails → `SITE_URL` → `NEXT_PUBLIC_SITE_URL` → `NEXTAUTH_URL` (fallback `https://glorytabernacle.co.uk`).
   - **Recommendation:** set `SITE_URL`, `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_APP_URL`, and `NEXTAUTH_URL` all to `https://glorytabernacle.co.uk` (or whatever the final domain is).

2. **`NEXTAUTH_SECRET` is required but invisible to a code grep** — NextAuth reads it internally, so it's the easiest required variable to miss. Without it, youth sign-in / sessions break or are insecure in production.

Minor: `NEXT_PUBLIC_VAPID_PUBLIC_KEY` must equal `VAPID_PUBLIC_KEY`; `VAPID_SUBJECT` must be a `mailto:`/`https` URI; `NOTIFICATION_FROM_EMAIL` must be a verified Resend domain in production.
