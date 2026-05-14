import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionToken, getSessionUser } from '@/lib/auth/session'

export async function GET(request: NextRequest) {
  try {
    const token = await getSessionToken()
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await getSessionUser(token)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10) || 1)
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') ?? '25', 10) || 25))
    const search = searchParams.get('search')?.trim() ?? ''

    const where = {
      role: 'YOUTH' as const,
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' as const } },
              { email: { contains: search, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    }

    const [youth, total] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          createdAt: true,
          youthCheckIns: {
            select: { id: true, signedInAt: true, signedOutAt: true },
            orderBy: { signedInAt: 'desc' },
          },
        },
      }),
      prisma.user.count({ where }),
    ])

    return NextResponse.json({
      youth: youth.map((y) => ({
        id: y.id,
        name: y.name,
        email: y.email,
        image: y.image,
        createdAt: y.createdAt.toISOString(),
        checkIns: y.youthCheckIns.map((ci) => ({
          id: ci.id,
          signedInAt: ci.signedInAt.toISOString(),
          signedOutAt: ci.signedOutAt?.toISOString() ?? null,
        })),
      })),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    })
  } catch (error) {
    console.error('Error listing youth (admin):', {
      error: error instanceof Error ? error.message : 'Unknown error',
    })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
