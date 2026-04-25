/**
 * Property 18: Input aria-invalid reflects error state
 * Validates: Requirements 10.11
 */
import { describe } from 'vitest'
import { render } from '@testing-library/react'
import * as fc from 'fast-check'
import { Input } from '@/components/ui/input'

describe('Input', () => {
  test('Property 18: error state sets aria-invalid and aria-describedby', () => {
    fc.assert(
      fc.property(
        // Generate a non-empty id and a non-empty error message
        fc.string({ minLength: 1, maxLength: 20 }).filter((s) => /^[a-z][a-z0-9-]*$/.test(s)),
        fc.string({ minLength: 1, maxLength: 50 }),
        (id, errorMsg) => {
          const { container } = render(
            <Input
              id={id}
              type="text"
              error={errorMsg}
              aria-label="test input"
            />
          )

          const input = container.querySelector('input')!
          const ariaInvalid = input.getAttribute('aria-invalid')
          const ariaDescribedBy = input.getAttribute('aria-describedby')

          return (
            ariaInvalid === 'true' &&
            ariaDescribedBy === `${id}-error`
          )
        }
      ),
      { numRuns: 20 }
    )
  })

  test('Property 18b: no error state means no aria-invalid', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 20 }).filter((s) => /^[a-z][a-z0-9-]*$/.test(s)),
        (id) => {
          const { container } = render(
            <Input id={id} type="text" aria-label="test input" />
          )

          const input = container.querySelector('input')!
          return input.getAttribute('aria-invalid') === null
        }
      ),
      { numRuns: 20 }
    )
  })
})
