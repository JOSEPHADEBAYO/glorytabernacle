import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/auth/login
 *
 * Standard email + password sign-in for staff users. No accounts are
 * auto-created here — users are provisioned either by a Super Admin via
 * /dashboard/users → Create User, or, for the very first Super Admin on a
 * fresh database, via scripts/create-super-admin.mjs.
 *
 * If the supplied email isn't in the User table, the response is a generic
 * 401 (we don't reveal whether the address exists). A constant-time-ish
 * bcrypt compare against a dummy hash runs on the "no user" path so the
 * response time doesn't leak account existence either.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body as {
      email?: unknown
      password?: unknown
    }

    if (typeof email !== 'string' || typeof password !== 'string') {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    const normalisedEmail = email.trim().toLowerCase()
    if (!normalisedEmail || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { email: normalisedEmail },
    })

    // Generic 401 for "no user", "no password set", and "wrong password"
    // alike — we don't want the response to leak which accounts exist.
    if (!user || !user.passwordHash) {
      // Constant-time-ish: still run a bcrypt compare against a dummy hash
      // so the response time for "no such user" matches the success path.
      await bcrypt.compare(
        password,
        '$2a$12$abcdefghijklmnopqrstuv0123456789ABCDEFGHIJKLMNOPQRSTUVWXY'
      )
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    if (!user.isActive) {
      return NextResponse.json(
        {
          error:
            'This account has been deactivated. Please contact your administrator.',
        },
        { status: 403 }
      )
    }

    const passwordValid = await bcrypt.compare(password, user.passwordHash)
    if (!passwordValid) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    const sessionToken = `session_${Date.now()}_${Math.random()
      .toString(36)
      .substring(2)}`
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

    await prisma.session.create({
      data: {
        userId: user.id,
        token: sessionToken,
        expiresAt,
      },
    })

    const cookieStore = await cookies()
    cookieStore.set('session_token', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    })

    return NextResponse.json({
      success: true,
      mustChangePassword: user.mustChangePassword,
      user: {
        email: user.email,
        name: user.name,
        role: user.role,
        position: user.position,
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