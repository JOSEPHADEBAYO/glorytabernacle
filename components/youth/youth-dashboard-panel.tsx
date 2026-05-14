'use client'

import { useState } from 'react'
import { Calendar, LogIn, LogOut, BookOpen, Play } from 'lucide-react'

interface OpenCheckIn {
  id: string
  signedInAt: string
}

interface Scripture {
  id: string
  date: string
  reference: string
  text: string
  videoUrl: string | null
}

interface YouthUser {
  id: string
  name: string
  email: string
  image: string | null
}

interface Props {
  youth: YouthUser
  openCheckIn: OpenCheckIn | null
  scriptures: Scripture[]
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function YouthDashboardPanel({ youth, openCheckIn: initialCheckIn, scriptures }: Props) {
  const [checkIn, setCheckIn] = useState<OpenCheckIn | null>(initialCheckIn)
  const [isLoading, setIsLoading] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  function showToast(message: string, type: 'success' | 'error') {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3500)
  }

  async function handleCheckIn() {
    setIsLoading(true)
    try {
      const res = await fetch('/api/youth/me/check-in', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to check in')
      setCheckIn(data.checkIn)
      showToast(data.alreadyIn ? 'You are already checked in.' : 'Checked in successfully!', 'success')
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Something went wrong', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleCheckOut() {
    setIsLoading(true)
    try {
      const res = await fetch('/api/youth/me/check-out', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to check out')
      setCheckIn(null)
      showToast('Checked out successfully. See you next time!', 'success')
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Something went wrong', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div
          role="alert"
          className={`fixed top-4 right-4 z-50 rounded-xl px-5 py-3 text-sm font-semibold text-white shadow-lg transition-all ${
            toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'
          }`}
        >
          {toast.message}
        </div>
      )}

      {/* Check-in / Check-out card */}
      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <h2 className="text-base font-bold mb-4" style={{ color: 'rgba(27,34,119,1)' }}>
          Service Attendance
        </h2>

        {checkIn ? (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-start gap-3">
              <div
                className="mt-0.5 flex h-9 w-9 flex-none items-center justify-center rounded-full"
                style={{ backgroundColor: 'rgba(27,34,119,0.08)' }}
              >
                <LogIn className="h-4 w-4" style={{ color: 'rgba(27,34,119,1)' }} />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">You are checked in</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Since {formatTime(checkIn.signedInAt)} · {formatDate(checkIn.signedInAt)}
                </p>
              </div>
            </div>
            <button
              type="button"
              disabled={isLoading}
              onClick={handleCheckOut}
              className="inline-flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
              style={{ backgroundColor: 'var(--church-red)' }}
            >
              <LogOut className="h-4 w-4" />
              {isLoading ? 'Signing out…' : 'Sign Out'}
            </button>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <p className="text-sm text-gray-600">
              You are not checked in yet. Tap the button when you arrive.
            </p>
            <button
              type="button"
              disabled={isLoading}
              onClick={handleCheckIn}
              className="inline-flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
              style={{ backgroundColor: 'rgba(27,34,119,1)' }}
            >
              <LogIn className="h-4 w-4" />
              {isLoading ? 'Signing in…' : 'Sign In'}
            </button>
          </div>
        )}
      </div>

      {/* Daily Scriptures */}
      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-5">
          <BookOpen className="h-5 w-5 flex-none" style={{ color: 'var(--church-green)' }} />
          <h2 className="text-base font-bold" style={{ color: 'rgba(27,34,119,1)' }}>
            Daily Scriptures
          </h2>
        </div>

        {scriptures.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-8">
            No scriptures posted yet. Check back soon!
          </p>
        ) : (
          <div className="space-y-6">
            {scriptures.map((s, i) => (
              <div
                key={s.id}
                className={`pb-6 ${i < scriptures.length - 1 ? 'border-b border-gray-100' : ''}`}
              >
                {/* Date + reference */}
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="h-3.5 w-3.5 flex-none text-gray-400" />
                  <span className="text-xs text-gray-400">{formatDate(s.date)}</span>
                </div>
                <p
                  className="text-sm font-extrabold mb-1"
                  style={{ color: 'rgba(27,34,119,1)' }}
                >
                  {s.reference}
                </p>
                <p className="text-sm text-gray-700 leading-relaxed italic">
                  &ldquo;{s.text}&rdquo;
                </p>

                {/* YouTube embed */}
                {s.videoUrl && (
                  <div className="mt-4">
                    <a
                      href={s.videoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold text-white transition-opacity hover:opacity-90"
                      style={{ backgroundColor: '#FF0000' }}
                    >
                      <Play className="h-3.5 w-3.5 fill-white" />
                      Watch on YouTube
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
