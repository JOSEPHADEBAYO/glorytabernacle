import type { Metadata } from 'next'
import { TopNavBar } from '@/components/church/nav-bar'
import { ParentDataRequest } from '@/components/church/parent-data-request'

export const metadata: Metadata = {
  title: 'Request data erasure — RCCG Glory Tabernacle, Barnstaple',
  description:
    "Ask RCCG Glory Tabernacle, Barnstaple to erase your child's personal data under your UK GDPR right to erasure.",
}

/**
 * Public right-to-erasure request page. A parent/guardian lodges a request to
 * have their child's data erased; the Children's Leader reviews and actions it
 * from the dashboard after verifying identity. Nothing is deleted on submit.
 */
export default function ParentDataRequestPage() {
  return (
    <>
      <TopNavBar />
      <main className="min-h-[60vh] py-16 px-6">
        <div className="mx-auto max-w-2xl">
          <div className="text-center mb-8">
            <p
              className="text-xs font-bold uppercase tracking-[0.2em] pt-5"
              style={{ color: 'var(--church-red, rgba(230, 17, 17, 1))' }}
            >
              Your data rights
            </p>
            <h1
              className="mt-2 text-3xl font-extrabold leading-tight"
              style={{ color: 'rgba(27, 34, 119, 1)' }}
            >
              Request erasure of your child&apos;s data
            </h1>
            <p className="mt-3 text-sm text-gray-600 leading-relaxed">
              Under UK GDPR you can ask us to erase the personal data we hold
              about your child. Fill in the form below and our Children&apos;s
              Leader will review it. We may contact you to confirm your
              identity before anything is erased.
            </p>
          </div>

          <div className="rounded-2xl bg-white border border-gray-200 shadow-sm">
            <ParentDataRequest />
          </div>
        </div>
      </main>
    </>
  )
}
