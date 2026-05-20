'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { useToast } from '@/components/ui/toast-provider'
import { FileUploadField } from '@/components/dashboard/file-upload-field'
import { TRACT_CATEGORIES } from '@/lib/types/tract'
import {
  ConfirmDeleteModal,
  useConfirmDelete,
} from '@/components/ui/confirm-delete-modal'

interface Tract {
  id: string
  title: string
  category: string
  description: string
  coverImage: string
  documentUrl: string
  published: boolean
  createdAt: Date
}

interface TractsManagerProps {
  initialTracts: Tract[]
}

export function TractsManager({ initialTracts }: TractsManagerProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [tracts, setTracts] = useState(initialTracts)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingTract, setEditingTract] = useState<Tract | null>(null)

  const handleAddTract = () => {
    setIsAddModalOpen(true)
  }

  const handleEditTract = (tract: Tract) => {
    setEditingTract(tract)
    setIsEditModalOpen(true)
  }

  // Enterprise-level refetch function
  const refetchTracts = async () => {
    try {
      const response = await fetch('/api/tracts', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store', // Ensure fresh data
      })

      if (response.ok) {
        const data = await response.json()
        // API returns { tracts: [] }, extract the tracts array
        const freshTracts = data.tracts || []
        setTracts(freshTracts)
      }
    } catch (error) {
      console.error('Error refetching tracts:', error)
    }
  }

  const [togglingTractId, setTogglingTractId] = useState<string | null>(null)
  const { isOpen: deleteIsOpen, pendingItem: deletePendingId, openDelete, closeDelete } = useConfirmDelete<string>()
  const [error, setError] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>('All Categories')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const [gridDisplayCount, setGridDisplayCount] = useState(12)

  const handleDeleteTract = async (id: string) => {
    try {
      const response = await fetch(`/api/tracts/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setTracts(tracts.filter((tract) => tract.id !== id))
        toast({
          title: 'Tract deleted successfully',
          description: 'The tract has been removed from the library.',
          variant: 'success',
          duration: 3000,
        })
        await refetchTracts()
        router.refresh()
      } else {
        const data = await response.json()
        const errorMessage = data.error || 'Failed to delete tract'
        toast({
          title: 'Delete failed',
          description: errorMessage,
          variant: 'error',
          duration: 5000,
        })
      }
    } catch (error) {
      console.error('Error deleting tract:', error)
      const errorMessage = error instanceof Error && error.message.includes('fetch')
        ? 'Unable to connect to server. Please check your internet connection.'
        : 'An error occurred while deleting the tract'
      toast({
        title: 'Delete failed',
        description: errorMessage,
        variant: 'error',
        duration: 5000,
      })
    }
  }

  const handleTogglePublish = async (id: string) => {
    const tract = tracts.find((t) => t.id === id)
    if (!tract) return

    setTogglingTractId(id)
    setError(null)

    const previousPublishedState = tract.published

    setTracts(tracts.map((t) => 
      t.id === id ? { ...t, published: !t.published } : t
    ))

    try {
      const response = await fetch(`/api/tracts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ published: !previousPublishedState }),
      })

      if (!response.ok) {
        setTracts(tracts.map((t) => 
          t.id === id ? { ...t, published: previousPublishedState } : t
        ))
        
        const data = await response.json()
        const errorMessage = data.error || 'Failed to update publish status'
        setError(errorMessage)
        toast({
          title: 'Publish status update failed',
          description: errorMessage,
          variant: 'error',
          duration: 5000,
        })
        
        setTimeout(() => setError(null), 5000)
      } else {
        toast({
          title: 'Publish status updated',
          description: `Tract ${!previousPublishedState ? 'published' : 'unpublished'} successfully.`,
          variant: 'success',
          duration: 3000,
        })
        await refetchTracts()
        router.refresh()
      }
    } catch (err) {
      setTracts(tracts.map((t) => 
        t.id === id ? { ...t, published: previousPublishedState } : t
      ))
      
      const errorMessage = err instanceof Error && err.message.includes('fetch')
        ? 'Unable to connect to server. Please check your internet connection.'
        : 'An error occurred while updating publish status'
      setError(errorMessage)
      toast({
        title: 'Publish status update failed',
        description: errorMessage,
        variant: 'error',
        duration: 5000,
      })
      console.error('Error toggling publish status:', err)
      
      setTimeout(() => setError(null), 5000)
    } finally {
      setTogglingTractId(null)
    }
  }

  // Filter tracts based on selected category and search query
  const filteredTracts = tracts.filter((tract) => {
    const matchesCategory = selectedCategory === 'All Categories' || tract.category === selectedCategory
    const matchesSearch = searchQuery === '' || 
      tract.title.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  // Pagination for table view
  const totalPages = Math.ceil(filteredTracts.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedTracts = filteredTracts.slice(startIndex, endIndex)

  // Grid view - show limited items for infinite scroll
  const gridTracts = filteredTracts.slice(0, gridDisplayCount)
  const hasMoreGridItems = gridDisplayCount < filteredTracts.length

  const loadMoreGridItems = () => {
    setGridDisplayCount(prev => Math.min(prev + 12, filteredTracts.length))
  }

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category)
    setCurrentPage(1)
    setGridDisplayCount(12)
  }

  const handleSearchChange = (query: string) => {
    setSearchQuery(query)
    setCurrentPage(1)
    setGridDisplayCount(12)
  }

  if (tracts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="text-center max-w-md">
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gray-100 flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-12 h-12 text-gray-400"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
              />
            </svg>
          </div>
          <h3 className="text-2xl font-bold mb-2" style={{ color: 'rgba(27, 34, 119, 1)' }}>
            No Tracts Available
          </h3>
          <p className="text-gray-600 mb-6">
            Get started by adding your first tract to the library.
          </p>
          <button
            onClick={handleAddTract}
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-5 h-5"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Add Your First Tract
          </button>
        </div>

        {isAddModalOpen && (
          <AddTractModal
            onClose={() => setIsAddModalOpen(false)}
            onSuccess={async () => {
              setIsAddModalOpen(false)
              await refetchTracts()
              router.refresh()
            }}
            toast={toast}
          />
        )}

        {isEditModalOpen && editingTract && (
          <EditTractModal
            tract={editingTract}
            onClose={() => {
              setIsEditModalOpen(false)
              setEditingTract(null)
            }}
            onSuccess={async () => {
              setIsEditModalOpen(false)
              setEditingTract(null)
              await refetchTracts()
              router.refresh()
            }}
            toast={toast}
          />
        )}
      </div>
    )
  }

  const showFilteredEmptyState = filteredTracts.length === 0 && tracts.length > 0

  return (
    <div>
      {/* Error Message */}
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center justify-between animate-in fade-in slide-in-from-top-2 duration-300">
          <span>{error}</span>
          <button
            onClick={() => setError(null)}
            className="text-red-700 hover:text-red-900"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-5 h-5"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Header with Add Button */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-sm text-gray-600">
            {filteredTracts.length} {filteredTracts.length === 1 ? 'tract' : 'tracts'}
            {selectedCategory !== 'All Categories' && ` in ${selectedCategory}`}
            {searchQuery && ` matching "${searchQuery}"`}
          </p>
        </div>
        <button
          onClick={handleAddTract}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-all hover:scale-105 active:scale-95"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="w-5 h-5"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Add Tract
        </button>
      </div>

      {/* Search Bar */}
      <SearchBar
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
      />

      {/* Category Filter and View Toggle */}
      <div className="mb-4 flex items-end justify-between gap-4">
        <CategoryFilter
          selectedCategory={selectedCategory}
          onCategoryChange={handleCategoryChange}
        />
        <ViewToggle viewMode={viewMode} onViewModeChange={setViewMode} />
      </div>

      {/* Filtered Empty State */}
      {showFilteredEmptyState && (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-8 h-8 text-gray-400"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-bold mb-2" style={{ color: 'rgba(27, 34, 119, 1)' }}>
              No Tracts Found
            </h3>
            <p className="text-gray-600 mb-4">
              {searchQuery && selectedCategory !== 'All Categories' 
                ? `No tracts match the search "${searchQuery}" in category: ${selectedCategory}`
                : searchQuery
                ? `No tracts match the search: "${searchQuery}"`
                : `No tracts match the selected category: ${selectedCategory}`}
            </p>
            <div className="flex gap-2 justify-center">
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                >
                  Clear Search
                </button>
              )}
              {selectedCategory !== 'All Categories' && (
                <button
                  onClick={() => setSelectedCategory('All Categories')}
                  className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                >
                  Clear Category Filter
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tracts Grid or Table */}
      {!showFilteredEmptyState && (
        <>
          {viewMode === 'grid' ? (
            <>
              <TractGrid
                tracts={gridTracts}
                onEdit={handleEditTract}
                // Open the confirm-delete modal — the modal's onConfirm
                // is wired to call handleDeleteTract(deletePendingId).
                // Passing the delete handler directly bypassed the modal.
                onDelete={openDelete}
                onTogglePublish={handleTogglePublish}
                togglingTractId={togglingTractId}
                deletingTractId={deletePendingId}
              />
              
              {/* Load More Button for Grid */}
              {hasMoreGridItems && (
                <div className="mt-6 flex justify-center animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <button
                    onClick={loadMoreGridItems}
                    className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-all hover:scale-105 active:scale-95 flex items-center gap-2 shadow-md hover:shadow-lg"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                      className="w-5 h-5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M19.5 13.5L12 21m0 0l-7.5-7.5M12 21V3"
                      />
                    </svg>
                    Load More Tracts
                  </button>
                </div>
              )}
            </>
          ) : (
            <>
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <TractsTable
                  tracts={paginatedTracts}
                  onEdit={handleEditTract}
                  // Open the confirm-delete modal (modal's onConfirm runs
                  // handleDeleteTract). Passing the handler directly here
                  // would skip the confirmation step.
                  onDelete={openDelete}
                  onTogglePublish={handleTogglePublish}
                  togglingTractId={togglingTractId}
                  deletingTractId={deletePendingId}
                />
              </div>
              
              {/* Pagination for Table */}
              {totalPages > 1 && (
                <TablePagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                  totalItems={filteredTracts.length}
                  itemsPerPage={itemsPerPage}
                />
              )}
            </>
          )}
        </>
      )}

      <ConfirmDeleteModal
        open={deleteIsOpen}
        onConfirm={async () => {
          if (deletePendingId) await handleDeleteTract(deletePendingId)
          closeDelete()
        }}
        onCancel={closeDelete}
      />

      {isAddModalOpen && (
        <AddTractModal
          onClose={() => setIsAddModalOpen(false)}
          onSuccess={async () => {
            setIsAddModalOpen(false)
            await refetchTracts()
            router.refresh()
          }}
          toast={toast}
        />
      )}

      {isEditModalOpen && editingTract && (
        <EditTractModal
          tract={editingTract}
          onClose={() => {
            setIsEditModalOpen(false)
            setEditingTract(null)
          }}
          onSuccess={async () => {
            setIsEditModalOpen(false)
            setEditingTract(null)
            await refetchTracts()
            router.refresh()
          }}
          toast={toast}
        />
      )}
    </div>
  )
}

