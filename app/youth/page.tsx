import { requireYouth } from '@/lib/auth/youth-session'
import { prisma } from '@/lib/prisma'
import { YouthDashboardPanel } from '@/components/youth/youth-dashboard-panel'
import { YouthPushOptIn } from '@/components/youth/youth-push-opt-in'

export default async function YouthDashboardPage() {
  const youth = await requireYouth()

  // Get open check-in if any
  const openCheckIn = await prisma.youthCheckIn.findFirst({
    where: { userId: youth.id, signedOutAt: null },
    orderBy: { signedInAt: 'desc' },
  })

  // Get latest 10 published scriptures
  const scriptures = await prisma.dailyScripture.findMany({
    where: { published: true },
    orderBy: { date: 'desc' },
    take: 10,
  })

  return (
    <div className="space-y-8">
      {/* Greeting */}
      <div>
        <p
          className="text-xs font-bold uppercase tracking-[0.2em]"
          style={{ color: 'var(--church-green)' }}
        >
          Welcome
        </p>
        <h1
          className="mt-1 text-3xl font-extrabold leading-tight"
          style={{ color: 'rgba(27,34,119,1)' }}
        >
          Hello, {youth.name.split(' ')[0]} 👋
        </h1>
        <p className="mt-2 text-sm text-gray-600 max-w-xl leading-relaxed">
          Check in when you arrive for the service, and check out when you
          leave. Browse today&apos;s daily scripture below.
        </p>
      </div>

      <YouthPushOptIn vapidPublicKey={process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? ''} />

      <YouthDashboardPanel
        youth={youth}
        openCheckIn={openCheckIn ? { id: openCheckIn.id, signedInAt: openCheckIn.signedInAt.toISOString() } : null}
        scriptures={scriptures.map((s) => ({
          id: s.id,
          date: s.date.toISOString(),
          reference: s.reference,
          text: s.text,
          videoUrl: s.videoUrl,
        }))}
      />
    </div>
  )
}
