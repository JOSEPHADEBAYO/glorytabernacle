/**
 * Unit tests for the Children Ministry Zod validation schemas.
 */

import { describe, it, expect } from 'vitest'
import {
  createChildSchema,
  updateChildSchema,
  checkInSchema,
  checkOutSchema,
} from '@/lib/validation/child'

const eightYearsAgo = new Date()
eightYearsAgo.setFullYear(eightYearsAgo.getFullYear() - 8)

const valid = {
  firstName: 'Joy',
  lastName: 'Adeniyi',
  dateOfBirth: eightYearsAgo.toISOString().slice(0, 10),
  gender: 'FEMALE',
  emergencyContactName: 'Grace Adeniyi',
  emergencyContactPhone: '07478 137599',
  emergencyContactRelation: 'Grandmother',
}

describe('createChildSchema', () => {
  it('accepts a valid minimal payload', () => {
    const r = createChildSchema.safeParse(valid)
    expect(r.success).toBe(true)
  })

  it('rejects future DOB', () => {
    const future = new Date()
    future.setFullYear(future.getFullYear() + 1)
    expect(
      createChildSchema.safeParse({
        ...valid,
        dateOfBirth: future.toISOString().slice(0, 10),
      }).success
    ).toBe(false)
  })

  it('rejects DOB > 18 years ago', () => {
    const old = new Date()
    old.setFullYear(old.getFullYear() - 19)
    expect(
      createChildSchema.safeParse({
        ...valid,
        dateOfBirth: old.toISOString().slice(0, 10),
      }).success
    ).toBe(false)
  })

  it('rejects empty firstName', () => {
    expect(createChildSchema.safeParse({ ...valid, firstName: '' }).success).toBe(false)
  })

  it('rejects malformed phone', () => {
    expect(
      createChildSchema.safeParse({ ...valid, emergencyContactPhone: 'abc' }).success
    ).toBe(false)
  })

  it('accepts +44 phone', () => {
    expect(
      createChildSchema.safeParse({
        ...valid,
        emergencyContactPhone: '+44 7478 137599',
      }).success
    ).toBe(true)
  })

  it('accepts FEMALE and MALE', () => {
    expect(createChildSchema.safeParse({ ...valid, gender: 'MALE' }).success).toBe(true)
    expect(createChildSchema.safeParse({ ...valid, gender: 'FEMALE' }).success).toBe(true)
  })

  it('rejects invalid gender', () => {
    expect(createChildSchema.safeParse({ ...valid, gender: 'OTHER' }).success).toBe(false)
  })

  it('accepts empty optional text fields', () => {
    expect(
      createChildSchema.safeParse({
        ...valid,
        allergies: '',
        medicalNotes: '',
        specialNeeds: '',
        photoUrl: '',
      }).success
    ).toBe(true)
  })

  it('rejects malformed photo URL', () => {
    expect(
      createChildSchema.safeParse({ ...valid, photoUrl: 'not-a-url' }).success
    ).toBe(false)
  })
})

describe('updateChildSchema', () => {
  it('accepts a single-field update', () => {
    expect(updateChildSchema.safeParse({ firstName: 'Joyce' }).success).toBe(true)
  })

  it('rejects empty body', () => {
    expect(updateChildSchema.safeParse({}).success).toBe(false)
  })
})

describe('checkInSchema', () => {
  it('accepts an array of child ids', () => {
    expect(checkInSchema.safeParse({ childIds: ['c1', 'c2'] }).success).toBe(true)
  })

  it('rejects empty array', () => {
    expect(checkInSchema.safeParse({ childIds: [] }).success).toBe(false)
  })

  it('caps at 20', () => {
    const tooMany = Array.from({ length: 21 }, (_, i) => `c${i}`)
    expect(checkInSchema.safeParse({ childIds: tooMany }).success).toBe(false)
  })
})

describe('checkOutSchema', () => {
  it('accepts an array of check-in ids', () => {
    expect(checkOutSchema.safeParse({ checkInIds: ['ci1'] }).success).toBe(true)
  })

  it('rejects empty', () => {
    expect(checkOutSchema.safeParse({ checkInIds: [] }).success).toBe(false)
  })
})
