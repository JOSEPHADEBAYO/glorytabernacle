'use client'

import { useState } from 'react'
import type { FormEvent } from 'react'
import { CheckCircle2, Send } from 'lucide-react'
import { useToast } from '@/components/ui/toast-provider'

export interface VolunteerStrengthOption {
  id: string
  title: string
}

interface VolunteerInterestFormProps {
  groups: VolunteerStrengthOption[]
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
      <span className="mb-2 block text-[0.7rem] font-extrabold uppercase tracking-[0.18em] text-gray-500">
        {label}
      </span>
      <input
        name={name}
        type={type}
        required
        placeholder={placeholder}
        className="h-12 w-full rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-900 outline-none focus:border-[#000666] focus:ring-2 focus:ring-[#000666]/20"
      />
    </label>
  )
}

function RadioPair({ question, name }: { question: string; name: string }) {
  return (
    <fieldset className="rounded-lg bg-gray-50 p-5">
      <legend className="mb-4 text-sm font-bold text-gray-900">{question}</legend>
      <div className="flex items-center gap-7">
        {['Yes', 'No'].map((answer) => (
          <label key={answer} className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="radio"
              name={name}
              value={answer.toLowerCase()}
              required
              className="h-4 w-4 border-gray-400 text-[#000666] focus:ring-[#000666]"
            />
            {answer}
          </label>
        ))}
      </div>
    </fieldset>
  )
}

