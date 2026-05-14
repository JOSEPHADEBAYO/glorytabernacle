import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionToken, getSessionUser } from '@/lib/auth/session'

/**
 * GET /api/admin/youth/check-ins/analytics
 *
 * Returns aggregated attendance numbers for the youth admin dashboard:
 *
 *   {
 *     sundays:   [{ date: 'YYYY-MM-DD', count: number }]   // last 12 Sundays
 *     months:    [{ month: 'YYYY-MM',   count: number }]   // last 6 months
 *     totals: {
 *       totalYouth: number
 *       totalCheckIns: number
 *       avgPerSunday: number
 *     }
 *   }
 *
 * "count" = distinct youth signed in during that bucket.
 */
export async function GET(_request: NextRequest) {
  try {
    const token = await getSessionToken()
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await getSessionUser(token)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // ---- last 12 Sundays --------------------------------------------------
    const sundays: Date[] = []
    const probe = new Date()
    probe.setHours(0, 0, 0, 0)
    while (probe.getDay() !== 0) probe.setDate(probe.getDate() - 1)
    for (let i = 0; i < 12; i++) {
      const d = new Date(probe)
      d.setDate(probe.getDate() - i * 7)
      sundays.unshift(d)
    }

    const sundayCounts = await Promise.all(
      sundays.map(async (sunday) => {
        const next = new Date(sunday)
        next.setDate(next.getDate() + 1)
        const distinct = await prisma.youthCheckIn.findMany({
          where: { signedInAt: { gte: sunday, lt: next } },
          distinct: ['userId'],
          select: { userId: true },
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
        const distinct = await prisma.youthCheckIn.findMany({
          where: { signedInAt: { gte: m.start, lt: m.end } },
          distinct: ['userId'],
          select: { userId: true },
        })
        return { month: m.key, count: distinct.length }
      })
    )

    // ---- totals -----------------------------------------------------------
    const [totalYouth, totalCheckIns] = await Promise.all([
      prisma.user.count({ where: { role: 'YOUTH' } }),
      prisma.youthCheckIn.count(),
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
        totals: { totalYouth, totalCheckIns, avgPerSunday },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error computing youth analytics:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
