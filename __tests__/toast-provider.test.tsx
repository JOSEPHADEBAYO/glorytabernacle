/**
 * Property 17: Toast queue never exceeds 3 visible toasts
 * Validates: Requirements 10.9
 */
import { describe } from 'vitest'
import { render, act, cleanup } from '@testing-library/react'
import * as fc from 'fast-check'
import { ToastProvider, useToast, type ToastVariant } from '@/components/ui/toast-provider'

const MAX_VISIBLE = 3

function ToastTrigger({ toasts }: { toasts: { title: string; variant: ToastVariant }[] }) {
  const { toast } = useToast()
  return (
    <button
      data-testid="trigger"
      onClick={() => {
        toasts.forEach((t) => toast(t))
      }}
    />
  )
}

describe('ToastProvider', () => {
  afterEach(() => {
    cleanup()
  })

  test('Property 17: visible toasts never exceed 3', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            title: fc.string({ minLength: 1, maxLength: 30 }),
            variant: fc.constantFrom<ToastVariant>('success', 'error', 'warning', 'info'),
          }),
          { minLength: 1, maxLength: 10 }
        ),
        (toasts) => {
          const { getByTestId, container } = render(
            <ToastProvider>
              <ToastTrigger toasts={toasts} />
            </ToastProvider>
          )

          act(() => {
            getByTestId('trigger').click()
          })

          // Count rendered toast items — Radix renders them as <li> inside the viewport <ol>
          const visibleToasts = container.querySelectorAll('[data-radix-collection-item]')
          const result = visibleToasts.length <= MAX_VISIBLE

          cleanup()
          return result
        }
      ),
      { numRuns: 20 }
    )
  })
})
