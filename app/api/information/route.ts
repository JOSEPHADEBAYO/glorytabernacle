import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionToken, getSessionUser } from '@/lib/auth/session'
import {
  createInformationSchema,
  informationQuerySchema,
} from '@/lib/validation/information'
import {
  INFORMATION_ADMIN_ROLES,
  type InformationAdminRole,
} from '@/lib/types/information'

function isAdmin(role: string | undefined): role is InformationAdminRole {
  return INFORMATION_ADMIN_ROLES.includes(role as InformationAdminRole)
}

function nullIfEmpty(value: string | undefined): string | null {
  return value && value.trim().length > 0 ? value.trim() : null
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validation = createInformationSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validation.error.issues.map((issue) => issue.message),
        },
        { status: 400 }
      )
    }

    const token = await getSessionToken()
    const user = token ? await getSessionUser(token) : null
    const adminCanPublish = user && isAdmin(user.role)
    const data = validation.data

    const item = await prisma.informationItem.create({
      data: {
        title: data.title,
        description: data.description,
        linkUrl: data.linkUrl,
        category: data.category,
        submittedBy: nullIfEmpty(data.submittedBy),
        submitterEmail: nullIfEmpty(data.submitterEmail),
        published: adminCanPublish ? data.published ?? false : false,
        createdBy: user?.id ?? null,
      },
    })

    return NextResponse.json({ item }, { status: 201 })
  } catch (error) {
    console.error('Error creating information item:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const token = await getSessionToken()
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await getSessionUser(token)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    if (!isAdmin(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const validation = informationQuerySchema.safeParse({
      published: searchParams.get('published') ?? undefined,
      category: searchParams.get('category') ?? undefined,
    })

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validation.error.issues.map((issue) => issue.message),
        },
        { status: 400 }
      )
    }

    const where: { published?: boolean; category?: string } = {}
    if (validation.data.published !== undefined) {
      where.published = validation.data.published === 'true'
    }
    if (validation.data.category) {
      where.category = validation.data.category
    }

    const items = await prisma.informationItem.findMany({
      where,
      orderBy: [{ published: 'asc' }, { createdAt: 'desc' }],
    })

    return NextResponse.json({ items }, { status: 200 })
  } catch (error) {
    console.error('Error listing information items:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
