import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { TractsManager } from '@/components/dashboard/tracts-manager'

export default async function TractsPage() {
  // Server-side auth check
  const cookieStore = await cookies()
  const sessionToken = cookieStore.get('session_token')?.value
  
  if (!sessionToken) {
    redirect('/login')
  }

  // Fetch tracts from database
  const tracts = await prisma.tract.findMany({
    orderBy: {
      createdAt: 'desc',
    },
  })

  return <TractsManager initialTracts={tracts} />
}
