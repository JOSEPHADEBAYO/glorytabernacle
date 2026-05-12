import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import {
  InformationManager,
  type DashboardInformationItem,
} from '@/components/dashboard/information-manager'

export const dynamic = 'force-dynamic'

export default async function InformationDashboardPage() {
  const cookieStore = await cookies()
  const sessionToken = cookieStore.get('session_token')?.value

  if (!sessionToken) {
    redirect('/login')
  }

  const items: DashboardInformationItem[] = await prisma.informationItem.findMany({
    orderBy: [{ published: 'asc' }, { createdAt: 'desc' }],
  })

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: 'rgba(27, 34, 119, 1)' }}>
          Information Hub
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          Review visitor submissions, publish approved immigration and job information, or create posts directly.
        </p>
      </div>
      <InformationManager initialItems={items} />
    </div>
  )
}
