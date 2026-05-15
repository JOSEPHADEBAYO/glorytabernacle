'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Users, Plus, Trash2, Loader2, X, CheckCircle2 } from 'lucide-react'
import { useConfirmDelete } from '@/components/ui/confirm-delete-modal'
import { ConfirmDeleteModal } from '@/components/ui/confirm-delete-modal'

interface ManagedUser {
  id: string
  name: string
  email: string
  phoneNumber: string | null
  position: string | null
  role: string
  isActive: boolean
  mustChangePassword: boolean
  createdAt: string
}

interface GroupOption {
  title: string
}

const POSITION_PREFIX = 'Head of '

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export default function UsersPage() {
  const router = useRouter()
  const [users, setUsers] = useState<ManagedUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [groupOptions, setGroupOptions] = useState<string[]>([])
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const {
    isOpen: deleteIsOpen,
    pendingItem: deletePendingId,
    openDelete,
    closeDelete,
  } = useConfirmDelete<string>()

  const [form, setForm] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    password: '',
    position: '',
  })
  const [formError, setFormError] = useState('')
  const [formLoading, setFormLoading] = useState(false)

  const showToast = useCallback((message: string, type: 'success' | 'error') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 5000)
  }, [])

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch('/api/users')
      if (res.status === 401 || res.status === 403) {
        router.push('/dashboard')
        return
      }
      if (!res.ok) throw new Error('Failed to fetch users')
      const data = await res.json()
      setUsers(data.users)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setIsLoading(false)
    }
  }, [router])

  const fetchGroups = useCallback(async () => {
    try {
      const res = await fetch('/api/groups')
      if (res.ok) {
        const data = await res.json()
        const titles = (data.groups ?? []).map((g: GroupOption) => `${POSITION_PREFIX}${g.title}`)
        setGroupOptions(['Head of Youth Department', ...titles])
      }
    } catch {
      setGroupOptions(['Head of Youth Department'])
    }
  }, [])

  useEffect(() => {
    fetchUsers()
    fetchGroups()
  }, [fetchUsers, fetchGroups])

  async function handleCreateUser(e: React.FormEvent) {
    e.preventDefault()
    setFormError('')

    if (!form.name || !form.email || !form.password || !form.position) {
      setFormError('All fields except phone are required')
      return
    }
    if (form.password.length < 8) {
      setFormError('Password must be at least 8 characters')
      return
    }

    setFormLoading(true)
    try {
      const res = await fetch('/api/auth/create-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phoneNumber: form.phoneNumber || undefined,
          password: form.password,
          position: form.position,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to create user')

      setShowCreateModal(false)
      setForm({ name: '', email: '', phoneNumber: '', password: '', position: '' })
      showToast(`User "${form.name}" created successfully`, 'success')
      fetchUsers()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setFormLoading(false)
    }
  }

  async function handleDeleteUser(id: string) {
    try {
      const res = await fetch(`/api/users/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Failed to delete user')
      }
      showToast('User deleted', 'success')
      fetchUsers()
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to delete', 'error')
    }
  }

  function openCreateModal() {
    setForm({ name: '', email: '', phoneNumber: '', password: '', position: groupOptions[0] ?? '' })
    setFormError('')
    setShowCreateModal(true)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: 'rgba(27, 34, 119, 1)' }} />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'rgba(27, 34, 119, 1)' }}>
            Users
          </h1>
          <p className="mt-1 text-sm text-gray-600">Manage dashboard users and their roles.</p>
        </div>
        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          style={{ backgroundColor: 'rgba(27, 34, 119, 1)' }}
        >
          <Plus className="h-4 w-4" />
          Create User
        </button>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {error}
        </div>
      )}

      {toast && (
        <div
          className={`mb-6 flex items-center gap-2 rounded-lg border px-4 py-3 text-sm ${
            toast.type === 'success'
              ? 'border-green-200 bg-green-50 text-green-700'
              : 'border-red-200 bg-red-50 text-red-700'
          }`}
        >
          {toast.type === 'success' ? <CheckCircle2 className="h-4 w-4" /> : <X className="h-4 w-4" />}
          {toast.message}
        </div>
      )}

      <div className="rounded-2xl border border-gray-200 bg-white">
        {users.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
              <Users className="h-7 w-7 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">No users yet</h3>
            <p className="text-sm text-gray-500 mb-6 max-w-sm">
              Create your first user to grant access to the dashboard.
            </p>
            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: 'rgba(27, 34, 119, 1)' }}
            >
              <Plus className="h-4 w-4" />
              Create User
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <Th>Name</Th>
                  <Th>Email</Th>
                  <Th>Position</Th>
                  <Th>Status</Th>
                  <Th>Created</Th>
                  <Th className="text-right">Actions</Th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <Td>
                      <span className="font-medium text-gray-900">{u.name}</span>
                    </Td>
                    <Td>
                      <a className="text-blue-600 hover:underline" href={`mailto:${u.email}`}>
                        {u.email}
                      </a>
                    </Td>
                    <Td>
                      <span className="text-sm text-gray-600">{u.position ?? '—'}</span>
                    </Td>
                    <Td>
                      {u.mustChangePassword ? (
                        <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                          First login
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">
                          Active
                        </span>
                      )}
                    </Td>
                    <Td>
                      <span className="text-sm text-gray-500">{formatDate(u.createdAt)}</span>
                    </Td>
                    <Td className="px-4 py-3 whitespace-nowrap text-right">
                      <button
                        type="button"
                        onClick={() => openDelete(u.id)}
                        className="inline-flex items-center gap-1 text-sm font-medium text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete
                      </button>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmDeleteModal
        open={deleteIsOpen}
        onConfirm={async () => {
          if (deletePendingId) await handleDeleteUser(deletePendingId)
          closeDelete()
        }}
        onCancel={closeDelete}
      />

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl sm:p-8">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Create User</h2>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {formError && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label htmlFor="user-name" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Full Name
                </label>
                <input
                  id="user-name"
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. John Doe"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label htmlFor="user-email" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Email
                </label>
                <input
                  id="user-email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder="e.g. john@church.org"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label htmlFor="user-phone" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Phone Number <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <input
                  id="user-phone"
                  type="tel"
                  value={form.phoneNumber}
                  onChange={(e) => setForm((f) => ({ ...f, phoneNumber: e.target.value }))}
                  placeholder="e.g. +44 7123 456789"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label htmlFor="user-password" className="block text-sm font-medium text-gray-700 mb-1.5">
                  One-Time Password
                </label>
                <input
                  id="user-password"
                  type="text"
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  placeholder="At least 8 characters"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
                <p className="mt-1 text-xs text-gray-500">
                  The user will be required to change this on first login.
                </p>
              </div>

              <div>
                <label htmlFor="user-position" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Position
                </label>
                <select
                  id="user-position"
                  value={form.position}
                  onChange={(e) => setForm((f) => ({ ...f, position: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="" disabled>Select a position</option>
                  {groupOptions.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="rounded-lg px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
                  style={{ backgroundColor: 'rgba(27, 34, 119, 1)' }}
                >
                  {formLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Creating…
                    </>
                  ) : (
                    'Create User'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

function Th({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <th className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 ${className ?? ''}`}>
      {children}
    </th>
  )
}

function Td({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <td className={`px-4 py-3 whitespace-nowrap ${className ?? ''}`}>
      {children}
    </td>
  )
}
