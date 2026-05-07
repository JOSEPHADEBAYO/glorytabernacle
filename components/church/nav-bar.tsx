'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { ChevronDown, Menu, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface NavDropdownItem {
  label: string
  href: string
}

interface NavLink {
  label: string
  href?: string          // optional — dropdown-only items have no href
  children?: NavDropdownItem[]
}

const NAV_LINKS: NavLink[] = [
  { label: 'Home', href: '/' },
  { label: 'About', href: '/about' },
  {
    label: 'Media',   // no href — dropdown only
    children: [
      { label: 'Sermons', href: '/sermons' },
      { label: 'Events', href: '/events' },
      { label: 'Books', href: '/books' },
      { label: 'Tracts', href: '/tracts' },
    ],
  },
  { label: 'Volunteer', href: '/volunteer' },
  {
    label: 'Connect',  // no href — dropdown only
    children: [
      { label: 'Contact Us', href: '/contact' },
      { label: 'Church Groups', href: '/groups' },
    ],
  },
]

export function TopNavBar() {
  const pathname = usePathname()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [mobileOpenDropdowns, setMobileOpenDropdowns] = useState<Set<string>>(new Set())
  const [desktopOpenDropdown, setDesktopOpenDropdown] = useState<string | null>(null)
  const [pinnedDropdown, setPinnedDropdown] = useState<string | null>(null)
  const [scrolled, setScrolled] = useState(false)
  const navRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Close pinned dropdown when clicking outside the nav
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setPinnedDropdown(null)
        setDesktopOpenDropdown(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Close pinned dropdown on route change
  useEffect(() => {
    setPinnedDropdown(null)
    setDesktopOpenDropdown(null)
  }, [pathname])

  function toggleDrawer() {
    setDrawerOpen((prev) => {
      if (prev) setMobileOpenDropdowns(new Set())
      return !prev
    })
  }

  function toggleMobileDropdown(label: string) {
    setMobileOpenDropdowns((prev) => {
      const next = new Set(prev)
      if (next.has(label)) next.delete(label)
      else next.add(label)
      return next
    })
  }

  function handleDropdownClick(label: string) {
    setPinnedDropdown((prev) => (prev === label ? null : label))
  }

  function isDropdownVisible(label: string) {
    return pinnedDropdown === label || desktopOpenDropdown === label
  }

  return (
    <header
      ref={navRef}
      className={cn(
        'fixed top-0 left-0 right-0 z-50 shadow-[var(--shadow-nav)] transition-all duration-300',
        scrolled
          ? 'bg-[rgba(27,34,119,0.97)]'
          : 'bg-[rgba(27,34,119,0.45)] backdrop-blur-sm'
      )}
    >
      <nav className="mx-auto flex h-16 max-w-[var(--container-max)] items-center px-[var(--section-padding-x)]">
        {/* Logo */}
        <div className="flex-none">
          <Link href="/" aria-label="RCCG Glory Tabernacle home">
              <Image
                src="/logo-with-no-bg.png"
                alt="RCCG Glory Tabernacle"
                width={140}
                height={140}
                className="rounded-md object-cover"
                onError={undefined}
              />
          </Link>
        </div>

        {/* Desktop links */}
        <ul className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-6 md:flex">
          {NAV_LINKS.map((link) => {
            const hasChildren = !!link.children?.length
            const isActive = link.href ? pathname === link.href : false
            const isOpen = isDropdownVisible(link.label)

            return (
              <li
                key={link.label}
                className="relative"
                onMouseEnter={() => hasChildren && setDesktopOpenDropdown(link.label)}
                onMouseLeave={() => {
                  // Only clear hover state if not pinned
                  if (pinnedDropdown !== link.label) setDesktopOpenDropdown(null)
                }}
              >
                {hasChildren ? (
                  // Dropdown trigger — button, no navigation
                  <button
                    type="button"
                    onClick={() => handleDropdownClick(link.label)}
                    aria-expanded={isOpen}
                    aria-haspopup="true"
                    className={cn(
                      'flex items-center gap-1 pb-1 text-sm font-medium text-white transition-colors hover:text-[var(--church-light-green)]',
                      isOpen && 'text-[var(--church-light-green)]'
                    )}
                  >
                    {link.label}
                    <ChevronDown
                      size={14}
                      className={cn('transition-transform duration-200', isOpen && 'rotate-180')}
                    />
                  </button>
                ) : (
                  <Link
                    href={link.href!}
                    className={cn(
                      'flex items-center gap-1 pb-1 text-sm font-medium text-white transition-colors hover:text-[var(--church-light-green)]',
                      isActive && 'border-b-2 border-[var(--church-green)]'
                    )}
                  >
                    {link.label}
                  </Link>
                )}

                {/* Dropdown panel */}
                {hasChildren && isOpen && (
                  <ul className="absolute left-0 top-full mt-2 min-w-[180px] rounded-xl bg-white py-2 shadow-xl border border-gray-100">
                    {link.children!.map((child) => (
                      <li key={child.href}>
                        <Link
                          href={child.href}
                          onClick={() => setPinnedDropdown(null)}
                          className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-[var(--church-green)] transition-colors"
                        >
                          {child.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            )
          })}
        </ul>

        {/* Right: NEED A RIDE + GIVE + hamburger */}
        <div className="ml-auto flex items-center gap-3">
          {/* Need a Ride Button - Hidden on mobile */}
          <Link
            href="https://chat.whatsapp.com/GkKjHdna7CLC99QvBreWIC?mode=gi_t"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden md:inline-flex items-center gap-2 rounded-md bg-white/10 backdrop-blur-sm px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-white/20 hover:scale-105 border border-white/20 group overflow-hidden relative"
          >
            <Image
              src="/bus.png"
              alt="Bus"
              width={16}
              height={16}
              className="w-4 h-4 transition-all duration-[1500ms] ease-linear group-hover:translate-x-20 group-hover:opacity-0"
            />
            <Image
              src="/bus.png"
              alt="Bus"
              width={16}
              height={16}
              className="w-4 h-4 absolute -left-16 transition-all duration-[1500ms] ease-linear group-hover:left-4 opacity-0 group-hover:opacity-100"
            />
            NEED A RIDE?
          </Link>

          {/* Give Button */}
          <Link
            href="/giving"
            className="rounded-md bg-[var(--church-green)] px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-[#155a1d] hover:scale-105"
          >
            GIVE
          </Link>

          {/* Hamburger Menu */}
          <button
            type="button"
            className="flex items-center justify-center text-white md:hidden"
            aria-label={drawerOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={drawerOpen}
            onClick={toggleDrawer}
          >
            {drawerOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </nav>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="border-t border-white/10 bg-[rgba(27,34,119,0.97)] md:hidden">
          <ul className="mx-auto max-w-[var(--container-max)] px-[var(--section-padding-x)] py-3">
            {NAV_LINKS.map((link) => {
              const hasChildren = !!link.children?.length
              const isActive = link.href ? pathname === link.href : false
              const isExpanded = mobileOpenDropdowns.has(link.label)

              return (
                <li key={link.label} className="border-b border-white/10 last:border-0">
                  {hasChildren ? (
                    <>
                      <button
                        type="button"
                        className={cn(
                          'flex w-full items-center justify-between py-3 text-sm font-medium text-white',
                          isExpanded && 'text-[var(--church-light-green)]'
                        )}
                        onClick={() => toggleMobileDropdown(link.label)}
                        aria-expanded={isExpanded}
                      >
                        {link.label}
                        <ChevronDown
                          size={16}
                          className={cn('transition-transform duration-200', isExpanded && 'rotate-180')}
                        />
                      </button>
                      {isExpanded && (
                        <ul className="mb-2 ml-4">
                          {link.children!.map((child) => (
                            <li key={child.href}>
                              <Link
                                href={child.href}
                                className="block py-2 text-sm text-white/80 hover:text-white"
                                onClick={() => setDrawerOpen(false)}
                              >
                                {child.label}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      )}
                    </>
                  ) : (
                    <Link
                      href={link.href!}
                      className={cn(
                        'block py-3 text-sm font-medium text-white hover:text-[var(--church-light-green)]',
                        isActive && 'text-[var(--church-light-green)]'
                      )}
                      onClick={() => setDrawerOpen(false)}
                    >
                      {link.label}
                    </Link>
                  )}
                </li>
              )
            })}

            {/* Mobile: Need a Ride Button */}
            <li className="pt-3">
              <Link
                href="https://chat.whatsapp.com/GkKjHdna7CLC99QvBreWIC?mode=gi_t"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full rounded-md bg-white/10 backdrop-blur-sm px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-white/20 border border-white/20 group overflow-hidden relative"
                onClick={() => setDrawerOpen(false)}
              >
                <Image
                  src="/bus.png"
                  alt="Bus"
                  width={16}
                  height={16}
                  className="w-4 h-4 transition-all duration-[1500ms] ease-linear group-hover:translate-x-20 group-hover:opacity-0"
                />
                <Image
                  src="/bus.png"
                  alt="Bus"
                  width={16}
                  height={16}
                  className="w-4 h-4 absolute left-0 transition-all duration-[1500ms] ease-linear group-hover:left-16 opacity-0 group-hover:opacity-100"
                />
                NEED A RIDE?
              </Link>
            </li>
          </ul>
        </div>
      )}
    </header>
  )
}
