# Design Document: Groups Page Feature

## Overview

The Groups Page feature provides a dedicated landing page at `/groups` that showcases the church's ministry groups and fellowship opportunities. The page follows the established design system of the existing church website, featuring a hero section titled "Where You Fit" and multiple group sections with alternating image-text layouts. The implementation leverages existing components (TopNavBar, Footer, NewsletterForm) and follows the same architectural patterns as other content pages (contact, giving, books, tracts, volunteer).

### Design Goals

1. **Consistency**: Maintain visual and structural consistency with existing pages
2. **Discoverability**: Make it easy for visitors to find groups that match their interests
3. **Accessibility**: Ensure WCAG compliance through semantic HTML and proper ARIA attributes
4. **Responsiveness**: Provide optimal viewing experience across all device sizes
5. **Maintainability**: Use reusable components and follow established patterns

## Architecture

### Page Structure

The Groups Page follows the standard Next.js App Router page structure:

```
app/
  groups/
    page.tsx          # Main page component (Server Component)
    group-sections.tsx # Client component for group display logic (if needed)
```

### Component Hierarchy

```
GroupsPage (Server Component)
├── TopNavBar
├── HeroSection (inline)
├── GroupsContentSection
│   └── GroupCard[] (alternating layout)
├── NewsletterSection
└── Footer
```

### Data Flow

Since the groups content is static (not fetched from an API), the data will be defined as a constant array within the page component, similar to the pattern used in `app/page.tsx` for EVENTS and SERMONS.

## Components and Interfaces

### 1. GroupsPage Component

**Location**: `app/groups/page.tsx`

**Type**: Server Component (default in App Router)

**Responsibility**: Main page orchestrator that composes all sections

**Structure**:
```typescript
export default function GroupsPage() {
  return (
    <>
      <TopNavBar />
      {/* Hero Section */}
      {/* Groups Content Section */}
      {/* Newsletter Section */}
      <Footer {...footerProps} />
    </>
  )
}
```

### 2. Hero Section

**Implementation**: Inline within GroupsPage (not extracted to separate component)

**Styling Pattern**: Follows the pattern from `app/giving/page.tsx`, `app/books/page.tsx`, and `app/tracts/page.tsx`

**Key Elements**:
- Background image with opacity overlay
- Navy gradient overlay (rgba(0, 6, 102, 0.9) to rgba(0, 6, 102, 0.4))
- Eyebrow label with light green accent
- Main heading: "Where You Fit"
- Descriptive subtext
- Minimum height: 480px-540px

### 3. Group Card Component

**Purpose**: Display individual group information with image, title, description, and CTA

**Layout Variants**:
- Image Left (odd-indexed groups)
- Image Right (even-indexed groups)

**Responsive Behavior**:
- Desktop (≥768px): Side-by-side image and text
- Mobile (<768px): Stacked layout (image on top, text below)

### 4. Newsletter Section

**Implementation**: Reuse existing pattern from other pages

**Components Used**:
- `NewsletterForm` component
- Grid layout with text content and decorative image

### 5. Navigation Integration

**Modification Required**: Update `components/church/nav-bar.tsx`

The "Church Groups" link already exists in the NAV_LINKS array under the "Connect" dropdown:

```typescript
{
  label: 'Connect',
  children: [
    { label: 'Contact Us', href: '/contact' },
    { label: 'Church Groups', href: '/groups' }, // Already present
  ],
}
```

No changes needed to navigation component.

## Data Models

### Group Interface

```typescript
interface Group {
  id: string
  title: string
  description: string
  imageSrc: string
  imageAlt: string
  ctaLabel?: string
  ctaHref?: string
}
```

### Groups Data

Based on available images in the public folder and requirements, the following groups will be displayed:

