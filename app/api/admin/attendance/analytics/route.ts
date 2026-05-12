import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionToken, getSessionUser } from '@/lib/auth/session'
import {
  ATTENDANCE_ADMIN_ROLES,
  ATTENDANCE_SERVICES,
  type AttendanceAdminRole,
} from '@/lib/types/attendance'

function isAdmin(role: string | undefined): role is AttendanceAdminRole {
  return ATTENDANCE_ADMIN_ROLES.includes(role as AttendanceAdminRole)
}

/**
 * GET /api/admin/attendance/analytics
 *
 * Returns aggregated counts the admin dashboard's Analytics tab consumes.
 *
 *   {
 *     weekly:        [{ weekStart: 'YYYY-MM-DD', count: number }]   // last 12 weeks (Sun-anchored)
 *     byService:     [{ service: string, count: number }]            // last 4 weeks
 *     returningSplit:{ newAttendees: number, returningAttendees: number } // distinct emails
 *     totals: {
 *       totalSubmissions: number
 *       distinctAttendees: number
 *       avgWeekly: number
 *     }
 *   }
 *
 * Counts represent rows submitted (not distinct attendees) unless noted.
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

    // ------- last 12 weeks (Sunday-anchored) -----------------------------
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Walk back to the most recent Sunday so weekStart is consistent.
    const mostRecentSunday = new Date(today)
    while (mostRecentSunday.getDay() !== 0) {
      mostRecentSunday.setDate(mostRecentSunday.getDate() - 1)
    }

    const weekStarts: Date[] = []
    for (let i = 11; i >= 0; i--) {
      const start = new Date(mostRecentSunday)
      start.setDate(mostRecentSunday.getDate() - i * 7)
      weekStarts.push(start)
    }

    const weekly = await Promise.all(
      weekStarts.map(async (weekStart) => {
        const weekEnd = new Date(weekStart)
        weekEnd.setDate(weekEnd.getDate() + 7)
        const count = await prisma.adultAttendance.count({
          where: { attendedAt: { gte: weekStart, lt: weekEnd } },
        })
        return {
          weekStart: weekStart.toISOString().slice(0, 10),
          count,
        }
      })
    )

    // ------- last 4 weeks: by service -----------------------------------
    const fourWeeksAgo = new Date(mostRecentSunday)
    fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 4 * 7)

    const byServiceCounts = await Promise.all(
      ATTENDANCE_SERVICES.map(async (svc) => {
        const count = await prisma.adultAttendance.count({
          where: {
            service: svc,
            attendedAt: { gte: fourWeeksAgo },
          },
        })
        return { service: svc, count }
      })
    )

    // ------- returning vs new: distinct emails ---------------------------
    // "Returning" = email appears more than once across all-time records.
    // We use raw groupBy + filter so this stays a single round trip.
    const grouped = await prisma.adultAttendance.groupBy({
      by: ['email'],
      _count: { email: true },
    })
    let newAttendees = 0
    let returningAttendees = 0
    for (const g of grouped) {
      if (g._count.email <= 1) newAttendees++
      else returningAttendees++
    }

    // ------- totals ------------------------------------------------------
    const totalSubmissions = weekly.reduce((acc, w) => acc + w.count, 0)
    const distinctAttendees = grouped.length
    // Average over weeks that had at least one submission, so quiet weeks
    // don't drag the average to zero.
    const activeWeeks = weekly.filter((w) => w.count > 0).length
    const avgWeekly =
      activeWeeks === 0
        ? 0
        : Math.round((totalSubmissions / activeWeeks) * 10) / 10

    return NextResponse.json(
      {
        weekly,
        byService: byServiceCounts,
        returningSplit: { newAttendees, returningAttendees },
        totals: {
          totalSubmissions: await prisma.adultAttendance.count(),
          distinctAttendees,
          avgWeekly,
        },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error computing attendance analytics:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
