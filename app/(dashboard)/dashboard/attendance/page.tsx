import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { AttendanceAdminPanel } from '@/components/dashboard/attendance-admin-panel'

export default async function AttendanceDashboardPage() {
  const cookieStore = await cookies()
  const sessionToken = cookieStore.get('session_token')?.value
  if (!sessionToken) {
    redirect('/login')
  }

  // Pre-fetch today's submissions and high-level totals so the page renders
  // immediately. The client panel takes over for filters / pagination /
  // analytics from there.
  const startOfToday = new Date()
  startOfToday.setHours(0, 0, 0, 0)

  const [todayRows, todayTotal, allTimeTotal] = await Promise.all([
    prisma.adultAttendance.findMany({
      where: { attendedAt: { gte: startOfToday } },
      orderBy: { attendedAt: 'desc' },
    }),
    prisma.adultAttendance.count({ where: { attendedAt: { gte: startOfToday } } }),
    prisma.adultAttendance.count(),
  ])

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: 'rgba(27, 34, 119, 1)' }}>
          Attendance
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          Today&apos;s sign-ins, full history, and trend analysis.
        </p>
      </div>
      <AttendanceAdminPanel
        initialTodayRows={todayRows}
        initialTodayTotal={todayTotal}
        initialAllTimeTotal={allTimeTotal}
      />
    </div>
  )
}
