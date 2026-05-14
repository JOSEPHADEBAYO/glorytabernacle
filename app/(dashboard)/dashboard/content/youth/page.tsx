import { prisma } from '@/lib/prisma'
import { ScripturesManager } from '@/components/dashboard/scriptures-manager'
import { YouthAttendancePanel } from '@/components/dashboard/youth-attendance-panel'

export default async function YouthScripturesPage() {
  const scriptures = await prisma.dailyScripture.findMany({
    orderBy: { date: 'desc' },
  })

  // Pre-fetch youth attendance data for initial render
  const startOfToday = new Date()
  startOfToday.setHours(0, 0, 0, 0)

  const [activeCheckIns, totalYouth, todayCheckIns] = await Promise.all([
    prisma.youthCheckIn.findMany({
      where: { signedOutAt: null },
      orderBy: { signedInAt: 'desc' },
      take: 200,
      include: {
        user: { select: { id: true, name: true, email: true, image: true } },
      },
    }),
    prisma.user.count({ where: { role: 'YOUTH' } }),
    prisma.youthCheckIn.count({ where: { signedInAt: { gte: startOfToday } } }),
  ])

  const serializedActiveCheckIns = activeCheckIns.map((c) => ({
    id: c.id,
    userId: c.userId,
    signedInAt: c.signedInAt.toISOString(),
    signedOutAt: c.signedOutAt?.toISOString() ?? null,
    user: c.user,
  }))

  return (
    <div className="space-y-10">
      {/* Scriptures Section */}
      <div>
        <div className="mb-6">
          <h1 className="text-2xl font-extrabold" style={{ color: 'rgba(27,34,119,1)' }}>
            Youth Ministry — Daily Scriptures
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Post daily scriptures with optional YouTube video links for youth members.
          </p>
        </div>
        <ScripturesManager initialScriptures={scriptures.map((s) => ({
          id: s.id,
          date: s.date.toISOString(),
          reference: s.reference,
          text: s.text,
          videoUrl: s.videoUrl,
          published: s.published,
          createdBy: s.createdBy,
          createdAt: s.createdAt.toISOString(),
          updatedAt: s.updatedAt.toISOString(),
        }))} />
      </div>

      {/* Attendance Section */}
      <div className="border-t border-gray-200 pt-10">
        <div className="mb-6">
          <h2 className="text-xl font-extrabold" style={{ color: 'rgba(27,34,119,1)' }}>
            Youth Attendance
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Live sign-ins, registered youth members, and attendance trends.
          </p>
        </div>
        <YouthAttendancePanel
          initialActiveCheckIns={serializedActiveCheckIns}
          initialTotalYouth={totalYouth}
          initialTotalCheckInsToday={todayCheckIns}
        />
      </div>
    </div>
  )
}
