/**
 * Unit tests for the Event Zod validation schemas.
 */

import { describe, it, expect } from 'vitest'
import {
  createEventSchema,
  updateEventSchema,
  eventQuerySchema,
} from '@/lib/validation/event'

const validCreate = {
  title: 'Sunday Worship Service',
  description: 'A morning of worship and Word at the main sanctuary.',
  date: '2026-06-07',
  time: '10:00 AM',
  location: 'Main Sanctuary',
}

describe('createEventSchema', () => {
  it('accepts a minimal valid payload', () => {
    const result = createEventSchema.safeParse(validCreate)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.published).toBe(false)
      expect(result.data.date).toBeInstanceOf(Date)
    }
  })

  it('rejects empty title', () => {
    const result = createEventSchema.safeParse({ ...validCreate, title: '' })
    expect(result.success).toBe(false)
  })

  it('rejects empty description', () => {
    const result = createEventSchema.safeParse({ ...validCreate, description: '' })
    expect(result.success).toBe(false)
  })

  it('rejects unparseable date', () => {
    const result = createEventSchema.safeParse({ ...validCreate, date: 'banana' })
    expect(result.success).toBe(false)
  })

  it('rejects malformed imageSrc', () => {
    const result = createEventSchema.safeParse({
      ...validCreate,
      imageSrc: 'not-a-url',
    })
    expect(result.success).toBe(false)
  })

  it('accepts empty optional URL fields', () => {
    const result = createEventSchema.safeParse({
      ...validCreate,
      imageSrc: '',
      registrationHref: '',
    })
    expect(result.success).toBe(true)
  })

  it('accepts a valid registrationHref URL', () => {
    const result = createEventSchema.safeParse({
      ...validCreate,
      registrationHref: 'https://example.com/register',
    })
    expect(result.success).toBe(true)
  })

  it('coerces ISO datetime string to Date', () => {
    const result = createEventSchema.safeParse({
      ...validCreate,
      date: '2026-06-07T10:00:00Z',
    })
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.date).toBeInstanceOf(Date)
  })
})

describe('updateEventSchema', () => {
  it('accepts a single-field update', () => {
    const result = updateEventSchema.safeParse({ published: true })
    expect(result.success).toBe(true)
  })

  it('rejects an empty object', () => {
    const result = updateEventSchema.safeParse({})
    expect(result.success).toBe(false)
  })

  it('validates field constraints when fields are provided', () => {
    const result = updateEventSchema.safeParse({ title: '' })
    expect(result.success).toBe(false)
  })

  it('allows clearing optional URL fields by sending empty string', () => {
    const result = updateEventSchema.safeParse({ registrationHref: '' })
    expect(result.success).toBe(true)
  })
})

describe('eventQuerySchema', () => {
  it('accepts no params', () => {
    const result = eventQuerySchema.safeParse({})
    expect(result.success).toBe(true)
  })

  it('accepts published=true / published=false', () => {
    expect(eventQuerySchema.safeParse({ published: 'true' }).success).toBe(true)
    expect(eventQuerySchema.safeParse({ published: 'false' }).success).toBe(true)
  })

  it('accepts upcoming=true / upcoming=false', () => {
    expect(eventQuerySchema.safeParse({ upcoming: 'true' }).success).toBe(true)
    expect(eventQuerySchema.safeParse({ upcoming: 'false' }).success).toBe(true)
  })

  it('accepts both filters combined', () => {
    expect(
      eventQuerySchema.safeParse({ published: 'true', upcoming: 'true' }).success
    ).toBe(true)
  })

  it('rejects invalid values', () => {
    expect(eventQuerySchema.safeParse({ published: 'banana' }).success).toBe(false)
    expect(eventQuerySchema.safeParse({ upcoming: 'banana' }).success).toBe(false)
  })
})
