import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { ProgramInterestManager } from '@/components/dashboard/program-interest-manager'

const DEFAULT_PAGE_SIZE = 25

export default async function ProgramInterestDashboardPage() {
  const cookieStore = await cookies()
  const sessionToken = cookieStore.get('session_token')?.value
  if (!sessionToken) {
    redirect('/login')
  }

  // Server-fetch the first page for fast initial paint. The client takes
  // over for search/pagination/email sending.
  const [total, rows] = await Promise.all([
    prisma.programInterest.count(),
    prisma.programInterest.findMany({
      orderBy: { createdAt: 'desc' },
      take: DEFAULT_PAGE_SIZE,
    }),
  ])

  // Serialize Date fields so the client component never has to handle Date objects.
  const initialRows = rows.map((r) => ({
    id: r.id,
    name: r.name,
    email: r.email,
    createdAt: r.createdAt.toISOString(),
  }))

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: 'rgba(27, 34, 119, 1)' }}>
          Program Interest
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          People who signed up via the &ldquo;Get Notified&rdquo; modal on the
          homepage. Send individual or bulk emails.
        </p>
      </div>
      <ProgramInterestManager
        initialRows={initialRows}
        initialTotal={total}
        pageSize={DEFAULT_PAGE_SIZE}
      />
    </div>
  )
}
