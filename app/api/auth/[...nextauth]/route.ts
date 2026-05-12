/**
 * NextAuth v4 catch-all route handler. Handles all OAuth flows
 * (sign-in, callback, sign-out, session) for parent users.
 *
 * v4 returns a single handler from NextAuth(authOptions); we re-export it
 * as both GET and POST so the App Router routes both verbs to it.
 */

import NextAuth from 'next-auth'
import { authOptions } from '@/lib/auth/parent-auth'

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
