import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { canManageConcerns } from '@/lib/types/safeguarding'
import { SafeguardingManager } from '@/components/dashboard/safeguarding-manager'

/**
 * Safeguarding concern log — DSL + SUPER_ADMIN only. Highly sensitive, so
 * the page itself enforces the gate (in addition to the API) before any
 * data is fetched.
 */
export default async function SafeguardingPage() {
  const cookieStore = await cookies()
  const sessionToken = cookieStore.get('session_token')?.value
  if (!sessionToken) redirect('/login')

  const session = await prisma.session.findUnique({
    where: { token: sessionToken },
    include: {
      user: { select: { role: true, isDesignatedSafeguardingLead: true } },
    },
  })
  if (!session || session.expiresAt < new Date()) redirect('/login')

  if (!canManageConcerns(session.user.role, session.user.isDesignatedSafeguardingLead)) {
    redirect('/dashboard')
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: 'rgba(27, 34, 119, 1)' }}>
          Safeguarding
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          The safeguarding concern log. Visible only to the Designated
          Safeguarding Lead and Super Admin.
        </p>
      </div>
      <SafeguardingManager />
    </div>
  )
}
