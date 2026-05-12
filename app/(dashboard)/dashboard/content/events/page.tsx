import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import {
  EventsManager,
  type DashboardEvent,
} from '@/components/dashboard/events-manager'

export default async function EventsDashboardPage() {
  // Server-side auth check — same pattern as the books / gallery dashboard pages
  const cookieStore = await cookies()
  const sessionToken = cookieStore.get('session_token')?.value

  if (!sessionToken) {
    redirect('/login')
  }

  // Fetch all events (drafts and published, past and upcoming) for the dashboard.
  // Newest first by date so the editor sees fresh entries at the top.
  const events: DashboardEvent[] = await prisma.event.findMany({
    orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
  })

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: 'rgba(27, 34, 119, 1)' }}>
          Events
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          Create, edit, and publish church events. Published upcoming events appear
          on the homepage and the public Events page.
        </p>
      </div>
      <EventsManager initialEvents={events} />
    </div>
  )
}
