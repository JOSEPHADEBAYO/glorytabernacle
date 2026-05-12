import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST() {
  // Delete session cookie
  const cookieStore = await cookies()
  cookieStore.delete('session_token')

  return NextResponse.json({ success: true })
}