```typescript
const GROUPS: Group[] = [
  {
    id: 'men',
    title: "Men's Ministry",
    description: "A brotherhood dedicated to spiritual growth, accountability, and service. Join us as we pursue godly character and lead our families with integrity.",
    imageSrc: '/men.png',
    imageAlt: "Men's Ministry gathering",
    ctaLabel: 'Learn More',
    ctaHref: '#men',
  },
  {
    id: 'women',
    title: "Women's Ministry",
    description: "A community of women supporting each other in faith, family, and purpose. Together we grow in wisdom, grace, and the knowledge of Christ.",
    imageSrc: '/women.png',
    imageAlt: "Women's Ministry fellowship",
    ctaLabel: 'Learn More',
    ctaHref: '#women',
  },
  {
    id: 'youth',
    title: 'Youth Ministry',
    description: "Empowering the next generation to walk boldly in their faith. A vibrant community where young people discover their identity in Christ and their purpose in the world.",
    imageSrc: '/youths.png',
    imageAlt: 'Youth Ministry activities',
    ctaLabel: 'Learn More',
    ctaHref: '#youth',
  },
  {
    id: 'house-fellowship',
    title: 'House Fellowship',
    description: "Small groups meeting in homes across the community for deeper connection, Bible study, and prayer. Experience authentic Christian community in an intimate setting.",
    imageSrc: '/House Fellowship.png',
    imageAlt: 'House Fellowship gathering',
    ctaLabel: 'Learn More',
    ctaHref: '#house-fellowship',
  },
  {
    id: 'prayer',
    title: 'Prayer Ministry',
    description: "The powerhouse of our church. Join us in intercession for our community, nation, and world. Experience the transformative power of corporate prayer.",
    imageSrc: '/Prayer.png',
    imageAlt: 'Prayer Ministry session',
    ctaLabel: 'Learn More',
    ctaHref: '#prayer',
  },
  {
    id: 'worship',
    title: 'Worship Team',
    description: "Using music and creative arts to usher in the presence of God. If you have a heart for worship and musical gifts, join us in leading the congregation into His presence.",
    imageSrc: '/Worship.png',
    imageAlt: 'Worship Team leading service',
    ctaLabel: 'Learn More',
    ctaHref: '#worship',
  },
]
```

## Layout Implementation

### Alternating Image-Text Pattern

The alternating layout will be achieved using CSS Grid and conditional styling based on array index:

```typescript
{GROUPS.map((group, index) => {
  const isImageLeft = index % 2 === 0
  
  return (
    <div
      key={group.id}
      className={`grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 items-center ${
        isImageLeft ? '' : 'md:grid-flow-dense'
      }`}
    >
      {/* Image */}
      <div className={`relative overflow-hidden rounded-2xl aspect-[4/3] ${
        isImageLeft ? '' : 'md:col-start-2'
      }`}>
        <Image
          src={group.imageSrc}
          alt={group.imageAlt}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 50vw"
        />
      </div>
      
      {/* Text Content */}
      <div className={`flex flex-col gap-4 ${
        isImageLeft ? '' : 'md:col-start-1 md:row-start-1'
      }`}>
        <h3 className="text-2xl md:text-3xl font-extrabold" 
            style={{ color: 'rgba(27, 34, 119, 1)' }}>
          {group.title}
        </h3>
        <p className="text-sm md:text-base text-gray-500 leading-relaxed">
          {group.description}
        </p>
        {group.ctaLabel && group.ctaHref && (
          <Link
            href={group.ctaHref}
            className="inline-flex items-center justify-center w-fit px-6 py-3 rounded-lg font-bold text-white text-sm transition-opacity hover:opacity-90"
            style={{ backgroundColor: 'var(--church-green)' }}
          >
            {group.ctaLabel}
          </Link>
        )}
      </div>
    </div>
  )
})}
```

### Responsive Breakpoints

Following the existing pattern:
- **Mobile**: `< 768px` - Stacked layout
- **Tablet**: `≥ 768px` - Side-by-side with alternating
- **Desktop**: `≥ 1024px` - Increased gap spacing

## Styling Strategy

### CSS Variables Usage

The page will use existing CSS variables defined in `app/globals.css`:

```css
--church-green: #1B6D24
--church-navy: rgba(27, 34, 119, 0.85)
--church-light-green: rgba(163, 246, 156, 1)
--section-padding-y: 5rem
--section-padding-x: 1.5rem
--container-max: 80rem
--radius-card: 1rem
```

### Color Palette

- **Primary Actions**: `var(--church-green)` - #1B6D24
- **Headings**: `rgba(27, 34, 119, 1)` (church navy)
- **Accents**: `var(--church-light-green)` - rgba(163, 246, 156, 1)
- **Body Text**: `text-gray-500` (Tailwind)
- **Background**: `rgba(249, 249, 249, 1)` for content sections
- **Newsletter Section**: `rgba(235, 241, 250, 1)` (light blue)

### Typography

Following existing patterns:
- **Hero Heading**: `text-5xl md:text-6xl font-extrabold`
- **Section Headings**: `text-2xl md:text-3xl font-extrabold`
- **Group Titles**: `text-2xl md:text-3xl font-extrabold`
- **Body Text**: `text-sm md:text-base leading-relaxed`
- **Eyebrow Labels**: `text-xs font-bold uppercase tracking-[0.2em]`

### Spacing

- **Section Padding**: `py-12` (3rem) or `py-[var(--section-padding-y)]` (5rem)
- **Horizontal Padding**: `px-[var(--section-padding-x)]` (1.5rem)
- **Container Max Width**: `max-w-[var(--container-max)]` (80rem)
- **Group Spacing**: `gap-12` between group cards

