import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'

export interface SessionUser {
  id: string
  email: string
  name: string
  role: string
}

export async function getSessionToken(): Promise<string | null> {
  const cookieStore = await cookies()
  return cookieStore.get('session_token')?.value ?? null
}

export async function validateSession(): Promise<boolean> {
  const token = await getSessionToken()
  if (!token) return false
  try {
    const session = await prisma.session.findUnique({
      where: { token },
      select: { expiresAt: true },
    })
    return !!session && session.expiresAt > new Date()
  } catch {
    return false
  }
}

export async function getSessionUser(token: string): Promise<SessionUser | null> {
  if (!token) return null
  try {
    const session = await prisma.session.findUnique({
      where: { token },
      include: { user: true },
    })
    if (!session || session.expiresAt < new Date()) return null
    return {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      role: session.user.role,
    }
  } catch {
    return null
  }
}
