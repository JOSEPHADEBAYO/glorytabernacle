import { cookies } from 'next/headers'
import { SessionManager } from '@/components/dashboard/session-manager'
import { Sidebar } from '@/components/dashboard/sidebar'
import { DashboardHeader } from '@/components/dashboard/dashboard-header'
import { MobileSidebarProvider } from '@/components/dashboard/mobile-sidebar-context'
import { prisma } from '@/lib/prisma'
import { canManageConcerns } from '@/lib/types/safeguarding'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Look up the signed-in user once and forward what the sidebar needs:
  //   - canSeeSafeguarding: DSL + Super Admin only. The page itself also
  //     enforces this — the sidebar flag just avoids showing a link that
  //     would bounce.
  //   - userName / userRole: rendered in the sidebar's user section so it
  //     reflects who's actually signed in (was previously hardcoded).
  let canSeeSafeguarding = false
  let userName: string | null = null
  let userRole: string | null = null
  const sessionToken = (await cookies()).get('session_token')?.value
  if (sessionToken) {
    const session = await prisma.session.findUnique({
      where: { token: sessionToken },
      include: {
        user: {
          select: {
            name: true,
            role: true,
            isDesignatedSafeguardingLead: true,
          },
        },
      },
    })
    if (session && session.expiresAt >= new Date()) {
      userName = session.user.name
      userRole = session.user.role
      canSeeSafeguarding = canManageConcerns(
        session.user.role,
        session.user.isDesignatedSafeguardingLead
      )
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Session Manager - handles automatic logout */}
      <SessionManager
        timeout={60000} // 1 minute (60,000 milliseconds)
        warningTime={10000} // 10 seconds warning before logout
      />

      {/* MobileSidebarProvider coordinates the slide-in drawer between the
          Sidebar and the DashboardHeader hamburger button. On lg+ the
          sidebar is permanently visible and the provider state is unused. */}
      <MobileSidebarProvider>
        <Sidebar
          canSeeSafeguarding={canSeeSafeguarding}
          userName={userName}
          userRole={userRole}
        />

        {/* Main content area — full width on mobile, offset for the sidebar
            on lg+ where the sidebar is permanently visible. */}
        <div className="lg:pl-64">
          <DashboardHeader />

          <main className="p-4 sm:p-6 lg:p-8">{children}</main>
        </div>
      </MobileSidebarProvider>
    </div>
  )
}