function AddTractModal({
  onClose,
  onSuccess,
  toast,
}: {
  onClose: () => void
  onSuccess: () => void
  toast: (options: {
    title: string
    description?: string
    variant?: 'success' | 'error' | 'warning' | 'info'
    duration?: number
  }) => void
}) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    title: '',
    category: 'Theology',
    description: '',
    coverImage: '',
    documentUrl: '',
    published: false,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validate that both files are uploaded
    if (!formData.coverImage) {
      setError('Please upload a cover image')
      return
    }

    if (!formData.documentUrl) {
      setError('Please upload a PDF document')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/tracts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        const newTract = await response.json()

        toast({
          title: 'Tract created successfully',
          description: `"${formData.title}" has been added to the library.`,
          variant: 'success',
          duration: 3000,
        })

        // Close modal and trigger refetch
        onSuccess()
      } else {
        const data = await response.json()
        const errorMessage = data.error || 'Failed to add tract'
        setError(errorMessage)
        toast({
          title: 'Failed to create tract',
          description: errorMessage,
          variant: 'error',
          duration: 5000,
        })
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error && err.message.includes('fetch')
          ? 'Unable to connect to server. Please check your internet connection.'
          : 'An error occurred while creating the tract'
      setError(errorMessage)
      toast({
        title: 'Failed to create tract',
        description: errorMessage,
        variant: 'error',
        duration: 5000,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold" style={{ color: 'rgba(27, 34, 119, 1)' }}>
            Add New Tract
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-6 h-6"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tract Title *
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              placeholder="Enter tract title"
              maxLength={200}
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category *
            </label>
            <select
              required
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            >
              {TRACT_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              required
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
              placeholder="Enter tract description (10-1000 characters)"
              minLength={10}
              maxLength={1000}
            />
            <p className="text-xs text-gray-500 mt-1">
              {formData.description.length}/1000 characters
            </p>
          </div>

          {/* Cover Image Upload */}
          <FileUploadField
            label="Cover Image *"
            accept="image/jpeg,image/png"
            maxSize={5 * 1024 * 1024} // 5MB
            currentUrl={formData.coverImage}
            onUpload={(url) => setFormData({ ...formData, coverImage: url })}
            onRemove={() => setFormData({ ...formData, coverImage: '' })}
          />

          {/* PDF Document Upload */}
          <FileUploadField
            label="PDF Document *"
            accept="application/pdf"
            maxSize={10 * 1024 * 1024} // 10MB
            currentUrl={formData.documentUrl}
            onUpload={(url) => setFormData({ ...formData, documentUrl: url })}
            onRemove={() => setFormData({ ...formData, documentUrl: '' })}
          />

          {/* Published */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="published"
              checked={formData.published}
              onChange={(e) => setFormData({ ...formData, published: e.target.checked })}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="published" className="text-sm font-medium text-gray-700">
              Publish immediately
            </label>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <svg
                    className="animate-spin h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Adding...
                </>
              ) : (
                'Add Tract'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}


function EditTractModal({
  tract,
  onClose,
  onSuccess,
  toast,
}: {
  tract: Tract
  onClose: () => void
  onSuccess: () => void
  toast: (options: {
    title: string
    description?: string
    variant?: 'success' | 'error' | 'warning' | 'info'
    duration?: number
  }) => void
}) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    title: tract.title,
    category: tract.category,
    description: tract.description,
    coverImage: tract.coverImage,
    documentUrl: tract.documentUrl,
    published: tract.published,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validate that both files are uploaded
    if (!formData.coverImage) {
      setError('Please upload a cover image')
      return
    }

    if (!formData.documentUrl) {
      setError('Please upload a PDF document')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch(`/api/tracts/${tract.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        const updatedTract = await response.json()

        toast({
          title: 'Tract updated successfully',
          description: `"${formData.title}" has been updated.`,
          variant: 'success',
          duration: 3000,
        })

        // Close modal and trigger refetch
        onSuccess()
      } else {
        const data = await response.json()
        const errorMessage = data.error || 'Failed to update tract'
        setError(errorMessage)
        toast({
          title: 'Failed to update tract',
          description: errorMessage,
          variant: 'error',
          duration: 5000,
        })
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error && err.message.includes('fetch')
          ? 'Unable to connect to server. Please check your internet connection.'
          : 'An error occurred while updating the tract'
      setError(errorMessage)
      toast({
        title: 'Failed to update tract',
        description: errorMessage,
        variant: 'error',
        duration: 5000,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold" style={{ color: 'rgba(27, 34, 119, 1)' }}>
            Edit Tract
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-6 h-6"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tract Title *
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              placeholder="Enter tract title"
              maxLength={200}
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category *
            </label>
            <select
              required
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            >
              {TRACT_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              required
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
              placeholder="Enter tract description (10-1000 characters)"
              minLength={10}
              maxLength={1000}
            />
            <p className="text-xs text-gray-500 mt-1">
              {formData.description.length}/1000 characters
            </p>
          </div>

          {/* Cover Image Upload */}
          <FileUploadField
            label="Cover Image *"
            accept="image/jpeg,image/png"
            maxSize={5 * 1024 * 1024} // 5MB
            currentUrl={formData.coverImage}
            onUpload={(url) => setFormData({ ...formData, coverImage: url })}
            onRemove={() => setFormData({ ...formData, coverImage: '' })}
          />

          {/* PDF Document Upload */}
          <FileUploadField
            label="PDF Document *"
            accept="application/pdf"
            maxSize={10 * 1024 * 1024} // 10MB
            currentUrl={formData.documentUrl}
            onUpload={(url) => setFormData({ ...formData, documentUrl: url })}
            onRemove={() => setFormData({ ...formData, documentUrl: '' })}
          />

          {/* Published */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="edit-published"
              checked={formData.published}
              onChange={(e) => setFormData({ ...formData, published: e.target.checked })}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="edit-published" className="text-sm font-medium text-gray-700">
              Publish immediately
            </label>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <svg
                    className="animate-spin h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Updating...
                </>
              ) : (
                'Update Tract'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}


function CategoryFilter({
  selectedCategory,
  onCategoryChange,
}: {
  selectedCategory: string
  onCategoryChange: (category: string) => void
}) {
  const allCategories = ['All Categories', ...TRACT_CATEGORIES]

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Filter by Category
      </label>
      <select
        value={selectedCategory}
        onChange={(e) => onCategoryChange(e.target.value)}
        className="w-full md:w-64 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white transition-all"
      >
        {allCategories.map((category) => (
          <option key={category} value={category}>
            {category}
          </option>
        ))}
      </select>
    </div>
  )
}

function SearchBar({
  searchQuery,
  onSearchChange,
}: {
  searchQuery: string
  onSearchChange: (query: string) => void
}) {
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Search Tracts
      </label>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="w-5 h-5 text-gray-400"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
            />
          </svg>
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search by title..."
          className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Clear search"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-5 h-5"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  )
}

function ViewToggle({
  viewMode,
  onViewModeChange,
}: {
  viewMode: 'grid' | 'table'
  onViewModeChange: (mode: 'grid' | 'table') => void
}) {
  return (
    <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
      <button
        onClick={() => onViewModeChange('grid')}
        className={`p-2 rounded-md transition-colors ${
          viewMode === 'grid'
            ? 'bg-white text-blue-600 shadow-sm'
            : 'text-gray-600 hover:text-gray-900'
        }`}
        title="Grid View"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          className="w-5 h-5"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z"
          />
        </svg>
      </button>
      <button
        onClick={() => onViewModeChange('table')}
        className={`p-2 rounded-md transition-colors ${
          viewMode === 'table'
            ? 'bg-white text-blue-600 shadow-sm'
            : 'text-gray-600 hover:text-gray-900'
        }`}
        title="Table View"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          className="w-5 h-5"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z"
          />
        </svg>
      </button>
    </div>
  )
}

function TractGrid({
  tracts,
  onEdit,
  onDelete,
  onTogglePublish,
  togglingTractId,
  deletingTractId: deletePendingId,
}: {
  tracts: Tract[]
  onEdit: (tract: Tract) => void
  onDelete: (id: string) => void
  onTogglePublish: (id: string) => void
  togglingTractId: string | null
  deletingTractId: string | null
}) {
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set())

  const handleImageError = (tractId: string) => {
    setImageErrors(prev => new Set(prev).add(tractId))
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {tracts.map((tract, index) => (
        <div
          key={tract.id}
          className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1 animate-in fade-in slide-in-from-bottom-4"
          style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'backwards' }}
        >
          {/* Tract Cover */}
          <div className="relative h-64 bg-gray-100">
            {imageErrors.has(tract.id) ? (
              <div className="w-full h-full flex flex-col items-center justify-center bg-gray-200">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-16 h-16 text-gray-400 mb-2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
                  />
                </svg>
                <span className="text-gray-500 text-sm">Image unavailable</span>
              </div>
            ) : (
              <Image
                src={tract.coverImage}
                alt={tract.title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                priority={index < 6}
                onError={() => handleImageError(tract.id)}
              />
            )}
            {!tract.published && (
              <div className="absolute top-2 right-2 bg-yellow-500 text-white text-xs font-semibold px-2 py-1 rounded">
                Draft
              </div>
            )}
          </div>

          {/* Tract Info */}
          <div className="p-4">
            <span className="text-xs font-semibold text-blue-600 uppercase tracking-wide">
              {tract.category}
            </span>
            <h3 className="text-lg font-bold mt-1 mb-1" style={{ color: 'rgba(27, 34, 119, 1)' }}>
              {tract.title}
            </h3>
            <p className="text-sm text-gray-600 line-clamp-2 mb-4">{tract.description}</p>

            {/* Publish Toggle */}
            <div className="mb-3 flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700">
                  {tract.published ? 'Published' : 'Draft'}
                </span>
                {togglingTractId === tract.id && (
                  <svg
                    className="animate-spin h-4 w-4 text-blue-600"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                )}
              </div>
              <button
                onClick={() => onTogglePublish(tract.id)}
                disabled={togglingTractId === tract.id}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                  tract.published ? 'bg-blue-600' : 'bg-gray-300'
                }`}
                aria-label={tract.published ? 'Unpublish tract' : 'Publish tract'}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    tract.published ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={() => window.open(tract.documentUrl, '_blank')}
                className="flex-1 px-3 py-2 text-sm font-medium text-green-600 border border-green-600 rounded-lg hover:bg-green-50 transition-colors"
              >
                View PDF
              </button>
              <button
                onClick={() => onEdit(tract)}
                disabled={togglingTractId === tract.id || deletePendingId === tract.id}
                className="flex-1 px-3 py-2 text-sm font-medium text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Edit
              </button>
              <button
                onClick={() => onDelete(tract.id)}
                disabled={togglingTractId === tract.id || deletePendingId === tract.id}
                className="flex-1 px-3 py-2 text-sm font-medium text-red-600 border border-red-600 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {deletePendingId === tract.id ? (
                  <>
                    <svg
                      className="animate-spin h-4 w-4"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Deleting...
                  </>
                ) : (
                  'Delete'
                )}
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function TractsTable({
  tracts,
  onEdit,
  onDelete,
  onTogglePublish,
  togglingTractId,
  deletingTractId: deletePendingId,
}: {
  tracts: Tract[]
  onEdit: (tract: Tract) => void
  onDelete: (id: string) => void
  onTogglePublish: (id: string) => void
  togglingTractId: string | null
  deletingTractId: string | null
}) {
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set())

  const handleImageError = (tractId: string) => {
    setImageErrors(prev => new Set(prev).add(tractId))
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Cover
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Title
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Category
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Published
              </th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {tracts.map((tract, index) => (
              <tr 
                key={tract.id} 
                className="hover:bg-gray-50 transition-all duration-200 animate-in fade-in slide-in-from-left-4"
                style={{ animationDelay: `${index * 30}ms`, animationFillMode: 'backwards' }}
              >
                {/* Cover Image */}
                <td className="px-6 py-4">
                  <div className="relative w-16 h-20 rounded overflow-hidden bg-gray-100 flex-shrink-0">
                    {imageErrors.has(tract.id) ? (
                      <div className="w-full h-full flex items-center justify-center bg-gray-200">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={1.5}
                          stroke="currentColor"
                          className="w-8 h-8 text-gray-400"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
                          />
                        </svg>
                      </div>
                    ) : (
                      <Image
                        src={tract.coverImage}
                        alt={tract.title}
                        fill
                        sizes="64px"
                        className="object-cover"
                        onError={() => handleImageError(tract.id)}
                      />
                    )}
                  </div>
                </td>

                {/* Title */}
                <td className="px-6 py-4">
                  <div className="text-sm font-semibold text-gray-900 truncate max-w-[200px]">
                    {tract.title}
                  </div>
                  <div className="text-xs text-gray-500 mt-1 truncate max-w-[200px]" title={tract.description}>
                    {tract.description}
                  </div>
                </td>

                {/* Category */}
                <td className="px-6 py-4">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {tract.category}
                  </span>
                </td>

                {/* Status Badge */}
                <td className="px-6 py-4">
                  {tract.published ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Published
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      Draft
                    </span>
                  )}
                </td>

                {/* Publish Toggle */}
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onTogglePublish(tract.id)}
                      disabled={togglingTractId === tract.id}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                        tract.published ? 'bg-blue-600' : 'bg-gray-300'
                      }`}
                      aria-label={tract.published ? 'Unpublish tract' : 'Publish tract'}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          tract.published ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                    {togglingTractId === tract.id && (
                      <svg
                        className="animate-spin h-4 w-4 text-blue-600"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                    )}
                  </div>
                </td>

                {/* Actions */}
                <td className="px-6 py-4">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => window.open(tract.documentUrl, '_blank')}
                      className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-all hover:scale-110 active:scale-95"
                      title="View PDF"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2}
                        stroke="currentColor"
                        className="w-5 h-5"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                        />
                      </svg>
                    </button>
                    <button
                      onClick={() => onEdit(tract)}
                      disabled={togglingTractId === tract.id || deletePendingId === tract.id}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all hover:scale-110 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Edit tract"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2}
                        stroke="currentColor"
                        className="w-5 h-5"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
                        />
                      </svg>
                    </button>
                    <button
                      onClick={() => onDelete(tract.id)}
                      disabled={togglingTractId === tract.id || deletePendingId === tract.id}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all hover:scale-110 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Delete tract"
                    >
                      {deletePendingId === tract.id ? (
                        <svg
                          className="animate-spin h-5 w-5"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          />
                        </svg>
                      ) : (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={2}
                          stroke="currentColor"
                          className="w-5 h-5"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                          />
                        </svg>
                      )}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function TablePagination({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  itemsPerPage,
}: {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  totalItems: number
  itemsPerPage: number
}) {
  const startItem = (currentPage - 1) * itemsPerPage + 1
  const endItem = Math.min(currentPage * itemsPerPage, totalItems)

  const getPageNumbers = () => {
    const pages: (number | string)[] = []
    const maxVisible = 7

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      if (currentPage <= 4) {
        for (let i = 1; i <= 5; i++) {
          pages.push(i)
        }
        pages.push('...')
        pages.push(totalPages)
      } else if (currentPage >= totalPages - 3) {
        pages.push(1)
        pages.push('...')
        for (let i = totalPages - 4; i <= totalPages; i++) {
          pages.push(i)
        }
      } else {
        pages.push(1)
        pages.push('...')
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i)
        }
        pages.push('...')
        pages.push(totalPages)
      }
    }

    return pages
  }

  return (
    <div className="mt-6 flex items-center justify-between animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="text-sm text-gray-700">
        Showing <span className="font-medium">{startItem}</span> to{' '}
        <span className="font-medium">{endItem}</span> of{' '}
        <span className="font-medium">{totalItems}</span> results
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-105 active:scale-95"
        >
          Previous
        </button>

        {getPageNumbers().map((page, index) => (
          <button
            key={index}
            onClick={() => typeof page === 'number' && onPageChange(page)}
            disabled={page === '...' || page === currentPage}
            className={`px-3 py-2 text-sm font-medium rounded-lg transition-all hover:scale-105 active:scale-95 ${
              page === currentPage
                ? 'bg-blue-600 text-white'
                : page === '...'
                ? 'text-gray-400 cursor-default'
                : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
            } ${page === '...' ? '' : 'disabled:opacity-50 disabled:cursor-not-allowed'}`}
          >
            {page}
          </button>
        ))}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-105 active:scale-95"
        >
          Next
        </button>
      </div>
    </div>
  )
}
