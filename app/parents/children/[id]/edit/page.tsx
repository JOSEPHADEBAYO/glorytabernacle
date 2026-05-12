import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { requireParent } from '@/lib/auth/parent-session'
import { ChildFormPanel } from '@/components/parents/child-form-panel'

export default async function EditChildPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const parent = await requireParent()
  const { id } = await params

  const child = await prisma.child.findFirst({
    where: { id, parents: { some: { id: parent.id } } },
  })
  if (!child) notFound()

  // Convert date to YYYY-MM-DD string for the date input.
  const dob = child.dateOfBirth.toISOString().slice(0, 10)

  return (
    <div className="space-y-6">
      <div>
        <Link href="/parents" className="text-sm text-blue-600 hover:underline">
          ← Back to dashboard
        </Link>
        <h1 className="mt-3 text-2xl font-extrabold" style={{ color: 'rgba(27, 34, 119, 1)' }}>
          Edit {child.firstName}&apos;s details
        </h1>
      </div>

      <ChildFormPanel
        mode="edit"
        childId={child.id}
        initial={{
          firstName: child.firstName,
          lastName: child.lastName,
          dateOfBirth: dob,
          gender: child.gender,
          allergies: child.allergies ?? '',
          medicalNotes: child.medicalNotes ?? '',
          specialNeeds: child.specialNeeds ?? '',
          photoUrl: child.photoUrl ?? '',
          emergencyContactName: child.emergencyContactName,
          emergencyContactPhone: child.emergencyContactPhone,
          emergencyContactRelation: child.emergencyContactRelation,
        }}
      />
    </div>
  )
}
