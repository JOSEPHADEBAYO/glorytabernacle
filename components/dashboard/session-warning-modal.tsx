'use client'

import { useEffect, useState } from 'react'

interface SessionWarningModalProps {
  isOpen: boolean
  remainingSeconds: number
  onContinue: () => void
  onLogout: () => void
}

export function SessionWarningModal({
  isOpen,
  remainingSeconds,
  onContinue,
  onLogout,
}: SessionWarningModalProps) {
  const [seconds, setSeconds] = useState(remainingSeconds)

  useEffect(() => {
    if (isOpen) {
      setSeconds(remainingSeconds)
      
      const interval = setInterval(() => {
        setSeconds((prev) => {
          if (prev <= 1) {
            clearInterval(interval)
            return 0
          }
          return prev - 1
        })
      }, 1000)

      return () => clearInterval(interval)
    }
  }, [isOpen, remainingSeconds])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onContinue}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 animate-in fade-in zoom-in duration-200">
        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-8 h-8 text-orange-600"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
        </div>

        {/* Content */}
        <h2 className="text-2xl font-bold text-center mb-2" style={{ color: 'rgba(27, 34, 119, 1)' }}>
          Session Expiring Soon
        </h2>
        <p className="text-center text-gray-600 mb-6">
          Your session will expire in <span className="font-bold text-orange-600">{seconds} seconds</span> due to inactivity.
        </p>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onLogout}
            className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
          >
            Logout Now
          </button>
          <button
            onClick={onContinue}
            className="flex-1 px-4 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
          >
            Stay Logged In
          </button>
        </div>

        {/* Info */}
        <p className="text-xs text-center text-gray-500 mt-4">
          Click anywhere or press any key to continue your session
        </p>
      </div>
    </div>
  )
}
