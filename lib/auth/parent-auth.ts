/**
 * NextAuth v4 configuration — formerly shared by parents + youth, now used
 * by the YOUTH portal only. The parent self-service flow was retired on
 * 15 May 2026; children check-in is now staff-managed from /dashboard/children.
 *
 * - Google is the only sign-in provider.
 * - JWT session strategy. The adapter still creates User + Account rows
 *   (so we have a persistent youth identity), but sessions live in a signed
 *   cookie rather than a database table.
 * - On every sign-in, brand-new OAuth users (no role yet, defaults to
 *   VIEWER) are promoted to YOUTH. Existing YOUTH or PARENT (legacy) roles
 *   are left untouched. Admin / staff users (have passwordHash) are never
 *   touched.
 *
 * Required env vars:
 *   - GOOGLE_CLIENT_ID
 *   - GOOGLE_CLIENT_SECRET
 *   - NEXTAUTH_SECRET   (generate with: openssl rand -base64 32)
 *   - NEXTAUTH_URL      e.g. http://localhost:3000  (or production URL)
 */

import type { NextAuthOptions, DefaultSession } from 'next-auth'
import { getServerSession } from 'next-auth/next'
import GoogleProvider from 'next-auth/providers/google'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { prisma } from '@/lib/prisma'

type AppRole =
  | 'SUPER_ADMIN'
  | 'CONTENT_EDITOR'
  | 'CHILDREN_LEADER'
  | 'VIEWER'
  | 'PARENT' // legacy — no longer assigned
  | 'YOUTH'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      role: AppRole
    } & DefaultSession['user']
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string
    role?: AppRole
  }
}

export const authOptions: NextAuthOptions = {
  // Cast through unknown because v4's adapter type signature is slightly
  // different from @auth/prisma-adapter's; the runtime contract matches.
  adapter: PrismaAdapter(prisma) as unknown as NextAuthOptions['adapter'],
  // JWT strategy avoids the legacy `Session` model collision. The adapter
  // is still used for User + Account rows.
  session: { strategy: 'jwt' },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
      authorization: { params: { prompt: 'select_account' } },
    }),
  ],
  pages: {
    signIn: '/youth/login',
  },
  callbacks: {
    /**
     * AWAITED. Runs after the adapter creates/finds the User row, BEFORE
     * the JWT is issued.
     *
     * Rules:
     * - Admin / staff users (have passwordHash) → role never touched
     * - New OAuth users (defaults to VIEWER) → set to YOUTH
     * - Existing YOUTH users → role preserved
     * - Existing PARENT users (legacy) → role preserved for audit, but
     *   they can no longer access /parents because those routes are gone.
     */
    async signIn({ user }) {
      if (!user.id) return true

      const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { role: true, passwordHash: true },
      })
      if (!dbUser) return true

      const isStaff = Boolean(dbUser.passwordHash)
      if (isStaff) return true

      // Brand-new OAuth users default to VIEWER from the adapter; promote
      // them to YOUTH for the youth portal.
      if (dbUser.role === 'VIEWER') {
        await prisma.user.update({
          where: { id: user.id },
          data: { role: 'YOUTH' },
        })
      }

      return true
    },

    /**
     * Builds the JWT payload. `user` is only populated on the very first
     * call (right after sign-in). On subsequent requests, only `token` is
     * present, so we read previously-stamped fields from there.
     */
    async jwt({ token, user }) {
      if (user) {
        // Re-read role from DB so we capture the value the signIn callback
        // just elevated to (the `user` object passed in might be stale).
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: { role: true },
        })
        token.id = user.id
        token.role = (dbUser?.role as AppRole | undefined) ?? 'YOUTH'
      }
      return token
    },

    /**
     * Surfaces the JWT payload onto the session object that server
     * components and API routes consume.
     */
    async session({ session, token }) {
      if (session.user) {
        session.user.id = (token.id as string) ?? ''
        session.user.role = (token.role as AppRole | undefined) ?? 'YOUTH'
      }
      return session
    },

    /**
     * Keep all internal post-auth redirects on this app.
     * Respects the callbackUrl so /youth/callback works correctly.
     */
    async redirect({ url, baseUrl }) {
      if (url.startsWith(baseUrl)) return url
      if (url.startsWith('/')) return `${baseUrl}${url}`
      return `${baseUrl}/youth`
    },
  },
}

/**
 * Server-side session getter — thin wrapper around `getServerSession` so
 * call sites don't have to repeat `getServerSession(authOptions)`.
 */
export function auth() {
  return getServerSession(authOptions)
}
