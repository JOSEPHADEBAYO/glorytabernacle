'use client'

import React, { useEffect, useState } from 'react'
import Image from 'next/image'
import { Play } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Modal,
  ModalTrigger,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalFooter,
  ModalClose,
} from '@/components/ui/modal'
import { cn } from '@/lib/utils'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface LiveStreamSectionProps {
  heading?: string
  subtext?: string
  thumbnailSrc: string
  thumbnailAlt: string
  isLive: boolean
  youtubeLiveHref?: string
  /** ISO 8601 datetime string — countdown target */
  nextServiceDate: string
}

// ---------------------------------------------------------------------------
// Countdown hook
// ---------------------------------------------------------------------------

interface TimeLeft {
  days: number
  hours: number
  minutes: number
  seconds: number
  expired: boolean
}

function useCountdown(targetDate: string): TimeLeft {
  const calculate = (): TimeLeft => {
    const diff = new Date(targetDate).getTime() - Date.now()
    if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true }
    const totalSeconds = Math.floor(diff / 1000)
    return {
      days: Math.floor(totalSeconds / 86400),
      hours: Math.floor((totalSeconds % 86400) / 3600),
      minutes: Math.floor((totalSeconds % 3600) / 60),
      seconds: totalSeconds % 60,
      expired: false,
    }
  }

  const [timeLeft, setTimeLeft] = useState<TimeLeft>(calculate)

  useEffect(() => {
    const id = setInterval(() => setTimeLeft(calculate()), 1000)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetDate])

  return timeLeft
}

// ---------------------------------------------------------------------------
// Countdown box
// ---------------------------------------------------------------------------

