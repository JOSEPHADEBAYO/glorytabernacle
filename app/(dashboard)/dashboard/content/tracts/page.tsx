import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { TractsManager } from '@/components/dashboard/tracts-manager'

type DashboardTract = {
  id: string
  title: string
  category: string
  description: string
  coverImage: string
  documentUrl: string
  published: boolean
  createdAt: Date
}

export default async function TractsPage() {
  // Server-side auth check
  const cookieStore = await cookies()
  const sessionToken = cookieStore.get('session_token')?.value
  
  if (!sessionToken) {
    redirect('/login')
  }

  // Fetch tracts from database
  const tracts: DashboardTract[] = await prisma.tract.findMany({
    orderBy: {
      createdAt: 'desc',
    },
  })

  return <TractsManager initialTracts={tracts} />
}
