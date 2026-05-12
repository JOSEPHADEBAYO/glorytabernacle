import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

// Super Admin credentials (for validation)
const SUPER_ADMIN = {
  email: 'adeolusegun1000@gmail.com',
  name: 'David Segun',
  role: 'SUPER_ADMIN',
}

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get('session_token')?.value

    if (!sessionToken) {
      return NextResponse.json(
        { error: 'No session found' },
        { status: 401 }
      )
    }

    // Validate session token format
    if (!sessionToken.startsWith('session_')) {
      return NextResponse.json(
        { error: 'Invalid session token' },
        { status: 401 }
      )
    }

    // In production, this would check database for session validity
    // For now, we return the user info if token exists
    return NextResponse.json({
      valid: true,
      user: {
        email: SUPER_ADMIN.email,
        name: SUPER_ADMIN.name,
        role: SUPER_ADMIN.role,
      },
    })
  } catch (error) {
    console.error('Session validation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
