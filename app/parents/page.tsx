import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { requireParent } from '@/lib/auth/parent-session'
import {
  ChildrenCheckInPanel,
  type ChildRow,
} from '@/components/parents/children-checkin-panel'

/**
 * Parent dashboard. Server-fetches the parent's children with their open
 * (unsigned-out) check-in if any, then hands off to a client panel that
 * lets parents tick + sign in, or tick + sign out.
 */
export default async function ParentDashboardPage() {
  const parent = await requireParent()

  const childrenRaw = await prisma.child.findMany({
    where: { parents: { some: { id: parent.id } } },
    orderBy: { firstName: 'asc' },
    include: {
      checkIns: {
        where: { signedOutAt: null },
        orderBy: { signedInAt: 'desc' },
        take: 1,
      },
    },
  })

  const children: ChildRow[] = childrenRaw.map((c) => {
    const open = c.checkIns[0]
    return {
      id: c.id,
      firstName: c.firstName,
      lastName: c.lastName,
      photoUrl: c.photoUrl,
      // Surface the open check-in so the panel can offer "Sign out" instead
      // of "Sign in" for currently-attending children.
      openCheckIn: open
        ? { id: open.id, signedInAt: open.signedInAt.toISOString() }
        : null,
    }
  })

  return (
    <div className="space-y-8">
      {/* Greeting */}
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.2em]"
           style={{ color: 'var(--church-light-green, rgb(27, 109, 36))' }}>
          Welcome
        </p>
        <h1
          className="mt-1 text-3xl font-extrabold leading-tight"
          style={{ color: 'rgba(27, 34, 119, 1)' }}
        >
          Hello, {parent.name.split(' ')[0] || parent.name} 👋
        </h1>
        <p className="mt-2 text-sm text-gray-600 max-w-xl leading-relaxed">
          Tick your children and sign them in for the service. Come back when
          you&apos;re ready to pick them up and we&apos;ll sign them out.
        </p>
      </div>

      {/* No children — encourage registration */}
      {children.length === 0 ? (
        <div className="rounded-2xl border border-gray-100 bg-white p-10 text-center shadow-sm">
          <div
            className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full"
            style={{ backgroundColor: 'rgba(0, 6, 102, 0.08)' }}
          >
            <svg className="h-7 w-7" style={{ color: 'rgba(0, 6, 102, 1)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold" style={{ color: 'rgba(27, 34, 119, 1)' }}>
            Register your first child
          </h2>
          <p className="mt-2 text-sm text-gray-600 max-w-md mx-auto">
            You only need to do this once per child. After that, they&apos;ll
            appear here every Sunday for quick check-in.
          </p>
          <Link
            href="/parents/children/new"
            className="mt-6 inline-flex items-center justify-center gap-2 rounded-lg px-6 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: 'rgba(27, 34, 119, 1)' }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Register a child
          </Link>
        </div>
      ) : (
        <ChildrenCheckInPanel children={children} />
      )}

      {/* Manage children */}
      {children.length > 0 && (
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold" style={{ color: 'rgba(27, 34, 119, 1)' }}>
              Your children
            </h2>
            <Link
              href="/parents/children/new"
              className="text-sm font-medium text-blue-600 hover:text-blue-800"
            >
              + Add another child
            </Link>
          </div>

          <ul className="divide-y divide-gray-100">
            {children.map((c) => (
              <li
                key={c.id}
                className="flex items-center justify-between py-3 text-sm"
              >
                <span className="font-medium text-gray-900">
                  {c.firstName} {c.lastName}
                </span>
                <Link
                  href={`/parents/children/${c.id}/edit`}
                  className="text-blue-600 hover:text-blue-800 font-medium text-xs"
                >
                  Edit details
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
