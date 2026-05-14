import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth/parent-auth'
import { prisma } from '@/lib/prisma'

/**
 * /youth/callback
 *
 * Server component that runs after Google OAuth completes.
 * Sets the user's role to YOUTH (if not already an admin), then
 * redirects to the youth dashboard.
 *
 * This is the callbackUrl passed to signIn() in YouthGoogleSignInButton.
 */
export default async function YouthCallbackPage() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect('/youth/login')
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, passwordHash: true },
  })

  // Only update role for non-admin OAuth users
  if (dbUser && !dbUser.passwordHash && dbUser.role !== 'YOUTH') {
    await prisma.user.update({
      where: { id: session.user.id },
      data: { role: 'YOUTH' },
    })
  }

  redirect('/youth')
}
