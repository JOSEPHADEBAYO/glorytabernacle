# Implementation Plan: Groups Page Feature

## Overview

Implement the Groups Page feature at `/groups` route following the established design patterns of the existing church website. The page showcases ministry groups and fellowship opportunities with a hero section titled "Where You Fit" and alternating image-text layouts for each group. The implementation reuses existing components (TopNavBar, Footer, NewsletterForm) and follows the same architectural patterns as other content pages (contact, giving, books, volunteer).

The page is a Server Component with static group data defined inline. All images are sourced from the existing `/public` folder. The navigation link "Church Groups" already exists in the TopNavBar under the "Connect" dropdown, so no navigation changes are required.

---

## Tasks

- [x] 1. Create the Groups Page route and structure
  - [x] 1.1 Create `app/groups/page.tsx` with basic page structure
    - Server Component (no `'use client'` directive)
    - Import `TopNavBar`, `Footer`, `NewsletterForm` components
    - Import `Image` from `next/image` and `Link` from `next/link`
    - Set up basic page layout with TopNavBar at top and Footer at bottom
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

  - [x] 1.2 Define the Group interface and GROUPS data array
    - Create TypeScript interface for Group with fields: `id`, `title`, `description`, `imageSrc`, `imageAlt`, `ctaLabel`, `ctaHref`
    - Define GROUPS constant array with 6 groups: Men's Ministry, Women's Ministry, Youth Ministry, House Fellowship, Prayer Ministry, Worship Team
    - Use existing images from `/public` folder: `men.png`, `women.png`, `youths.png`, `House Fellowship.png`, `Prayer.png`, `Worship.png`
    - Include descriptive alt text for each image
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 4.1, 4.2, 4.3_

- [x] 2. Implement the Hero Section
  - [x] 2.1 Create hero section with background image and overlay
    - Use `relative` positioning with `min-height: 540px`
    - Background color: `rgba(0, 6, 102, 1)` (church navy)
    - Add background image using `next/image` with `fill` prop and `opacity-20`
    - Add gradient overlay: `linear-gradient(to right, rgba(0,6,102,0.95) 40%, rgba(0,6,102,0.5) 100%)`
    - Use `imagegallery1.png` or similar from `/public` as hero background
    - _Requirements: 2.1, 2.2, 2.3, 2.6_

  - [x] 2.2 Add hero content with eyebrow, heading, and description
    - Add eyebrow label above heading with church light green color (`var(--church-light-green)`)
    - Main heading: "Where You Fit" with `text-5xl md:text-6xl font-extrabold text-white`
    - Add descriptive text explaining the purpose of church groups
    - Apply proper spacing and max-width constraints (`max-w-[var(--container-max)]`)
    - _Requirements: 2.1, 2.4, 2.5_

- [x] 3. Implement Groups Content Section with alternating layout
  - [x] 3.1 Create groups content section container
    - Background color: `rgba(249, 249, 249, 1)` (light gray)
    - Apply section padding: `py-12 px-[var(--section-padding-x)]`
    - Container max-width: `max-w-[var(--container-max)]`
    - Add spacing between group cards: `gap-12` or `gap-16`
    - _Requirements: 1.5, 9.3_

  - [x] 3.2 Implement alternating image-text layout logic
    - Map over GROUPS array with index
    - Use conditional logic: `index % 2 === 0` for image-left, else image-right
    - Desktop layout (≥768px): Two-column grid with `grid-cols-1 md:grid-cols-2`
    - For image-right groups, use `md:grid-flow-dense` and `md:col-start-2` for image, `md:col-start-1 md:row-start-1` for text
    - Mobile layout (<768px): Stacked layout with image on top
    - _Requirements: 3.1, 3.2, 6.1, 6.2_

  - [x] 3.3 Render group images with Next.js Image component
    - Use `next/image` with `fill` prop and `object-cover`
    - Apply `rounded-2xl` border radius
    - Set `aspect-[4/3]` ratio
    - Provide `sizes` attribute: `(max-width: 768px) 100vw, 50vw`
    - Include descriptive alt text from group data
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

  - [x] 3.4 Render group text content (title, description, CTA)
    - Group title: `text-2xl md:text-3xl font-extrabold` with church navy color `rgba(27, 34, 119, 1)`
    - Description: `text-sm md:text-base text-gray-500 leading-relaxed`
    - CTA button: "Learn More" with church green background (`var(--church-green)`), white text, `rounded-lg`, `px-6 py-3`
    - Conditionally render CTA only if `ctaLabel` and `ctaHref` exist
    - Use `next/link` for CTA button
    - _Requirements: 3.3, 3.4, 3.5, 9.1_

