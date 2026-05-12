'use client'

import { useState } from 'react'
import type { FormEvent } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  Building2,
  CheckCircle2,
  MapPin,
  UserRound,
} from 'lucide-react'
import { TopNavBar } from '@/components/church/nav-bar'
import { useToast } from '@/components/ui/toast-provider'

const MEMBERSHIP_CLASSES = [
  {
    name: 'Foundation Class',
    description: 'Starting the journey of faith.',
  },
  {
    name: 'Maturity Class',
    description: 'Deepening your spiritual roots.',
  },
  {
    name: 'School of Ministry',
    description: 'Equipping for leadership and service.',
  },
]

const EXPECTATIONS = [
  {
    tag: 'The Vision',
    title: 'Authentic Community',
    description:
      'We believe that real growth happens in the context of relationships. Membership connects you to circles of support and accountability.',
  },
  {
    tag: 'The Mission',
    title: 'Shared Purpose',
    description:
      'Discover your place in the work God is doing through Glory Tabernacle and serve with clarity, joy, and commitment.',
  },
]

function InstagramIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <rect width="32" height="32" rx="8" fill="url(#member-ig-grad)" />
      <defs>
        <radialGradient id="member-ig-grad" cx="30%" cy="107%" r="130%">
          <stop offset="0%" stopColor="#fdf497" />
          <stop offset="45%" stopColor="#fd5949" />
          <stop offset="60%" stopColor="#d6249f" />
          <stop offset="90%" stopColor="#285AEB" />
        </radialGradient>
      </defs>
      <rect x="9" y="9" width="14" height="14" rx="4" stroke="white" strokeWidth="1.5" />
      <circle cx="16" cy="16" r="3.5" stroke="white" strokeWidth="1.5" />
      <circle cx="21" cy="11" r="1" fill="white" />
    </svg>
  )
}

function YoutubeIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <rect width="32" height="32" rx="8" fill="#FF0000" />
      <path d="M23.5 16c0 1.3-.1 2.6-.35 3.45-.22.76-.82 1.36-1.58 1.56-1.39.37-6.57.37-6.57.37s-5.18 0-6.57-.37a2.18 2.18 0 0 1-1.58-1.56C6.6 18.6 6.5 17.3 6.5 16s.1-2.6.35-3.45c.22-.76.82-1.36 1.58-1.56 1.39-.37 6.57-.37 6.57-.37s5.18 0 6.57.37c.76.2 1.36.8 1.58 1.56.25.85.35 2.15.35 3.45z" fill="white" />
      <path d="M14 18.75v-5.5L18.75 16 14 18.75z" fill="#FF0000" />
    </svg>
  )
}

function FacebookIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <rect width="32" height="32" rx="8" fill="#1877F2" />
      <path d="M21 16h-3v9h-4v-9h-2v-3h2v-2c0-2.2 1.3-3.5 3.3-3.5.9 0 1.9.1 2.7.2v3h-1.8c-1 0-1.2.5-1.2 1.2V13h3l-.5 3z" fill="white" />
    </svg>
  )
}

function TikTokIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <rect width="32" height="32" rx="8" fill="#000000" />
      <path d="M22 11.5c-.8-.5-1.4-1.3-1.6-2.2h-2.2v9.4c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2c.2 0 .4 0 .6.1v-2.3c-.2 0-.4-.1-.6-.1-2.3 0-4.2 1.9-4.2 4.2s1.9 4.2 4.2 4.2 4.2-1.9 4.2-4.2v-5c.8.6 1.8.9 2.8.9v-2.2c-.5 0-1-.3-1.2-.8z" fill="white" />
    </svg>
  )
}

function XIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <rect width="32" height="32" rx="8" fill="#000000" />
      <path d="M19.24 14.53 24.48 9h-1.25l-4.55 5.29L14.9 9H10l5.49 7.99L10 25h1.24l4.81-5.58L20.1 25H25l-5.76-10.47Zm-1.7 1.97-.56-.79-4.43-6.34h1.75l3.58 5.12.56.79 4.64 6.65h-1.74l-3.8-5.43Z" fill="white" />
    </svg>
  )
}

