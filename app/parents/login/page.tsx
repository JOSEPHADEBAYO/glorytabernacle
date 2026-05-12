import { redirect } from 'next/navigation'
import Link from 'next/link'
import { TopNavBar } from '@/components/church/nav-bar'
import { auth } from '@/lib/auth/parent-auth'
import { GoogleSignInButton } from '@/components/parents/google-sign-in-button'

/**
 * Parent sign-in page.
 *
 * Server-renders the page chrome and a client-side "Continue with Google"
 * button (NextAuth v4's `signIn` is client-only). If a parent is already
 * signed in, redirect straight to the dashboard.
 */
export default async function ParentLoginPage() {
  const session = await auth()
  console.log(":::::;>>>>>", session);
  if (session?.user?.id && session.user.role === 'PARENT') {
    redirect('/parents')
  }

  return (
    <>
      {/* <TopNavBar /> */}
      <main className="min-h-[80vh] flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-md">
          <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
            <div className="text-center mb-8">
              <div
                className="inline-flex h-14 w-14 items-center justify-center rounded-full mb-4"
                style={{ backgroundColor: 'rgba(0, 6, 102, 0.08)' }}
              >
                <svg
                  className="h-7 w-7"
                  style={{ color: 'rgba(0, 6, 102, 1)' }}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
              </div>
              <h1 className="text-2xl font-extrabold" style={{ color: 'rgba(27, 34, 119, 1)' }}>
                Children&apos;s Ministry
              </h1>
              <p className="mt-2 text-sm text-gray-600 leading-relaxed">
                Sign in with Google to register your children and check them
                in for Sunday&apos;s service.
              </p>
            </div>

            <GoogleSignInButton />

            <p className="mt-6 text-xs text-gray-500 text-center leading-relaxed">
              We use your Google account only to identify you as a parent.
              You&apos;ll be able to register your children once and then
              simply check them in each Sunday.
            </p>
          </div>

          <p className="mt-6 text-center text-sm text-gray-600">
            <Link href="/" className="text-blue-600 hover:underline">
              ← Back to homepage
            </Link>
          </p>
        </div>
      </main>
    </>
  )
}
