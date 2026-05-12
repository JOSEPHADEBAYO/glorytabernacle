/**
 * NextAuth v4 configuration for parent users.
 *
 * - Google is the only sign-in provider — parents authenticate with their
 *   personal Google accounts. No passwords stored for parents.
 * - JWT session strategy. The adapter still creates User + Account rows
 *   (so we have a persistent parent identity to link children to), but
 *   sessions live in a signed cookie rather than a database table. This
 *   sidesteps the model-name collision with the existing legacy `Session`
 *   model used by the stubbed admin login.
 * - On every sign-in we promote OAuth-only users (no password) to PARENT
 *   in the awaited `callbacks.signIn`, ensuring the role is correct
 *   *before* the JWT is issued.
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

type ParentRole = 'SUPER_ADMIN' | 'CONTENT_EDITOR' | 'VIEWER' | 'PARENT'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      role: ParentRole
    } & DefaultSession['user']
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string
    role?: ParentRole
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
    signIn: '/parents/login',
  },
  callbacks: {
    /**
     * AWAITED. Runs after the adapter creates/finds the User row, BEFORE
     * the JWT is issued. We elevate OAuth-only users to PARENT here so
     * the role baked into the JWT is correct from the very first request.
     */
    async signIn({ user }) {
      if (!user.id) return true

      const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { role: true, passwordHash: true },
      })
      if (!dbUser) return true

      // OAuth-only user (no password) → ensure PARENT role.
      const isAdmin = Boolean(dbUser.passwordHash)
      if (!isAdmin && dbUser.role !== 'PARENT') {
        await prisma.user.update({
          where: { id: user.id },
          data: { role: 'PARENT' },
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
        token.role = (dbUser?.role as ParentRole | undefined) ?? 'PARENT'
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
        session.user.role = (token.role as ParentRole | undefined) ?? 'PARENT'
      }
      return session
    },

    /**
     * Keep all internal post-auth redirects on this app. If anywhere
     * outside our base URL is requested, fall back to /parents.
     */
    async redirect({ url, baseUrl }) {
      return url.startsWith(baseUrl) ? url : `${baseUrl}/parents`
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
