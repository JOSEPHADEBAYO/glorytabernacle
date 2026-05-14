import { redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/lib/auth/parent-auth'
import { YouthGoogleSignInButton } from '@/components/youth/youth-google-sign-in-button'

export default async function YouthLoginPage() {
  const session = await auth()
  if (session?.user?.id && session.user.role === 'YOUTH') {
    redirect('/youth')
  }

  return (
    <main className="min-h-[80vh] flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
          <div className="text-center mb-8">
            <div
              className="inline-flex h-14 w-14 items-center justify-center rounded-full mb-4"
              style={{ backgroundColor: 'rgba(27,34,119,0.08)' }}
            >
              <svg
                className="h-7 w-7"
                style={{ color: 'rgba(27,34,119,1)' }}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
              </svg>
            </div>
            <h1 className="text-2xl font-extrabold" style={{ color: 'rgba(27,34,119,1)' }}>
              Youth Ministry
            </h1>
            <p className="mt-2 text-sm text-gray-600 leading-relaxed">
              Sign in with Google to access the youth portal — check in for
              services and read today&apos;s daily scripture.
            </p>
          </div>

          <YouthGoogleSignInButton />

          <p className="mt-6 text-xs text-gray-500 text-center leading-relaxed">
            We use your Google account to identify you as a youth member.
            Your name and email are captured automatically on first sign-in.
          </p>
        </div>

        <p className="mt-6 text-center text-sm text-gray-600">
          <Link href="/" className="text-blue-600 hover:underline">
            ← Back to homepage
          </Link>
        </p>
      </div>
    </main>
  )
}
