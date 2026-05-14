import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import {
  VolunteerInterestsManager,
  type DashboardVolunteerInterest,
} from '@/components/dashboard/volunteer-interests-manager'

const DEFAULT_PAGE_SIZE = 25

export const dynamic = 'force-dynamic'

export default async function VolunteersDashboardPage() {
  const cookieStore = await cookies()
  const sessionToken = cookieStore.get('session_token')?.value

  if (!sessionToken) {
    redirect('/login')
  }

  const [total, interests] = await Promise.all([
    prisma.volunteerInterest.count(),
    prisma.volunteerInterest.findMany({
      orderBy: { createdAt: 'desc' },
      take: DEFAULT_PAGE_SIZE,
    }),
  ])

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: 'rgba(27, 34, 119, 1)' }}>
          Volunteer Interests
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          Review people who want to serve, their ministry strengths, spiritual readiness, and experience.
        </p>
      </div>
      <VolunteerInterestsManager
        initialInterests={interests as DashboardVolunteerInterest[]}
        initialTotal={total}
        pageSize={DEFAULT_PAGE_SIZE}
      />
    </div>
  )
}
