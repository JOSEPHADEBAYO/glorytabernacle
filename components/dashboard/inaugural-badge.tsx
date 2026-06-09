'use client'

import QRCode from 'react-qr-code'
import { Printer, X } from 'lucide-react'
import { INAUGURAL_THEME } from '@/lib/types/inaugural-registration'

export interface BadgeData {
  registrationId: string
  firstName: string
  lastName: string
  /** Where the registrant is from. Either "Member of RCCG Glory Tabernacle"
   *  for locals, or the home-church name for visitors. */
  subtitle: string
  /** Full URL the QR code resolves to. Encoded straight into the QR. */
  qrTarget: string
}

interface InauguralBadgeProps {
  data: BadgeData
  onClose?: () => void
}

/**
 * Printable badge for an inaugural-service registrant. Designed to be
 * printed at A6 (105×148mm) or similar — anything roughly portrait.
 *
 * The wrapping dashboard-only chrome (close button, toolbar) is hidden via a
 * print stylesheet so the printed page contains nothing but the badge
 * itself.
 */
export function InauguralBadge({ data, onClose }: InauguralBadgeProps) {
  return (
    <>
      <style>{`
        @media print {
          /* Hide everything except the badge wrapper when printing. */
          body * { visibility: hidden !important; }
          #inaugural-badge-print-root,
          #inaugural-badge-print-root * { visibility: visible !important; }
          #inaugural-badge-print-root {
            position: fixed !important;
            inset: 0 !important;
            background: white !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
          }
          #inaugural-badge-toolbar { display: none !important; }
          @page { size: A6 portrait; margin: 8mm; }
        }
      `}</style>

      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
          aria-hidden="true"
        />

        <div className="relative w-full max-w-md">
          {/* Toolbar — print + close, hidden when printing. */}
          <div
            id="inaugural-badge-toolbar"
            className="mb-4 flex items-center justify-between rounded-xl bg-white px-4 py-3 shadow-lg"
          >
            <p className="text-sm font-semibold text-gray-700">
              Badge preview
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-2 rounded-lg bg-[#000666] px-4 py-2 text-xs font-bold text-white hover:opacity-90"
              >
                <Printer className="h-4 w-4" aria-hidden="true" />
                Print badge
              </button>
              {onClose && (
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close"
                  className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              )}
            </div>
          </div>

          {/* The badge itself — print scope wraps this root. */}
          <div id="inaugural-badge-print-root">
            <BadgeCard data={data} />
          </div>
        </div>
      </div>
    </>
  )
}

/**
 * Pure badge card — no chrome. Exported separately so it could be rendered
 * inline anywhere else (e.g. a future "wallet" page) without the modal
 * wrapper.
 */
export function BadgeCard({ data }: { data: BadgeData }) {
  return (
    <div
      className="overflow-hidden rounded-2xl bg-white shadow-2xl"
      style={{
        width: '88mm',
        margin: '0 auto',
        border: '2px solid rgba(0,6,102,0.12)',
      }}
    >
      {/* Header — navy gradient with eyebrow + event name + date. */}
      <div
        className="relative px-6 pt-6 pb-5 text-center text-white"
        style={{
          background:
            'linear-gradient(135deg, rgba(0,6,102,1) 0%, rgba(27,34,119,1) 60%, rgba(0,6,102,1) 100%)',
        }}
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full opacity-40"
          style={{
            background:
              'radial-gradient(circle, rgba(163,246,156,0.4) 0%, rgba(0,6,102,0) 70%)',
          }}
        />
        <p
          className="text-[0.55rem] font-bold uppercase tracking-[0.3em]"
          style={{ color: 'rgba(163,246,156,1)' }}
        >
          A Brand New Beginning
        </p>
        <h2 className="mt-1 font-serif text-xl font-extrabold leading-tight">
          Inaugural Service
        </h2>
        <p
          className="mt-1.5 font-serif text-[0.78rem] italic leading-tight"
          style={{ color: 'rgba(163,246,156,1)' }}
        >
          Theme: <span className="font-bold not-italic">{INAUGURAL_THEME.title}</span> · {INAUGURAL_THEME.scripture}
        </p>
        <p className="mt-1.5 text-[0.65rem] font-semibold tracking-wider text-white/80">
          Sunday · 19 July 2026
        </p>
      </div>

      {/* Name block */}
      <div className="px-6 pt-7 pb-3 text-center">
        <p
          className="text-base font-medium uppercase tracking-[0.18em] text-gray-500"
          style={{ letterSpacing: '0.16em' }}
        >
          {data.firstName}
        </p>
        <p
          className="mt-1 text-3xl font-extrabold leading-tight"
          style={{ color: 'rgba(0,6,102,1)' }}
        >
          {data.lastName}
        </p>
        <p className="mt-3 text-xs italic text-gray-600">{data.subtitle}</p>
      </div>

      {/* QR code */}
      <div className="flex flex-col items-center px-6 pb-4">
        <div
          className="rounded-lg bg-white p-2"
          style={{ border: '1px solid rgba(0,6,102,0.08)' }}
        >
          <QRCode
            value={data.qrTarget}
            size={120}
            level="M"
            bgColor="#ffffff"
            fgColor="#000666"
          />
        </div>
        <p
          className="mt-3 font-mono text-sm font-bold tracking-wider"
          style={{ color: 'rgba(0,6,102,1)' }}
        >
          {data.registrationId}
        </p>
      </div>

      {/* Footer disclaimer */}
      <div
        className="px-6 pb-4 text-center"
        style={{ borderTop: '1px solid rgba(0,6,102,0.06)' }}
      >
        <p className="mt-3 text-[0.55rem] uppercase tracking-[0.18em] text-gray-400">
          © RCCG Glory Tabernacle, Barnstaple · Please wear at all times during the service
        </p>
      </div>
    </div>
  )
}
