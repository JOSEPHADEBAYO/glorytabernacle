import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { GroupsManager } from '@/components/dashboard/groups-manager'

export default async function GroupsDashboardPage() {
  const cookieStore = await cookies()
  const sessionToken = cookieStore.get('session_token')?.value

  if (!sessionToken) {
    redirect('/login')
  }

  const groups = await prisma.group.findMany({
    orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
  })

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: 'rgba(27, 34, 119, 1)' }}>
          Groups & Ministries
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          Create and edit ministries and groups. Each entry follows the same
          departmental-board layout: scripture, head responsibilities, programmes,
          and three vision-pillar statements (Furnish · Transform · Influence).
        </p>
      </div>
      <GroupsManager initialGroups={groups} />
    </div>
  )
}
