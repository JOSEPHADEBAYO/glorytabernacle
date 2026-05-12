import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { ChildrenAdminPanel } from '@/components/dashboard/children-admin-panel'
import { Prisma } from '@prisma/client'

type ActiveCheckIn = Prisma.ChildCheckInGetPayload<{
  include: {
    child: {
      select: {
        id: true
        firstName: true
        lastName: true
        photoUrl: true
        allergies: true
        specialNeeds: true
      }
    }
    signedInBy: {
      select: {
        id: true
        name: true
        email: true
      }
    }
    signedOutBy: {
      select: {
        id: true
        name: true
        email: true
      }
    }
  }
}>
export default async function ChildrenDashboardPage() {
  const cookieStore = await cookies()
  const sessionToken = cookieStore.get('session_token')?.value
  if (!sessionToken) {
    redirect('/login')
  }

  // Pre-fetch the first batch of data so the page renders immediately.
  // The client panel takes over from there with polling for the live board.
  const startOfToday = new Date()
  startOfToday.setHours(0, 0, 0, 0)

  const [activeCheckIns, todayCheckIns, totalChildren] = await Promise.all([
    prisma.childCheckIn.findMany({
      where: { signedOutAt: null },
      orderBy: { signedInAt: 'desc' },
      take: 200,
      include: {
        child: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            photoUrl: true,
            allergies: true,
            specialNeeds: true,
          },
        },
        signedInBy: { select: { id: true, name: true, email: true } },
        signedOutBy: { select: { id: true, name: true, email: true } },
      },
    }),
    prisma.childCheckIn.count({ where: { signedInAt: { gte: startOfToday } } }),
    prisma.child.count(),
  ])

  // const serializedActiveCheckIns = activeCheckIns.map((checkIn) => ({
  //   ...checkIn,
  //   signedInAt: checkIn.signedInAt.toISOString(),
  //   signedOutAt: checkIn.signedOutAt?.toISOString() ?? null,
  // }))

  const serializedActiveCheckIns = activeCheckIns.map(
  (checkIn: typeof activeCheckIns[number]) => ({
    ...checkIn,
    signedInAt: checkIn.signedInAt.toISOString(),
    signedOutAt: checkIn.signedOutAt?.toISOString() ?? null,
  })
)

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: 'rgba(27, 34, 119, 1)' }}>
          Children
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          Live attendance, registered children, and Sunday/monthly trends.
        </p>
      </div>
      <ChildrenAdminPanel
        initialActiveCheckIns={serializedActiveCheckIns}
        totalChildren={totalChildren}
        totalCheckInsToday={todayCheckIns}
      />
    </div>
  )
}
