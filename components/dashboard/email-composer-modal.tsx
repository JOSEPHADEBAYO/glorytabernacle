'use client'

import { useState } from 'react'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface EmailRecipient {
  id?: string
  name: string
  email: string
}

export interface EmailSendResult {
  sent: number
  failed: number
  errors?: Array<{ email: string; reason: string }>
}

/**
 * Discriminated union for the recipient target. Drives the "Sending to:"
 * header and what payload the modal builds.
 */
export type EmailComposerTarget =
  | { kind: 'single'; recipient: EmailRecipient }
  | { kind: 'multi'; recipients: EmailRecipient[]; label?: string }
  | { kind: 'all'; label: string }

interface EmailComposerModalProps {
  target: EmailComposerTarget
  /** API endpoint that accepts the composed email. */
  sendEndpoint: string
  /**
   * Build the request body sent to `sendEndpoint`. The composer hands you
   * the validated form fields (subject/body/ctaLabel/ctaHref) and the
   * current target — you return whatever JSON the endpoint expects.
   */
  buildPayload: (args: {
    target: EmailComposerTarget
    subject: string
    body: string
    ctaLabel?: string
    ctaHref?: string
  }) => Record<string, unknown>
  onClose: () => void
  onSent: (result: EmailSendResult) => void
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Shared admin email composer used by every dashboard table that has a
 * "Send Email" action (members, new-members, volunteers, program-interest,
 * etc.). Visual + behavioural parity guaranteed since they share one
 * component.
 */
export function EmailComposerModal({
  target,
  sendEndpoint,
  buildPayload,
  onClose,
  onSent,
}: EmailComposerModalProps) {
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [ctaLabel, setCtaLabel] = useState('')
  const [ctaHref, setCtaHref] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const recipientLabel = describeTarget(target)

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const trimmedLabel = ctaLabel.trim()
    const trimmedHref = ctaHref.trim()

    // Keep CTA fields paired client-side so we don't round-trip a 400.
    if (Boolean(trimmedLabel) !== Boolean(trimmedHref)) {
      setError(
        'Fill in both the CTA label and the CTA URL — or leave both blank.'
      )
      return
    }

    setIsSending(true)
    try {
      const payload = buildPayload({
        target,
        subject: subject.trim(),
        body: body.trim(),
        ctaLabel: trimmedLabel.length > 0 ? trimmedLabel : undefined,
        ctaHref: trimmedHref.length > 0 ? trimmedHref : undefined,
      })

      const res = await fetch(sendEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (res.ok) {
        const result = (await res.json()) as EmailSendResult
        onSent(result)
      } else {
        const data = await res.json().catch(() => ({}))
        setError(data.error ?? 'Could not send. Please try again.')
      }
    } catch (err) {
      console.error('Email composer send error:', err)
      setError('Unable to reach the server. Please try again.')
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="composer-title"
    >
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
          <h2
            id="composer-title"
            className="text-xl font-bold"
            style={{ color: 'rgba(27, 34, 119, 1)' }}
          >
            Compose Email
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close composer"
            className="text-gray-400 hover:text-gray-600"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSend} className="p-6 space-y-4">
          {error && (
            <div role="alert" className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="rounded-lg bg-blue-50 border border-blue-200 px-4 py-3 text-sm text-blue-800">
            <span className="font-semibold">Sending to:</span> {recipientLabel}
          </div>

          <div>
            <label htmlFor="email-subject" className="block text-sm font-medium text-gray-700 mb-2">
              Subject *
            </label>
            <input
              id="email-subject"
              type="text"
              required
              maxLength={200}
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Welcome to Glory Tabernacle"
              className="w-full px-4 py-2 bg-white text-gray-900 placeholder-gray-400 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>

          <div>
            <label htmlFor="email-body" className="block text-sm font-medium text-gray-700 mb-2">
              Message *
            </label>
            <textarea
              id="email-body"
              required
              maxLength={20000}
              rows={10}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write your message. Blank lines become paragraphs in the email."
              className="w-full px-4 py-2 bg-white text-gray-900 placeholder-gray-400 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none font-mono text-sm"
            />
            <p className="mt-1 text-xs text-gray-500">
              Each recipient&apos;s greeting (&ldquo;Hi &lt;name&gt;,&rdquo;) is added automatically.
            </p>
          </div>

          {/* Optional CTA button */}
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-3">
            <div>
              <p className="text-sm font-semibold text-gray-900">
                Call-to-action button <span className="text-gray-500 font-normal">(optional)</span>
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Adds a green button under the message. Leave both blank to skip.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="email-cta-label" className="block text-xs font-medium text-gray-700 mb-1">
                  Button label
                </label>
                <input
                  id="email-cta-label"
                  type="text"
                  maxLength={60}
                  value={ctaLabel}
                  onChange={(e) => setCtaLabel(e.target.value)}
                  placeholder="e.g. Register Now"
                  className="w-full px-3 py-2 bg-white text-gray-900 placeholder-gray-400 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                />
              </div>
              <div>
                <label htmlFor="email-cta-href" className="block text-xs font-medium text-gray-700 mb-1">
                  Button URL
                </label>
                <input
                  id="email-cta-href"
                  type="url"
                  value={ctaHref}
                  onChange={(e) => setCtaHref(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-2 bg-white text-gray-900 placeholder-gray-400 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSending}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSending}
              className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {isSending ? 'Sending…' : 'Send'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function describeTarget(target: EmailComposerTarget): string {
  if (target.kind === 'single') {
    return `${target.recipient.name} (${target.recipient.email})`
  }
  if (target.kind === 'multi') {
    return target.label ?? `${target.recipients.length} recipients`
  }
  return target.label
}

/**
 * Shared toast formatter for send results. Useful so every consumer
 * reports outcomes the same way.
 */
export function formatSendResultToast(result: EmailSendResult): {
  title: string
  description?: string
  variant: 'success' | 'warning'
} {
  if (result.failed > 0) {
    return {
      title: `Sent ${result.sent}, ${result.failed} failed`,
      description:
        result.errors?.[0]?.reason ??
        'Check the server logs for per-recipient details.',
      variant: 'warning',
    }
  }
  return {
    title: `Sent to ${result.sent} ${result.sent === 1 ? 'recipient' : 'recipients'}`,
    variant: 'success',
  }
}
