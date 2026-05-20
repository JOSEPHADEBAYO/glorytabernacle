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

function parseDate(value: unknown): Date | null {
  if (typeof value !== 'string' || value.trim() === '') return null
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? null : d
}

/**
 * Bump a date-only Date (parsed as midnight UTC) to 23:59:59.999 of the
 * same UTC day so the `lte: toDate` filter actually includes records made
 * later that day. See per-child endpoint for full rationale.
 */
function toEndOfDay(date: Date): Date {
  return new Date(date.getTime() + 24 * 60 * 60 * 1000 - 1)
}

function startOfThisMonth(): Date {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0)
}

interface BulkResult {
  sent: number
  skipped: number
  failed: number
  results: Array<{
    childId: string
    childName: string
    status: 'sent' | 'skipped' | 'failed'
    reason?: string
  }>
}

/**
 * POST /api/admin/children/email-performances
 *
 * Bulk: emails every child's performance report to their primary guardian.
 *
 * Body (all optional):
 *   - fromDate (ISO date string) — defaults to start of current month
 *   - toDate   (ISO date string) — defaults to now
 *   - childIds (string[])        — limit to a specific subset, default all
 *
 * Skips (does not fail) children with no primary-guardian email or no
 * check-ins in the range. Returns a per-child summary.
 *
 * Restricted to CHILDREN_LEADER + SUPER_ADMIN.
 */
export async function POST(request: NextRequest) {
  try {
    const token = await getSessionToken()
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await getSessionUser(token)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    if (!isAdmin(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json().catch(() => ({}))
    const fromDate = parseDate(body?.fromDate) ?? startOfThisMonth()
    const parsedTo = parseDate(body?.toDate)
    const toDate = parsedTo ? toEndOfDay(parsedTo) : new Date()
    if (fromDate > toDate) {
      return NextResponse.json(
        { error: 'fromDate must be on or before toDate' },
        { status: 400 }
      )
    }

    const childIdsRaw = body?.childIds
    const childIds: string[] | undefined =
      Array.isArray(childIdsRaw) && childIdsRaw.every((x) => typeof x === 'string')
        ? childIdsRaw
        : undefined

    const children = await prisma.child.findMany({
      where: childIds ? { id: { in: childIds } } : {},
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
      include: {
        checkIns: {
          where: { signedInAt: { gte: fromDate, lte: toDate } },
          orderBy: { signedInAt: 'asc' },
          select: { signedInAt: true, signedOutAt: true, performance: true },
        },
      },
    })

    const summary: BulkResult = {
      sent: 0,
      skipped: 0,
      failed: 0,
      results: [],
    }

    // Send in a small concurrency window so we don't overwhelm Resend or
    // the database, but still finish quickly when there are many children.
    const CONCURRENCY = 5
    const queue = [...children]

    async function worker() {
      while (queue.length) {
        const child = queue.shift()
        if (!child) return
        const childName = `${child.firstName} ${child.lastName}`.trim()

        if (!child.primaryGuardianEmail) {
          summary.skipped++
          summary.results.push({
            childId: child.id,
            childName,
            status: 'skipped',
            reason: 'No primary-guardian email on file.',
          })
          continue
        }

        if (child.checkIns.length === 0) {
          summary.skipped++
          summary.results.push({
            childId: child.id,
            childName,
            status: 'skipped',
            reason: 'No check-ins recorded in the chosen date range.',
          })
          continue
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

        if (result.ok) {
          summary.sent++
          summary.results.push({ childId: child.id, childName, status: 'sent' })
        } else {
          summary.failed++
          summary.results.push({
            childId: child.id,
            childName,
            status: 'failed',
            reason: result.reason,
          })
        }
      }
    }

    await Promise.all(
      Array.from({ length: Math.min(CONCURRENCY, children.length || 1) }, () =>
        worker()
      )
    )

    return NextResponse.json(summary, { status: 200 })
  } catch (error) {
    console.error('Error bulk-emailing performance reports:', {
      error: error instanceof Error ? error.message : 'Unknown',
      timestamp: new Date().toISOString(),
    })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
