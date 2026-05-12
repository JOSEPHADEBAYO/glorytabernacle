import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { BooksManager } from '@/components/dashboard/books-manager'

export default async function BooksPage() {
  // Server-side auth check
  const cookieStore = await cookies()
  const sessionToken = cookieStore.get('session_token')?.value
  
  if (!sessionToken) {
    redirect('/login')
  }

  // Fetch books from database
  const books = await prisma.book.findMany({
    orderBy: {
      createdAt: 'desc',
    },
  })

  return <BooksManager initialBooks={books} />
}
