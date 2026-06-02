'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'

/**
 * Coordinates the mobile sidebar drawer between the Sidebar component (which
 * slides in/out) and the DashboardHeader (which owns the hamburger button).
 * On `lg` and up the drawer doesn't apply — the sidebar is always visible
 * statically and this context's state is effectively ignored.
 */
interface MobileSidebarContextValue {
  isOpen: boolean
  open: () => void
  close: () => void
  toggle: () => void
}

const MobileSidebarContext = createContext<MobileSidebarContextValue>({
  isOpen: false,
  open: () => {},
  close: () => {},
  toggle: () => {},
})

export function MobileSidebarProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [isOpen, setIsOpen] = useState(false)

  const open = useCallback(() => setIsOpen(true), [])
  const close = useCallback(() => setIsOpen(false), [])
  const toggle = useCallback(() => setIsOpen((v) => !v), [])

  // Lock body scroll while the drawer is open so the page behind doesn't
  // scroll under the user's finger.
  useEffect(() => {
    if (!isOpen) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [isOpen])

  // Close on Escape — standard drawer/dialog behaviour.
  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen, close])

  const value = useMemo(
    () => ({ isOpen, open, close, toggle }),
    [isOpen, open, close, toggle]
  )

  return (
    <MobileSidebarContext.Provider value={value}>
      {children}
    </MobileSidebarContext.Provider>
  )
}

export function useMobileSidebar(): MobileSidebarContextValue {
  return useContext(MobileSidebarContext)
}
