/**
 * Shared TypeScript types for the Adult Attendance system.
 *
 * Public visitors submit their name + email + service via the /attendance
 * page. Admins review the records in /dashboard/attendance and look at
 * weekly trends, service breakdowns, and returning vs new ratios.
 */

/**
 * The fixed list of recognised services. Edit this constant to add or
 * remove services — every record's `service` field is validated against
 * this list at write time.
 *
 * Keep entries in service-of-the-day order so the dashboard tables and
 * charts surface them in a predictable sequence.
 */
export const ATTENDANCE_SERVICES = [
  'Sunday First Service',
  'Sunday Second Service',
  'Midweek Service',
  'Prayer Meeting',
  'Other',
] as const

export type AttendanceService = typeof ATTENDANCE_SERVICES[number]

/** Roles allowed to view the admin attendance dashboard. */
export const ATTENDANCE_ADMIN_ROLES = [
  'SUPER_ADMIN',
  'CONTENT_EDITOR',
] as const
export type AttendanceAdminRole = typeof ATTENDANCE_ADMIN_ROLES[number]

/**
 * Complete AdultAttendance record as stored in the database.
 */
export interface AttendanceRecord {
  id: string
  name: string
  email: string
  service: AttendanceService
  attendedAt: Date
  createdAt: Date
}

/**
 * Input shape for POST /api/attendance.
 */
export interface SubmitAttendanceInput {
  name: string
  email: string
  service: AttendanceService
}

/**
 * Suggest the most likely service based on the current day/time, used to
 * pre-select the dropdown on the public form. This is a UX nicety — the
 * visitor can always change it.
 */
export function suggestCurrentService(now: Date = new Date()): AttendanceService {
  const day = now.getDay() // 0 = Sun, 1 = Mon, ..., 3 = Wed
  const hour = now.getHours()

  if (day === 0) {
    // Sunday — second service typically runs from late morning into early
    // afternoon. Anything before that we treat as the first service.
    return hour >= 11 ? 'Sunday Second Service' : 'Sunday First Service'
  }
  if (day === 3) return 'Midweek Service'
  if (day === 5 || day === 6) return 'Prayer Meeting'
  return 'Other'
}
