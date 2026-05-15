'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { useToast } from '@/components/ui/toast-provider'
import {
  ConfirmDeleteModal,
  useConfirmDelete,
} from '@/components/ui/confirm-delete-modal'

interface Book {
  id: string
  title: string
  author: string
  category: string
  description: string
  coverImage: string
  purchaseUrl: string | null
  published: boolean
  /** Book-of-the-Month flag — appears on homepage BooksSection when true. */
  featured: boolean
  /** Sort order within the featured set (1 = big slot, 2-3 = small slots). */
  featuredOrder: number
  createdAt: Date
}

interface BooksManagerProps {
  initialBooks: Book[]
}

const BOOK_CATEGORIES = [
  'Spiritual Growth',
  'Prayer & Intercession',
  'Faith & Doctrine',
  'Christian Living',
  'Leadership',
  'Family & Relationships',
  'Devotional',
  'Theology',
  'Biography',
  'Other',
]

export function BooksManager({ initialBooks }: BooksManagerProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [books, setBooks] = useState(initialBooks)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingBook, setEditingBook] = useState<Book | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [togglingBookId, setTogglingBookId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>('All Categories')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const { isOpen: deleteIsOpen, pendingItem: deletePendingId, openDelete, closeDelete } = useConfirmDelete<string>()
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10) // Table pagination
  const [gridDisplayCount, setGridDisplayCount] = useState(12) // Grid infinite scroll

  // Enterprise-level refetch function
  const refetchBooks = async () => {
    try {
      const response = await fetch('/api/books', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store', // Ensure fresh data
      })

      if (response.ok) {
        const data = await response.json()
        // API returns { books: [] }, extract the books array
        const freshBooks = data.books || []
        setBooks(freshBooks)
      }
    } catch (error) {
      console.error('Error refetching books:', error)
    }
  }

  const handleAddBook = () => {
    setIsAddModalOpen(true)
  }

  const handleEditBook = (book: Book) => {
    setEditingBook(book)
    setIsEditModalOpen(true)
  }

  const handleDeleteBook = async (id: string) => {
    try {
      const response = await fetch(`/api/books/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        // Optimistically remove from UI
        setBooks(books.filter((book) => book.id !== id))
        toast({
          title: 'Book deleted successfully',
          description: 'The book has been removed from the library.',
          variant: 'success',
          duration: 3000,
        })
        // Refetch to ensure consistency
        await refetchBooks()
        router.refresh()
      } else {
        const data = await response.json()
        const errorMessage = data.error || 'Failed to delete book'
        toast({
          title: 'Delete failed',
          description: errorMessage,
          variant: 'error',
          duration: 5000,
        })
      }
    } catch (error) {
      console.error('Error deleting book:', error)
      const errorMessage = error instanceof Error && error.message.includes('fetch')
        ? 'Unable to connect to server. Please check your internet connection.'
        : 'An error occurred while deleting the book'
      toast({
        title: 'Delete failed',
        description: errorMessage,
        variant: 'error',
        duration: 5000,
      })
    }
  }

  const handleTogglePublish = async (id: string) => {
    // Find the book to toggle
    const book = books.find((b) => b.id === id)
    if (!book) return

    // Set loading state for this specific book
    setTogglingBookId(id)
    setError(null)

    // Store previous state for rollback
    const previousPublishedState = book.published

    // Optimistically update local state
    setBooks(books.map((b) => 
      b.id === id ? { ...b, published: !b.published } : b
    ))

    try {
      const response = await fetch(`/api/books/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ published: !previousPublishedState }),
      })

      if (!response.ok) {
        // Revert on error
        setBooks(books.map((b) => 
          b.id === id ? { ...b, published: previousPublishedState } : b
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
        
        // Clear error after 5 seconds
        setTimeout(() => setError(null), 5000)
      } else {
        // Show success toast
        toast({
          title: 'Publish status updated',
          description: `Book ${!previousPublishedState ? 'published' : 'unpublished'} successfully.`,
          variant: 'success',
          duration: 3000,
        })
        // Refetch to ensure consistency with server
        await refetchBooks()
        router.refresh()
      }
    } catch (err) {
      // Revert on error
      setBooks(books.map((b) => 
        b.id === id ? { ...b, published: previousPublishedState } : b
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
      
      // Clear error after 5 seconds
      setTimeout(() => setError(null), 5000)
    } finally {
      setTogglingBookId(null)
    }
  }

  // Filter books based on selected category and search query
  const filteredBooks = books.filter((book) => {
    // Apply category filter
    const matchesCategory = selectedCategory === 'All Categories' || book.category === selectedCategory
    
    // Apply search filter (case-insensitive, matches title OR author)
    const matchesSearch = searchQuery === '' || 
      book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.author.toLowerCase().includes(searchQuery.toLowerCase())
    
    // Both filters must match (AND logic)
    return matchesCategory && matchesSearch
  })

  // Pagination for table view
  const totalPages = Math.ceil(filteredBooks.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedBooks = filteredBooks.slice(startIndex, endIndex)

  // Grid view - show limited items for infinite scroll
  const gridBooks = filteredBooks.slice(0, gridDisplayCount)
  const hasMoreGridItems = gridDisplayCount < filteredBooks.length

  // Load more for grid infinite scroll
  const loadMoreGridItems = () => {
    setGridDisplayCount(prev => Math.min(prev + 12, filteredBooks.length))
  }

  // Reset pagination when filters change
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

  if (books.length === 0) {
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
                d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"
              />
            </svg>
          </div>
          <h3 className="text-2xl font-bold mb-2" style={{ color: 'rgba(27, 34, 119, 1)' }}>
            No Books Available
          </h3>
          <p className="text-gray-600 mb-6">
            Get started by adding your first book to the library.
          </p>
          <button
            onClick={handleAddBook}
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
            Add Your First Book
          </button>
        </div>

        {isAddModalOpen && (
          <AddBookModal
            onClose={() => setIsAddModalOpen(false)}
            onSuccess={async () => {
              setIsAddModalOpen(false)
              // Immediately refetch books from server
              await refetchBooks()
              router.refresh()
            }}
            toast={toast}
          />
        )}
      </div>
    )
  }

  // Show empty state if filtered results are empty but books exist
  const showFilteredEmptyState = filteredBooks.length === 0 && books.length > 0

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
            {filteredBooks.length} {filteredBooks.length === 1 ? 'book' : 'books'}
            {selectedCategory !== 'All Categories' && ` in ${selectedCategory}`}
            {searchQuery && ` matching "${searchQuery}"`}
          </p>
        </div>
        <button
          onClick={handleAddBook}
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
          Add Book
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
              No Books Found
            </h3>
            <p className="text-gray-600 mb-4">
              {searchQuery && selectedCategory !== 'All Categories' 
                ? `No books match the search "${searchQuery}" in category: ${selectedCategory}`
                : searchQuery
                ? `No books match the search: "${searchQuery}"`
                : `No books match the selected category: ${selectedCategory}`}
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

      {/* Books Grid or Table */}
      {!showFilteredEmptyState && (
        <>
          {viewMode === 'grid' ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {gridBooks.map((book, index) => (
              <div
                key={book.id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1 animate-in fade-in slide-in-from-bottom-4"
                style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'backwards' }}
              >
                {/* Book Cover */}
                <div className="relative h-64 bg-gray-100">
                  <Image
                    src={book.coverImage}
                    alt={book.title}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute top-2 right-2 flex gap-2">
                    {book.featured && (
                      <div
                        className="text-white text-xs font-semibold px-2 py-1 rounded"
                        style={{ backgroundColor: 'rgba(0, 6, 102, 1)' }}
                        title={`Book of the Month — slot ${book.featuredOrder || 'unset'}`}
                      >
                        Featured #{book.featuredOrder || '?'}
                      </div>
                    )}
                    {!book.published && (
                      <div className="bg-yellow-500 text-white text-xs font-semibold px-2 py-1 rounded">
                        Draft
                      </div>
                    )}
                  </div>
                </div>

                {/* Book Info */}
                <div className="p-4">
                  <span className="text-xs font-semibold text-blue-600 uppercase tracking-wide">
                    {book.category}
                  </span>
                  <h3 className="text-lg font-bold mt-1 mb-1" style={{ color: 'rgba(27, 34, 119, 1)' }}>
                    {book.title}
                  </h3>
                  <p className="text-sm text-gray-600 mb-2">by {book.author}</p>
                  <p className="text-sm text-gray-600 line-clamp-2 mb-4">{book.description}</p>

                  {/* Publish Toggle */}
                  <div className="mb-3 flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-700">
                        {book.published ? 'Published' : 'Draft'}
                      </span>
                      {togglingBookId === book.id && (
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
                      onClick={() => handleTogglePublish(book.id)}
                      disabled={togglingBookId === book.id || isLoading}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                        book.published ? 'bg-blue-600' : 'bg-gray-300'
                      }`}
                      aria-label={book.published ? 'Unpublish book' : 'Publish book'}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          book.published ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditBook(book)}
                      disabled={togglingBookId === book.id || deletePendingId === book.id}
                      className="flex-1 px-3 py-2 text-sm font-medium text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => openDelete(book.id)}
                      disabled={togglingBookId === book.id || deletePendingId === book.id}
                      className="flex-1 px-3 py-2 text-sm font-medium text-red-600 border border-red-600 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {deletePendingId === book.id ? (
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
                Load More Books
              </button>
            </div>
          )}
        </>
          ) : (
            <>
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <BooksTable
                books={paginatedBooks}
                onEdit={handleEditBook}
                onDelete={handleDeleteBook}
                onTogglePublish={handleTogglePublish}
                togglingBookId={togglingBookId}
                deletingBookId={deletePendingId}
                isLoading={isLoading}
              />
            </div>
            
            {/* Pagination for Table */}
            {totalPages > 1 && (
              <TablePagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                totalItems={filteredBooks.length}
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
          if (deletePendingId) await handleDeleteBook(deletePendingId)
          closeDelete()
        }}
        onCancel={closeDelete}
      />

      {isAddModalOpen && (
        <AddBookModal
          onClose={() => setIsAddModalOpen(false)}
          onSuccess={async () => {
            setIsAddModalOpen(false)
            // Immediately refetch books from server
            await refetchBooks()
            router.refresh()
          }}
          toast={toast}
        />
      )}

      {isEditModalOpen && editingBook && (
        <EditBookModal
          book={editingBook}
          onClose={() => {
            setIsEditModalOpen(false)
            setEditingBook(null)
          }}
          onSuccess={async () => {
            setIsEditModalOpen(false)
            setEditingBook(null)
            // Immediately refetch books from server
            await refetchBooks()
            router.refresh()
          }}
          toast={toast}
        />
      )}
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
  const allCategories = ['All Categories', ...BOOK_CATEGORIES]

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
        Search Books
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
          placeholder="Search by title or author..."
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

function AddBookModal({ onClose, onSuccess, toast }: { onClose: () => void; onSuccess: () => void; toast: (options: { title: string; description?: string; variant?: 'success' | 'error' | 'warning' | 'info'; duration?: number }) => void }) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    category: 'Spiritual Growth',
    description: '',
    coverImage: '',
    purchaseUrl: '',
    published: false,
    featured: false,
    featuredOrder: 0,
  })

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload an image file (JPG, PNG, etc.)',
        variant: 'error',
        duration: 5000,
      })
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Please upload an image smaller than 5MB',
        variant: 'error',
        duration: 5000,
      })
      return
    }

    setIsUploading(true)
    setError('')

    try {
      const uploadFormData = new FormData()
      uploadFormData.append('file', file)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: uploadFormData,
      })

      if (response.ok) {
        const data = await response.json()
        setFormData({ ...formData, coverImage: data.url })
        toast({
          title: 'Image uploaded successfully',
          description: 'Your book cover has been uploaded.',
          variant: 'success',
          duration: 3000,
        })
      } else {
        const data = await response.json()
        const errorMessage = data.error || 'Failed to upload image'
        setError(errorMessage)
        toast({
          title: 'Upload failed',
          description: errorMessage,
          variant: 'error',
          duration: 5000,
        })
      }
    } catch (err) {
      const errorMessage = 'An error occurred while uploading the image'
      setError(errorMessage)
      toast({
        title: 'Upload failed',
        description: errorMessage,
        variant: 'error',
        duration: 5000,
      })
    } finally {
      setIsUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      const response = await fetch('/api/books', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        const newBook = await response.json()
        
        toast({
          title: 'Book created successfully',
          description: `"${formData.title}" has been added to the library.`,
          variant: 'success',
          duration: 3000,
        })
        
        // Close modal and trigger refetch
        onSuccess()
      } else {
        const data = await response.json()
        const errorMessage = data.error || 'Failed to add book'
        setError(errorMessage)
        toast({
          title: 'Failed to create book',
          description: errorMessage,
          variant: 'error',
          duration: 5000,
        })
      }
    } catch (err) {
      const errorMessage = err instanceof Error && err.message.includes('fetch')
        ? 'Unable to connect to server. Please check your internet connection.'
        : 'An error occurred while creating the book'
      setError(errorMessage)
      toast({
        title: 'Failed to create book',
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
            Add New Book
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
              Book Title *
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              placeholder="Enter book title"
            />
          </div>

          {/* Author */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Author *
            </label>
            <input
              type="text"
              required
              value={formData.author}
              onChange={(e) => setFormData({ ...formData, author: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              placeholder="Enter author name"
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
              {BOOK_CATEGORIES.map((cat) => (
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
              placeholder="Enter book description"
            />
          </div>

          {/* Cover Image Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cover Image *
            </label>
            
            {/* Image Preview */}
            {formData.coverImage && (
              <div className="mb-3 relative w-full h-48 rounded-lg overflow-hidden border border-gray-300">
                <Image
                  src={formData.coverImage}
                  alt="Book cover preview"
                  fill
                  className="object-cover"
                />
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, coverImage: '' })}
                  className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors"
                  title="Remove image"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                    className="w-4 h-4"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}

            {/* File Upload Button */}
            <div className="flex gap-2">
              <label className="flex-1 cursor-pointer">
                <div className="flex items-center justify-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors">
                  {isUploading ? (
                    <>
                      <svg
                        className="animate-spin h-5 w-5 text-blue-600"
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
                      <span className="text-sm font-medium text-blue-600">Uploading...</span>
                    </>
                  ) : (
                    <>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2}
                        stroke="currentColor"
                        className="w-5 h-5 text-gray-600"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
                        />
                      </svg>
                      <span className="text-sm font-medium text-gray-700">
                        {formData.coverImage ? 'Change Image' : 'Upload Image'}
                      </span>
                    </>
                  )}
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  disabled={isUploading}
                  className="hidden"
                />
              </label>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Upload a book cover image (JPG, PNG, max 5MB)
            </p>
            
            {/* Hidden input to ensure form validation */}
            <input
              type="hidden"
              required
              value={formData.coverImage}
            />
          </div>

          {/* Purchase URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Purchase URL (Optional)
            </label>
            <input
              type="url"
              value={formData.purchaseUrl}
              onChange={(e) => setFormData({ ...formData, purchaseUrl: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              placeholder="https://example.com/buy-book"
            />
          </div>

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

          {/* Book of the Month — featured + featuredOrder */}
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  Feature on Homepage
                </p>
                <p className="text-xs text-gray-500">
                  Appears in the &ldquo;Books of the Month&rdquo; section.
                  Pick three books at most: 1 = big featured slot, 2-3 = small
                  secondary slots.
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={formData.featured}
                onClick={() =>
                  setFormData((prev) => ({ ...prev, featured: !prev.featured }))
                }
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  formData.featured ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    formData.featured ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
            {formData.featured && (
              <div className="flex items-center gap-3">
                <label htmlFor="featuredOrder" className="text-sm font-medium text-gray-700">
                  Featured order
                </label>
                <input
                  id="featuredOrder"
                  type="number"
                  min={1}
                  max={99}
                  step={1}
                  value={formData.featuredOrder}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      featuredOrder: parseInt(e.target.value, 10) || 0,
                    })
                  }
                  className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
                <span className="text-xs text-gray-500">
                  1 = big slot · 2-3 = small slots
                </span>
              </div>
            )}
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
                'Add Book'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function EditBookModal({
  book,
  onClose,
  onSuccess,
  toast,
}: {
  book: Book
  onClose: () => void
  onSuccess: () => void
  toast: (options: { title: string; description?: string; variant?: 'success' | 'error' | 'warning' | 'info'; duration?: number }) => void
}) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    title: book.title,
    author: book.author,
    category: book.category,
    description: book.description,
    coverImage: book.coverImage,
    purchaseUrl: book.purchaseUrl || '',
    published: book.published,
    featured: book.featured,
    featuredOrder: book.featuredOrder,
  })

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload an image file (JPG, PNG, etc.)',
        variant: 'error',
        duration: 5000,
      })
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Please upload an image smaller than 5MB',
        variant: 'error',
        duration: 5000,
      })
      return
    }

    setIsUploading(true)
    setError('')

    try {
      const uploadFormData = new FormData()
      uploadFormData.append('file', file)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: uploadFormData,
      })

      if (response.ok) {
        const data = await response.json()
        setFormData({ ...formData, coverImage: data.url })
        toast({
          title: 'Image uploaded successfully',
          description: 'Your book cover has been uploaded.',
          variant: 'success',
          duration: 3000,
        })
      } else {
        const data = await response.json()
        const errorMessage = data.error || 'Failed to upload image'
        setError(errorMessage)
        toast({
          title: 'Upload failed',
          description: errorMessage,
          variant: 'error',
          duration: 5000,
        })
      }
    } catch (err) {
      const errorMessage = 'An error occurred while uploading the image'
      setError(errorMessage)
      toast({
        title: 'Upload failed',
        description: errorMessage,
        variant: 'error',
        duration: 5000,
      })
    } finally {
      setIsUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      const response = await fetch(`/api/books/${book.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        const updatedBook = await response.json()
        
        toast({
          title: 'Book updated successfully',
          description: `"${formData.title}" has been updated.`,
          variant: 'success',
          duration: 3000,
        })
        
        // Close modal and trigger refetch
        onSuccess()
      } else {
        const data = await response.json()
        const errorMessage = data.error || 'Failed to update book'
        setError(errorMessage)
        toast({
          title: 'Failed to update book',
          description: errorMessage,
          variant: 'error',
          duration: 5000,
        })
      }
    } catch (err) {
      const errorMessage = err instanceof Error && err.message.includes('fetch')
        ? 'Unable to connect to server. Please check your internet connection.'
        : 'An error occurred while updating the book'
      setError(errorMessage)
      toast({
        title: 'Failed to update book',
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
            Edit Book
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
              Book Title *
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              placeholder="Enter book title"
            />
          </div>

          {/* Author */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Author *
            </label>
            <input
              type="text"
              required
              value={formData.author}
              onChange={(e) => setFormData({ ...formData, author: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              placeholder="Enter author name"
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
              {BOOK_CATEGORIES.map((cat) => (
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
              placeholder="Enter book description"
            />
          </div>

          {/* Cover Image Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cover Image *
            </label>
            
            {/* Image Preview */}
            {formData.coverImage && (
              <div className="mb-3 relative w-full h-48 rounded-lg overflow-hidden border border-gray-300">
                <Image
                  src={formData.coverImage}
                  alt="Book cover preview"
                  fill
                  className="object-cover"
                />
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, coverImage: '' })}
                  className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors"
                  title="Remove image"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                    className="w-4 h-4"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}

            {/* File Upload Button */}
            <div className="flex gap-2">
              <label className="flex-1 cursor-pointer">
                <div className="flex items-center justify-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors">
                  {isUploading ? (
                    <>
                      <svg
                        className="animate-spin h-5 w-5 text-blue-600"
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
                      <span className="text-sm font-medium text-blue-600">Uploading...</span>
                    </>
                  ) : (
                    <>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2}
                        stroke="currentColor"
                        className="w-5 h-5 text-gray-600"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
                        />
                      </svg>
                      <span className="text-sm font-medium text-gray-700">
                        {formData.coverImage ? 'Change Image' : 'Upload Image'}
                      </span>
                    </>
                  )}
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  disabled={isUploading}
                  className="hidden"
                />
              </label>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Upload a book cover image (JPG, PNG, max 5MB)
            </p>
            
            {/* Hidden input to ensure form validation */}
            <input
              type="hidden"
              required
              value={formData.coverImage}
            />
          </div>

          {/* Purchase URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Purchase URL (Optional)
            </label>
            <input
              type="url"
              value={formData.purchaseUrl}
              onChange={(e) => setFormData({ ...formData, purchaseUrl: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              placeholder="https://example.com/buy-book"
            />
          </div>

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

          {/* Book of the Month — featured + featuredOrder */}
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  Feature on Homepage
                </p>
                <p className="text-xs text-gray-500">
                  Appears in the &ldquo;Books of the Month&rdquo; section.
                  Pick three books at most: 1 = big featured slot, 2-3 = small
                  secondary slots.
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={formData.featured}
                onClick={() =>
                  setFormData((prev) => ({ ...prev, featured: !prev.featured }))
                }
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  formData.featured ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    formData.featured ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
            {formData.featured && (
              <div className="flex items-center gap-3">
                <label htmlFor="edit-featuredOrder" className="text-sm font-medium text-gray-700">
                  Featured order
                </label>
                <input
                  id="edit-featuredOrder"
                  type="number"
                  min={1}
                  max={99}
                  step={1}
                  value={formData.featuredOrder}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      featuredOrder: parseInt(e.target.value, 10) || 0,
                    })
                  }
                  className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
                <span className="text-xs text-gray-500">
                  1 = big slot · 2-3 = small slots
                </span>
              </div>
            )}
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
                'Update Book'
              )}
            </button>
          </div>
        </form>
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

function BooksTable({
  books,
  onEdit,
  onDelete,
  onTogglePublish,
  togglingBookId,
  deletingBookId: deletePendingId,
  isLoading,
}: {
  books: Book[]
  onEdit: (book: Book) => void
  onDelete: (id: string) => void
  onTogglePublish: (id: string) => void
  togglingBookId: string | null
  deletingBookId: string | null
  isLoading: boolean
}) {
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
                Author
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
            {books.map((book, index) => (
              <tr 
                key={book.id} 
                className="hover:bg-gray-50 transition-all duration-200 animate-in fade-in slide-in-from-left-4"
                style={{ animationDelay: `${index * 30}ms`, animationFillMode: 'backwards' }}
              >
                {/* Cover Image */}
                <td className="px-6 py-4">
                  <div className="relative w-16 h-20 rounded overflow-hidden bg-gray-100 flex-shrink-0">
                    <Image
                      src={book.coverImage}
                      alt={book.title}
                      fill
                      sizes="64px"
                      className="object-cover"
                    />
                  </div>
                </td>

                {/* Title */}
                <td className="px-6 py-4">
                  <div className="text-sm font-semibold text-gray-900 truncate max-w-[200px]">
                    {book.title}
                  </div>
                  <div className="text-xs text-gray-500 mt-1 truncate max-w-[200px]" title={book.description}>
                    {book.description}
                  </div>
                </td>

                {/* Author */}
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900">{book.author}</div>
                </td>

                {/* Category */}
                <td className="px-6 py-4">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {book.category}
                  </span>
                </td>

                {/* Status Badge */}
                <td className="px-6 py-4">
                  {book.published ? (
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
                      onClick={() => onTogglePublish(book.id)}
                      disabled={togglingBookId === book.id || isLoading}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                        book.published ? 'bg-blue-600' : 'bg-gray-300'
                      }`}
                      aria-label={book.published ? 'Unpublish book' : 'Publish book'}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          book.published ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                    {togglingBookId === book.id && (
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
                      onClick={() => onEdit(book)}
                      disabled={togglingBookId === book.id || deletePendingId === book.id}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all hover:scale-110 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Edit book"
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
                      onClick={() => onDelete(book.id)}
                      disabled={togglingBookId === book.id || deletePendingId === book.id}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all hover:scale-110 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Delete book"
                    >
                      {deletePendingId === book.id ? (
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
      // Show all pages if total is small
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      // Always show first page
      pages.push(1)

      if (currentPage > 3) {
        pages.push('...')
      }

      // Show pages around current page
      const start = Math.max(2, currentPage - 1)
      const end = Math.min(totalPages - 1, currentPage + 1)

      for (let i = start; i <= end; i++) {
        pages.push(i)
      }

      if (currentPage < totalPages - 2) {
        pages.push('...')
      }

      // Always show last page
      pages.push(totalPages)
    }

    return pages
  }

  return (
    <div className="mt-4 flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200 sm:px-6 rounded-b-xl animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* Results info */}
      <div className="flex-1 flex justify-between sm:hidden">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          Previous
        </button>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          Next
        </button>
      </div>

      <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-gray-700">
            Showing <span className="font-medium">{startItem}</span> to{' '}
            <span className="font-medium">{endItem}</span> of{' '}
            <span className="font-medium">{totalItems}</span> results
          </p>
        </div>
        <div>
          <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
            {/* Previous button */}
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-105 active:scale-95"
            >
              <span className="sr-only">Previous</span>
              <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </button>

            {/* Page numbers */}
            {getPageNumbers().map((page, index) => {
              if (page === '...') {
                return (
                  <span
                    key={`ellipsis-${index}`}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700"
                  >
                    ...
                  </span>
                )
              }

              return (
                <button
                  key={page}
                  onClick={() => onPageChange(page as number)}
                  className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium transition-all hover:scale-105 active:scale-95 ${
                    currentPage === page
                      ? 'z-10 bg-blue-600 border-blue-600 text-white shadow-md'
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {page}
                </button>
              )
            })}

            {/* Next button */}
            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-105 active:scale-95"
            >
              <span className="sr-only">Next</span>
              <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </button>
          </nav>
        </div>
      </div>
    </div>
  )
}
