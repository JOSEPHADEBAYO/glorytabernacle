<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Auth system (admin dashboard)

- Admin auth uses **database-backed sessions**: `Session` model (token, userId, expiresAt), `TwoFactorCode` model (userId, code, expiresAt, used)
- Login at `/login` — `POST /api/auth/login` looks up/creates user in DB via Prisma, validates password with `bcryptjs`, creates session row, sets `session_token` cookie (7-day expiry)
- Session validated by `GET /api/auth/session` — queries DB `Session` table, auto-deletes expired sessions
- Logout at `POST /api/auth/logout` — deletes session from DB, clears cookie
- First login auto-creates the super admin user in DB with hashed password (`bcryptjs`, 12 rounds)

## Password change flow (dashboard/settings)

Multi-step flow on `/dashboard/settings`:
1. **Send code**: `POST /api/auth/send-code` — generates 6-digit code, stores in `TwoFactorCode` table (10-min expiry), emails via Resend
2. **Verify code**: `POST /api/auth/verify-code` — checks code matches and not expired, marks `used: true`
3. **Change password**: `POST /api/auth/change-password` — hashes new password, updates `User.passwordHash`, deletes ALL sessions for user, clears cookie
4. **Logout & re-login**: Client calls `POST /api/auth/logout`, redirects to `/login`
