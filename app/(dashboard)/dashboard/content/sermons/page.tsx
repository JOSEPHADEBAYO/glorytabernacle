import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { SermonsManager, type DashboardSermon } from '@/components/dashboard/sermons-manager'

export default async function SermonsDashboardPage() {
  const cookieStore = await cookies()
  const sessionToken = cookieStore.get('session_token')?.value

  if (!sessionToken) {
    redirect('/login')
  }

  const sermons = (await (prisma.sermon as any).findMany({
    orderBy: { date: 'desc' },
  })) as DashboardSermon[]

  const serializedSermons = sermons.map((sermon) => ({
    ...sermon,
    date: new Date(sermon.date).toISOString(),
    createdAt: new Date(sermon.createdAt).toISOString(),
    updatedAt: new Date(sermon.updatedAt).toISOString(),
  }))

  return <SermonsManager initialSermons={serializedSermons} />
}
