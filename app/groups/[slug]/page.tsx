import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { TopNavBar } from '@/components/church/nav-bar'
import { Footer } from '@/components/church/footer'
import { JoinGroupForm } from '@/components/church/join-group-form'
import { prisma } from '@/lib/prisma'
import type { GroupProgramme, GroupSpecialRole } from '@/lib/types/group'

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Narrow JsonValue into our typed list shapes safely. The DB might contain
 * legacy or partially-edited content; we tolerate it instead of crashing.
 */
function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.filter((v): v is string => typeof v === 'string')
}

function asProgrammeArray(value: unknown): GroupProgramme[] {
  if (!Array.isArray(value)) return []
  return value
    .filter(
      (v): v is { title: string; schedule?: string } =>
        typeof v === 'object' &&
        v !== null &&
        typeof (v as { title?: unknown }).title === 'string'
    )
    .map((v) => ({
      title: v.title,
      schedule: typeof v.schedule === 'string' ? v.schedule : undefined,
    }))
}

function asSpecialRole(value: unknown): GroupSpecialRole | null {
  if (
    typeof value !== 'object' ||
    value === null ||
    Array.isArray(value) ||
    typeof (value as { title?: unknown }).title !== 'string' ||
    typeof (value as { body?: unknown }).body !== 'string'
  ) {
    return null
  }
  return {
    title: (value as { title: string }).title,
    body: (value as { body: string }).body,
  }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function GroupDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  const group = await prisma.group.findUnique({
    where: { slug },
  })

  // Treat unpublished groups as not-found for the public page
  if (!group || !group.published) {
    notFound()
  }

  const responsibilities = asStringArray(group.responsibilities)
  const programmes = asProgrammeArray(group.programmes)
  const specialRole = asSpecialRole(group.specialRole)

  const hasResponsibilities = responsibilities.length > 0
  const hasProgrammes = programmes.length > 0
  const hasVisionPillars = Boolean(
    group.furnishStatement ?? group.transformStatement ?? group.influenceStatement
  )
  const hasBoardContent =
    hasResponsibilities || hasProgrammes || hasVisionPillars || Boolean(specialRole)

  return (
    <>
      <TopNavBar />

      {/* ── Hero / scripture banner ── */}
      <section
        className="relative w-full pt-20 pb-12 px-6 md:px-16"
        style={{ backgroundColor: 'rgba(0, 6, 102, 1)' }}
      >
        <div className="relative z-10 mx-auto max-w-[var(--container-max)]">
          <Link
            href="/groups"
            className="text-xs font-bold uppercase tracking-[0.2em] text-white/70 hover:text-white transition-colors"
          >
            ← All Ministries
          </Link>
          <h1 className="mt-4 text-3xl md:text-5xl font-extrabold text-white leading-tight">
            {group.title}
          </h1>
          {group.scripture && (
            <p
              className="mt-6 max-w-2xl border-l-4 pl-4 text-base italic leading-relaxed text-white/80"
              style={{ borderColor: 'var(--church-light-green, #5db174)' }}
            >
              {group.scripture}
            </p>
          )}
        </div>
      </section>

      {/* ── Image strip ── */}
      <section className="w-full" style={{ backgroundColor: 'rgba(249, 249, 249, 1)' }}>
        <div className="mx-auto max-w-[var(--container-max)] px-6 md:px-16 py-8">
          <div className="relative w-full overflow-hidden rounded-2xl" style={{ aspectRatio: '16 / 6' }}>
            <Image
              src={group.imageSrc}
              alt={group.imageAlt}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 1200px"
              priority
            />
          </div>
          <p className="mt-6 text-base leading-relaxed text-gray-700 max-w-3xl">
            {group.description}
          </p>
        </div>
      </section>

      {/* ── Departmental Board (only if there is any content) ── */}
      {hasBoardContent && (
        <section className="w-full bg-white py-12 px-6 md:px-16">
          <div className="mx-auto max-w-[var(--container-max)]">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Column 1 — Head of [Ministry] */}
              {(group.headTitle || hasResponsibilities) && (
                <div className="rounded-2xl overflow-hidden border border-gray-100 bg-white shadow-sm">
                  <div
                    className="px-5 py-3 text-white font-bold tracking-wide text-sm uppercase"
                    style={{ backgroundColor: 'rgba(0, 6, 102, 1)' }}
                  >
                    {group.headTitle ?? 'Head of Ministry'}
                  </div>
                  {hasResponsibilities ? (
                    <ol className="p-6 space-y-4">
                      {responsibilities.map((item, i) => (
                        <li key={i} className="flex gap-3 text-sm leading-relaxed text-gray-700">
                          <span className="font-bold text-gray-400 flex-none w-5 text-right">
                            {i + 1}.
                          </span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ol>
                  ) : (
                    <div className="p-6 text-sm text-gray-400 italic">
                      Responsibilities to be added.
                    </div>
                  )}
                </div>
              )}

              {/* Column 2 — Programmes & Sub-Units */}
              {(hasProgrammes || specialRole) && (
                <div className="rounded-2xl overflow-hidden border border-gray-100 bg-white shadow-sm">
                  <div
                    className="px-5 py-3 text-white font-bold tracking-wide text-sm uppercase"
                    style={{ backgroundColor: 'rgba(0, 6, 102, 1)' }}
                  >
                    Programmes &amp; Sub-Units
                  </div>
                  <div className="p-5 space-y-3">
                    {programmes.map((p, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-3 border-l-4 pl-3 py-1"
                        style={{ borderColor: 'rgba(0, 6, 102, 0.2)' }}
                      >
                        <p className="text-sm leading-relaxed text-gray-800">
                          <span className="font-semibold">{p.title}</span>
                          {p.schedule && (
                            <>
                              {' '}
                              <span className="text-xs text-gray-500">— {p.schedule}</span>
                            </>
                          )}
                        </p>
                      </div>
                    ))}
                    {specialRole && (
                      <div
                        className="mt-2 rounded-lg p-4 border"
                        style={{
                          borderColor: 'rgba(0, 6, 102, 0.15)',
                          backgroundColor: 'rgba(232, 238, 255, 0.4)',
                        }}
                      >
                        <p className="text-[10px] font-extrabold uppercase tracking-widest mb-1.5" style={{ color: 'rgba(0, 6, 102, 1)' }}>
                          {specialRole.title}
                        </p>
                        <p className="text-sm leading-relaxed text-gray-700">
                          {specialRole.body}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Column 3 — Vision Alignment */}
              {hasVisionPillars && (
                <div className="rounded-2xl overflow-hidden border border-gray-100 bg-white shadow-sm">
                  <div
                    className="px-5 py-3 text-white font-bold tracking-wide text-sm uppercase"
                    style={{ backgroundColor: 'rgba(0, 6, 102, 1)' }}
                  >
                    Vision Alignment
                  </div>
                  <div className="p-5 space-y-4">
                    {group.scripture && (
                      <p className="text-xs italic leading-relaxed text-gray-500">
                        &ldquo;{group.scripture}&rdquo;
                      </p>
                    )}
                    <div className="grid grid-cols-3 gap-2">
                      <PillarBox
                        label="FURNISH"
                        body={group.furnishStatement}
                        bg="rgba(0, 6, 102, 1)"
                      />
                      <PillarBox
                        label="TRANSFORM"
                        body={group.transformStatement}
                        bg="rgba(27, 109, 36, 1)"
                      />
                      <PillarBox
                        label="INFLUENCE"
                        body={group.influenceStatement}
                        bg="rgba(173, 38, 38, 1)"
                      />
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <p className="text-[10px] font-extrabold uppercase tracking-widest text-gray-500 mb-3">
                        How we serve the vision
                      </p>
                      {group.furnishStatement && (
                        <p className="mb-2 text-sm leading-relaxed text-gray-700">
                          <span className="font-bold" style={{ color: 'rgba(0, 6, 102, 1)' }}>FURNISH:</span>{' '}
                          {group.furnishStatement}
                        </p>
                      )}
                      {group.transformStatement && (
                        <p className="mb-2 text-sm leading-relaxed text-gray-700">
                          <span className="font-bold" style={{ color: 'rgba(27, 109, 36, 1)' }}>TRANSFORM:</span>{' '}
                          {group.transformStatement}
                        </p>
                      )}
                      {group.influenceStatement && (
                        <p className="text-sm leading-relaxed text-gray-700">
                          <span className="font-bold" style={{ color: 'rgba(173, 38, 38, 1)' }}>INFLUENCE:</span>{' '}
                          {group.influenceStatement}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* CTA */}
            {group.ctaLabel && group.ctaHref && (
              <div className="mt-10 text-center">
                <Link
                  href={group.ctaHref}
                  className="inline-flex items-center justify-center px-6 py-3 rounded-lg text-sm font-bold text-white transition-opacity hover:opacity-90"
                  style={{ backgroundColor: 'rgba(27, 34, 119, 1)' }}
                >
                  {group.ctaLabel}
                </Link>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── Get Involved form ── */}
      <JoinGroupForm groupId={group.id} groupTitle={group.title} />

      <Footer
        logo={{ src: '/logo.png', alt: 'RCCG Glory Tabernacle, Barnstaple' }}
        tagline="Furnish  ·  Transform  ·  Influence"
        columns={[
          {
            heading: 'Quick Links',
            links: [
              { label: 'Home', href: '/' },
              { label: 'About', href: '/about' },
              { label: 'Groups', href: '/groups' },
              { label: 'Events', href: '/events' },
            ],
          },
        ]}
        socialLinks={[
          { platform: 'instagram', href: 'https://www.instagram.com/glorytabernaclebarnstaple?igsh=MWkxaTF0Yjd1czk3Mg%3D%3D&utm_source=qr' },
          { platform: 'youtube', href: 'https://www.youtube.com/@glorytabernaclehq' },
          { platform: 'facebook', href: 'https://www.facebook.com/share/1CDurcWmxG/?mibextid=wwXIfr' },
          { platform: 'x', href: 'https://x.com/rccggthq' },
          { platform: 'tiktok', href: 'https://www.tiktok.com/@rccgglorytabernaclebarns?_r=1&_t=ZN-965RffiNMP8X' },
        ]}
        contactInfo={{
          address: 'North Devon College, Old Sticklepath Hill Barnstaple EX31 2BQ England',
          phone: '+1 (555) 123-4567',
          email: 'info@rccgglory.org',
          directionsHref: 'https://maps.google.com',
        }}
        copyrightText={`© ${new Date().getFullYear()} RCCG Glory Tabernacle, Barnstaple. All rights reserved.`}
      />
    </>
  )
}

function PillarBox({
  label,
  body,
  bg,
}: {
  label: string
  body: string | null
  bg: string
}) {
  return (
    <div
      className="rounded-md text-white p-2.5 flex flex-col"
      style={{ backgroundColor: body ? bg : 'rgba(180,180,180,0.4)' }}
    >
      <p className="text-[9px] font-extrabold uppercase tracking-widest text-center">
        {label}
      </p>
      <p className="mt-1.5 text-[10px] leading-snug text-white/90 flex-1">
        {body ?? '—'}
      </p>
    </div>
  )
}
