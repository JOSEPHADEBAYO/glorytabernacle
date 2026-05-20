import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createChildSchema } from '@/lib/validation/child'

/**
 * POST /api/parent/register-child
 *
 * Publicly accessible — parents complete the same registration form the
 * Children Leader uses (see /dashboard/children → Register a child) and
 * submit here. Same Zod validation as the admin endpoint; no auth required
 * because parents no longer have user accounts.
 *
 * Parents do not get permission to check children in / out. That remains a
 * staff action via /api/admin/children/[id]/check-in.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null)
    if (!body) {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }

    const validation = createChildSchema.safeParse(body)
    if (!validation.success) {
      const errors = validation.error.issues.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      }))
      return NextResponse.json(
        { error: 'Validation failed', details: errors },
        { status: 400 }
      )
    }

    const data = validation.data

    const child = await prisma.child.create({
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        dateOfBirth: new Date(data.dateOfBirth as Date),
        gender: data.gender,
        allergies: data.allergies?.trim() || null,
        medicalNotes: data.medicalNotes?.trim() || null,
        specialNeeds: data.specialNeeds?.trim() || null,
        photoUrl: data.photoUrl?.trim() || null,
        primaryGuardianName: data.primaryGuardianName,
        primaryGuardianPhone: data.primaryGuardianPhone,
        primaryGuardianEmail: data.primaryGuardianEmail?.trim() || null,
        emergencyContactName: data.emergencyContactName,
        emergencyContactPhone: data.emergencyContactPhone,
        emergencyContactRelation: data.emergencyContactRelation,
        // GDPR consent captured from the public form (Zod guarantees the
        // mandatory consents are true before we reach here).
        consentDataProcessing: data.consentDataProcessing,
        consentMedicalInfoSharing: data.consentMedicalInfoSharing,
        consentEmergencyTreatment: data.consentEmergencyTreatment,
        consentPhotography: data.consentPhotography ?? false,
        consentByName: data.consentByName,
        consentCapturedAt: new Date(),
        authorisedCollectors:
          data.authorisedCollectors && data.authorisedCollectors.length > 0
            ? {
                create: data.authorisedCollectors.map((c) => ({
                  name: c.name,
                  relationship: c.relationship,
                  phone: c.phone?.trim() || null,
                  photoUrl: c.photoUrl?.trim() || null,
                  notes: c.notes?.trim() || null,
                })),
              }
            : undefined,
        // Public submissions go into the Pending queue. A Children Leader
        // must approve from /dashboard/children → Pending before the child
        // appears on the active roster or can be signed in.
        approved: false,
      },
      select: { id: true, firstName: true, lastName: true },
    })

    return NextResponse.json({ child }, { status: 201 })
  } catch (err) {
    console.error('Parent register-child error:', {
      error: err instanceof Error ? err.message : 'Unknown',
      timestamp: new Date().toISOString(),
    })
    return NextResponse.json(
      { error: 'Could not register your child. Please try again.' },
      { status: 500 }
    )
  }
}
