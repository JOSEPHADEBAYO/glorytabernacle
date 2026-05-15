import { useState, useCallback } from 'react'
import { Trash2, X } from 'lucide-react'

interface ConfirmDeleteModalProps {
  open: boolean
  title?: string
  message?: string
  itemName?: string
  onConfirm: () => void | Promise<void>
  onCancel: () => void
  isDeleting?: boolean
}

export function ConfirmDeleteModal({
  open,
  title = 'Confirm Delete',
  message,
  itemName,
  onConfirm,
  onCancel,
  isDeleting: externalDeleting,
}: ConfirmDeleteModalProps) {
  const [internalDeleting, setInternalDeleting] = useState(false)
  const isDeleting = externalDeleting ?? internalDeleting

  if (!open) return null

  const handleConfirm = async () => {
    setInternalDeleting(true)
    try {
      await onConfirm()
    } finally {
      setInternalDeleting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} aria-hidden="true" />
      <div className="relative w-full max-w-sm rounded-2xl bg-white shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-2">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-50">
              <Trash2 className="h-5 w-5 text-red-500" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">{title}</h2>
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={isDeleting}
            className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-40"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-4">
          <p className="text-sm text-gray-600 leading-relaxed">
            {message ?? (
              <>
                Are you sure you want to delete
                {itemName ? <strong className="text-gray-900"> {itemName}</strong> : ' this item'}
                ? This action cannot be undone.
              </>
            )}
          </p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 pb-6 pt-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={isDeleting}
            className="px-4 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isDeleting}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white rounded-lg transition-all disabled:opacity-50"
            style={{ backgroundColor: '#dc2626' }}
          >
            {isDeleting ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Deleting…
              </>
            ) : (
              'Delete'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

/**
 * Hook to manage confirm-delete state.
 * Returns: [isOpen, pendingItem, openDelete, closeDelete]
 */
export function useConfirmDelete<T = string>() {
  const [pendingItem, setPendingItem] = useState<T | null>(null)
  const isOpen = pendingItem !== null

  const openDelete = useCallback((item: T) => setPendingItem(item), [])
  const closeDelete = useCallback(() => setPendingItem(null), [])

  return { isOpen, pendingItem, openDelete, closeDelete } as const
}
