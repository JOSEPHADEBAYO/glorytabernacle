import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import {
  INAUGURAL_ADMIN_ROLES,
  formatRegistrationId,
} from '@/lib/types/inaugural-registration'
import {
  InauguralManager,
  type DashboardInauguralRegistration,
} from '@/components/dashboard/inaugural-manager'

const PAGE_SIZE = 25

function getSiteUrl(): string {
  const url =
    process.env.SITE_URL ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.NEXTAUTH_URL ??
    'https://www.glorytabernacle.co.uk'
  return url.replace(/\/+$/, '')
}

export default async function InauguralServiceDashboardPage() {
  // Auth: session cookie must exist + role must be in the admin allow-list.
  const sessionToken = (await cookies()).get('session_token')?.value
  if (!sessionToken) redirect('/login')

  const session = await prisma.session.findUnique({
    where: { token: sessionToken },
    include: { user: { select: { role: true } } },
  })
  if (!session || session.expiresAt < new Date()) redirect('/login')
  const role = session.user?.role
  if (!role || !(INAUGURAL_ADMIN_ROLES as readonly string[]).includes(role)) {
    redirect('/dashboard')
  }

  const [total, rows] = await Promise.all([
    prisma.inauguralRegistration.count(),
    prisma.inauguralRegistration.findMany({
      orderBy: { createdAt: 'desc' },
      take: PAGE_SIZE,
    }),
  ])

  const initialRows: DashboardInauguralRegistration[] = rows.map((r) => ({
    ...r,
    registrationId: formatRegistrationId(r.serialNumber),
  }))

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-[#000666]">Inaugural Service Registrations</h2>
        <p className="mt-1 text-sm text-gray-500 max-w-2xl">
          Every person who&apos;s registered for the inaugural service on 19 July 2026. Search by name, email, or registration ID (e.g. <code className="text-gray-600">GT-2026-0001</code>). Click any row&apos;s ID to copy it, or &quot;View badge&quot; to preview and print the badge.
        </p>
      </div>

      <InauguralManager
        initialRows={initialRows}
        initialTotal={total}
        pageSize={PAGE_SIZE}
        siteUrl={getSiteUrl()}
      />
    </div>
  )
}
