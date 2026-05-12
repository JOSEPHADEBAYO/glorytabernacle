import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { SermonsManager, type DashboardSermon } from '@/components/dashboard/sermons-manager'

type SermonRow = Omit<DashboardSermon, 'date' | 'createdAt' | 'updatedAt'> & {
  date: Date
  createdAt: Date
  updatedAt: Date
}

export default async function SermonsDashboardPage() {
  const cookieStore = await cookies()
  const sessionToken = cookieStore.get('session_token')?.value

  if (!sessionToken) {
    redirect('/login')
  }

  const sermons: SermonRow[] = await prisma.sermon.findMany({
    orderBy: { date: 'desc' },
  })

  const serializedSermons = sermons.map((sermon) => ({
    ...sermon,
    date: new Date(sermon.date).toISOString(),
    createdAt: new Date(sermon.createdAt).toISOString(),
    updatedAt: new Date(sermon.updatedAt).toISOString(),
  }))

  return <SermonsManager initialSermons={serializedSermons} />
}
