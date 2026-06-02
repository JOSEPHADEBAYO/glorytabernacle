# Railway cron set-up — hand-off

**Date:** 1 June 2026
**Why:** the project's scheduled jobs have moved from **Vercel Cron**
(`vercel.json`) to **Railway**. The Next.js app continues to be deployed on
Vercel; Railway is used purely as the scheduler, making authenticated HTTPS
calls to the same `/api/cron/*` endpoints on your production URL.

`vercel.json` now ships as an empty `{}` — there are no Vercel-scheduled
crons any more.

## What changed

| Cron | Previous Vercel schedule | New Railway schedule | Endpoint to hit |
| --- | --- | --- | --- |
| Event reminder emails | `*/5 * * * *` (every 5 min) | unchanged | `POST /api/cron/send-event-notifications` |
| Right-to-erasure weekly digest | `0 8 * * 1` (Mon 08:00 UTC) | unchanged | `POST /api/cron/erasure-reminders` |
| **Birthday digest** *(new)* | n/a | `0 6 * * *` (daily 06:00 UTC) | `POST /api/cron/birthday-digest` |
| ~~Mount Up daily reminder~~ | ~~`45 23 * * *`~~ | **REMOVED** — replaced by a manual push button | n/a |

The Mount Up daily email cron is gone; Super Admin now triggers a Web-Push
reminder from `/dashboard` instead (subscribers opt in from the public
homepage).

## What each cron route expects

Both remaining routes accept `GET` or `POST` and require a single header:

```
Authorization: Bearer <CRON_SECRET>
```

`CRON_SECRET` is the same value you've already set in your Vercel
environment. Copy it into Railway too. If the header is missing or wrong, the
route returns **401 Unauthorized**. If `CRON_SECRET` isn't set on the
server, the route returns **500** and refuses to run — so a forgotten env
var is loud, not silent.

Both routes return a JSON summary, e.g.
`{ "pending": 2, "overdue": 1, "recipients": 3, "sent": 3, "failed": 0 }`.

## Step-by-step: set this up on Railway

1. **Create a new Railway project** (or open the existing one if the app is
   already there). The "Cron" service type is what you want — *not* a
   service that runs the app, just a scheduled HTTP call.

2. **Set the environment variables** on the Railway project:

   ```
   APP_URL=https://www.glorytabernacle.co.uk    # IMPORTANT: use whichever variant doesn't redirect
   CRON_SECRET=<paste the same secret from Vercel>
   ```

   > **⚠ The `www.` matters.** Vercel sets up a 307 redirect between bare
   > `glorytabernacle.co.uk` and `www.glorytabernacle.co.uk`. Most HTTP clients
   > strip the `Authorization` header when following a cross-host redirect
   > (and some don't follow redirects on POST at all). Result: using the
   > "wrong" hostname here gives a silent `401` on every run. Always point
   > Railway at the host that responds `200` directly, not the one that
   > redirects.
   >
   > Quick check from any terminal:
   >
   > ```bash
   > curl -i -X POST \
   >   -H "Authorization: Bearer $CRON_SECRET" \
   >   "$APP_URL/api/cron/send-event-notifications"
   > ```
   >
   > `200 OK` → that's the URL to use. `307 Temporary Redirect` → switch
   > to the URL shown in the `Location:` header.

3. **Add two cron jobs**, each running its own one-line command.

   ### Cron #1 — Event reminders (every 5 minutes)

   - **Schedule (cron expression):** `*/5 * * * *`
   - **Command:**
     ```bash
     curl -fsS -X POST \
       -H "Authorization: Bearer $CRON_SECRET" \
       "$APP_URL/api/cron/send-event-notifications"
     ```

   ### Cron #2 — Erasure-request weekly digest (Mondays 08:00 UTC)

   - **Schedule (cron expression):** `0 8 * * 1`
   - **Command:**
     ```bash
     curl -fsS -X POST \
       -H "Authorization: Bearer $CRON_SECRET" \
       "$APP_URL/api/cron/erasure-reminders"
     ```

   ### Cron #3 — Member birthday digest (daily 06:00 UTC)

   Emails the admin team a digest of every `GroupMember` whose
   `birthDay`/`birthMonth` matches today. Silently no-ops on days with no
   birthdays — the admin only ever receives the email when there's
   actually someone to greet.

   Recipient resolution: `ADMIN_NOTIFICATION_EMAIL` env var takes precedence;
   otherwise every active `SUPER_ADMIN` gets a copy.

   - **Schedule (cron expression):** `0 6 * * *`
   - **Command:**
     ```bash
     curl -fsS -X POST \
       -H "Authorization: Bearer $CRON_SECRET" \
       "$APP_URL/api/cron/birthday-digest"
     ```

   The `-fsS` flags make `curl` fail-fast on HTTP errors so Railway logs an
   obvious failure if the endpoint returns 4xx/5xx (silent failures are the
   worst kind of cron bug).

4. **Save and let Railway dispatch.** You can hit "Run now" once on each
   cron to confirm the connection works before waiting for the schedule.

## Test it manually

You can test either endpoint from any machine that has curl + the secret:

```bash
curl -i -X POST \
  -H "Authorization: Bearer $CRON_SECRET" \
  https://www.glorytabernacle.co.uk/api/cron/send-event-notifications

curl -i -X POST \
  -H "Authorization: Bearer $CRON_SECRET" \
  https://www.glorytabernacle.co.uk/api/cron/erasure-reminders

curl -i -X POST \
  -H "Authorization: Bearer $CRON_SECRET" \
  https://www.glorytabernacle.co.uk/api/cron/birthday-digest
```

Expected: `200 OK` with a small JSON summary. `401 Unauthorized` means the
header is missing/wrong; `500` means `CRON_SECRET` isn't set server-side.

## Rolling back to Vercel (if needed)

If you ever want to revert to Vercel-scheduled crons, put the originals back
in `vercel.json`:

```json
{
  "crons": [
    { "path": "/api/cron/send-event-notifications", "schedule": "*/5 * * * *" },
    { "path": "/api/cron/erasure-reminders",        "schedule": "0 8 * * 1" }
  ]
}
```

Disable the Railway crons before doing this so the same job doesn't fire
twice.

## Notes

- The cron *routes* themselves did not change. They still accept GET or POST
  and still authenticate via `Authorization: Bearer ${CRON_SECRET}` — only
  the scheduler invoking them changed.
- The Mount Up route (`app/api/cron/send-mount-up-reminder/route.ts`) has
  been deleted. The Mount Up email helper (`lib/email/send-mount-up-reminder.ts`)
  has also been deleted. Subscribers from the previous cron are still in
  `MembershipApplication` / `AdultAttendance` — they just don't receive Mount
  Up email pings any more. The new flow is opt-in push only.
- Update `GO_LIVE_CHECKLIST.md` once you've configured Railway so the section
  on cron jobs reflects the Railway URLs rather than `vercel.json` paths.
