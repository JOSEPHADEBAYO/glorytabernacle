import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import {
  GalleryManager,
  type GalleryPhoto,
} from '@/components/dashboard/gallery-manager'

export default async function GalleryDashboardPage() {
  // Server-side auth check — same pattern as the books dashboard page
  const cookieStore = await cookies()
  const sessionToken = cookieStore.get('session_token')?.value

  if (!sessionToken) {
    redirect('/login')
  }

  // Fetch all gallery photos (drafts and published) for the dashboard view
  const photos: GalleryPhoto[] = await prisma.gallery.findMany({
    orderBy: [{ dateTaken: 'desc' }, { createdAt: 'desc' }],
  })

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: 'rgba(27, 34, 119, 1)' }}>
          Gallery
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          Upload and manage photos shown in the homepage Image Gallery.
        </p>
      </div>
      <GalleryManager initialPhotos={photos} />
    </div>
  )
}