### Border Radius

- **Cards**: `rounded-2xl` (1rem)
- **Buttons**: `rounded-lg` (0.5rem)
- **Images**: `rounded-2xl`

## Error Handling

### Image Loading

1. **Fallback Handling**: Use Next.js Image component's built-in error handling
2. **Alt Text**: Provide descriptive alt text for all images
3. **Sizes Attribute**: Specify appropriate sizes for responsive loading

```typescript
<Image
  src={group.imageSrc}
  alt={group.imageAlt}
  fill
  className="object-cover"
  sizes="(max-width: 768px) 100vw, 50vw"
  onError={(e) => {
    // Fallback to placeholder if image fails to load
    e.currentTarget.src = '/placeholder.png'
  }}
/>
```

### Missing Data

Since groups data is static and defined in the component, missing data scenarios are minimal. However:

1. **Empty Groups Array**: Display a message if no groups are available
2. **Missing CTA**: Conditionally render CTA button only if both label and href exist
3. **Missing Images**: Provide fallback placeholder image

## Testing Strategy

### Unit Testing

Since this feature does not involve complex business logic or property-based testing scenarios (it's primarily a static content display page), the testing strategy will focus on:

1. **Component Rendering Tests**:
   - Verify page renders without errors
   - Verify all groups are displayed
   - Verify alternating layout logic works correctly
   - Verify responsive behavior at different breakpoints

2. **Integration Tests**:
   - Verify navigation link to `/groups` works
   - Verify all images load correctly
   - Verify CTA buttons have correct href attributes
   - Verify Footer and NavBar integration

3. **Accessibility Tests**:
   - Verify semantic HTML structure
   - Verify heading hierarchy (h1 → h2 → h3)
   - Verify alt text presence on all images
   - Verify keyboard navigation works
   - Verify color contrast ratios meet WCAG AA standards

### Example Test Cases

```typescript
// Example unit test structure (using Vitest + React Testing Library)

describe('GroupsPage', () => {
  it('renders the hero section with correct title', () => {
    render(<GroupsPage />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Where You Fit')
  })

  it('renders all group cards', () => {
    render(<GroupsPage />)
    expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(6)
  })

  it('alternates image position for each group', () => {
    render(<GroupsPage />)
    const groupSections = screen.getAllByTestId('group-card')
    // Verify first group has image on left
    // Verify second group has image on right
  })

  it('includes newsletter section', () => {
    render(<GroupsPage />)
    expect(screen.getByText(/Never Miss a Moment/i)).toBeInTheDocument()
  })
})
```

### Manual Testing Checklist

- [ ] Page loads at `/groups` route
- [ ] Hero section displays correctly with background image
- [ ] All 6 group cards render with correct content
- [ ] Images alternate between left and right on desktop
- [ ] Images stack on top of text on mobile
- [ ] All CTA buttons are clickable and styled correctly
- [ ] Newsletter form is present and functional
- [ ] Footer displays with correct links
- [ ] Navigation highlights "Church Groups" when on `/groups`
- [ ] Page is responsive across mobile, tablet, and desktop
- [ ] All images have appropriate alt text
- [ ] Color contrast meets accessibility standards
- [ ] Keyboard navigation works throughout the page

## Accessibility Considerations

### Semantic HTML

```html
<main>
  <section aria-label="Hero">
    <h1>Where You Fit</h1>
  </section>
  
  <section aria-label="Ministry Groups">
    <article>
      <h3>Men's Ministry</h3>
      <!-- content -->
    </article>
    <!-- more groups -->
  </section>
  
  <section aria-label="Newsletter">
    <!-- newsletter content -->
  </section>
</main>
```

### ARIA Attributes

- Use `aria-label` for sections without visible headings
- Use `aria-hidden="true"` for decorative elements (overlays, gradients)
- Ensure all interactive elements are keyboard accessible
- Provide descriptive alt text for all images

### Heading Hierarchy

```
h1: "Where You Fit" (Hero)
  h2: "Never Miss a Moment" (Newsletter)
  h3: Group titles (Men's Ministry, Women's Ministry, etc.)
```

### Color Contrast

All text must meet WCAG AA standards:
- **Normal text**: 4.5:1 contrast ratio
- **Large text** (18pt+): 3:1 contrast ratio

Verified combinations:
- White text on navy background (rgba(0, 6, 102, 1)): ✓ Pass
- Gray text (text-gray-500) on white: ✓ Pass
- Navy headings on white: ✓ Pass

### Keyboard Navigation

- All links and buttons must be focusable
- Focus indicators must be visible
- Tab order must be logical (top to bottom, left to right)

## Performance Considerations

### Image Optimization

1. **Next.js Image Component**: Automatic optimization, lazy loading, and responsive images
2. **Sizes Attribute**: Proper sizing hints for responsive images
3. **Priority Loading**: Hero image should use `priority` prop
4. **Format**: WebP with fallback to original format

### Code Splitting

- Page is automatically code-split by Next.js App Router
- No additional client-side JavaScript needed (Server Component)
- Newsletter form is the only client component (already optimized)

### Bundle Size

Estimated additions:
- Page component: ~2KB
- Groups data: ~1KB
- No additional dependencies required

## Implementation Phases

### Phase 1: Page Structure (Core)
1. Create `app/groups/page.tsx`
2. Implement hero section
3. Add TopNavBar and Footer integration
4. Verify routing works

### Phase 2: Groups Content
1. Define GROUPS data array
2. Implement group card rendering
3. Implement alternating layout logic
4. Add responsive styles

### Phase 3: Newsletter Integration
1. Add newsletter section
2. Integrate NewsletterForm component
3. Add decorative image

### Phase 4: Polish & Testing
1. Verify all images load correctly
2. Test responsive behavior
3. Verify accessibility compliance
4. Test keyboard navigation
5. Verify color contrast
6. Cross-browser testing

## Dependencies

### Existing Dependencies (No New Additions)

- `next`: ^15.x (App Router)
- `react`: ^19.x
- `next/image`: Image optimization
- `next/link`: Client-side navigation
- `@/components/church/nav-bar`: Navigation component
- `@/components/church/footer`: Footer component
- `@/components/church/newsletter-form`: Newsletter form component

### File Dependencies

- `/public/men.png`
- `/public/women.png`
- `/public/youths.png`
- `/public/House Fellowship.png`
- `/public/Prayer.png`
- `/public/Worship.png`
- `/public/fellowship.png` (for newsletter section)
- `/public/imagegallery1.png` or similar (for hero background)

## Migration and Deployment

### Deployment Checklist

- [ ] Verify all image assets exist in `/public` folder
- [ ] Test page in development environment
- [ ] Run build to check for TypeScript errors
- [ ] Verify no console errors or warnings
- [ ] Test on multiple browsers (Chrome, Firefox, Safari, Edge)
- [ ] Test on multiple devices (mobile, tablet, desktop)
- [ ] Verify SEO metadata is present
- [ ] Deploy to staging environment
- [ ] Perform final QA on staging
- [ ] Deploy to production

### Rollback Plan

If issues arise post-deployment:
1. Remove `/groups` route by deleting `app/groups/page.tsx`
2. Navigation link will show 404 (graceful degradation)
3. No database migrations or API changes required
4. Simple file-level rollback

## Future Enhancements

### Potential Improvements (Out of Scope for Initial Release)

1. **Dynamic Content**: Fetch groups from CMS or database
2. **Group Detail Pages**: Individual pages for each group with more information
3. **Contact Forms**: Embedded forms for joining specific groups
4. **Calendar Integration**: Show upcoming group meetings
5. **Member Testimonials**: Add testimonials from group members
6. **Search/Filter**: Allow visitors to filter groups by category or interest
7. **Group Leaders**: Display group leader information and contact details
8. **Meeting Times**: Show regular meeting schedules for each group

## Appendix

### File Structure

```
app/
  groups/
    page.tsx                    # Main groups page component

components/
  church/
    nav-bar.tsx                 # Already includes /groups link
    footer.tsx                  # Reused component
    newsletter-form.tsx         # Reused component

public/
  men.png                       # Men's ministry image
  women.png                     # Women's ministry image
  youths.png                    # Youth ministry image
  House Fellowship.png          # House fellowship image
  Prayer.png                    # Prayer ministry image
  Worship.png                   # Worship team image
  fellowship.png                # Newsletter section image
  imagegallery1.png            # Hero background image
```

### Code Style Guidelines

Following existing codebase conventions:

1. **TypeScript**: Strict mode enabled
2. **Component Style**: Functional components with TypeScript interfaces
3. **Styling**: Tailwind CSS with inline styles for brand colors
4. **Imports**: Absolute imports using `@/` alias
5. **Formatting**: Consistent with existing pages (2-space indentation)
6. **Comments**: Minimal comments, self-documenting code preferred

### Reference Pages

For implementation consistency, refer to:

- `app/giving/page.tsx` - Hero section pattern
- `app/books/page.tsx` - Content section pattern
- `app/volunteer/page.tsx` - Two-column layout pattern
- `app/contact/page.tsx` - Newsletter section pattern
- `app/tracts/page.tsx` - Overall page structure

---

**Document Version**: 1.0  
**Last Updated**: 2025-01-XX  
**Status**: Ready for Implementation
