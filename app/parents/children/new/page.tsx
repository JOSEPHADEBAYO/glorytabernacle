import Link from 'next/link'
import { requireParent } from '@/lib/auth/parent-session'
import { ChildFormPanel } from '@/components/parents/child-form-panel'

export default async function NewChildPage() {
  await requireParent()

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/parents"
          className="text-sm text-blue-600 hover:underline"
        >
          ← Back to dashboard
        </Link>
        <h1 className="mt-3 text-2xl font-extrabold" style={{ color: 'rgba(27, 34, 119, 1)' }}>
          Register a child
        </h1>
        <p className="mt-2 text-sm text-gray-600 max-w-xl leading-relaxed">
          You only need to do this once. Allergies, medical notes and an
          emergency contact are required so our team can care for your child
          well.
        </p>
      </div>

      <ChildFormPanel mode="create" />
    </div>
  )
}
