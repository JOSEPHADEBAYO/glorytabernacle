import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

// Super Admin credentials
const SUPER_ADMIN = {
  email: 'adeolusegun1000@gmail.com',
  password: 'David2026@@',
  name: 'David Segun',
  role: 'SUPER_ADMIN',
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Check credentials
    if (email !== SUPER_ADMIN.email || password !== SUPER_ADMIN.password) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Create session token
    const sessionToken = `session_${Date.now()}_${Math.random().toString(36).substring(2)}`

    // Set secure HTTP-only cookie
    const cookieStore = await cookies()
    cookieStore.set('session_token', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    })

    return NextResponse.json({
      success: true,
      user: {
        email: SUPER_ADMIN.email,
        name: SUPER_ADMIN.name,
        role: SUPER_ADMIN.role,
      },
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
