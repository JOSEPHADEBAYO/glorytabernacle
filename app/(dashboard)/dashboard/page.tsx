import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { MountUpNotifyCard } from '@/components/dashboard/mount-up-notify-card'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Format a Date as a relative time ("just now", "5 minutes ago", "2 hours ago",
 * "3 days ago") for the recent-activity feed.
 */
function formatRelativeTime(date: Date): string {
  const seconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000))
  if (seconds < 30) return 'just now'
  if (seconds < 60) return `${seconds} seconds ago`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days} day${days === 1 ? '' : 's'} ago`
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

/**
 * Server-fetch all the metrics and recent-activity data the overview needs.
 * Each query is independent, so we run them in parallel. Failures fall back
 * to zero/empty values so a single broken query can't break the whole page.
 */
async function loadOverviewData() {
  const now = new Date()

  // Parallel fetch with `allSettled` so one failure doesn't take everything down.
  const results = await Promise.allSettled([
    prisma.event.count(),
    prisma.event.count({ where: { date: { gte: now } } }),
    prisma.group.count({ where: { published: true } }),
    prisma.group.count(),
    prisma.sermon.count(),
    prisma.book.count(),
    prisma.book.count({ where: { featured: true } }),
    prisma.groupMember.count(),
    prisma.groupMember.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        group: { select: { title: true } },
      },
    }),
  ])

  const num = (i: number): number =>
    results[i].status === 'fulfilled' ? (results[i] as PromiseFulfilledResult<number>).value : 0

  const recentMembers =
    results[8].status === 'fulfilled'
      ? (results[8] as PromiseFulfilledResult<
          Array<{
            id: string
            firstName: string
            lastName: string
            createdAt: Date
            group: { title: string }
          }>
        >).value
      : []

  return {
    totalEvents: num(0),
    upcomingEvents: num(1),
    publishedGroups: num(2),
    totalGroups: num(3),
    totalSermons: num(4),
    totalBooks: num(5),
    featuredBooks: num(6),
    totalMembers: num(7),
    recentMembers,
  }
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function DashboardPage() {
  const cookieStore = await cookies()
  const sessionToken = cookieStore.get('session_token')?.value
  if (!sessionToken) {
    redirect('/login')
  }

  // Resolve the current user's role so we can gate the Super-Admin-only
  // Mount Up reminder card. Falls back to null on lookup failure rather than
  // crashing — the overview still renders without the card in that case.
  let userRole: string | null = null
  let mountUpSubscribers = 0
  try {
    const session = await prisma.session.findUnique({
      where: { token: sessionToken },
      include: { user: { select: { role: true } } },
    })
    userRole = session?.user?.role ?? null
    if (userRole === 'SUPER_ADMIN') {
      mountUpSubscribers = await prisma.pushSubscription.count({
        where: { topic: 'MOUNT_UP' },
      })
    }
  } catch (err) {
    console.error('Dashboard: failed to resolve session/role', err)
  }
  const isSuperAdmin = userRole === 'SUPER_ADMIN'

  const data = await loadOverviewData()

  // Helper to build a "trend" line that's actually informative
  const eventTrend =
    data.totalEvents === 0
      ? 'No events yet'
      : `${data.upcomingEvents} upcoming`
  const groupTrend =
    data.totalGroups === 0
      ? 'No groups yet'
      : `${data.publishedGroups} published`
  const sermonTrend = data.totalSermons === 0 ? 'No sermons yet' : 'Total sermons'
  const bookTrend =
    data.totalBooks === 0
      ? 'No books yet'
      : `${data.featuredBooks} featured`

  return (
    <div>
      {/* Dashboard Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Events"
          value={String(data.totalEvents)}
          icon="📅"
          color="bg-blue-500"
          trend={eventTrend}
        />
        <StatCard
          title="Active Groups"
          value={String(data.publishedGroups)}
          icon="👥"
          color="bg-green-500"
          trend={groupTrend}
        />
        <StatCard
          title="Sermons"
          value={String(data.totalSermons)}
          icon="🎤"
          color="bg-purple-500"
          trend={sermonTrend}
        />
        <StatCard
          title="Books"
          value={String(data.totalBooks)}
          icon="📚"
          color="bg-orange-500"
          trend={bookTrend}
        />
      </div>

      {/* Mount Up reminder — Super Admin only. Replaces the daily 11:45pm
          cron that used to blast emails; now a manual, opt-in push. */}
      {isSuperAdmin && <MountUpNotifyCard subscriberCount={mountUpSubscribers} />}

      {/* Members callout — prominent because every submission needs follow-up */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">New-Member Submissions</p>
            <p className="text-3xl font-bold mt-1" style={{ color: 'rgba(27, 34, 119, 1)' }}>
              {data.totalMembers}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              People who&apos;ve filled the &ldquo;Get Involved&rdquo; form on a ministry page.
            </p>
          </div>
          <Link
            href="/dashboard/members"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors"
          >
            View All →
          </Link>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
        <h2 className="text-lg font-semibold mb-4" style={{ color: 'rgba(27, 34, 119, 1)' }}>
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <QuickActionCard
            title="Manage Events"
            description="Create, publish, and edit events"
            icon="➕"
            href="/dashboard/content/events"
          />
          <QuickActionCard
            title="Manage Groups"
            description="Edit ministries and fellowships"
            icon="✏️"
            href="/dashboard/content/groups"
          />
          <QuickActionCard
            title="Upload Gallery Photos"
            description="Add images to the homepage gallery"
            icon="📸"
            href="/dashboard/content/gallery"
          />
        </div>
      </div>

      {/* Recent Activity — latest member submissions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold" style={{ color: 'rgba(27, 34, 119, 1)' }}>
            Recent Activity
          </h2>
          {data.recentMembers.length > 0 && (
            <Link
              href="/dashboard/members"
              className="text-sm font-medium text-blue-600 hover:text-blue-800"
            >
              See all →
            </Link>
          )}
        </div>

        {data.recentMembers.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-gray-500">
              No recent activity yet. New member submissions will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {data.recentMembers.map((m) => (
              <ActivityItem
                key={m.id}
                action="New Member Submitted"
                description={`${m.firstName} ${m.lastName} joined ${m.group.title}`}
                time={formatRelativeTime(new Date(m.createdAt))}
                icon="👤"
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Cards (unchanged from before)
// ---------------------------------------------------------------------------

function StatCard({
  title,
  value,
  icon,
  color,
  trend,
}: {
  title: string
  value: string
  icon: string
  color: string
  trend: string
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className={`${color} w-12 h-12 rounded-lg flex items-center justify-center text-2xl`}>
          {icon}
        </div>
        <span className="text-xs text-gray-600 font-medium">{trend}</span>
      </div>
      <p className="text-sm text-gray-600 mb-1">{title}</p>
      <p className="text-3xl font-bold" style={{ color: 'rgba(27, 34, 119, 1)' }}>
        {value}
      </p>
    </div>
  )
}

function QuickActionCard({
  title,
  description,
  icon,
  href,
}: {
  title: string
  description: string
  icon: string
  href: string
}) {
  return (
    <Link
      href={href}
      className="block p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md transition-all group"
    >
      <div className="text-2xl mb-2">{icon}</div>
      <h3
        className="font-semibold mb-1 group-hover:text-blue-600 transition-colors"
        style={{ color: 'rgba(27, 34, 119, 1)' }}
      >
        {title}
      </h3>
      <p className="text-sm text-gray-600">{description}</p>
    </Link>
  )
}

function ActivityItem({
  action,
  description,
  time,
  icon,
}: {
  action: string
  description: string
  time: string
  icon: string
}) {
  return (
    <div className="flex items-start gap-4 pb-4 border-b border-gray-100 last:border-0 last:pb-0">
      <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-xl flex-shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900">{action}</p>
        <p className="text-sm text-gray-600 truncate">{description}</p>
      </div>
      <span className="text-xs text-gray-500 whitespace-nowrap">{time}</span>
    </div>
  )
}
