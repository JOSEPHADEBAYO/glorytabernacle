import { TopNavBar } from '@/components/church/nav-bar'
import { ParentRegisterChild } from '@/components/church/parent-register-child'

/**
 * Public parent-side child registration page.
 *
 * Parents register their child with the same form the Children Leader uses
 * (shared via components/dashboard/child-form.tsx) and submit through the
 * public /api/parent/register-child endpoint. Parents do NOT have a login
 * and cannot check children in or out — that remains a staff action.
 */
export default function ParentRegisterPage() {
  return (
    <>
      <TopNavBar />
      <main className="min-h-[60vh] py-16 px-6">
        <div className="mx-auto max-w-3xl">
          <div className="text-center mb-8">
            <p
              className="text-xs font-bold uppercase tracking-[0.2em] pt-5"
              style={{ color: 'var(--church-red, rgba(230, 17, 17, 1))' }}
            >
              Children&apos;s Ministry
            </p>
            <h1
              className="mt-2 text-3xl font-extrabold leading-tight"
              style={{ color: 'rgba(27, 34, 119, 1)' }}
            >
              Register your child
            </h1>
            <p className="mt-3 text-sm text-gray-600 leading-relaxed">
              Fill in your child&apos;s details below so our Children&apos;s
              Ministry team can welcome them safely on Sunday. On arrival the
              children&apos;s leader will sign them in and out — there&apos;s
              nothing more for you to do here.
            </p>
          </div>

          <div className="rounded-2xl bg-white border border-gray-200 shadow-sm">
            <ParentRegisterChild />
          </div>
        </div>
      </main>
    </>
  )
}