export function VolunteerInterestForm({ groups }: VolunteerInterestFormProps) {
  const { toast } = useToast()
  const [selectedStrengths, setSelectedStrengths] = useState<string[]>([])
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  function toggleStrength(id: string) {
    setSelectedStrengths((current) => {
      if (current.includes(id)) return current.filter((item) => item !== id)
      if (current.length >= 2) {
        toast({
          title: 'Maximum of two',
          description: 'Please choose no more than two areas of strength.',
          variant: 'warning',
          duration: 4000,
        })
        return current
      }
      return [...current, id]
    })
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setStatus(null)

    if (selectedStrengths.length === 0) {
      setStatus({
        type: 'error',
        message: 'Please choose at least one area of strength.',
      })
      return
    }

    const form = event.currentTarget
    const formData = new FormData(form)
    const payload = {
      name: formData.get('name'),
      email: formData.get('email'),
      phoneNumber: formData.get('phoneNumber'),
      address: formData.get('address'),
      areaStrengthIds: selectedStrengths,
      pastExperience: formData.get('pastExperience'),
      contributionStatement: formData.get('contributionStatement'),
      bornAgain: formData.get('bornAgain') === 'yes',
      filledWithHolyGhost: formData.get('filledWithHolyGhost') === 'yes',
    }

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/volunteer-interests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        const details = Array.isArray(data.details) ? data.details.join(' ') : undefined
        throw new Error(details ?? data.error ?? 'Failed to submit volunteer interest')
      }

      form.reset()
      setSelectedStrengths([])
      setStatus({
        type: 'success',
        message: 'Thank you. Your volunteer interest has been received.',
      })
      toast({
        title: 'Volunteer interest submitted',
        description: 'Our team will review it and follow up with you.',
        variant: 'success',
      })
    } catch (error) {
      setStatus({
        type: 'error',
        message: error instanceof Error ? error.message : 'Unable to submit your interest.',
      })
      toast({
        title: 'Submission failed',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'error',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto max-w-[76rem] rounded-xl bg-white px-6 py-10 shadow-[0_18px_50px_rgba(0,6,102,0.08)] md:px-10 lg:px-14"
    >
      <div className="border-b border-gray-200 pb-8">
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#1b6d24]">
          Volunteer Interest
        </p>
        <h1 className="mt-3 text-3xl font-extrabold leading-tight text-[#000666] md:text-5xl">
          Why you should volunteer
        </h1>
        <p className="mt-5 max-w-5xl text-sm leading-7 text-gray-600 md:text-base">
          At RCCG Glory Tabernacle, volunteering is more than serving-it is becoming part of God&apos;s purpose. We believe God does not only use people to serve His purposes, He also makes them transgenerational blessings. If God can use you, He can bless you. Through serving, people are FURNISHED for good works, TRANSFORMED in character and purpose, and empowered to INFLUENCE their world for Jesus Christ. Whatever your gift or experience, there is a place for you to grow, belong, and make kingdom impact
        </p>
      </div>

      <section className="mt-10">
        <div className="mb-6 flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-[#1b6d24]" />
          <h2 className="text-2xl font-extrabold text-[#000666]">Biodata</h2>
        </div>
        <div className="grid grid-cols-1 gap-x-6 gap-y-5 md:grid-cols-2">
          <Field name="name" label="Name" placeholder="Your full name" />
          <Field name="email" label="Email" placeholder="you@example.com" type="email" />
          <Field name="phoneNumber" label="Phone" placeholder="+44..." />
          <Field name="address" label="Address" placeholder="Your residential address" />
        </div>
      </section>

      <section className="mt-10">
        <div className="mb-2 flex items-center justify-between gap-4">
          <h2 className="text-2xl font-extrabold text-[#000666]">Area of strength</h2>
          <span className="text-xs font-semibold text-gray-500">
            {selectedStrengths.length}/2 selected
          </span>
        </div>
        <p className="mb-5 text-sm text-gray-600">
          Choose up to two groups or ministries where your strength is most evident.
        </p>
        {groups.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-300 p-6 text-sm text-gray-600">
            No published groups are available yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {groups.map((group) => {
              const checked = selectedStrengths.includes(group.id)
              const disabled = !checked && selectedStrengths.length >= 2
              return (
                <label
                  key={group.id}
                  className={`flex cursor-pointer items-center gap-3 rounded-lg border p-4 text-sm font-semibold transition ${
                    checked
                      ? 'border-[#1b6d24] bg-green-50 text-[#1b6d24]'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-[#000666]'
                  } ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    disabled={disabled}
                    onChange={() => toggleStrength(group.id)}
                    className="h-4 w-4 rounded border-gray-300 text-[#1b6d24] focus:ring-[#1b6d24]"
                  />
                  {group.title}
                </label>
              )
            })}
          </div>
        )}
      </section>

      <section className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2">
        <label className="block">
          <span className="mb-2 block text-[0.7rem] font-extrabold uppercase tracking-[0.18em] text-gray-500">
            Past experiences in your area of strength
          </span>
          <textarea
            name="pastExperience"
            rows={7}
            required
            className="w-full resize-none rounded-lg border border-gray-300 bg-white p-4 text-sm leading-6 text-gray-900 outline-none focus:border-[#000666] focus:ring-2 focus:ring-[#000666]/20"
            placeholder="Tell us where you have served, worked, led, helped, or gained experience..."
          />
        </label>
        <label className="block">
          <span className="mb-2 block text-[0.7rem] font-extrabold uppercase tracking-[0.18em] text-gray-500">
            How do you think you can serve in this area?
          </span>
          <textarea
            name="contributionStatement"
            rows={7}
            required
            className="w-full resize-none rounded-lg border border-gray-300 bg-white p-4 text-sm leading-6 text-gray-900 outline-none focus:border-[#000666] focus:ring-2 focus:ring-[#000666]/20"
            placeholder="Share your ideas, heart, and the kind of impact you hope to make..."
          />
        </label>
      </section>

      <section className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-2">
        <RadioPair question="Are you Born again?" name="bornAgain" />
        <RadioPair question="Are you Filled with the Holy Ghost?" name="filledWithHolyGhost" />
      </section>

      <div className="mx-auto mt-10 max-w-[34rem] text-center">
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
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex min-h-14 items-center justify-center gap-2 rounded-lg bg-[#1b6d24] px-8 text-sm font-extrabold text-white shadow-[0_12px_22px_rgba(27,109,36,0.28)] transition-colors hover:bg-[#155a1d] disabled:opacity-60"
        >
          <Send className="h-4 w-4" />
          {isSubmitting ? 'Submitting...' : 'Submit Volunteer Interest'}
        </button>
      </div>
    </form>
  )
}
