/**
 * Unit tests for the Group Zod validation schemas + sluggify helper.
 */

import { describe, it, expect } from 'vitest'
import {
  createGroupSchema,
  updateGroupSchema,
  groupQuerySchema,
} from '@/lib/validation/group'
import { sluggify } from '@/lib/types/group'

const validCreate = {
  slug: 'prayer-intercession',
  title: 'Prayer & Intercession',
  description: 'Lead corporate prayer.',
  imageSrc: 'https://example.com/image.jpg',
  imageAlt: 'Prayer ministry',
}

describe('createGroupSchema', () => {
  it('accepts a minimal payload', () => {
    const r = createGroupSchema.safeParse(validCreate)
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.published).toBe(false)
  })

  it('rejects uppercase in slug', () => {
    const r = createGroupSchema.safeParse({ ...validCreate, slug: 'Prayer' })
    expect(r.success).toBe(false)
  })

  it('rejects leading hyphen in slug', () => {
    const r = createGroupSchema.safeParse({ ...validCreate, slug: '-prayer' })
    expect(r.success).toBe(false)
  })

  it('rejects double hyphen in slug', () => {
    const r = createGroupSchema.safeParse({ ...validCreate, slug: 'prayer--intercession' })
    expect(r.success).toBe(false)
  })

  it('accepts numeric slug segments', () => {
    const r = createGroupSchema.safeParse({ ...validCreate, slug: 'team-2026' })
    expect(r.success).toBe(true)
  })

  it('rejects malformed imageSrc', () => {
    const r = createGroupSchema.safeParse({ ...validCreate, imageSrc: 'not-a-url' })
    expect(r.success).toBe(false)
  })

  it('accepts responsibilities array', () => {
    const r = createGroupSchema.safeParse({
      ...validCreate,
      responsibilities: ['Lead prayers', 'Organise teams'],
    })
    expect(r.success).toBe(true)
  })

  it('rejects empty responsibility entries', () => {
    const r = createGroupSchema.safeParse({
      ...validCreate,
      responsibilities: ['Lead prayers', ''],
    })
    expect(r.success).toBe(false)
  })

  it('accepts programmes with optional schedule', () => {
    const r = createGroupSchema.safeParse({
      ...validCreate,
      programmes: [
        { title: 'MOUNT UP', schedule: 'Daily 00:00–00:30' },
        { title: 'Weekly Prayer Meeting' },
      ],
    })
    expect(r.success).toBe(true)
  })

  it('rejects programme with empty title', () => {
    const r = createGroupSchema.safeParse({
      ...validCreate,
      programmes: [{ title: '' }],
    })
    expect(r.success).toBe(false)
  })

  it('accepts specialRole when both fields provided', () => {
    const r = createGroupSchema.safeParse({
      ...validCreate,
      specialRole: { title: 'SOUL PIPELINE', body: 'Administers HG baptism' },
    })
    expect(r.success).toBe(true)
  })

  it('accepts specialRole = null', () => {
    const r = createGroupSchema.safeParse({ ...validCreate, specialRole: null })
    expect(r.success).toBe(true)
  })

  it('rejects specialRole with empty body', () => {
    const r = createGroupSchema.safeParse({
      ...validCreate,
      specialRole: { title: 'SOUL PIPELINE', body: '' },
    })
    expect(r.success).toBe(false)
  })
})

describe('updateGroupSchema', () => {
  it('accepts single-field update', () => {
    expect(updateGroupSchema.safeParse({ published: true }).success).toBe(true)
  })

  it('rejects empty object', () => {
    expect(updateGroupSchema.safeParse({}).success).toBe(false)
  })

  it('validates slug constraints when provided', () => {
    expect(updateGroupSchema.safeParse({ slug: 'BAD slug' }).success).toBe(false)
  })

  it('accepts setting specialRole to null', () => {
    expect(updateGroupSchema.safeParse({ specialRole: null }).success).toBe(true)
  })
})

describe('groupQuerySchema', () => {
  it('accepts no params', () => {
    expect(groupQuerySchema.safeParse({}).success).toBe(true)
  })

  it('accepts published true / false', () => {
    expect(groupQuerySchema.safeParse({ published: 'true' }).success).toBe(true)
    expect(groupQuerySchema.safeParse({ published: 'false' }).success).toBe(true)
  })

  it('rejects invalid published value', () => {
    expect(groupQuerySchema.safeParse({ published: 'banana' }).success).toBe(false)
  })
})

describe('sluggify', () => {
  it('lowercases and replaces spaces with hyphens', () => {
    expect(sluggify('Prayer & Intercession')).toBe('prayer-intercession')
  })

  it('strips punctuation', () => {
    expect(sluggify("King's Club (Men's)")).toBe('kings-club-mens')
  })

  it('collapses runs of whitespace', () => {
    expect(sluggify('Many   Spaces  Here')).toBe('many-spaces-here')
  })

  it('trims surrounding hyphens', () => {
    expect(sluggify('  --hello--  ')).toBe('hello')
  })

  it('handles numerics', () => {
    expect(sluggify('Team 2026')).toBe('team-2026')
  })
})
