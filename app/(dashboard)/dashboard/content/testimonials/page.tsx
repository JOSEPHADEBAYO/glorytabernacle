import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import {
  TestimonialsManager,
  type DashboardTestimonial,
} from '@/components/dashboard/testimonials-manager'

export default async function TestimonialsDashboardPage() {
  const cookieStore = await cookies()
  const sessionToken = cookieStore.get('session_token')?.value
  if (!sessionToken) {
    redirect('/login')
  }

  const testimonials: DashboardTestimonial[] = await prisma.testimonial.findMany({
    orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
  })

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: 'rgba(27, 34, 119, 1)' }}>
          Testimonials
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          Add and manage member testimonials shown on the homepage
          Testimonials section.
        </p>
      </div>
      <TestimonialsManager initialTestimonials={testimonials} />
    </div>
  )
}
