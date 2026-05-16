import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { sendWelcomeEmail } from '@/lib/email/send-welcome-email'
import type { UserRole } from '@prisma/client'

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get('session_token')?.value

    if (!sessionToken) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const session = await prisma.session.findUnique({
      where: { token: sessionToken },
      include: { user: true },
    })

    if (!session || session.expiresAt < new Date()) {
      return NextResponse.json({ error: 'Session expired' }, { status: 401 })
    }

    if (session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Only super admins can create users' }, { status: 403 })
    }

    const { name, email, phoneNumber, password: oneTimePassword, position } = await request.json()

    if (!name || !email || !oneTimePassword || !position) {
      return NextResponse.json(
        { error: 'Name, email, password, and position are required' },
        { status: 400 }
      )
    }

    if (oneTimePassword.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      )
    }

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json(
        { error: 'A user with this email already exists' },
        { status: 409 }
      )
    }

    const passwordHash = await bcrypt.hash(oneTimePassword, 12)

    // Position → role mapping. We intentionally only elevate to YOUTH /
    // CHILDREN_LEADER for the dedicated department heads; everyone else
    // defaults to CONTENT_EDITOR. SUPER_ADMIN cannot be created here.
    let role: UserRole
    if (position === 'Head of Youth Department') {
      role = 'YOUTH'
    } else if (position === 'Head of Children Department') {
      role = 'CHILDREN_LEADER'
    } else {
      role = 'CONTENT_EDITOR'
    }

    const user = await prisma.user.create({
      data: {
        name,
        email,
        phoneNumber: phoneNumber || null,
        position,
        passwordHash,
        role,
        mustChangePassword: true,
        isActive: true,
      },
    })

    const emailResult = await sendWelcomeEmail(email, name, oneTimePassword, position)

    if (!emailResult.ok) {
      console.error('Welcome email failed:', emailResult.detail)
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        position: user.position,
        role: user.role,
      },
      emailSent: emailResult.ok,
    })
  } catch (error) {
    console.error('Create user error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
