'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { KeyRound, MailCheck, Lock, CheckCircle2, Loader2, ArrowLeft, Eye, EyeOff } from 'lucide-react'

type Step = 'idle' | 'code-sent' | 'verified' | 'done'

export default function SettingsPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('idle')
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  async function handleSendCode() {
    setError('')
    setIsLoading(true)
    try {
      const res = await fetch('/api/auth/send-code', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to send code')
      setStep('code-sent')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleVerifyCode() {
    setError('')
    if (code.length !== 6) {
      setError('Please enter the 6-digit code')
      return
    }
    setIsLoading(true)
    try {
      const res = await fetch('/api/auth/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Invalid code')
      setStep('verified')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleChangePassword() {
    setError('')
    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    setIsLoading(true)
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, confirmPassword }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to change password')
      setStep('done')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleLogoutAndLogin() {
    await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {})
    router.push('/login')
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{ color: 'rgba(27, 34, 119, 1)' }}>
          Settings
        </h1>
        <p className="mt-1 text-sm text-gray-600">Manage your account settings and security.</p>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {error}
        </div>
      )}

      {/* Password Change */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 sm:p-8">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full" style={{ backgroundColor: 'rgba(27, 34, 119, 0.1)' }}>
            <KeyRound className="h-5 w-5" style={{ color: 'rgba(27, 34, 119, 1)' }} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Change Password</h2>
            <p className="text-sm text-gray-500">
              {step === 'idle' && 'We will send a verification code to your email.'}
              {step === 'code-sent' && 'Enter the code sent to your email.'}
              {step === 'verified' && 'Choose a new strong password.'}
              {step === 'done' && 'Password changed successfully.'}
            </p>
          </div>
        </div>

        {/* Step indicator */}
        {step !== 'done' && (
          <div className="mb-6 flex items-center gap-2">
            {['idle', 'code-sent', 'verified'].map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div
                  className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                    step === s
                      ? 'text-white'
                      : ['code-sent', 'verified'].includes(step) && ['idle'].includes(s)
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-400'
                  }`}
                  style={step === s ? { backgroundColor: 'rgba(27, 34, 119, 1)' } : {}}
                >
                  {['code-sent', 'verified'].includes(step) && ['idle', 'code-sent'].includes(s) && s !== step
                    ? '✓'
                    : i + 1}
                </div>
                {i < 2 && (
                  <div
                    className={`h-0.5 w-8 sm:w-16 ${
                      (step === 'code-sent' && i === 0) || step === 'verified'
                        ? 'bg-green-400'
                        : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        )}

        {/* Step: idle */}
        {step === 'idle' && (
          <button
            type="button"
            onClick={handleSendCode}
            disabled={isLoading}
            className="inline-flex items-center gap-2 rounded-lg px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
            style={{ backgroundColor: 'rgba(27, 34, 119, 1)' }}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Sending Code…
              </>
            ) : (
              <>
                <MailCheck className="h-4 w-4" />
                Send Verification Code
              </>
            )}
          </button>
        )}

        {/* Step: code-sent */}
        {step === 'code-sent' && (
          <div className="space-y-4">
            <div>
              <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-1.5">
                Verification Code
              </label>
              <input
                id="code"
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                placeholder="000000"
                className="w-full max-w-xs rounded-lg border border-gray-300 px-4 py-2.5 text-center text-2xl font-bold tracking-[0.5em] text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleVerifyCode}
                disabled={isLoading || code.length !== 6}
                className="inline-flex items-center gap-2 rounded-lg px-6 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
                style={{ backgroundColor: 'rgba(27, 34, 119, 1)' }}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Verifying…
                  </>
                ) : (
                  'Verify Code'
                )}
              </button>
              <button
                type="button"
                onClick={() => { setStep('idle'); setCode(''); setError('') }}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back
              </button>
            </div>
          </div>
        )}

        {/* Step: verified */}
        {step === 'verified' && (
          <div className="space-y-4">
            <div>
              <label htmlFor="new-password" className="block text-sm font-medium text-gray-700 mb-1.5">
                New Password
              </label>
              <div className="relative w-full max-w-xs">
                <input
                  id="new-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 pr-10 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div>
              <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 mb-1.5">
                Confirm New Password
              </label>
              <div className="relative w-full max-w-xs">
                <input
                  id="confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 pr-10 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((v) => !v)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleChangePassword}
                disabled={isLoading || !password || !confirmPassword}
                className="inline-flex items-center gap-2 rounded-lg px-6 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
                style={{ backgroundColor: 'rgba(27, 34, 119, 1)' }}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Changing Password…
                  </>
                ) : (
                  <>
                    <Lock className="h-4 w-4" />
                    Change Password
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => { setStep('code-sent'); setPassword(''); setConfirmPassword(''); setError('') }}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back
              </button>
            </div>
          </div>
        )}

        {/* Step: done */}
        {step === 'done' && (
          <div className="rounded-xl border border-green-200 bg-green-50 p-6 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
              <CheckCircle2 className="h-7 w-7 text-green-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">Password Changed</h3>
            <p className="text-sm text-gray-600 mb-6">
              Your password has been updated successfully. Please log in again with your new password.
            </p>
            <button
              type="button"
              onClick={handleLogoutAndLogin}
              className="inline-flex items-center gap-2 rounded-lg px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: 'rgba(27, 34, 119, 1)' }}
            >
              Log Out &amp; Log In Again
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
