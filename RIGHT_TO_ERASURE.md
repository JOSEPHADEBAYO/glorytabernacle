# Right to erasure (UK GDPR Article 17) — hand-off

**Date:** 18 May 2026

Parents/guardians can ask the church to erase their child's data. Requests
are submitted on a public form, land in a review queue, and a Children's
Leader / Super Admin actions them manually. **Nothing is deleted
automatically** — a human always reviews and confirms.

## The flow

1. A parent opens **`/parent/data-request`** and submits the child's name,
   their own name + email, and an optional message, ticking a box to confirm
   they're the parent/guardian.
2. The request lands in **Dashboard → Children → Data requests** as
   *Pending*. The system tries a best-effort match to a registered child
   (by guardian email + child name) and pre-selects it.
3. The leader **verifies the requester's identity** (e.g. replies to the
   email), picks the matching child from the dropdown, and clicks
   **"Erase data & complete"** — or **"Dismiss"** if it can't be verified /
   was withdrawn, or **"Complete (no record held)"** if we hold nothing.
4. Erasing permanently deletes the child's record, photo (from Cloudinary),
   authorised collectors + their photos, and the entire check-in history.

## What is kept

Safeguarding concerns are **not** deleted. The link to the child is cleared
(`childId` set to null) but the concern itself — including the free-text
details the DSL recorded — is retained, in line with statutory safeguarding
guidance. The erasure request itself is also retained (with the child link
nulled) as a record that erasure was carried out, and stamped with who
actioned it and when.

## Who can action requests

`SUPER_ADMIN` and `CHILDREN_LEADER` only (same as the rest of the
children's-ministry tooling). The public submission form needs no login.

## Required steps (one-time)

Run the migration and regenerate the Prisma client, then restart the server:

```bash
npx prisma migrate deploy
npx prisma generate
```

(In development you can use `npx prisma migrate dev` instead.)

## Files

- **Migration** `prisma/migrations/20260518090000_erasure_requests` — creates
  the `ErasureStatus` enum and `ErasureRequest` table, with FKs to `Child`
  (`childId`, ON DELETE SET NULL) and `User` (`handledById`, ON DELETE SET
  NULL).
- **`prisma/schema.prisma`** — `ErasureRequest` model + `ErasureStatus` enum;
  `Child.erasureRequests` and `User.erasureRequestsHandled` back-relations.
- **`lib/types/erasure.ts`** — `ERASURE_ADMIN_ROLES`, `canHandleErasure()`,
  status enum + labels.
- **`lib/validation/erasure.ts`** — Zod schemas for submit / handle / list.
- **`lib/children/erase-child.ts`** — `eraseChild(childId)`: the single
  erasure code path (purges Cloudinary photos, then deletes the row +
  cascade). Used by both the child `DELETE` route and the erasure flow.
- **`lib/cloudinary.ts`** — `deleteChildImage(publicId)` destroys an
  authenticated child/collector image (best-effort).
- **`app/api/parent/erasure-request/route.ts`** — public `POST` (records a
  PENDING request + best-effort child match).
- **`app/api/admin/erasure-requests/route.ts`** — admin `GET` list (status
  filter + pagination; attaches candidate children per request).
- **`app/api/admin/erasure-requests/[id]/route.ts`** — admin `PATCH`
  (link/relink a child, "erase & complete", dismiss, or reopen).
- **`app/parent/data-request/page.tsx`** + **`components/church/parent-data-request.tsx`**
  — the public form.
- **`components/dashboard/children-admin-panel.tsx`** — the new
  **Data requests** tab.
- **`app/privacy-notice/page.tsx`** — "Your rights" now links to the form.
- **`app/api/admin/children/[id]/route.ts`** — `DELETE` is now a *true*
  erasure (purges Cloudinary photos before deleting), via `eraseChild`.

## Important caveats

- **Identity verification is manual.** The public form can't prove who the
  requester is, so the leader must confirm identity (the box ticked on the
  form is recorded as the basis, not proof). Verify before erasing.
- **Erasure is irreversible.** Once "Erase data & complete" runs, the child's
  record, photos, collectors, and check-in history are gone.
- **No automated purge / retention timer.** Erasure only happens when a
  leader actions a request. (A scheduled retention sweep could be added
  later if you want one.)
- **One month to respond.** UK GDPR requires responding to an erasure request
  within one month — keep the queue cleared.

## Weekly reminder (so nothing misses the 1-month deadline)

A cron emails every active Children Leader + Super Admin a digest of the
pending queue once a week. It only sends when the queue isn't empty, and
flags any request older than **21 days** as *overdue* (UK GDPR requires a
response within one month, so this leaves ~a week of runway).

- **Cron route:** `app/api/cron/erasure-reminders/route.ts` — protected by
  `Authorization: Bearer ${CRON_SECRET}` (the same secret your other crons
  use). Accepts GET or POST.
- **Email:** `lib/email/send-erasure-digest.ts` — lists each pending request
  with its age, with a button to the dashboard.
- **Schedule:** `vercel.json` → `"0 8 * * 1"` (Mondays at 08:00 UTC). Change
  the cron expression there if you'd prefer a different day/time.
- **Threshold:** `OVERDUE_DAYS = 21` in the cron route — adjust if you want a
  tighter/looser overdue flag.

### Env vars it relies on (you likely already have these)

```
CRON_SECRET=<same secret your existing crons use>
RESEND_API_KEY=<your Resend key>
NOTIFICATION_FROM_EMAIL=RCCG Glory Tabernacle, Barnstaple <notifications@yourdomain>
# Optional — used for the dashboard link in the email; falls back to the
# production URL if unset:
SITE_URL=https://glorytabernacle.co.uk
```

### Test the reminder manually

```bash
curl -i -H "Authorization: Bearer $CRON_SECRET" \
  https://YOUR_DOMAIN/api/cron/erasure-reminders
```

It returns a JSON summary, e.g. `{ "pending": 2, "overdue": 1, "recipients": 3, "sent": 3, "failed": 0 }`.

## Smoke test

1. Run the migration + `prisma generate`, restart.
2. Register a test child (with a photo + a guardian email you control).
3. Go to **`/parent/data-request`**, submit using that same guardian email and
   the child's exact name, tick the confirmation box → "We've received your
   request".
4. As Super Admin / Children Leader, open **Dashboard → Children → Data
   requests**. The request should be *Pending* with the test child pre-selected
   in the dropdown.
5. Click **"Erase data & complete"** → confirm. The child should disappear
   from All Children, the Cloudinary photo should be gone, and the request
   should move to *Completed* (showing who handled it).
6. (Reminder) Hit the cron URL with the curl command above — with a pending
   request in the queue, the Children Leaders + Super Admins should receive
   the digest email.
