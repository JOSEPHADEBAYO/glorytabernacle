import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { FileUploadField } from './file-upload-field'

// Mock Next.js Image component
vi.mock('next/image', () => ({
  default: ({ src, alt, ...props }: any) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} {...props} />
  },
}))

describe('FileUploadField', () => {
  const mockOnUpload = vi.fn()
  const mockOnRemove = vi.fn()
  let fetchMock: any

  beforeEach(() => {
    vi.clearAllMocks()
    // Mock global fetch
    fetchMock = vi.fn()
    global.fetch = fetchMock
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  // Helper function to get file input
  const getFileInput = (container: HTMLElement) => {
    return container.querySelector('input[type="file"]') as HTMLInputElement
  }

  describe('File Type Validation', () => {
    it('should accept JPG files when accept includes image/jpeg', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ url: 'https://example.com/image.jpg' }),
      })

      const { container } = render(
        <FileUploadField
          label="Cover Image"
          accept="image/jpeg,image/png"
          maxSize={5 * 1024 * 1024}
          onUpload={mockOnUpload}
          onRemove={mockOnRemove}
        />
      )

      const input = getFileInput(container)
      const file = new File(['image content'], 'test.jpg', { type: 'image/jpeg' })

      fireEvent.change(input, { target: { files: [file] } })

      await waitFor(() => {
        expect(fetchMock).toHaveBeenCalledWith('/api/upload', expect.any(Object))
      })

      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    })

    it('should accept PNG files when accept includes image/png', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ url: 'https://example.com/image.png' }),
      })

      const { container } = render(
        <FileUploadField
          label="Cover Image"
          accept="image/jpeg,image/png"
          maxSize={5 * 1024 * 1024}
          onUpload={mockOnUpload}
          onRemove={mockOnRemove}
        />
      )

      const input = getFileInput(container)
      const file = new File(['image content'], 'test.png', { type: 'image/png' })

      fireEvent.change(input, { target: { files: [file] } })

      await waitFor(() => {
        expect(fetchMock).toHaveBeenCalledWith('/api/upload', expect.any(Object))
      })

      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    })

    it('should accept PDF files when accept includes application/pdf', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ url: 'https://example.com/document.pdf' }),
      })

      const { container } = render(
        <FileUploadField
          label="PDF Document"
          accept="application/pdf"
          maxSize={10 * 1024 * 1024}
          onUpload={mockOnUpload}
          onRemove={mockOnRemove}
        />
      )

      const input = getFileInput(container)
      const file = new File(['pdf content'], 'test.pdf', { type: 'application/pdf' })

      fireEvent.change(input, { target: { files: [file] } })

      await waitFor(() => {
        expect(fetchMock).toHaveBeenCalledWith('/api/upload', expect.any(Object))
      })

      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    })

    it('should reject invalid file types for image upload', async () => {
      const { container } = render(
        <FileUploadField
          label="Cover Image"
          accept="image/jpeg,image/png"
          maxSize={5 * 1024 * 1024}
          onUpload={mockOnUpload}
          onRemove={mockOnRemove}
        />
      )

      const input = getFileInput(container)
      const file = new File(['pdf content'], 'test.pdf', { type: 'application/pdf' })

      fireEvent.change(input, { target: { files: [file] } })

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent('Invalid file type. Expected JPG or PNG.')
      })

      expect(fetchMock).not.toHaveBeenCalled()
      expect(mockOnUpload).not.toHaveBeenCalled()
    })

    it('should reject invalid file types for PDF upload', async () => {
      const { container } = render(
        <FileUploadField
          label="PDF Document"
          accept="application/pdf"
          maxSize={10 * 1024 * 1024}
          onUpload={mockOnUpload}
          onRemove={mockOnRemove}
        />
      )

      const input = getFileInput(container)
      const file = new File(['image content'], 'test.jpg', { type: 'image/jpeg' })

      fireEvent.change(input, { target: { files: [file] } })

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent('Invalid file type. Expected PDF.')
      })

      expect(fetchMock).not.toHaveBeenCalled()
      expect(mockOnUpload).not.toHaveBeenCalled()
    })
  })

  describe('File Size Validation', () => {
    it('should accept files within size limit', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ url: 'https://example.com/image.jpg' }),
      })

      const { container } = render(
        <FileUploadField
          label="Cover Image"
          accept="image/jpeg,image/png"
          maxSize={5 * 1024 * 1024} // 5MB
          onUpload={mockOnUpload}
          onRemove={mockOnRemove}
        />
      )

      const input = getFileInput(container)
      // Create a 4MB file (within limit)
      const fileContent = new Array(4 * 1024 * 1024).fill('a').join('')
      const file = new File([fileContent], 'test.jpg', { type: 'image/jpeg' })

      fireEvent.change(input, { target: { files: [file] } })

      await waitFor(() => {
        expect(fetchMock).toHaveBeenCalledWith('/api/upload', expect.any(Object))
      })

      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    })

    it('should reject files exceeding 5MB for images', async () => {
      const { container } = render(
        <FileUploadField
          label="Cover Image"
          accept="image/jpeg,image/png"
          maxSize={5 * 1024 * 1024} // 5MB
          onUpload={mockOnUpload}
          onRemove={mockOnRemove}
        />
      )

      const input = getFileInput(container)
      // Create a 6MB file (exceeds limit)
      const fileContent = new Array(6 * 1024 * 1024).fill('a').join('')
      const file = new File([fileContent], 'test.jpg', { type: 'image/jpeg' })

      fireEvent.change(input, { target: { files: [file] } })

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent('File too large. Maximum size is 5MB.')
      })

      expect(fetchMock).not.toHaveBeenCalled()
      expect(mockOnUpload).not.toHaveBeenCalled()
    })

    it('should reject files exceeding 10MB for PDFs', async () => {
      const { container } = render(
        <FileUploadField
          label="PDF Document"
          accept="application/pdf"
          maxSize={10 * 1024 * 1024} // 10MB
          onUpload={mockOnUpload}
          onRemove={mockOnRemove}
        />
      )

      const input = getFileInput(container)
      // Create an 11MB file (exceeds limit)
      const fileContent = new Array(11 * 1024 * 1024).fill('a').join('')
      const file = new File([fileContent], 'test.pdf', { type: 'application/pdf' })

      fireEvent.change(input, { target: { files: [file] } })

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent('File too large. Maximum size is 10MB.')
      })

      expect(fetchMock).not.toHaveBeenCalled()
      expect(mockOnUpload).not.toHaveBeenCalled()
    })
  })

  describe('Upload Success Flow', () => {
    it('should show loading state during upload', async () => {
      // Create a promise that we can control
      let resolveUpload: any
      const uploadPromise = new Promise((resolve) => {
        resolveUpload = resolve
      })

      fetchMock.mockReturnValueOnce(uploadPromise)

      const { container } = render(
        <FileUploadField
          label="Cover Image"
          accept="image/jpeg,image/png"
          maxSize={5 * 1024 * 1024}
          onUpload={mockOnUpload}
          onRemove={mockOnRemove}
        />
      )

      const input = getFileInput(container)
      const file = new File(['image content'], 'test.jpg', { type: 'image/jpeg' })

      fireEvent.change(input, { target: { files: [file] } })

      // Check for loading state
      await waitFor(() => {
        expect(screen.getByText('Uploading...')).toBeInTheDocument()
      })

      // Resolve the upload
      resolveUpload({
        ok: true,
        json: async () => ({ url: 'https://example.com/image.jpg' }),
      })

      // Wait for loading to disappear
      await waitFor(() => {
        expect(screen.queryByText('Uploading...')).not.toBeInTheDocument()
      })
    })

    it('should call onUpload with URL on successful upload', async () => {
      const testUrl = 'https://example.com/uploaded-image.jpg'
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ url: testUrl }),
      })

      const { container } = render(
        <FileUploadField
          label="Cover Image"
          accept="image/jpeg,image/png"
          maxSize={5 * 1024 * 1024}
          onUpload={mockOnUpload}
          onRemove={mockOnRemove}
        />
      )

      const input = getFileInput(container)
      const file = new File(['image content'], 'test.jpg', { type: 'image/jpeg' })

      fireEvent.change(input, { target: { files: [file] } })

      await waitFor(() => {
        expect(mockOnUpload).toHaveBeenCalledWith(testUrl)
      })
    })

    it('should upload file to /api/upload endpoint', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ url: 'https://example.com/image.jpg' }),
      })

      const { container } = render(
        <FileUploadField
          label="Cover Image"
          accept="image/jpeg,image/png"
          maxSize={5 * 1024 * 1024}
          onUpload={mockOnUpload}
          onRemove={mockOnRemove}
        />
      )

      const input = getFileInput(container)
      const file = new File(['image content'], 'test.jpg', { type: 'image/jpeg' })

      fireEvent.change(input, { target: { files: [file] } })

      await waitFor(() => {
        expect(fetchMock).toHaveBeenCalledWith(
          '/api/upload',
          expect.objectContaining({
            method: 'POST',
            body: expect.any(FormData),
          })
        )
      })
    })

    it('should disable input during upload', async () => {
      let resolveUpload: any
      const uploadPromise = new Promise((resolve) => {
        resolveUpload = resolve
      })

      fetchMock.mockReturnValueOnce(uploadPromise)

      const { container } = render(
        <FileUploadField
          label="Cover Image"
          accept="image/jpeg,image/png"
          maxSize={5 * 1024 * 1024}
          onUpload={mockOnUpload}
          onRemove={mockOnRemove}
        />
      )

      const input = getFileInput(container)
      const file = new File(['image content'], 'test.jpg', { type: 'image/jpeg' })

      fireEvent.change(input, { target: { files: [file] } })

      await waitFor(() => {
        expect(input).toBeDisabled()
      })

      // Resolve the upload
      resolveUpload({
        ok: true,
        json: async () => ({ url: 'https://example.com/image.jpg' }),
      })

      await waitFor(() => {
        expect(input).not.toBeDisabled()
      })
    })
  })

  describe('Upload Error Handling', () => {
    it('should display error message when upload fails', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Upload failed due to server error' }),
      })

      const { container } = render(
        <FileUploadField
          label="Cover Image"
          accept="image/jpeg,image/png"
          maxSize={5 * 1024 * 1024}
          onUpload={mockOnUpload}
          onRemove={mockOnRemove}
        />
      )

      const input = getFileInput(container)
      const file = new File(['image content'], 'test.jpg', { type: 'image/jpeg' })

      fireEvent.change(input, { target: { files: [file] } })

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent('Upload failed due to server error')
      })

      expect(mockOnUpload).not.toHaveBeenCalled()
    })

    it('should display generic error when upload fails without error message', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        json: async () => ({}),
      })

      const { container } = render(
        <FileUploadField
          label="Cover Image"
          accept="image/jpeg,image/png"
          maxSize={5 * 1024 * 1024}
          onUpload={mockOnUpload}
          onRemove={mockOnRemove}
        />
      )

      const input = getFileInput(container)
      const file = new File(['image content'], 'test.jpg', { type: 'image/jpeg' })

      fireEvent.change(input, { target: { files: [file] } })

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent('Upload failed')
      })

      expect(mockOnUpload).not.toHaveBeenCalled()
    })

    it('should handle network errors gracefully', async () => {
      fetchMock.mockRejectedValueOnce(new Error('Network error'))

      const { container } = render(
        <FileUploadField
          label="Cover Image"
          accept="image/jpeg,image/png"
          maxSize={5 * 1024 * 1024}
          onUpload={mockOnUpload}
          onRemove={mockOnRemove}
        />
      )

      const input = getFileInput(container)
      const file = new File(['image content'], 'test.jpg', { type: 'image/jpeg' })

      fireEvent.change(input, { target: { files: [file] } })

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent('Network error')
      })

      expect(mockOnUpload).not.toHaveBeenCalled()
    })

    it('should display external error prop', () => {
      render(
        <FileUploadField
          label="Cover Image"
          accept="image/jpeg,image/png"
          maxSize={5 * 1024 * 1024}
          onUpload={mockOnUpload}
          onRemove={mockOnRemove}
          error="External validation error"
        />
      )

      expect(screen.getByRole('alert')).toHaveTextContent('External validation error')
    })
  })

  describe('Preview Display', () => {
    it('should display image preview for uploaded images', () => {
      const imageUrl = 'https://example.com/image.jpg'

      render(
        <FileUploadField
          label="Cover Image"
          accept="image/jpeg,image/png"
          maxSize={5 * 1024 * 1024}
          currentUrl={imageUrl}
          onUpload={mockOnUpload}
          onRemove={mockOnRemove}
        />
      )

      const image = screen.getByAltText('Preview')
      expect(image).toBeInTheDocument()
      expect(image).toHaveAttribute('src', imageUrl)
    })

    it('should display filename for uploaded PDFs', () => {
      const pdfUrl = 'https://example.com/documents/my-tract.pdf'

      render(
        <FileUploadField
          label="PDF Document"
          accept="application/pdf"
          maxSize={10 * 1024 * 1024}
          currentUrl={pdfUrl}
          onUpload={mockOnUpload}
          onRemove={mockOnRemove}
        />
      )

      expect(screen.getByText('my-tract.pdf')).toBeInTheDocument()
      // Check for the text within the preview area (not the label)
      const pdfDocumentTexts = screen.getAllByText('PDF Document')
      expect(pdfDocumentTexts.length).toBeGreaterThan(0)
    })

    it('should display fallback filename for invalid PDF URLs', () => {
      const invalidUrl = 'not-a-valid-url'

      render(
        <FileUploadField
          label="PDF Document"
          accept="application/pdf"
          maxSize={10 * 1024 * 1024}
          currentUrl={invalidUrl}
          onUpload={mockOnUpload}
          onRemove={mockOnRemove}
        />
      )

      expect(screen.getByText('document.pdf')).toBeInTheDocument()
    })

    it('should show upload area when no file is uploaded', () => {
      render(
        <FileUploadField
          label="Cover Image"
          accept="image/jpeg,image/png"
          maxSize={5 * 1024 * 1024}
          onUpload={mockOnUpload}
          onRemove={mockOnRemove}
        />
      )

      expect(screen.getByText('Click to upload image')).toBeInTheDocument()
      expect(screen.getByText('JPG or PNG, max 5MB')).toBeInTheDocument()
    })

    it('should show correct text for PDF upload area', () => {
      render(
        <FileUploadField
          label="PDF Document"
          accept="application/pdf"
          maxSize={10 * 1024 * 1024}
          onUpload={mockOnUpload}
          onRemove={mockOnRemove}
        />
      )

      expect(screen.getByText('Click to upload PDF')).toBeInTheDocument()
      expect(screen.getByText('PDF only, max 10MB')).toBeInTheDocument()
    })
  })

  describe('Remove Functionality', () => {
    it('should call onRemove when remove button is clicked for images', () => {
      const imageUrl = 'https://example.com/image.jpg'

      render(
        <FileUploadField
          label="Cover Image"
          accept="image/jpeg,image/png"
          maxSize={5 * 1024 * 1024}
          currentUrl={imageUrl}
          onUpload={mockOnUpload}
          onRemove={mockOnRemove}
        />
      )

      const removeButton = screen.getByText('Remove Image')
      fireEvent.click(removeButton)

      expect(mockOnRemove).toHaveBeenCalledTimes(1)
    })

    it('should call onRemove when remove button is clicked for PDFs', () => {
      const pdfUrl = 'https://example.com/document.pdf'

      render(
        <FileUploadField
          label="PDF Document"
          accept="application/pdf"
          maxSize={10 * 1024 * 1024}
          currentUrl={pdfUrl}
          onUpload={mockOnUpload}
          onRemove={mockOnRemove}
        />
      )

      const removeButton = screen.getByText('Remove PDF')
      fireEvent.click(removeButton)

      expect(mockOnRemove).toHaveBeenCalledTimes(1)
    })

    it('should clear error when remove is clicked', () => {
      const imageUrl = 'https://example.com/image.jpg'

      const { rerender } = render(
        <FileUploadField
          label="Cover Image"
          accept="image/jpeg,image/png"
          maxSize={5 * 1024 * 1024}
          currentUrl={imageUrl}
          onUpload={mockOnUpload}
          onRemove={mockOnRemove}
          error="Some error"
        />
      )

      expect(screen.getByRole('alert')).toHaveTextContent('Some error')

      const removeButton = screen.getByText('Remove Image')
      fireEvent.click(removeButton)

      // Rerender without error after remove
      rerender(
        <FileUploadField
          label="Cover Image"
          accept="image/jpeg,image/png"
          maxSize={5 * 1024 * 1024}
          onUpload={mockOnUpload}
          onRemove={mockOnRemove}
        />
      )

      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('should handle no file selected', () => {
      const { container } = render(
        <FileUploadField
          label="Cover Image"
          accept="image/jpeg,image/png"
          maxSize={5 * 1024 * 1024}
          onUpload={mockOnUpload}
          onRemove={mockOnRemove}
        />
      )

      const input = getFileInput(container)
      fireEvent.change(input, { target: { files: null } })

      expect(fetchMock).not.toHaveBeenCalled()
      expect(mockOnUpload).not.toHaveBeenCalled()
    })

    it('should clear previous errors when new file is selected', async () => {
      const { container } = render(
        <FileUploadField
          label="Cover Image"
          accept="image/jpeg,image/png"
          maxSize={5 * 1024 * 1024}
          onUpload={mockOnUpload}
          onRemove={mockOnRemove}
        />
      )

      const input = getFileInput(container)

      // First, upload an invalid file type
      const invalidFile = new File(['pdf content'], 'test.pdf', { type: 'application/pdf' })
      fireEvent.change(input, { target: { files: [invalidFile] } })

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent('Invalid file type')
      })

      // Now upload a valid file
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ url: 'https://example.com/image.jpg' }),
      })

      const validFile = new File(['image content'], 'test.jpg', { type: 'image/jpeg' })
      fireEvent.change(input, { target: { files: [validFile] } })

      // Error should be cleared
      await waitFor(() => {
        expect(screen.queryByRole('alert')).not.toBeInTheDocument()
      })
    })

    it('should reset file input after successful upload', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ url: 'https://example.com/image.jpg' }),
      })

      const { container } = render(
        <FileUploadField
          label="Cover Image"
          accept="image/jpeg,image/png"
          maxSize={5 * 1024 * 1024}
          onUpload={mockOnUpload}
          onRemove={mockOnRemove}
        />
      )

      const input = getFileInput(container)
      const file = new File(['image content'], 'test.jpg', { type: 'image/jpeg' })

      fireEvent.change(input, { target: { files: [file] } })

      await waitFor(() => {
        expect(mockOnUpload).toHaveBeenCalled()
      })

      // Input value should be reset
      expect(input.value).toBe('')
    })

    it('should reset file input after validation error', async () => {
      const { container } = render(
        <FileUploadField
          label="Cover Image"
          accept="image/jpeg,image/png"
          maxSize={5 * 1024 * 1024}
          onUpload={mockOnUpload}
          onRemove={mockOnRemove}
        />
      )

      const input = getFileInput(container)
      const file = new File(['pdf content'], 'test.pdf', { type: 'application/pdf' })

      fireEvent.change(input, { target: { files: [file] } })

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument()
      })

      // Input value should be reset
      expect(input.value).toBe('')
    })
  })
})