- [x] 4. Implement Newsletter Section
  - [x] 4.1 Create newsletter section with two-column layout
    - Background color: `rgba(235, 241, 250, 1)` (light blue)
    - Apply section padding: `py-12 px-[var(--section-padding-x)]`
    - Grid layout: `grid-cols-1 md:grid-cols-2` with `gap-8`
    - _Requirements: 7.1, 7.2_

  - [x] 4.2 Add newsletter content and form
    - Left column: Heading "Never Miss a Moment" with church navy color
    - Descriptive text relevant to groups: "Subscribe to stay informed about group activities and fellowship opportunities"
    - Integrate `NewsletterForm` component (already exists)
    - Right column: Decorative image using `fellowship.png` with `rounded-2xl`, `height: 220px`
    - _Requirements: 7.3, 7.4, 7.5_

- [x] 5. Integrate Footer component
  - [x] 5.1 Add Footer with appropriate props
    - Pass logo props: `{ src: '/logo-with-no-bg.png', alt: 'RCCG Glory Tabernacle' }`
    - Pass tagline: "Furnish · Transform · Influence"
    - Pass columns with Quick Links including "Church Groups" link to `/groups`
    - Pass social links array (Instagram, YouTube, Facebook)
    - Pass contact info with address, phone, email, directions link
    - Pass copyright text with dynamic year
    - _Requirements: 1.3_

- [x] 6. Apply consistent styling and polish
  - [x] 6.1 Verify color consistency across the page
    - Primary buttons use `var(--church-green)` (#1B6D24)
    - Headings use church navy `rgba(27, 34, 119, 1)`
    - Accent elements use `var(--church-light-green)` (rgba(163, 246, 156, 1))
    - Body text uses `text-gray-500`
    - _Requirements: 9.1, 9.2, 9.3_

  - [x] 6.2 Verify typography consistency
    - Hero heading: `text-5xl md:text-6xl font-extrabold`
    - Group titles: `text-2xl md:text-3xl font-extrabold`
    - Body text: `text-sm md:text-base leading-relaxed`
    - Eyebrow labels: `text-xs font-bold uppercase tracking-[0.2em]`
    - _Requirements: 9.4_

  - [x] 6.3 Verify spacing and layout consistency
    - Section padding: `py-12` or `py-[var(--section-padding-y)]`
    - Horizontal padding: `px-[var(--section-padding-x)]`
    - Container max-width: `max-w-[var(--container-max)]`
    - Border radius: `rounded-2xl` for images and cards, `rounded-lg` for buttons
    - _Requirements: 9.5, 9.6_

- [x] 7. Ensure accessibility compliance
  - [x] 7.1 Verify semantic HTML structure
    - Use `<main>` wrapper for page content
    - Use `<section>` elements with appropriate `aria-label` attributes
    - Use proper heading hierarchy: h1 for hero, h2 for section headings, h3 for group titles
    - Use `<article>` or semantic divs for group cards
    - _Requirements: 10.1, 10.3_

  - [x] 7.2 Verify image accessibility
    - All images have descriptive alt text
    - Decorative overlays use `aria-hidden="true"`
    - Background images have empty alt or are CSS backgrounds
    - _Requirements: 10.2, 4.3_

  - [x] 7.3 Verify interactive element accessibility
    - All CTA buttons are keyboard accessible
    - Links have visible focus indicators
    - Color contrast meets WCAG AA standards (4.5:1 for normal text, 3:1 for large text)
    - _Requirements: 10.4, 10.5_

- [-] 8. Checkpoint — Verify page functionality
  - Ensure page loads at `/groups` route without errors
  - Verify all 6 group sections render correctly
  - Verify alternating layout works on desktop
  - Verify stacked layout works on mobile
  - Verify all images load correctly
  - Verify navigation link highlights when on `/groups`
  - Ask the user if questions arise

- [x] 9. Write unit tests for Groups Page
  - [x] 9.1 Write test to verify page renders without errors
    - Test that GroupsPage component renders successfully
    - Test that TopNavBar and Footer are present
    - _Requirements: 1.1, 1.2, 1.3_

  - [x] 9.2 Write test to verify all groups are rendered
    - Test that all 6 group sections are rendered
    - Test that each group has a title, description, and image
    - Test that CTA buttons are present for all groups
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

  - [x] 9.3 Write test to verify alternating layout logic
    - Test that odd-indexed groups have image on left
    - Test that even-indexed groups have image on right
    - Test responsive behavior at different breakpoints
    - _Requirements: 3.1, 3.2, 6.1, 6.2_

  - [x] 9.4 Write test to verify accessibility compliance
    - Test that all images have alt text
    - Test proper heading hierarchy (h1 → h2 → h3)
    - Test that interactive elements are keyboard accessible
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [x] 10. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

---

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- The "Church Groups" navigation link already exists in the TopNavBar under "Connect" dropdown — no navigation changes needed
- All images are sourced from existing `/public` folder — no new image assets required
- The page is a Server Component with zero client-side JavaScript (except for reused components like TopNavBar)
- Newsletter section reuses the existing `NewsletterForm` component
- Footer and TopNavBar are reused from existing components
- No property-based tests are included because this is a static UI/presentation feature without universal correctness properties
- Focus on component rendering tests, integration tests, and accessibility tests instead
