import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { MembersManager } from '@/components/dashboard/members-manager'

const DEFAULT_PAGE_SIZE = 25

export default async function MembersDashboardPage() {
  const cookieStore = await cookies()
  const sessionToken = cookieStore.get('session_token')?.value
  if (!sessionToken) {
    redirect('/login')
  }

  // Server-fetch the first page so the dashboard renders fast on initial load.
  const [total, members, groups] = await Promise.all([
    prisma.groupMember.count(),
    prisma.groupMember.findMany({
      orderBy: { createdAt: 'desc' },
      take: DEFAULT_PAGE_SIZE,
      include: {
        group: { select: { id: true, slug: true, title: true } },
      },
    }),
    prisma.group.findMany({
      orderBy: [{ order: 'asc' }, { title: 'asc' }],
      select: { id: true, title: true },
    }),
  ])

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: 'rgba(27, 34, 119, 1)' }}>
          Members
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          New-member submissions from the &ldquo;Get Involved&rdquo; form on each
          ministry page. Review, follow up, and remove entries here.
        </p>
      </div>
      <MembersManager
        initialMembers={members}
        initialTotal={total}
        pageSize={DEFAULT_PAGE_SIZE}
        groups={groups}
      />
    </div>
  )
}
