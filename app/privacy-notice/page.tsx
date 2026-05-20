import type { Metadata } from 'next'
import { TopNavBar } from '@/components/church/nav-bar'
import { Footer } from '@/components/church/footer'

export const metadata: Metadata = {
  title: 'Privacy Notice — RCCG Glory Tabernacle Barnstaple',
  description:
    'How RCCG Glory Tabernacle Barnstaple collects, uses, and protects your personal data, including children’s data, under UK GDPR.',
}

/**
 * Public privacy notice. Written to satisfy UK GDPR Articles 13/14
 * transparency requirements, with particular attention to children's
 * (special-category) data captured by the children's-ministry registration.
 *
 * NOTE FOR THE CHURCH: this is a solid starting template but should be
 * reviewed by your data-protection lead or a solicitor, and the
 * bracketed/italicised placeholders confirmed, before you rely on it. The
 * "last updated" date should be bumped whenever you change it.
 */
export default function PrivacyNoticePage() {
  return (
    <>
      <TopNavBar />
      <main className="px-6 py-16">
        <article className="mx-auto max-w-3xl">
          <p
            className="text-xs font-bold uppercase tracking-[0.2em]"
            style={{ color: 'var(--church-red, rgba(230, 17, 17, 1))' }}
          >
            Legal
          </p>
          <h1
            className="mt-2 text-3xl font-extrabold leading-tight md:text-4xl"
            style={{ color: 'rgba(27, 34, 119, 1)' }}
          >
            Privacy Notice
          </h1>
          <p className="mt-3 text-sm text-gray-500">
            Last updated: 16 May 2026
          </p>

          <div className="prose-church mt-8 space-y-6 text-sm leading-relaxed text-gray-700">
            <Section title="1. Who we are">
              <p>
                RCCG Glory Tabernacle Barnstaple (&ldquo;we&rdquo;,
                &ldquo;us&rdquo;, &ldquo;the church&rdquo;) is the data
                controller for the personal information described in this
                notice. We are based at North Devon College, Old Sticklepath
                Hill, Barnstaple EX31 2BQ, United Kingdom. You can contact us
                about data protection at{' '}
                <a className="text-blue-700 underline" href="mailto:admin@glorytabernacle.co.uk">
                  admin@glorytabernacle.co.uk
                </a>
                .
              </p>
            </Section>

            <Section title="2. The information we collect">
              <p>Depending on how you interact with us, we may collect:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>
                  <strong>Contact &amp; membership details</strong> — name,
                  email, phone, address, and information you provide when you
                  join a group, register interest, volunteer, or apply for
                  membership.
                </li>
                <li>
                  <strong>Children&apos;s information</strong> — for the
                  children&apos;s ministry we collect a child&apos;s name,
                  date of birth, gender, a photo (if you consent), the primary
                  guardian and emergency contact details, authorised
                  collectors, and attendance records.
                </li>
                <li>
                  <strong>Special-category data</strong> — allergies, medical
                  notes, and special-needs information you provide for a child.
                  This is &ldquo;special category&rdquo; data under UK GDPR
                  Article 9 and we only process it with your explicit consent
                  (see section 4).
                </li>
                <li>
                  <strong>Attendance &amp; pastoral records</strong> — check-in
                  / check-out times, who collected a child, and any
                  performance or pastoral notes a leader records.
                </li>
              </ul>
            </Section>

            <Section title="3. How we use it and our lawful basis">
              <p>We use your information to:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>run our services, groups, and children&apos;s ministry;</li>
                <li>keep children safe (safeguarding and emergency response);</li>
                <li>contact you about activities you&apos;ve registered for;</li>
                <li>send a child&apos;s performance / pastoral reports to their primary guardian.</li>
              </ul>
              <p>
                Our lawful bases under UK GDPR Article 6 are{' '}
                <strong>consent</strong> (which you can withdraw at any time),
                our <strong>legitimate interests</strong> in running the
                church and caring for our community, and, where children are
                involved, the protection of their <strong>vital interests</strong>{' '}
                in an emergency. For special-category data (health/allergies)
                we rely on your <strong>explicit consent</strong> under Article
                9(2)(a).
              </p>
            </Section>

            <Section title="4. Consent for children's data">
              <p>
                When you register a child you are asked to give explicit
                consent to: processing the child&apos;s personal data for the
                children&apos;s ministry; sharing medical / allergy
                information with the leaders who care for them; and the
                administration of first aid and emergency medical treatment
                (including calling 999) if we cannot reach you. Consent to
                photography and use of images is optional and separate. You can
                withdraw any consent at any time by emailing us — withdrawing
                consent will not affect the lawfulness of processing before the
                withdrawal.
              </p>
            </Section>

            <Section title="5. Who we share it with">
              <p>
                We do not sell your data. We share it only where necessary: with
                children&apos;s-ministry leaders who care for your child; with
                our email provider (Resend) to send you communications; with
                our image host (Cloudinary) where you have consented to photos;
                and with the emergency services or social-care authorities
                where we are legally obliged or it is necessary to protect a
                child. Some of these providers may process data outside the UK
                under appropriate safeguards.
              </p>
            </Section>

            <Section title="6. How long we keep it">
              <p>
                We keep routine attendance and contact data for as long as you
                are involved with the church and a reasonable period
                afterwards. Records that may be relevant to a safeguarding
                matter are kept in line with statutory safeguarding guidance
                (typically until a child reaches the age of 25, or longer where
                required). After that we securely delete or anonymise the data.
              </p>
            </Section>

            <Section title="7. Your rights">
              <p>Under UK GDPR you have the right to:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>access the personal data we hold about you or your child;</li>
                <li>ask us to correct inaccurate data;</li>
                <li>ask us to erase data (in certain circumstances);</li>
                <li>restrict or object to our processing;</li>
                <li>request portability of the data you gave us;</li>
                <li>withdraw consent at any time.</li>
              </ul>
              <p>
                To exercise any of these, email{' '}
                <a className="text-blue-700 underline" href="mailto:admin@glorytabernacle.co.uk">
                  admin@glorytabernacle.co.uk
                </a>
                . We will respond within one month.
              </p>
            </Section>

            <Section title="8. Complaints">
              <p>
                If you are unhappy with how we handle your data you can
                complain to the Information Commissioner&apos;s Office (ICO),
                the UK&apos;s data-protection regulator, at{' '}
                <a
                  className="text-blue-700 underline"
                  href="https://ico.org.uk/make-a-complaint/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  ico.org.uk/make-a-complaint
                </a>{' '}
                or by calling 0303 123 1113. We&apos;d appreciate the chance to
                resolve it directly first.
              </p>
            </Section>

            <Section title="9. Changes to this notice">
              <p>
                We may update this notice from time to time. The
                &ldquo;last updated&rdquo; date at the top shows when it last
                changed.
              </p>
            </Section>
          </div>
        </article>
      </main>
      {/* <Footer /> */}
    </>
  )
}

function Section({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="space-y-2">
      <h2
        className="text-lg font-bold"
        style={{ color: 'rgba(27, 34, 119, 1)' }}
      >
        {title}
      </h2>
      {children}
    </section>
  )
}
