import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionToken, getSessionUser } from '@/lib/auth/session'
import {
  CHILDREN_ADMIN_ROLES,
  type ChildrenAdminRole,
} from '@/lib/types/child'
import { sendChildPerformanceReport } from '@/lib/email/send-child-performance-report'

function isAdmin(role: string | undefined): role is ChildrenAdminRole {
  return CHILDREN_ADMIN_ROLES.includes(role as ChildrenAdminRole)
}

interface RouteContext {
  params: Promise<{ id: string }>
}

/**
 * Parse an optional ISO date string from the body. Defaults are computed
 * by the caller — this just turns "2026-05-01" into a Date or returns null
 * for an invalid value.
 */
function parseDate(value: unknown): Date | null {
  if (typeof value !== 'string' || value.trim() === '') return null
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? null : d
}

/**
 * Bump a "YYYY-MM-DD" Date (which `new Date(str)` parses as midnight UTC)
 * to the END of that UTC day (23:59:59.999Z) so the boundary `lte: toDate`
 * filter actually includes check-ins recorded later in the day.
 *
 * Without this, asking for "May 1 → May 16" excluded everything checked
 * in on May 16 because the parsed toDate was May 16 00:00:00 UTC.
 */
function toEndOfDay(date: Date): Date {
  return new Date(date.getTime() + 24 * 60 * 60 * 1000 - 1)
}

/**
 * Start-of-current-month at 00:00 in local time.
 */
function startOfThisMonth(): Date {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0)
}

/**
 * POST /api/admin/children/[id]/email-performance
 *
 * Emails one child's performance history to their primary guardian.
 * Body (all optional):
 *   - fromDate (ISO date string) — defaults to start of current month
 *   - toDate   (ISO date string) — defaults to now
 *
 * Returns 422 when the child has no primary-guardian email on file.
 * Restricted to CHILDREN_LEADER + SUPER_ADMIN.
 */
export async function POST(request: NextRequest, { params }: RouteContext) {
  try {
    const token = await getSessionToken()
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await getSessionUser(token)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    if (!isAdmin(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params

    const body = await request.json().catch(() => ({}))
    const fromDate = parseDate(body?.fromDate) ?? startOfThisMonth()
    const parsedTo = parseDate(body?.toDate)
    // If a date-only string was supplied, treat it as the END of that day
    // (inclusive). Default falls back to "now" which is already a precise
    // moment and shouldn't be widened.
    const toDate = parsedTo ? toEndOfDay(parsedTo) : new Date()
    if (fromDate > toDate) {
      return NextResponse.json(
        { error: 'fromDate must be on or before toDate' },
        { status: 400 }
      )
    }

    const child = await prisma.child.findUnique({
      where: { id },
      include: {
        checkIns: {
          where: { signedInAt: { gte: fromDate, lte: toDate } },
          orderBy: { signedInAt: 'asc' },
          select: { signedInAt: true, signedOutAt: true, performance: true },
        },
      },
    })

    if (!child) {
      return NextResponse.json({ error: 'Child not found' }, { status: 404 })
    }

    if (!child.primaryGuardianEmail) {
      return NextResponse.json(
        {
          error:
            'No primary-guardian email on file for this child. Edit the child to add one.',
        },
        { status: 422 }
      )
    }

    const result = await sendChildPerformanceReport(
      {
        childFirstName: child.firstName,
        childLastName: child.lastName,
        guardianName: child.primaryGuardianName,
        guardianEmail: child.primaryGuardianEmail,
        checkIns: child.checkIns,
      },
      { fromDate, toDate }
    )

    if (!result.ok) {
      return NextResponse.json({ error: result.reason }, { status: 502 })
    }

    return NextResponse.json({ success: true, sent: 1 }, { status: 200 })
  } catch (error) {
    console.error('Error emailing performance report:', {
      error: error instanceof Error ? error.message : 'Unknown',
      timestamp: new Date().toISOString(),
    })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
