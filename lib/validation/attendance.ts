/**
 * Zod validation schemas for the Adult Attendance system.
 */

import { z } from 'zod'
import { ATTENDANCE_SERVICES } from '@/lib/types/attendance'

/**
 * Public-form schema for POST /api/attendance.
 */
export const submitAttendanceSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Your name is required')
    .max(100, 'Name too long'),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email('A valid email is required')
    .max(254, 'Email too long'),
  service: z.enum(ATTENDANCE_SERVICES, {
    message: 'Please select which service you attended',
  }),
})

/**
 * Query parameters for the admin list endpoint.
 */
export const adminAttendanceQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
  service: z.enum(ATTENDANCE_SERVICES).optional(),
  /** Inclusive lower bound, ISO date or datetime. */
  fromDate: z.coerce.date().optional(),
  /** Inclusive upper bound. */
  toDate: z.coerce.date().optional(),
  search: z.string().max(200).optional(),
})
