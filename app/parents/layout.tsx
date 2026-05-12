import Link from 'next/link'
import Image from 'next/image'
import { auth } from '@/lib/auth/parent-auth'
import { SignOutButton } from '@/components/parents/sign-out-button'

export default async function ParentsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  const isSignedIn = Boolean(session?.user?.id)
  const userName = session?.user?.name ?? null
  const userImage = session?.user?.image ?? null

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-30 bg-white border-b border-gray-200">
        <div className="mx-auto max-w-5xl px-6 py-3 flex items-center justify-between">
          <Link href="/parents" className="flex items-center gap-3">
            <Image
              src="/logo-with-no-bg.png"
              alt="RCCG Glory Tabernacle"
              width={120}
              height={36}
              className="object-contain"
            />
            <span
              className="hidden sm:inline text-sm font-semibold tracking-wide"
              style={{ color: 'rgba(27, 34, 119, 1)' }}
            >
              Children&apos;s Ministry
            </span>
          </Link>

          {isSignedIn && (
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2">
                {userImage ? (
                  <Image
                    src={userImage}
                    alt=""
                    width={32}
                    height={32}
                    className="rounded-full"
                    unoptimized
                  />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-sm font-semibold text-blue-700">
                    {userName?.[0]?.toUpperCase() ?? '?'}
                  </div>
                )}
                <span className="text-sm font-medium text-gray-700">
                  {userName}
                </span>
              </div>
              <SignOutButton />
            </div>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8">{children}</main>
    </div>
  )
}
