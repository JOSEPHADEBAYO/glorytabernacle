import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { NewMembersManager } from '@/components/dashboard/new-members-manager'

const DEFAULT_PAGE_SIZE = 25

export default async function NewMembersDashboardPage() {
  const cookieStore = await cookies()
  const sessionToken = cookieStore.get('session_token')?.value

  if (!sessionToken) {
    redirect('/login')
  }

  const [total, applications] = await Promise.all([
    prisma.membershipApplication.count(),
    prisma.membershipApplication.findMany({
      orderBy: { createdAt: 'desc' },
      take: DEFAULT_PAGE_SIZE,
    }),
  ])

  return (
    <div>
      <div className="mb-6">
        <h1
          className="text-2xl font-bold"
          style={{ color: 'rgba(27, 34, 119, 1)' }}
        >
          New Member
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          Membership applications submitted from the Church Membership page.
          Review contact details, selected class, and prayer points here.
        </p>
      </div>
      <NewMembersManager
        initialApplications={applications}
        initialTotal={total}
        pageSize={DEFAULT_PAGE_SIZE}
      />
    </div>
  )
}
