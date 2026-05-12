import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionToken, getSessionUser } from '@/lib/auth/session'
import {
  CHILDREN_ADMIN_ROLES,
  type ChildrenAdminRole,
} from '@/lib/types/child'

function isAdmin(role: string | undefined): role is ChildrenAdminRole {
  return CHILDREN_ADMIN_ROLES.includes(role as ChildrenAdminRole)
}

/**
 * GET /api/admin/check-ins/analytics
 *
 * Returns aggregated attendance numbers for the admin children dashboard:
 *
 *   {
 *     sundays:   [{ date: 'YYYY-MM-DD', count: number }]   // last 12 Sundays
 *     months:    [{ month: 'YYYY-MM',   count: number }]   // last 6 months
 *     totals: {
 *       totalChildren: number
 *       totalCheckIns: number
 *       avgPerSunday:  number
 *     }
 *   }
 *
 * "count" = distinct children signed in during that bucket, so a child
 * counted twice on the same Sunday only contributes once.
 */
export async function GET(_request: NextRequest) {
  try {
    const token = await getSessionToken()
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await getSessionUser(token)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    if (!isAdmin(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // ---- last 12 Sundays --------------------------------------------------
    // Build a list of the last 12 Sundays (oldest → newest) so the chart's
    // x-axis is consistent even when some Sundays had zero attendance.
    const sundays: Date[] = []
    const probe = new Date()
    probe.setHours(0, 0, 0, 0)
    // Walk back to the most recent Sunday
    while (probe.getDay() !== 0) probe.setDate(probe.getDate() - 1)
    for (let i = 0; i < 12; i++) {
      const d = new Date(probe)
      d.setDate(probe.getDate() - i * 7)
      sundays.unshift(d)
    }

    // For each Sunday, count distinct children signed in that day.
    const sundayCounts = await Promise.all(
      sundays.map(async (sunday) => {
        const next = new Date(sunday)
        next.setDate(next.getDate() + 1)
        const distinct = await prisma.childCheckIn.findMany({
          where: { signedInAt: { gte: sunday, lt: next } },
          distinct: ['childId'],
          select: { childId: true },
        })
        return {
          date: sunday.toISOString().slice(0, 10),
          count: distinct.length,
        }
      })
    )

    // ---- last 6 months ----------------------------------------------------
    const now = new Date()
    const months: Array<{ start: Date; end: Date; key: string }> = []
    for (let i = 5; i >= 0; i--) {
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1)
      const key = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}`
      months.push({ start, end, key })
    }

    const monthCounts = await Promise.all(
      months.map(async (m) => {
        const distinct = await prisma.childCheckIn.findMany({
          where: { signedInAt: { gte: m.start, lt: m.end } },
          distinct: ['childId'],
          select: { childId: true },
        })
        return { month: m.key, count: distinct.length }
      })
    )

    // ---- totals -----------------------------------------------------------
    const [totalChildren, totalCheckIns] = await Promise.all([
      prisma.child.count(),
      prisma.childCheckIn.count(),
    ])

    const sundayWithAttendance = sundayCounts.filter((s) => s.count > 0).length
    const sundayTotal = sundayCounts.reduce((acc, s) => acc + s.count, 0)
    const avgPerSunday =
      sundayWithAttendance === 0
        ? 0
        : Math.round((sundayTotal / sundayWithAttendance) * 10) / 10

    return NextResponse.json(
      {
        sundays: sundayCounts,
        months: monthCounts,
        totals: { totalChildren, totalCheckIns, avgPerSunday },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error computing children analytics:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
