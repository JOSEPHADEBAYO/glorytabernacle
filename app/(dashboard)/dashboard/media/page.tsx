import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { HeroCarouselManager } from '@/components/dashboard/hero-carousel-manager'

export default async function MediaDashboardPage() {
  const cookieStore = await cookies()
  const sessionToken = cookieStore.get('session_token')?.value

  if (!sessionToken) {
    redirect('/login')
  }

  const images = await prisma.heroCarouselImage.findMany({
    orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
  })

  return (
    <div>
      <div className="mb-6">
        <h1
          className="text-2xl font-bold"
          style={{ color: 'rgba(27, 34, 119, 1)' }}
        >
          Media Library
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          Upload and manage the hero carousel images shown on the landing page.
        </p>
      </div>
      <HeroCarouselManager initialImages={images} />
    </div>
  )
}
