'use client'

import { useState } from 'react'
import type { FormEvent } from 'react'
import { CheckCircle2, Send } from 'lucide-react'
import {
  CHILDREN_AGE_GROUPS,
  type ChildrenAgeGroup,
} from '@/lib/types/inaugural-registration'

interface SuccessState {
  registrationId: string
  firstName: string
  lastName: string
}

export function InauguralRegisterForm() {
  const [status, setStatus] = useState<{ type: 'error'; message: string } | null>(
    null
  )
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [success, setSuccess] = useState<SuccessState | null>(null)
  const [fromOutside, setFromOutside] = useState(false)
  const [photoConsent, setPhotoConsent] = useState<boolean | null>(null)
  const [bringingChildren, setBringingChildren] = useState<boolean | null>(null)
  const [childAgeGroups, setChildAgeGroups] = useState<ChildrenAgeGroup[]>([])

  function toggleAgeGroup(group: ChildrenAgeGroup) {
    setChildAgeGroups((current) =>
      current.includes(group)
        ? current.filter((g) => g !== group)
        : [...current, group]
    )
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setStatus(null)
    setIsSubmitting(true)

    const form = event.currentTarget
    const formData = new FormData(form)
    const rawNumberOfChildren = formData.get('numberOfChildren')
    const numberOfChildren =
      bringingChildren && typeof rawNumberOfChildren === 'string' && rawNumberOfChildren.trim()
        ? Number(rawNumberOfChildren)
        : undefined
    const payload = {
      firstName: formData.get('firstName'),
      lastName: formData.get('lastName'),
      email: formData.get('email'),
      gender: formData.get('gender'),
      address: formData.get('address'),
      isRccgMember: formData.get('isRccgMember') === 'yes',
      fromOutsideBarnstaple: fromOutside,
      homeChurch: fromOutside ? formData.get('homeChurch') : undefined,
      photographyConsent: photoConsent ?? false,
      bringingChildren: bringingChildren ?? false,
      numberOfChildren,
      childrenAgeGroups: bringingChildren ? childAgeGroups : undefined,
      childrenSpecialNeeds: bringingChildren
        ? (formData.get('childrenSpecialNeeds') as string | null) ?? undefined
        : undefined,
    }

    try {
      if (photoConsent === null) {
        throw new Error('Please answer the photography question before submitting.')
      }
      if (bringingChildren === null) {
        throw new Error('Please tell us whether you are bringing children.')
      }
      const res = await fetch('/api/inaugural-service/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json().catch(() => ({}))

      if (res.ok && data.registrationId) {
        setSuccess({
          registrationId: data.registrationId,
          firstName: data.firstName,
          lastName: data.lastName,
        })
        form.reset()
        setFromOutside(false)
        setPhotoConsent(null)
        setBringingChildren(null)
        setChildAgeGroups([])
        return
      }

      if (res.status === 409 && data.registrationId) {
        setStatus({
          type: 'error',
          message: `This email is already registered. Your existing registration ID is ${data.registrationId}.`,
        })
        return
      }

      const detail = Array.isArray(data.details) ? data.details.join(' ') : null
      throw new Error(detail ?? data.error ?? 'Could not register. Please try again.')
    } catch (err) {
      setStatus({
        type: 'error',
        message: err instanceof Error ? err.message : 'Could not register.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (success) {
    return (
      <div className="mx-auto max-w-3xl rounded-2xl bg-white px-6 py-12 text-center shadow-[0_18px_50px_rgba(0,6,102,0.08)] md:px-10">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[#1b6d24]/10">
          <CheckCircle2 className="h-9 w-9 text-[#1b6d24]" aria-hidden="true" />
        </div>
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#1b6d24]">
          You&apos;re in
        </p>
        <h2 className="mt-3 text-3xl font-extrabold text-[#000666] md:text-4xl">
          Thank you, {success.firstName}!
        </h2>
        <p className="mt-4 text-sm leading-relaxed text-gray-600 md:text-base">
          Your registration is confirmed. A confirmation email is on its way to your inbox.
        </p>

        <div className="mx-auto mt-8 max-w-md rounded-xl border border-[#dde3f2] bg-[#f4f7ff] px-6 py-6 text-left">
          <p className="text-[0.7rem] font-extrabold uppercase tracking-[0.2em] text-[#000666]">
            Your registration ID
          </p>
          <p className="mt-2 font-mono text-3xl font-bold tracking-wider text-[#000666]">
            {success.registrationId}
          </p>
          <p className="mt-3 text-xs leading-relaxed text-gray-600">
            Save this email or screenshot this screen — you&apos;ll need this ID at the door so we can issue your printed badge.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setSuccess(null)}
          className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-[#000666] underline-offset-4 hover:underline"
        >
          Register someone else
        </button>
      </div>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto max-w-3xl rounded-2xl bg-white px-6 py-10 shadow-[0_18px_50px_rgba(0,6,102,0.08)] md:px-10"
    >
      <div className="border-b border-gray-200 pb-6">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#1b6d24]">
          Inaugural Service · 19 July 2026
        </p>
        <h1 className="mt-3 text-3xl font-extrabold leading-tight text-[#000666] md:text-4xl">
          Register your place
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-gray-600 md:text-base">
        We are delighted to invite you to this great banquet. The King of glory is here, come expectant
        </p>
      </div>

      <section className="mt-8 grid grid-cols-1 gap-x-6 gap-y-5 md:grid-cols-2">
        <Field name="firstName" label="First name" placeholder="Your first name" autoComplete="given-name" />
        <Field name="lastName" label="Last name" placeholder="Your last name" autoComplete="family-name" />
        <Field name="email" label="Email" placeholder="you@example.com" type="email" autoComplete="email" />
        <Select name="gender" label="Gender" options={[{ value: 'MALE', label: 'Male' }, { value: 'FEMALE', label: 'Female' }]} />
        <div className="md:col-span-2">
          <Field name="address" label="Address" placeholder="Your full address" autoComplete="street-address" />
        </div>
      </section>

      <section className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2">
        <YesNoQuestion
          name="isRccgMember"
          question="Are you a member of RCCG?"
        />
        <YesNoQuestion
          name="fromOutsideBarnstaple"
          question="Are you travelling from outside Barnstaple?"
          onChange={(v) => setFromOutside(v === 'yes')}
        />
      </section>

      {fromOutside && (
        <section className="mt-6">
          <Field
            name="homeChurch"
            label="Which church are you coming from?"
            placeholder="e.g. RCCG New Gate Church, Bedford"
          />
        </section>
      )}

      <section className="mt-6">
        <fieldset className="rounded-lg bg-gray-50 p-5">
          <legend className="mb-1 text-sm font-bold text-gray-900">
            Are you coming along with your children?
          </legend>
          <p className="mb-3 text-xs leading-relaxed text-gray-600">
            We&apos;d like to plan space, activities, and supervision in advance, so let us know if children will be joining you.
          </p>
          <div className="flex items-center gap-7">
            {(['Yes', 'No'] as const).map((answer) => (
              <label
                key={answer}
                className="flex items-center gap-2 text-sm text-gray-700"
              >
                <input
                  type="radio"
                  name="bringingChildren"
                  value={answer.toLowerCase()}
                  required
                  checked={bringingChildren === (answer === 'Yes')}
                  onChange={() => setBringingChildren(answer === 'Yes')}
                  className="h-4 w-4 border-gray-400 text-[#000666] focus:ring-[#000666]"
                />
                {answer}
              </label>
            ))}
          </div>

          {bringingChildren && (
            <div className="mt-5 space-y-5 border-t border-gray-200 pt-5">
              <label className="block max-w-xs">
                <span className="mb-2 block text-[0.7rem] font-extrabold uppercase tracking-[0.18em] text-gray-500">
                  How many children?
                </span>
                <input
                  type="number"
                  name="numberOfChildren"
                  min={1}
                  max={20}
                  required
                  placeholder="e.g. 2"
                  className="h-12 w-full rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-900 outline-none focus:border-[#000666] focus:ring-2 focus:ring-[#000666]/20"
                />
              </label>

              <div>
                <span className="mb-2 block text-[0.7rem] font-extrabold uppercase tracking-[0.18em] text-gray-500">
                  Age group(s) — tick all that apply
                </span>
                <div className="flex flex-wrap gap-2">
                  {CHILDREN_AGE_GROUPS.map((group) => {
                    const checked = childAgeGroups.includes(group)
                    return (
                      <label
                        key={group}
                        className={`inline-flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-semibold transition ${
                          checked
                            ? 'border-[#1b6d24] bg-[#1b6d24]/10 text-[#1b6d24]'
                            : 'border-gray-300 bg-white text-gray-700 hover:border-[#000666]'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleAgeGroup(group)}
                          className="h-3.5 w-3.5 rounded border-gray-400 text-[#1b6d24] focus:ring-[#1b6d24]"
                        />
                        {group}
                      </label>
                    )
                  })}
                </div>
              </div>

              <label className="block">
                <span className="mb-2 block text-[0.7rem] font-extrabold uppercase tracking-[0.18em] text-gray-500">
                  Any special needs we should be aware of? <span className="lowercase text-gray-400">(optional)</span>
                </span>
                <textarea
                  name="childrenSpecialNeeds"
                  rows={3}
                  maxLength={1000}
                  placeholder="Allergies, mobility, sensory needs, etc."
                  className="w-full resize-none rounded-lg border border-gray-300 bg-white p-4 text-sm leading-6 text-gray-900 outline-none focus:border-[#000666] focus:ring-2 focus:ring-[#000666]/20"
                />
              </label>
            </div>
          )}
        </fieldset>
      </section>

      <section className="mt-6">
        <fieldset className="rounded-lg bg-gray-50 p-5">
          <legend className="mb-1 text-sm font-bold text-gray-900">
            Would you like to be photographed?
          </legend>
          <p className="mb-3 text-xs leading-relaxed text-gray-600">
            We capture photos at the service for church publications and our website. Your answer here lets the photography team know in advance.
          </p>
          <div className="flex items-center gap-7">
            {(['Yes', 'No'] as const).map((answer) => (
              <label
                key={answer}
                className="flex items-center gap-2 text-sm text-gray-700"
              >
                <input
                  type="radio"
                  name="photographyConsent"
                  value={answer.toLowerCase()}
                  required
                  checked={photoConsent === (answer === 'Yes')}
                  onChange={() => setPhotoConsent(answer === 'Yes')}
                  className="h-4 w-4 border-gray-400 text-[#000666] focus:ring-[#000666]"
                />
                {answer}
              </label>
            ))}
          </div>
        </fieldset>
      </section>

      <div className="mx-auto mt-10 max-w-md text-center">
        {status && (
          <div
            role="alert"
            className="mb-6 rounded-md bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
          >
            {status.message}
          </div>
        )}
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-[#1b6d24] px-8 text-sm font-extrabold text-white shadow-[0_12px_22px_rgba(27,109,36,0.28)] transition-colors hover:bg-[#155a1d] disabled:opacity-60"
        >
          <Send className="h-4 w-4" />
          {isSubmitting ? 'Registering…' : 'Register for the service'}
        </button>
      </div>
    </form>
  )
}

function Field({
  name,
  label,
  placeholder,
  type = 'text',
  autoComplete,
}: {
  name: string
  label: string
  placeholder: string
  type?: string
  autoComplete?: string
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-[0.7rem] font-extrabold uppercase tracking-[0.18em] text-gray-500">
        {label}
      </span>
      <input
        name={name}
        type={type}
        required
        placeholder={placeholder}
        autoComplete={autoComplete}
        className="h-12 w-full rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-900 outline-none focus:border-[#000666] focus:ring-2 focus:ring-[#000666]/20"
      />
    </label>
  )
}

function Select({
  name,
  label,
  options,
}: {
  name: string
  label: string
  options: { value: string; label: string }[]
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-[0.7rem] font-extrabold uppercase tracking-[0.18em] text-gray-500">
        {label}
      </span>
      <select
        name={name}
        required
        defaultValue=""
        className="h-12 w-full rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-900 outline-none focus:border-[#000666] focus:ring-2 focus:ring-[#000666]/20"
      >
        <option value="" disabled>Select…</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </label>
  )
}

function YesNoQuestion({
  name,
  question,
  onChange,
}: {
  name: string
  question: string
  onChange?: (value: string) => void
}) {
  return (
    <fieldset className="rounded-lg bg-gray-50 p-5">
      <legend className="mb-3 text-sm font-bold text-gray-900">{question}</legend>
      <div className="flex items-center gap-7">
        {['Yes', 'No'].map((answer) => (
          <label key={answer} className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="radio"
              name={name}
              value={answer.toLowerCase()}
              required
              onChange={(e) => onChange?.(e.currentTarget.value)}
              className="h-4 w-4 border-gray-400 text-[#000666] focus:ring-[#000666]"
            />
            {answer}
          </label>
        ))}
      </div>
    </fieldset>
  )
}
