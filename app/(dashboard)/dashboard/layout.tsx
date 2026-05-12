import { SessionManager } from '@/components/dashboard/session-manager'
import { Sidebar } from '@/components/dashboard/sidebar'
import { DashboardHeader } from '@/components/dashboard/dashboard-header'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Session Manager - handles automatic logout */}
      <SessionManager 
        timeout={60000} // 1 minute (60,000 milliseconds)
        warningTime={10000} // 10 seconds warning before logout
      />
      
      {/* Sidebar */}
      <Sidebar />
      
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
