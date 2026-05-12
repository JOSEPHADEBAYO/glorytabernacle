/**
 * Property-Based Test: Validation Error Responses (Tract Creation)
 * 
 * Feature: tracts-management-system, Property 2: Validation Error Responses
 * 
 * **Validates: Requirements 1.8, 3.7, 13.1, 13.2, 13.8, 13.9, 18.7**
 * 
 * Property 2: Validation Error Responses
 * For any invalid tract creation or update request (missing required fields, invalid URLs,
 * invalid category, invalid data types, field length violations), the API SHALL return HTTP
 * status 400 with a descriptive error message listing all validation failures.
 * 
 * Note: This test focuses on the validation schema error messages, not the API responses
 * (which will be tested later when the API endpoints are implemented).
 */

import { describe, expect } from 'vitest'
import { fc, it } from '@fast-check/vitest'
import { createTractSchema, updateTractSchema } from '@/lib/validation/tract'
import { TRACT_CATEGORIES } from '@/lib/types/tract'

describe('Property 2: Validation Error Responses', () => {
  describe('Create Tract Schema - Error Message Quality', () => {
    it.prop([fc.constant({})], { numRuns: 20 })('returns descriptive errors for completely empty payload', (payload) => {
      const result = createTractSchema.safeParse(payload)
      
      // Should fail validation
      if (result.success) {
        throw new Error('Validation should have failed for empty payload')
      }
      
      // Should have errors for all required fields
      if (result.error.issues.length === 0) {
        throw new Error('Should have validation errors')
      }
      
      // Each error should have a descriptive message
      for (const error of result.error.issues) {
        if (!error.message || error.message.length === 0) {
          throw new Error('Error message should be descriptive')
        }
      }
      
      // Each error should have a path
      for (const error of result.error.issues) {
        if (!error.path || error.path.length === 0) {
          throw new Error('Error should have a path')
        }
      }
    })

    it.prop([
      fc.string().filter(cat => {
        const trimmed = cat.trim()
        return trimmed.length > 0 && !TRACT_CATEGORIES.includes(trimmed as any)
      })
    ], { numRuns: 20 })('returns descriptive error for invalid category', (invalidCategory) => {
      const payload = {
        title: 'Valid Title',
        category: invalidCategory,
        description: 'Valid description with at least ten characters',
        coverImage: 'https://example.com/image.jpg',
        documentUrl: 'https://example.com/document.pdf',
        published: false
      }
      
      const result = createTractSchema.safeParse(payload)
      
      if (result.success) {
        throw new Error('Validation should have failed for invalid category')
      }
      
      const categoryError = result.error.issues.find(e => e.path[0] === 'category')
      if (!categoryError) {
        throw new Error('Should have category error')
      }
      
      if (!categoryError.message || !categoryError.message.length > 0) {
        throw new Error('Category error should have a descriptive message')
      }
    })

    it.prop([
      fc.string().filter(s => {
        const trimmed = s.trim()
        if (trimmed.length === 0) return false
        try {
          new URL(trimmed)
          return false // Valid URL, skip it
        } catch {
          return true // Invalid URL, use it
        }
      })
    ], { numRuns: 20 })('returns descriptive error for invalid coverImage URL', (invalidUrl) => {
      const payload = {
        title: 'Valid Title',
        category: 'Evangelism',
        description: 'Valid description with at least ten characters',
        coverImage: invalidUrl,
        documentUrl: 'https://example.com/document.pdf',
        published: false
      }
      
      const result = createTractSchema.safeParse(payload)
      
      if (result.success) {
        throw new Error('Validation should have failed for invalid URL')
      }
      
      const urlError = result.error.issues.find(e => e.path[0] === 'coverImage')
      if (!urlError) {
        throw new Error('Should have coverImage error')
      }
      
      if (!urlError.message || !urlError.message.toLowerCase().includes('url')) {
        throw new Error('URL error message should mention URL')
      }
    })

    it.prop([
      fc.string().filter(s => {
        const trimmed = s.trim()
        if (trimmed.length === 0) return false
        try {
          new URL(trimmed)
          return false // Valid URL, skip it
        } catch {
          return true // Invalid URL, use it
        }
      })
    ], { numRuns: 20 })('returns descriptive error for invalid documentUrl', (invalidUrl) => {
      const payload = {
        title: 'Valid Title',
        category: 'Evangelism',
        description: 'Valid description with at least ten characters',
        coverImage: 'https://example.com/image.jpg',
        documentUrl: invalidUrl,
        published: false
      }
      
      const result = createTractSchema.safeParse(payload)
      
      if (result.success) {
        throw new Error('Validation should have failed for invalid documentUrl')
      }
      
      const urlError = result.error.issues.find(e => e.path[0] === 'documentUrl')
      if (!urlError) {
        throw new Error('Should have documentUrl error')
      }
      
      if (!urlError.message || !urlError.message.toLowerCase().includes('url')) {
        throw new Error('documentUrl error message should mention URL')
      }
    })

    it.prop([
      fc.string({ minLength: 201, maxLength: 300 }).filter(s => s.trim().length > 200)
    ], { numRuns: 20 })('returns descriptive error for title exceeding max length', (longTitle) => {
      const payload = {
        title: longTitle,
        category: 'Evangelism',
        description: 'Valid description with at least ten characters',
        coverImage: 'https://example.com/image.jpg',
        documentUrl: 'https://example.com/document.pdf',
        published: false
      }
      
      const result = createTractSchema.safeParse(payload)
      
      if (result.success) {
        throw new Error('Validation should have failed for long title')
      }
      
      const titleError = result.error.issues.find(e => e.path[0] === 'title')
      if (!titleError) {
        throw new Error('Should have title error')
      }
      
      // Message should indicate length issue
      const msg = titleError.message.toLowerCase()
      if (!msg.includes('long') && !msg.includes('length') && !msg.includes('max')) {
        throw new Error('Title error message should mention length issue')
      }
    })

    it.prop([
      fc.string({ minLength: 1001, maxLength: 1500 })
    ], { numRuns: 20 })('returns descriptive error for description exceeding max length', (longDescription) => {
      const payload = {
        title: 'Valid Title',
        category: 'Evangelism',
        description: longDescription,
        coverImage: 'https://example.com/image.jpg',
        documentUrl: 'https://example.com/document.pdf',
        published: false
      }
      
      const result = createTractSchema.safeParse(payload)
      
      if (result.success) {
        throw new Error('Validation should have failed for long description')
      }
      
      const descError = result.error.issues.find(e => e.path[0] === 'description')
      if (!descError) {
        throw new Error('Should have description error')
      }
      
      // Message should indicate length issue
      const msg = descError.message.toLowerCase()
      if (!msg.includes('long') && !msg.includes('length') && !msg.includes('max')) {
        throw new Error('Description error message should mention length issue')
      }
    })

    it.prop([
      fc.string({ maxLength: 9 })
    ], { numRuns: 20 })('returns descriptive error for description below min length', (shortDescription) => {
      const payload = {
        title: 'Valid Title',
        category: 'Evangelism',
        description: shortDescription,
        coverImage: 'https://example.com/image.jpg',
        documentUrl: 'https://example.com/document.pdf',
        published: false
      }
      
      const result = createTractSchema.safeParse(payload)
      
      if (result.success) {
        throw new Error('Validation should have failed for short description')
      }
      
      const descError = result.error.issues.find(e => e.path[0] === 'description')
      if (!descError) {
        throw new Error('Should have description error')
      }
      
      // Message should indicate minimum length requirement
      const msg = descError.message.toLowerCase()
      if (!msg.includes('least') && !msg.includes('min') && !msg.includes('character')) {
        throw new Error('Description error message should mention minimum length requirement')
      }
    })
  })

  describe('Update Tract Schema - Error Message Quality', () => {
    it.prop([fc.constant({})], { numRuns: 20 })('returns descriptive error for empty update payload', (payload) => {
      const result = updateTractSchema.safeParse(payload)
      
      if (result.success) {
        throw new Error('Validation should have failed for empty update payload')
      }
      
      // Should have at least one error
      if (result.error.issues.length === 0) {
        throw new Error('Should have validation errors')
      }
      
      // Error should mention that at least one field is required
      const hasRelevantError = result.error.issues.some(e => {
        const msg = e.message.toLowerCase()
        return msg.includes('field') || msg.includes('provided') || msg.includes('update')
      })
      
      if (!hasRelevantError) {
        throw new Error('Error message should mention that at least one field is required')
      }
    })

    it.prop([
      fc.string().filter(cat => {
        const trimmed = cat.trim()
        return trimmed.length > 0 && !TRACT_CATEGORIES.includes(trimmed as any)
      })
    ], { numRuns: 20 })('returns descriptive error for invalid category in update', (invalidCategory) => {
      const payload = {
        category: invalidCategory
      }
      
      const result = updateTractSchema.safeParse(payload)
      
      if (result.success) {
        throw new Error('Validation should have failed for invalid category')
      }
      
      const categoryError = result.error.issues.find(e => e.path[0] === 'category')
      if (!categoryError) {
        throw new Error('Should have category error')
      }
      
      if (!categoryError.message || !categoryError.message.length > 0) {
        throw new Error('Category error should have a descriptive message')
      }
    })

    it.prop([
      fc.string().filter(s => {
        const trimmed = s.trim()
        if (trimmed.length === 0 || trimmed === '') return false
        try {
          new URL(trimmed)
          return false // Valid URL, skip it
        } catch {
          return true // Invalid URL, use it
        }
      })
    ], { numRuns: 20 })('returns descriptive error for invalid coverImage URL in update', (invalidUrl) => {
      const payload = {
        coverImage: invalidUrl
      }
      
      const result = updateTractSchema.safeParse(payload)
      
      if (result.success) {
        throw new Error('Validation should have failed for invalid coverImage URL')
      }
      
      const urlError = result.error.issues.find(e => e.path[0] === 'coverImage')
      if (!urlError) {
        throw new Error('Should have coverImage error')
      }
      
      if (!urlError.message || !urlError.message.toLowerCase().includes('url')) {
        throw new Error('coverImage error message should mention URL')
      }
    })

    it.prop([
      fc.string().filter(s => {
        const trimmed = s.trim()
        if (trimmed.length === 0 || trimmed === '') return false
        try {
          new URL(trimmed)
          return false // Valid URL, skip it
        } catch {
          return true // Invalid URL, use it
        }
      })
    ], { numRuns: 20 })('returns descriptive error for invalid documentUrl in update', (invalidUrl) => {
      const payload = {
        documentUrl: invalidUrl
      }
      
      const result = updateTractSchema.safeParse(payload)
      
      if (result.success) {
        throw new Error('Validation should have failed for invalid documentUrl')
      }
      
      const urlError = result.error.issues.find(e => e.path[0] === 'documentUrl')
      if (!urlError) {
        throw new Error('Should have documentUrl error')
      }
      
      if (!urlError.message || !urlError.message.toLowerCase().includes('url')) {
        throw new Error('documentUrl error message should mention URL')
      }
    })
  })

  describe('Error Message Structure', () => {
    it.prop([
      fc.record({
        title: fc.constant(undefined),
        category: fc.constant(undefined),
        description: fc.constant(undefined),
        coverImage: fc.constant(undefined),
        documentUrl: fc.constant(undefined)
      })
    ], { numRuns: 20 })('provides error messages with field paths for missing fields', (payload) => {
      const result = createTractSchema.safeParse(payload)
      
      if (result.success) {
        throw new Error('Validation should have failed for missing fields')
      }
      
      // Each error should have a path
      for (const error of result.error.issues) {
        if (!error.path || error.path.length === 0) {
          throw new Error('Each error should have a path')
        }
      }
      
      // Each error should have a message
      for (const error of result.error.issues) {
        if (!error.message || error.message.length === 0) {
          throw new Error('Each error should have a message')
        }
      }
    })

    it.prop([
      fc.record({
        title: fc.constant(''),
        category: fc.string().filter(cat => {
          const trimmed = cat.trim()
          return trimmed.length > 0 && !TRACT_CATEGORIES.includes(trimmed as any)
        }),
        description: fc.string({ maxLength: 9 }),
        coverImage: fc.string().filter(s => {
          const trimmed = s.trim()
          if (trimmed.length === 0) return false
          try {
            new URL(trimmed)
            return false
          } catch {
            return true
          }
        }),
        documentUrl: fc.string().filter(s => {
          const trimmed = s.trim()
          if (trimmed.length === 0) return false
          try {
            new URL(trimmed)
            return false
          } catch {
            return true
          }
        })
      })
    ], { numRuns: 20 })('provides unique error messages for different validation failures', (payload) => {
      const result = createTractSchema.safeParse(payload)
      
      if (result.success) {
        throw new Error('Validation should have failed')
      }
      
      // Get all error messages
      const messages = result.error.issues.map(e => e.message)
      
      // Should have multiple errors
      if (messages.length <= 1) {
        throw new Error('Should have multiple validation errors')
      }
      
      // Messages should not all be identical
      const uniqueMessages = new Set(messages)
      if (uniqueMessages.size <= 1) {
        throw new Error('Error messages should be unique for different failures')
      }
    })
  })
})