function Field({
  name,
  label,
  placeholder,
  type = 'text',
}: {
  name: string
  label: string
  placeholder: string
  type?: string
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-[0.7rem] font-extrabold uppercase tracking-[0.18em] text-[#8a8f9c]">
        {label}
      </span>
      <input
        name={name}
        type={type}
        required
        placeholder={placeholder}
        className="h-12 w-full border-0 bg-[#f0f0f0] px-4 text-sm text-[#30323a] outline-none placeholder:text-[#9aa0aa] focus:ring-2 focus:ring-[#000666]"
      />
    </label>
  )
}

function SelectField({
  name,
  label,
  placeholder,
  options,
}: {
  name: string
  label: string
  placeholder: string
  options: Array<{ label: string; value: string }>
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-[0.7rem] font-extrabold uppercase tracking-[0.18em] text-[#8a8f9c]">
        {label}
      </span>
      <select
        name={name}
        required
        defaultValue=""
        className="h-12 w-full border-0 bg-[#f0f0f0] px-4 text-sm text-[#30323a] outline-none focus:ring-2 focus:ring-[#000666]"
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  )
}

function SectionTitle({
  icon,
  children,
}: {
  icon: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="mb-6 flex items-center gap-2">
      <span className="text-[#000666]">{icon}</span>
      <h2 className="text-2xl font-extrabold leading-tight text-[#000666]">
        {children}
      </h2>
    </div>
  )
}

function RadioPair({ question, name }: { question: string; name: string }) {
  return (
    <fieldset className="bg-[#f2f2f2] p-6">
      <legend className="mb-4 text-sm font-bold text-[#30323a]">
        {question}
      </legend>
      <div className="flex items-center gap-7">
        {['Yes', 'No'].map((answer) => (
          <label key={answer} className="flex items-center gap-2 text-sm text-[#5d6470]">
            <input
              type="radio"
              name={name}
              value={answer.toLowerCase()}
              required
              className="h-4 w-4 border-[#a8afba] text-[#000666] focus:ring-[#000666]"
            />
            {answer}
          </label>
        ))}
      </div>
    </fieldset>
  )
}

function ExpectationCard({
  tag,
  title,
  description,
}: {
  tag: string
  title: string
  description: string
}) {
  return (
    <article className="relative min-h-[18rem] overflow-hidden rounded-md shadow-sm">
      <Image
        src="/fellowship.png"
        alt=""
        fill
        className="object-cover"
        sizes="(max-width: 1024px) 100vw, 50vw"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#000666] via-[#000666]/65 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 p-8 text-white">
        <span className="mb-4 inline-flex bg-[#1b6d24] px-4 py-1 text-[0.65rem] font-extrabold uppercase tracking-[0.18em]">
          {tag}
        </span>
        <h3 className="text-3xl font-extrabold leading-tight">{title}</h3>
        <p className="mt-4 max-w-[34rem] text-sm leading-7 text-white/85">
          {description}
        </p>
      </div>
    </article>
  )
}

function MembershipFooter() {
  return (
    <footer className="bg-[#000666] text-white">
      <div className="mx-auto grid max-w-[var(--container-max)] grid-cols-1 gap-10 px-[var(--section-padding-x)] py-14 md:grid-cols-[1.2fr_0.8fr_1fr_auto]">
        <div>
          <Image
            src="/logo-with-no-bg.png"
            alt="RCCG Glory Tabernacle"
            width={92}
            height={92}
            className="rounded-full"
          />
          <p className="mt-6 max-w-[16rem] text-sm leading-7 text-white/70">
            Furnishing, transforming and influencing lives through faith,
            fellowship and community.
          </p>
        </div>

        <div>
          <h3 className="mb-5 text-xs font-extrabold uppercase tracking-[0.22em]">
            Quick Links
          </h3>
          <ul className="space-y-3 text-sm text-white/70">
            {[
              ['Home', '/'],
              ['About', '/about'],
              ['Media', '/sermons'],
              ['Volunteer', '/volunteer'],
              ['Connect', '/contact'],
            ].map(([label, href]) => (
              <li key={href}>
                <Link href={href} className="transition-colors hover:text-white">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="mb-5 text-xs font-extrabold uppercase tracking-[0.22em]">
            Location
          </h3>
          <p className="max-w-[16rem] text-sm leading-7 text-white/70">
            North Devon College, Old Sticklepath Hill Barnstaple EX31 2BQ
            England
          </p>
          <Link
            href="https://maps.google.com"
            className="mt-3 inline-flex text-sm font-bold text-[#55b45c]"
          >
            Get Directions
          </Link>
        </div>

        <div className="flex gap-4">
          <InstagramIcon />
          <YoutubeIcon />
          <FacebookIcon />
          <TikTokIcon />
          <XIcon />
        </div>
      </div>
      <div className="border-t border-white/20 py-6 text-center text-xs text-white/60">
        © {new Date().getFullYear()} Glory Tabernacle. All rights reserved.
      </div>
    </footer>
  )
}

export default function BecomeMemberPage() {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [status, setStatus] = useState<{
    type: 'success' | 'error'
    message: string
  } | null>(null)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSubmitting(true)
    setStatus(null)

    const form = event.currentTarget
    const formData = new FormData(form)
    const payload = {
      membershipClass: formData.get('membershipClass'),
      firstName: formData.get('firstName'),
      lastName: formData.get('lastName'),
      email: formData.get('email'),
      phoneNumber: formData.get('phoneNumber'),
      gender: formData.get('gender'),
      maritalStatus: formData.get('maritalStatus'),
      streetAddress: formData.get('streetAddress'),
      city: formData.get('city'),
      stateProvince: formData.get('stateProvince'),
      country: formData.get('country'),
      rccgMember: formData.get('rccgMember') === 'yes',
      saved: formData.get('saved') === 'yes',
      expectations: formData.get('expectations'),
    }

    try {
      const res = await fetch('/api/membership-applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        const details = Array.isArray(data.details)
          ? data.details.join(' ')
          : undefined
        const message = details ?? data.error ?? 'Failed to submit application'
        if (res.status === 409) {
          toast({
            title: 'Email already exists',
            description:
              'A membership application has already been submitted with this email address.',
            variant: 'error',
            duration: 6000,
          })
        }
        throw new Error(message)
      }

      form.reset()
      toast({
        title: 'Application submitted',
        description:
          'Thank you. Your membership application has been received.',
        variant: 'success',
      })
      setStatus({
        type: 'success',
        message:
          'Thank you. Your membership application has been received, and our team will follow up with you.',
      })
    } catch (error) {
      setStatus({
        type: 'error',
        message:
          error instanceof Error
            ? error.message
            : 'Unable to submit your application. Please try again.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <TopNavBar />
      <main className="bg-[#f4f4f4]">
        <section className="relative flex min-h-[26rem] items-center justify-center overflow-hidden pt-16 text-center">
          <Image
            src="/join.png"
            alt=""
            fill
            priority
            className="object-cover object-center"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-[#000666]/82" />
          <div className="relative z-10 mx-auto max-w-4xl px-6">
            <div
              className="mx-auto mb-6 h-3 w-3 rounded-sm bg-[#1b6d24]"
              aria-hidden="true"
            />
            <h1 className="text-5xl font-extrabold leading-tight text-white md:text-6xl">
              Church Membership
            </h1>
            <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-white/70 md:text-xl">
              Join our growing community and find a place to belong, grow, and
              serve. Our membership tracks are designed to root you deeply in
              faith and community.
            </p>
          </div>
        </section>

        <section className="px-[var(--section-padding-x)] py-20">
          <form
            onSubmit={handleSubmit}
            className="mx-auto max-w-[71rem] bg-white px-10 py-16 shadow-[0_18px_50px_rgba(0,6,102,0.08)] md:px-16 lg:px-20"
          >
            <div>
              <h2 className="text-3xl font-extrabold text-[#000666]">
                Select Your Class
              </h2>
              <p className="mt-6 max-w-[54rem] text-sm leading-7 text-[#59606c]">
                Choose the foundation path that best fits your current spiritual
                journey. Each course offers unique insights into the core values
                of Glory Tabernacle.
              </p>

              <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
                {MEMBERSHIP_CLASSES.map((membershipClass, index) => (
                  <label
                    key={membershipClass.name}
                    className={`block cursor-pointer border px-7 py-7 transition-colors ${
                      index === 0
                        ? 'border-[#000666] bg-[#1b2280] text-white'
                        : 'border-[#e5e5e5] bg-[#f8f8f8] text-[#30323a] hover:border-[#000666]'
                    }`}
                  >
                    <input
                      type="radio"
                      name="membershipClass"
                      value={membershipClass.name}
                      defaultChecked={index === 0}
                      className="sr-only"
                    />
                    <span className="block text-base font-extrabold">
                      {membershipClass.name}
                    </span>
                    <span
                      className={`mt-3 block text-xs ${
                        index === 0 ? 'text-white/70' : 'text-[#777d87]'
                      }`}
                    >
                      {membershipClass.description}
                    </span>
                    <span className="mt-5 flex items-center gap-2 text-[0.65rem] font-extrabold uppercase tracking-[0.12em]">
                      <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                      Select
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div className="mt-16">
              <SectionTitle icon={<UserRound className="h-5 w-5" />}>
                Personal Information
              </SectionTitle>
              <div className="grid grid-cols-1 gap-x-8 gap-y-6 md:grid-cols-2">
                <Field name="firstName" label="First Name" placeholder="e.g. John" />
                <Field name="lastName" label="Last Name" placeholder="e.g. Doe" />
                <Field
                  name="email"
                  label="Email Address"
                  placeholder="john.doe@example.com"
                  type="email"
                />
                <Field name="phoneNumber" label="Phone Number" placeholder="+1 (555) 000-0000" />
                <SelectField
                  name="gender"
                  label="Gender"
                  placeholder="Select Gender"
                  options={[
                    { label: 'Female', value: 'FEMALE' },
                    { label: 'Male', value: 'MALE' },
                  ]}
                />
                <SelectField
                  name="maritalStatus"
                  label="Marital Status"
                  placeholder="Select Status"
                  options={[
                    { label: 'Single', value: 'SINGLE' },
                    { label: 'Engaged', value: 'ENGAGED' },
                    { label: 'Married', value: 'MARRIED' },
                    { label: 'Separated', value: 'SEPARATED' },
                    { label: 'Divorced', value: 'DIVORCED' },
                    { label: 'Widowed', value: 'WIDOWED' },
                  ]}
                />
              </div>
            </div>

            <div className="mt-16">
              <SectionTitle icon={<MapPin className="h-5 w-5" />}>
                Residential Address
              </SectionTitle>
              <div className="grid grid-cols-1 gap-x-8 gap-y-6 md:grid-cols-3">
                <div className="md:col-span-3">
                  <Field name="streetAddress" label="Street Address" placeholder="123 Faith Street" />
                </div>
                <Field name="city" label="City" placeholder="Barnstaple" />
                <Field name="stateProvince" label="State / Province" placeholder="Devon" />
                <Field name="country" label="Country" placeholder="United Kingdom" />
              </div>
            </div>

            <div className="mt-16">
              <SectionTitle icon={<Building2 className="h-5 w-5" />}>
                Spiritual History
              </SectionTitle>
              <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                <RadioPair
                  question="Are you a member of any RCCG Church?"
                  name="rccgMember"
                />
                <RadioPair question="Have you been Saved?" name="saved" />
              </div>
            </div>

            <div className="mt-16">
              <label className="block">
                <span className="mb-3 block text-[0.7rem] font-extrabold uppercase tracking-[0.18em] text-[#8a8f9c]">
                  Expectations / Prayer Points
                </span>
                <textarea
                  name="expectations"
                  rows={8}
                  placeholder="Share what you hope to achieve through this membership track..."
                  className="w-full resize-none border-0 bg-[#f0f0f0] p-4 text-sm text-[#30323a] outline-none placeholder:text-[#9aa0aa] focus:ring-2 focus:ring-[#000666]"
                />
              </label>
            </div>

            <div className="mx-auto mt-16 max-w-[34rem] text-center">
              {status && (
                <div
                  role="status"
                  className={`mb-6 rounded-md px-4 py-3 text-sm font-medium ${
                    status.type === 'success'
                      ? 'bg-green-50 text-green-700'
                      : 'bg-red-50 text-red-700'
                  }`}
                >
                  {status.message}
                </div>
              )}
              <p className="text-xs leading-5 text-[#59606c]">
                By submitting this application, you agree to our spiritual values
                and commitment to the Glory Tabernacle community journey.
              </p>
              <button
                type="submit"
                disabled={isSubmitting}
                className="mt-7 min-h-14 min-w-[18rem] rounded-md bg-[#1b6d24] px-8 text-sm font-extrabold text-white shadow-[0_12px_22px_rgba(27,109,36,0.28)] transition-colors hover:bg-[#155a1d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-60"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Application'}
              </button>
            </div>
          </form>
        </section>

        <section className="bg-[#eeeeee] px-[var(--section-padding-x)] py-20">
          <div className="mx-auto max-w-[var(--container-max)]">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="text-4xl font-extrabold text-[#000666] md:text-5xl">
                What to Expect
              </h2>
              <p className="mt-5 text-base leading-7 text-[#59606c]">
                Membership at Glory Tabernacle is more than a name on a list; it
                is a covenant of growth and shared mission.
              </p>
            </div>

            <div className="mt-14 grid grid-cols-1 gap-8 lg:grid-cols-2">
              {EXPECTATIONS.map((item) => (
                <ExpectationCard key={item.title} {...item} />
              ))}
            </div>
          </div>
        </section>
      </main>
      <MembershipFooter />
    </>
  )
}
