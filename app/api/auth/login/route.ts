import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

const ADMIN_EMAIL = 'oluwasegunadeolu12@gmail.com'
const ADMIN_NAME = 'David Oluwasegun'
const ADMIN_PASSWORD = 'David2026@@'
const SALT_ROUNDS = 12

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    let user = await prisma.user.findUnique({ where: { email } })

    if (!user) {
      if (email !== ADMIN_EMAIL) {
        return NextResponse.json(
          { error: 'Invalid email or password' },
          { status: 401 }
        )
      }
      const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, SALT_ROUNDS)
      user = await prisma.user.create({
        data: {
          email: ADMIN_EMAIL,
          name: ADMIN_NAME,
          passwordHash,
          role: 'SUPER_ADMIN',
          isActive: true,
          mustChangePassword: false,
        },
      })
    }

    if (!user.passwordHash) {
      if (email !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
        return NextResponse.json(
          { error: 'Invalid email or password' },
          { status: 401 }
        )
      }
      const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, SALT_ROUNDS)
      user = await prisma.user.update({
        where: { id: user.id },
        data: { passwordHash, mustChangePassword: false },
      })
    }

    const passwordValid = await bcrypt.compare(password, user.passwordHash!)
    if (!passwordValid) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    if (email === ADMIN_EMAIL && user.role !== 'SUPER_ADMIN') {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { role: 'SUPER_ADMIN' },
      })
    }

    const sessionToken = `session_${Date.now()}_${Math.random().toString(36).substring(2)}`
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
