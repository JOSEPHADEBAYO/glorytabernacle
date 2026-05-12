import { describe, it, expect } from 'vitest'
import { createBookSchema } from '@/lib/validation/book'

describe('Debug Validation', () => {
  it('should show what safeParse returns for empty object', () => {
    const result = createBookSchema.safeParse({})
    console.log('Result:', JSON.stringify(result, null, 2))
    console.log('result.success:', result.success)
    console.log('result.error:', result.error)
    if (!result.success) {
      console.log('result.error.errors:', result.error.errors)
      console.log('result.error keys:', Object.keys(result.error))
      console.log('result.error.issues:', result.error.issues)
    }
  })
})
