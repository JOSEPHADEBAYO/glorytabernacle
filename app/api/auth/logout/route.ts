import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'

export async function POST() {
  const cookieStore = await cookies()
  const token = cookieStore.get('session_token')?.value

  if (token) {
    try {
      await prisma.session.deleteMany({ where: { token } })
    } catch {
      // ignore cleanup errors
    }
  }

  cookieStore.delete('session_token')

  return NextResponse.json({ success: true })
}
