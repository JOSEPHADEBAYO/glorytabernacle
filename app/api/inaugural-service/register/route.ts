import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { createInauguralRegistrationSchema } from '@/lib/validation/inaugural-registration'
import {
  formatRegistrationId,
  INAUGURAL_SERVICE_DATE,
} from '@/lib/types/inaugural-registration'
import { sendInauguralConfirmation } from '@/lib/email/send-inaugural-confirmation'

/**
 * POST /api/inaugural-service/register
 *
 * Public form submit. Validates, persists, fires the confirmation email,
 * returns the human-readable badge ID (e.g. GT-2026-0001) so the page can
 * show it on the success screen.
 *
 * Idempotency: the email column has a unique index. A repeat submission with
 * the same email is rejected with 409 + the registrant's existing ID so they
 * can re-find it without staff intervention.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validation = createInauguralRegistrationSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validation.error.issues.map((issue) => issue.message),
        },
        { status: 400 }
      )
    }
    const data = validation.data
    const normalisedEmail = data.email.toLowerCase()

    // Tidy: clear homeChurch if the registrant said they're local. The Zod
    // schema also rejects the inverse (from-outside without home church), so
    // we know we're in a coherent state here.
    const homeChurch = data.fromOutsideBarnstaple
      ? data.homeChurch ?? null
      : null

    try {
      const created = await prisma.inauguralRegistration.create({
        data: {
          firstName: data.firstName,
          lastName: data.lastName,
          email: normalisedEmail,
          gender: data.gender,
          address: data.address,
          isRccgMember: data.isRccgMember,
          fromOutsideBarnstaple: data.fromOutsideBarnstaple,
          homeChurch,
        },
      })

      const registrationId = formatRegistrationId(created.serialNumber)

      // Fire-and-forget email — never blocks the form's success response.
      void sendInauguralConfirmation({
        to: normalisedEmail,
        firstName: data.firstName,
        lastName: data.lastName,
        registrationId,
        eventDate: INAUGURAL_SERVICE_DATE,
      })
        .then((result) => {
          if (!result.ok) {
            console.error('Inaugural confirmation email failed:', {
              email: normalisedEmail,
              reason: result.detail,
            })
          }
        })
        .catch((err) => {
          console.error('Inaugural confirmation email threw:', err)
        })

      return NextResponse.json(
        {
          registrationId,
          serialNumber: created.serialNumber,
          firstName: created.firstName,
          lastName: created.lastName,
        },
        { status: 201 }
      )
    } catch (err) {
      // P2002 = unique constraint violation. Email is the only field with a
      // unique index that the form can hit, so it's safe to surface a
      // tailored message + the existing ID.
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2002'
      ) {
        const existing = await prisma.inauguralRegistration.findUnique({
          where: { email: normalisedEmail },
          select: { serialNumber: true },
        })
        return NextResponse.json(
          {
            error:
              'This email address is already registered for the inaugural service.',
            registrationId: existing
              ? formatRegistrationId(existing.serialNumber)
              : null,
          },
          { status: 409 }
        )
      }
      throw err
    }
  } catch (error) {
    console.error('Inaugural registration error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
