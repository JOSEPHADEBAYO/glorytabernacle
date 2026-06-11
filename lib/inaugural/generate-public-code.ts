/**
 * Allocates a unique, unguessable 4-digit code for an inaugural-service
 * registration so the public badge ID does not reveal registration order.
 *
 * Why a separate column instead of `serialNumber`?
 *   The serialNumber is a Postgres autoincrement — useful internally but
 *   leaks "you were the 7th person to register" to anyone who reads the
 *   badge. The client asked that the badge ID look random.
 *
 * Uniqueness rules:
 *  1. The code must not collide with any existing `publicCode` (enforced
 *     by the unique index too, but checking first avoids a noisy P2002).
 *  2. The 4-digit code, read as an integer, must not collide with any
 *     existing `serialNumber`. Otherwise "GT-2026-0001" could refer to
 *     both a legacy serial-ID row AND a new random-code row, and the
 *     programme-page lookup would silently pick the wrong person.
 *
 * Retries up to MAX_ATTEMPTS times. For an inaugural-service guest list
 * of a few hundred attendees the per-attempt collision probability is
 * <5%, so 12 retries gives effectively zero failure rate.
 */
import { prisma } from '@/lib/prisma'

const MAX_ATTEMPTS = 12
const CODE_LENGTH = 4
const MAX_CODE_VALUE = 10 ** CODE_LENGTH // 10000

export async function generateInauguralPublicCode(): Promise<string> {
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const n = Math.floor(Math.random() * MAX_CODE_VALUE)
    const code = String(n).padStart(CODE_LENGTH, '0')
    // Check both columns in parallel — one DB round-trip per attempt.
    const [byCode, bySerial] = await Promise.all([
      prisma.inauguralRegistration.findUnique({
        where: { publicCode: code },
        select: { id: true },
      }),
      prisma.inauguralRegistration.findUnique({
        where: { serialNumber: n },
        select: { id: true },
      }),
    ])
    if (!byCode && !bySerial) return code
  }
  throw new Error(
    `Could not allocate a unique inaugural badge code after ${MAX_ATTEMPTS} attempts. ` +
      'This should never happen for sub-thousand guest lists — investigate.'
  )
}
