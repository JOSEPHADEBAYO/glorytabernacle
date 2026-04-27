import Image from 'next/image'
import Link from 'next/link'

interface FooterLink {
  label: string
  href: string
}

interface FooterColumn {
  heading: string
  links: FooterLink[]
}

interface SocialLink {
  platform: 'facebook' | 'x' | 'youtube' | 'tiktok' | 'instagram'
  href: string
}

interface FooterProps {
  logo: { src: string; alt: string }
  columns: FooterColumn[]
  socialLinks: SocialLink[]
  contactInfo: {
    address: string
    phone: string
    email: string
    directionsHref?: string
  }
  copyrightText: string
  tagline?: string
}

// Inline SVG brand icons — pixel-perfect colored versions
function InstagramIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <rect width="32" height="32" rx="8" fill="url(#ig-grad)" />
      <defs>
        <radialGradient id="ig-grad" cx="30%" cy="107%" r="130%">
          <stop offset="0%" stopColor="#fdf497" />
          <stop offset="5%" stopColor="#fdf497" />
          <stop offset="45%" stopColor="#fd5949" />
          <stop offset="60%" stopColor="#d6249f" />
          <stop offset="90%" stopColor="#285AEB" />
        </radialGradient>
      </defs>
      <rect x="9" y="9" width="14" height="14" rx="4" stroke="white" strokeWidth="1.5" fill="none" />
      <circle cx="16" cy="16" r="3.5" stroke="white" strokeWidth="1.5" fill="none" />
      <circle cx="21" cy="11" r="1" fill="white" />
    </svg>
  )
}

function YoutubeIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <rect width="32" height="32" rx="8" fill="#FF0000" />
      <path d="M22.5 16c0 1.2-.1 2.4-.3 3.2-.2.7-.7 1.2-1.3 1.4-1.2.3-6 .3-6 .3s-4.8 0-6-.3c-.6-.2-1.1-.7-1.3-1.4C7.4 18.4 7.3 17.2 7.3 16s.1-2.4.3-3.2c.2-.7.7-1.2 1.3-1.4 1.2-.3 6-.3 6-.3s4.8 0 6 .3c.6.2 1.1.7 1.3 1.4.2.8.3 2 .3 3.2z" fill="white" />
      <path d="M14 18.5v-5l4.5 2.5L14 18.5z" fill="#FF0000" />
    </svg>
  )
}

function FacebookIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <rect width="32" height="32" rx="8" fill="#1877F2" />
      <path d="M21 16h-3v9h-4v-9h-2v-3h2v-2c0-2.2 1.3-3.5 3.3-3.5.9 0 1.9.1 2.7.2v3h-1.8c-1 0-1.2.5-1.2 1.2V13h3l-.5 3z" fill="white" />
    </svg>
  )
}

function XIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <rect width="32" height="32" rx="8" fill="#000000" />
      <path d="M18.244 13.525L23.475 8h-1.243l-4.549 5.29L13.9 8H9l5.491 7.99L9 24h1.243l4.802-5.583L19.1 24H24l-5.756-10.475zm-1.7 1.977l-.557-.796-4.43-6.334H13.3l3.576 5.113.557.796 4.648 6.647h-1.743l-3.794-5.426z" fill="white" />
    </svg>
  )
}

function TikTokIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <rect width="32" height="32" rx="8" fill="#000000" />
      <path d="M21 10.5c-.8-.5-1.4-1.3-1.6-2.2h-2.2v9.4c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2c.2 0 .4 0 .6.1V13.5c-.2 0-.4-.1-.6-.1-2.3 0-4.2 1.9-4.2 4.2s1.9 4.2 4.2 4.2 4.2-1.9 4.2-4.2v-5c.8.6 1.8.9 2.8.9v-2.2c-.5 0-1-.3-1.2-.8z" fill="white" />
    </svg>
  )
}

const SOCIAL_ICON_MAP = {
  instagram: InstagramIcon,
  youtube: YoutubeIcon,
  facebook: FacebookIcon,
  x: XIcon,
  tiktok: TikTokIcon,
}

const SOCIAL_LABELS = {
  facebook: 'Facebook',
  x: 'X (Twitter)',
  youtube: 'YouTube',
  tiktok: 'TikTok',
  instagram: 'Instagram',
}

export function Footer({
  logo,
  columns,
  socialLinks,
  contactInfo,
  copyrightText,
  tagline,
}: FooterProps) {
  // Separate location column from other columns
  const quickLinksCol = columns[0]
  const locationCol = columns.find(c => c.heading.toLowerCase().includes('contact') || c.heading.toLowerCase().includes('location'))

  return (
    <footer style={{ backgroundColor: 'rgba(248, 250, 252, 1)' }}>
      <div className="max-w-[var(--container-max)] mx-auto px-[var(--section-padding-x)] py-12">

        {/* Main grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_auto] gap-10 lg:gap-8">
          <div className="flex flex-col gap-4">
            <Link href="/" aria-label="RCCG Glory Tabernacle home">    
                  <Image src={logo.src} alt={logo.alt} width={80} height={80} className="rounded-full object-cover" />
            </Link>
            {tagline && (
              <p className="text-sm text-gray-500 leading-relaxed max-w-[200px]">
                {tagline}
              </p>
            )}
          </div>

          {/* Col 2: Quick Links */}
          {quickLinksCol && (
            <div className="flex flex-col gap-4">
              <h3
                className="text-xs font-extrabold uppercase tracking-[0.18em]"
                style={{ color: 'rgba(27, 34, 119, 1)' }}
              >
                {quickLinksCol.heading}
              </h3>
              <ul className="flex flex-col gap-2.5">
                {quickLinksCol.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-gray-500 transition-colors hover:text-gray-800"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Col 3: Location */}
          <div className="flex flex-col gap-4">
            <h3
              className="text-xs font-extrabold uppercase tracking-[0.18em]"
              style={{ color: 'rgba(27, 34, 119, 1)' }}
            >
              Location
            </h3>
            <address className="not-italic flex flex-col gap-1">
              <p className="text-sm text-gray-500 leading-relaxed">
                {contactInfo.address}
              </p>
              {contactInfo.directionsHref && (
                <a
                  href={contactInfo.directionsHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-semibold mt-2 transition-colors hover:opacity-80"
                  style={{ color: 'var(--church-green)' }}
                >
                  Get Directions
                </a>
              )}
            </address>
          </div>

          {/* Col 4: Social icons */}
          <div className="flex flex-row lg:flex-row items-start gap-3">
            {socialLinks
              .filter(s => ['instagram', 'youtube', 'facebook'].includes(s.platform))
              .map(({ platform, href }) => {
                const Icon = SOCIAL_ICON_MAP[platform]
                return (
                  <a
                    key={platform}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={SOCIAL_LABELS[platform]}
                    className="transition-opacity hover:opacity-80"
                  >
                    <Icon />
                  </a>
                )
              })}
          </div>

        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-gray-300">
        <p className="py-4 text-center text-xs text-gray-400">
          {copyrightText.replace('2025', new Date().getFullYear().toString())}
        </p>
      </div>
    </footer>
  )
}
