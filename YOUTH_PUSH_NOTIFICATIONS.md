# Youth push notifications + YOUTH_LEADER role — hand-off

**Date:** 17 May 2026

## 1. YOUTH_LEADER role fix

Creating a user with position **Head of Youth Department** now assigns the
`YOUTH_LEADER` role (staff who manage the youth ministry), **not** `YOUTH`.
`YOUTH` is reserved for actual youth *members* who sign in via Google OAuth on
the youth portal.

- New enum value `YOUTH_LEADER` (migration `20260517160000_add_youth_leader_role`).
- A follow-up migration (`20260517160100_migrate_youth_leaders`) moves any
  existing `YOUTH` user that has a `passwordHash` (i.e. a mis-labelled leader)
  to `YOUTH_LEADER`. Real youth members have no password, so they're untouched.

## 2. Youth push notifications

Super Admins and Youth Leaders can send a **"please sign out"** web-push
reminder to every youth currently checked in for a programme.

**Flow:**
1. A youth opens the youth portal (`/youth`) and taps **Turn on reminders** —
   this registers the service worker, asks for notification permission, and
   stores a push subscription.
2. After a programme, the leader opens **Dashboard → Youth Ministry** and clicks
   **Remind checked-in youth to sign out**.
3. Every youth who is still signed in *and* has reminders enabled gets a push
   notification; tapping it opens `/youth` to sign out.

### Required setup (one-time)

**a) Install the web-push package:**

```bash
npm install web-push
npm install -D @types/web-push   # optional, for types
```

**b) Generate VAPID keys:**

```bash
npx web-push generate-vapid-keys
```

**c) Add to your environment (.env / hosting env vars):**

```
VAPID_PUBLIC_KEY=<public key from step b>
VAPID_PRIVATE_KEY=<private key from step b>
VAPID_SUBJECT=mailto:admin@glorytabernacle.co.uk
NEXT_PUBLIC_VAPID_PUBLIC_KEY=<same as VAPID_PUBLIC_KEY>
```

`NEXT_PUBLIC_VAPID_PUBLIC_KEY` must equal `VAPID_PUBLIC_KEY` — the browser
needs it to subscribe, and the `NEXT_PUBLIC_` prefix exposes it to the client.

> ⚠️ **`VAPID_SUBJECT` is a contact URI, not the notification text.** It must
> be a `mailto:` address (e.g. `mailto:admin@glorytabernacle.co.uk`) or an
> `https://` URL — it's part of the VAPID spec so push services can contact
> you. It is **not** the notification title. (The reminder's title/body are
> set in code in `/api/admin/youth/notify-checkout`.) Setting it to anything
> else now safely falls back to the default `mailto:` and logs a warning
> instead of erroring.

**d) Run the migration + regenerate the client:**

```bash
npx prisma migrate deploy
npx prisma generate
```

Then restart the server.

### Files

- `prisma` — `PushSubscription` model + `User.pushSubscriptions`. Migration `20260517170000_push_subscriptions`.
- `lib/push.ts` — VAPID config, `sendPushToUsers()` (prunes dead 404/410 subs), `canNotifyYouth()` role check (`SUPER_ADMIN` + `YOUTH_LEADER`).
- `public/push-sw.js` — service worker (handles `push` + `notificationclick`).
- `components/youth/youth-push-opt-in.tsx` — youth-portal opt-in control, rendered on `/youth`.
- `app/api/youth/push/subscribe` + `/unsubscribe` — youth (NextAuth) subscription endpoints.
- `app/api/admin/youth/notify-checkout` — leader trigger (gated to `SUPER_ADMIN` + `YOUTH_LEADER`); pushes to distinct currently-checked-in youth.
- `components/dashboard/youth-attendance-panel.tsx` — "Remind checked-in youth to sign out" button with an inline result message.

### Important caveats

- **iPhone / iPad:** Apple only allows web push when the site is **added to the
  Home Screen** and opened from there (iOS 16.4+). The opt-in control detects
  unsupported browsers and tells the youth to add the site to their Home Screen
  first. Android Chrome and desktop browsers work directly.
- **HTTPS required:** push only works over HTTPS (or `localhost` in dev).
- The reminder reaches only youth who (a) are currently checked in and (b) have
  turned on reminders on the device they're carrying. The button's result
  message reports how many actually received it.
- Subscriptions that the push service reports as gone (404/410) are deleted
  automatically on the next send.

### Smoke test

1. Set the env vars and restart.
2. Sign in to the youth portal as a youth (Google), tap **Turn on reminders**,
   accept the permission prompt → "Reminders are on".
3. Check in (sign in) on the youth portal.
4. As Super Admin / Youth Leader, go to Dashboard → Youth Ministry and click
   **Remind checked-in youth to sign out** → you should receive the push, and
   the button should report "Reminder sent to 1 youth".
5. Tap the notification → it should open `/youth` so you can sign out.
