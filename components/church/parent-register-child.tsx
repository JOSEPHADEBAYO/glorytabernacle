'use client'

import { useState } from 'react'
import {
  ChildForm,
  EMPTY_CHILD_FORM,
} from '@/components/dashboard/child-form'

/**
 * Public-facing child registration card on /parent/register.
 *
 * Reuses the same ChildForm component the Children Leader uses inside
 * /dashboard/children → "Register a child". The difference is purely the
 * endpoints:
 *   - Photo upload  → /api/parent/upload-child-photo  (public, image-only)
 *   - Form submit   → /api/parent/register-child      (public, no auth)
 *
 * Parents cannot sign children in or out from here — that's a staff action
 * inside /dashboard/children.
 */
export function ParentRegisterChild() {
  const [success, setSuccess] = useState<{
    firstName: string
    lastName: string
  } | null>(null)

  if (success) {
    return (
      <div className="px-6 py-10 text-center">
        <div
          className="mx-auto flex h-12 w-12 items-center justify-center rounded-full"
          style={{ backgroundColor: 'var(--church-green, #0D8A4A)' }}
          aria-hidden="true"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth={3}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-6 w-6"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h2
          className="mt-5 text-2xl font-extrabold"
          style={{ color: 'rgba(27, 34, 119, 1)' }}
        >
          Thanks — we&apos;ve received {success.firstName}&apos;s details
        </h2>
        <p className="mt-3 text-sm text-gray-600 leading-relaxed max-w-md mx-auto">
          For safeguarding, every parent-submitted registration is reviewed
          by our Children&apos;s Leader before {success.firstName} {success.lastName} appears on
          the roster. We&apos;ll have you set up before Sunday — if anything
          needs checking, we&apos;ll be in touch on the contact details
          you provided.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={() => setSuccess(null)}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Register another child
          </button>
          <a
            href="/"
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Back to home
          </a>
        </div>
      </div>
    )
  }

  return (
    <ChildForm
      initialValues={EMPTY_CHILD_FORM}
      uploadEndpoint="/api/parent/upload-child-photo"
      submitLabel="Register child"
      onSubmit={async (values) => {
        const res = await fetch('/api/parent/register-child', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(values),
        })
        if (!res.ok) {
          const json = await res.json().catch(() => ({}))
          // Surface server validation messages where useful.
          if (json.details && Array.isArray(json.details) && json.details.length > 0) {
            throw new Error(
              json.details
                .map((d: { field: string; message: string }) => `${d.field}: ${d.message}`)
                .join('; ')
            )
          }
          throw new Error(json.error ?? 'Could not register your child.')
        }
        setSuccess({ firstName: values.firstName, lastName: values.lastName })
      }}
    />
  )
}
