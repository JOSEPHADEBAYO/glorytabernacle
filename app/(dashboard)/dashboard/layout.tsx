import { cookies } from 'next/headers'
import { SessionManager } from '@/components/dashboard/session-manager'
import { Sidebar } from '@/components/dashboard/sidebar'
import { DashboardHeader } from '@/components/dashboard/dashboard-header'
import { prisma } from '@/lib/prisma'
import { canManageConcerns } from '@/lib/types/safeguarding'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Determine whether to show the Safeguarding nav item (DSL + Super Admin
  // only). The page itself also enforces this — the sidebar flag just
  // avoids showing a link that would bounce.
  let canSeeSafeguarding = false
  const sessionToken = (await cookies()).get('session_token')?.value
  if (sessionToken) {
    const session = await prisma.session.findUnique({
      where: { token: sessionToken },
      include: {
        user: { select: { role: true, isDesignatedSafeguardingLead: true } },
      },
    })
    if (session && session.expiresAt >= new Date()) {
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

      {/* Sidebar */}
      <Sidebar canSeeSafeguarding={canSeeSafeguarding} />
      
      {/* Main Content Area */}
      <div className="pl-64">
        {/* Top Header */}
        <DashboardHeader />
        
        {/* Page Content */}
        <main className="p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
