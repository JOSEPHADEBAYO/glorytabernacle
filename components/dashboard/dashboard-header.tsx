'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useState } from 'react'
import { useMobileSidebar } from './mobile-sidebar-context'

export function DashboardHeader() {
  const router = useRouter()
  const pathname = usePathname()
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const { open } = useMobileSidebar()

  const handleLogout = async () => {
    setIsLoggingOut(true)
    
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      router.push('/login')
      router.refresh()
    } catch (error) {
      console.error('Logout error:', error)
      setIsLoggingOut(false)
    }
  }

  // Get page title from pathname
  const getPageTitle = () => {
    if (pathname === '/dashboard') return 'Overview'
    if (pathname.includes('/events')) return 'Events Management'
    if (pathname.includes('/groups')) return 'Groups & Ministries'
    if (pathname.includes('/sermons')) return 'Sermons'
    if (pathname.includes('/books')) return 'Books'
    if (pathname.includes('/new-members')) return 'New Member'
    if (pathname.includes('/media')) return 'Media Library'
    if (pathname.includes('/users')) return 'User Management'
    if (pathname.includes('/settings')) return 'Settings'
    return 'Dashboard'
  }

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
      <div className="px-4 sm:px-6 lg:px-8 py-3 lg:py-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            {/* Mobile hamburger — opens the sidebar drawer. Hidden on lg+ where
                the sidebar is always visible. */}
            <button
              type="button"
              onClick={open}
              aria-label="Open menu"
              className="lg:hidden -ml-1 p-2 rounded-lg text-gray-600 hover:bg-gray-100"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5" />
              </svg>
            </button>

            {/* Page Title */}
            <div className="min-w-0">
              <h1
                className="text-lg sm:text-xl lg:text-2xl font-bold truncate"
                style={{ color: 'rgba(27, 34, 119, 1)' }}
              >
                {getPageTitle()}
              </h1>
              <p className="hidden sm:block text-xs sm:text-sm text-gray-500 mt-0.5 truncate">
                Manage your church content and settings
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 sm:gap-2 lg:gap-4 shrink-0">
            {/* Notifications */}
            <button
              aria-label="Notifications"
              className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 sm:w-6 sm:h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
              </svg>
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>

            {/* Logout Button — icon-only on mobile, icon + text on sm+ */}
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              aria-label={isLoggingOut ? 'Logging out' : 'Logout'}
              className="p-2 sm:px-3 sm:py-2 lg:px-4 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
              </svg>
              <span className="hidden sm:inline">
                {isLoggingOut ? 'Logging out...' : 'Logout'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