function CountdownBox({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex min-w-[3.5rem] flex-col items-center rounded-md border border-[var(--church-navy)] px-2.5 py-1.5">
      <span className="text-xl font-bold leading-none text-[var(--church-navy)]">
        {String(value).padStart(2, '0')}
      </span>
      <span className="mt-1 text-[0.55rem] font-semibold uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Notify modal form
// ---------------------------------------------------------------------------

function NotifyModal() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [nameError, setNameError] = useState('')
  const [emailError, setEmailError] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    let valid = true
    if (!name.trim()) { setNameError('Name is required'); valid = false } else setNameError('')
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError('A valid email is required'); valid = false
    } else setEmailError('')
    if (valid) setSubmitted(true)
  }

  return (
    <Modal>
      <ModalTrigger asChild>
        <button
          type="button"
          className="w-full rounded-md border border-[var(--church-navy)] bg-transparent px-4 py-2 text-sm font-semibold uppercase tracking-widest text-[var(--church-navy)] transition-colors duration-200 hover:bg-[var(--church-navy)] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--church-navy)]/50"
        >
          Get Notified
        </button>
      </ModalTrigger>
      <ModalContent variant="form" style={{ backgroundColor: 'rgba(255, 255, 255, 1)', color: 'rgba(17, 17, 17, 1)' }}>
        <ModalHeader>
          <ModalTitle className="text-xl font-bold text-[var(--church-navy)]">
            Stay in the Loop
          </ModalTitle>
          <ModalDescription style={{ color: 'rgba(100, 100, 100, 1)' }}>
            Enter your details and we&apos;ll notify you before the next live service begins.
          </ModalDescription>
        </ModalHeader>

        {submitted ? (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--church-green)]/10">
              <svg className="h-7 w-7 text-[var(--church-green)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-lg font-semibold text-[var(--church-navy)]">You&apos;re on the list!</p>
            <p className="text-sm" style={{ color: 'rgba(100, 100, 100, 1)' }}>
              We&apos;ll send you a reminder before we go live.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5 pt-4">
            {/* Name field */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="notify-name"
                className="text-sm font-medium"
                style={{ color: 'rgba(30, 30, 30, 1)' }}
              >
                Full Name
              </label>
              <input
                id="notify-name"
                type="text"
                placeholder="Jane Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                aria-invalid={!!nameError}
                aria-describedby={nameError ? 'notify-name-error' : undefined}
                className={cn(
                  'w-full rounded-lg border px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400',
                  'bg-white outline-none transition-all duration-150',
                  'focus:border-[var(--church-navy)] focus:ring-2 focus:ring-[var(--church-navy)]/15',
                  nameError
                    ? 'border-red-400 ring-2 ring-red-100'
                    : 'border-gray-200 hover:border-gray-300'
                )}
              />
              {nameError && (
                <p id="notify-name-error" className="text-xs text-red-500">{nameError}</p>
              )}
            </div>

            {/* Email field */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="notify-email"
                className="text-sm font-medium"
                style={{ color: 'rgba(30, 30, 30, 1)' }}
              >
                Email Address
              </label>
              <input
                id="notify-email"
                type="email"
                placeholder="jane@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-invalid={!!emailError}
                aria-describedby={emailError ? 'notify-email-error' : undefined}
                className={cn(
                  'w-full rounded-lg border px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400',
                  'bg-white outline-none transition-all duration-150',
                  'focus:border-[var(--church-navy)] focus:ring-2 focus:ring-[var(--church-navy)]/15',
                  emailError
                    ? 'border-red-400 ring-2 ring-red-100'
                    : 'border-gray-200 hover:border-gray-300'
                )}
              />
              {emailError && (
                <p id="notify-email-error" className="text-xs text-red-500">{emailError}</p>
              )}
            </div>

            <ModalFooter className="pt-2">
              <ModalClose asChild>
                <button
                  type="button"
                  className="rounded-lg border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900"
                >
                  Cancel
                </button>
              </ModalClose>
              <button
                type="submit"
                className="rounded-lg bg-[var(--church-green)] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--church-green)]/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--church-green)]/50"
              >
                Notify Me
              </button>
            </ModalFooter>
          </form>
        )}
      </ModalContent>
    </Modal>
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function LiveStreamSection({
  heading = 'Experience The Hub Live',
  subtext = 'Join our digital congregation from anywhere in the world. Our next encounter begins in:',
  thumbnailSrc,
  thumbnailAlt,
  isLive,
  youtubeLiveHref,
  nextServiceDate,
}: LiveStreamSectionProps) {
  const { days, hours, minutes, expired } = useCountdown(nextServiceDate)

  const PlayButton = () => {
    const inner = (
      <span
        className={cn(
          'flex h-16 w-16 items-center justify-center rounded-full bg-[var(--church-green)] shadow-lg',
          'transition-transform duration-200',
          isLive && 'hover:scale-110 cursor-pointer',
          !isLive && 'opacity-90 cursor-default'
        )}
        aria-label={isLive ? 'Watch live stream' : 'Stream is currently offline'}
      >
        <Play className="h-7 w-7 fill-white text-white translate-x-0.5" />
      </span>
    )

    if (isLive && youtubeLiveHref) {
      return (
        <a
          href={youtubeLiveHref}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute inset-0 flex items-center justify-center"
        >
          {inner}
        </a>
      )
    }

    return (
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {inner}
      </div>
    )
  }

  return (
    <section
      aria-label="Live stream section"
      className="w-full py-8 px-[var(--section-padding-x)]"
      style={{ backgroundColor: 'rgba(249, 249, 249, 1)' }}
    >
      <div
        className="mx-auto max-w-3xl rounded-2xl overflow-hidden"
        style={{
          backgroundColor: 'rgba(255, 255, 255, 1)',
          boxShadow: '0px 20px 40px 0px rgba(26, 28, 28, 0.06)',
        }}
      >
        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* ── Thumbnail ── */}
          <div className="relative min-h-[200px] md:min-h-[240px]">
            <Image
              src={thumbnailSrc}
              alt={thumbnailAlt}
              fill
              className="object-cover"
            />

            {/* Status badge */}
            <div className="absolute left-3 top-3 z-10">
              {isLive ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--church-green)] px-3 py-1 text-xs font-bold uppercase tracking-wider text-white shadow">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
                  </span>
                  Live
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-red-600 px-3 py-1 text-xs font-bold uppercase tracking-wider text-white shadow">
                  <span className="h-2 w-2 rounded-full bg-white" />
                  Offline
                </span>
              )}
            </div>

            {/* Play button */}
            <PlayButton />
          </div>

          {/* ── Content ── */}
          <div className="flex flex-col justify-center gap-4 p-6 md:p-8">
            {/* Decorative rule */}
            <div
              className="h-[3px] w-12 rounded-full bg-[var(--church-navy)]"
              aria-hidden="true"
            />

            <div className="flex flex-col gap-2">
              <h2 className="text-xl font-bold leading-tight text-[var(--church-navy)] md:text-2xl">
                {heading}
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">{subtext}</p>
            </div>

            {/* Countdown or live message */}
            {expired || isLive ? (
              <p className="text-lg font-semibold text-[var(--church-green)]">
                We&apos;re Live! 🎉
              </p>
            ) : (
              <div
                className="flex gap-3"
                role="timer"
                aria-label={`Countdown: ${days} days, ${hours} hours, ${minutes} minutes`}
              >
                <CountdownBox value={days} label="Days" />
                <CountdownBox value={hours} label="Hours" />
                <CountdownBox value={minutes} label="Mins" />
              </div>
            )}

            {/* CTA */}
            <NotifyModal />
          </div>
        </div>
      </div>
    </section>
  )
}
