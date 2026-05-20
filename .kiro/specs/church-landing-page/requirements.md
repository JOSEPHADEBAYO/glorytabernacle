# Requirements Document

## Introduction

This document defines the functional and non-functional requirements for the RCCG Glory Tabernacle, Barnstaple church website. The site is a multi-page Next.js 16 (App Router) application with a 7-section landing page as the primary deliverable. It is built on TypeScript, Tailwind CSS v4, and the existing shadcn/radix-ui foundation. Data is hardcoded for the initial release; a CMS integration is out of scope. Additional pages (sermons, giving, books) are stubbed with placeholder content.

---

## Glossary

- **Landing_Page**: The root route (`/`) that assembles all 7 sections.
- **TopNavBar**: The sticky navigation bar rendered at the top of every page.
- **HeroSection**: The full-viewport slideshow section at the top of the Landing_Page.
- **AboutSection**: The two-column section describing the church's mission and vision.
- **EventsSection**: The section displaying upcoming church events as a card grid.
- **SermonsSection**: The section displaying recent sermon recordings as a card row.
- **SupportSection**: The full-width call-to-action banner for giving/support.
- **Footer**: The multi-column footer with links, social icons, and contact info.
- **EventCard**: A card component rendering a single `ChurchEvent`.
- **SermonCard**: A card component rendering a single `Sermon`.
- **ThemeProvider**: The client component that manages light/dark mode state.
- **ToastProvider**: The client component that manages the toast notification queue.
- **Design_System**: The set of CSS custom property tokens and shared UI components.
- **Stub_Page**: A route that renders a minimal placeholder until full content is built.
- **Server_Component**: A React component rendered exclusively on the server with no client JS.
- **Client_Component**: A React component that ships JS to the browser for interactivity.

---

## Requirements

### Requirement 1: Top Navigation Bar

**User Story:** As a site visitor, I want a persistent navigation bar, so that I can move between sections and pages from anywhere on the site.

#### Acceptance Criteria

1. THE TopNavBar SHALL render the RCCG Glory Tabernacle, Barnstaple logo on the far left, navigation links centered, and a "GIVE" CTA button on the far right.
2. THE TopNavBar SHALL always display a `--church-navy` background regardless of scroll position.
3. THE TopNavBar SHALL render the following links in order: Home, About, Media (with dropdown), Volunteer, Connect (with dropdown).
4. WHEN a visitor hovers over or clicks "Media" on desktop, THE TopNavBar SHALL reveal a dropdown menu containing "Sermons" and "Books".
5. WHEN a visitor hovers over or clicks "Connect" on desktop, THE TopNavBar SHALL reveal a dropdown menu containing "Contact Us" and "Small Groups".
6. WHEN a dropdown is open, THE chevron icon next to the parent link SHALL rotate 180°.
7. WHEN the current pathname matches a navigation link's `href`, THE TopNavBar SHALL apply a green bottom-border active indicator to that link.
8. WHEN a visitor activates the hamburger menu on a mobile viewport, THE TopNavBar SHALL expand a slide-down drawer containing all navigation links with dropdowns expanding inline.
9. WHEN a visitor activates the hamburger menu a second time, THE TopNavBar SHALL collapse the drawer and restore the closed state.
10. THE TopNavBar SHALL use `position: sticky` and `z-50` so that it remains visible during scroll.
11. THE TopNavBar SHALL use `next/link` for all internal navigation links.
12. THE hamburger button SHALL set `aria-expanded` reflecting the open/closed state of the mobile drawer.
13. THE "GIVE" CTA button SHALL use `--church-green` background with white text and `rounded-md` border radius.

---

### Requirement 2: Hero Slideshow Section

**User Story:** As a site visitor, I want an engaging hero section, so that I immediately understand the church's identity and can take a primary action.

#### Acceptance Criteria

1. THE HeroSection SHALL occupy the full viewport width and a minimum height of `100svh`.
2. THE HeroSection SHALL display each slide's background image using `next/image` with `fill` and `object-cover`.
3. WHEN the HeroSection is mounted, THE HeroSection SHALL automatically advance to the next slide every 5000 ms.
4. WHEN a visitor hovers over the HeroSection, THE HeroSection SHALL pause the auto-advance timer.
5. WHEN a visitor moves the pointer off the HeroSection, THE HeroSection SHALL resume the auto-advance timer.
6. WHEN the active slide is the last slide and the timer fires, THE HeroSection SHALL advance to the first slide (wrap-around).
7. THE HeroSection SHALL transition between slides using a CSS `opacity` cross-fade with `transition-opacity duration-1000 ease-in-out`.
8. THE HeroSection SHALL render one dot indicator per slide, with the dot corresponding to the active slide visually distinguished.
9. THE HeroSection SHALL render a primary CTA button and a secondary CTA button overlaid on the slide content.
10. THE HeroSection SHALL apply a `--church-navy` colour overlay at the configured `overlayOpacity` (default 0.5) over each background image.
11. THE HeroSection SHALL load the first slide's image with the `preload` attribute (not the deprecated `priority` prop) as the LCP element.

---

### Requirement 2b: Live Stream Section

**User Story:** As a site visitor, I want to see the church's live stream status and a countdown to the next service, so that I can tune in or get notified when it goes live.

#### Acceptance Criteria

1. THE LiveStreamSection SHALL be placed immediately after the HeroSection on the Landing_Page.
2. THE LiveStreamSection SHALL display a video thumbnail image on the left and content on the right in a two-column layout on `md+` viewports, stacking vertically on mobile.
3. THE LiveStreamSection SHALL display a status badge in the top-left corner of the thumbnail: `OFFLINE` (red background) when the stream is not live, and `LIVE` (green background, pulsing indicator) when the stream is active.
4. THE LiveStreamSection SHALL render a green circular play button overlay centered on the thumbnail.
5. WHEN the stream is live, THE play button SHALL link to the configured YouTube live URL.
6. WHEN the stream is offline, THE play button SHALL be non-interactive (no link).
7. THE LiveStreamSection SHALL render a decorative navy horizontal rule above the section heading.
8. THE LiveStreamSection SHALL render the heading "Experience The Hub Live" and a configurable subtext.
9. THE LiveStreamSection SHALL render a countdown timer displaying Days, Hours, and Minutes until the next configured service date/time.
10. WHEN the countdown reaches zero, THE LiveStreamSection SHALL display a "We're Live!" message in place of the countdown.
11. THE countdown timer SHALL update every second using a client-side interval.
12. THE LiveStreamSection SHALL render a "GET NOTIFIED" button with an outlined style (navy border and text).
13. WHEN a visitor clicks "GET NOTIFIED", THE LiveStreamSection SHALL open a modal containing an email subscription form.
14. THE email subscription form SHALL include a name field, an email field, and a submit button.
15. THE LiveStreamSection SHALL be a Client_Component due to the countdown timer and modal interaction.

---

### Requirement 3: About Section

**User Story:** As a site visitor, I want to learn about the church's mission and vision, so that I can decide whether this community is right for me.

#### Acceptance Criteria

1. THE AboutSection SHALL render the provided heading, body text, mission statement, and vision statement.
2. THE AboutSection SHALL render the provided image using `next/image` with meaningful `alt` text.
3. THE AboutSection SHALL be a Server_Component with no client-side JavaScript.
4. WHEN rendered on a viewport of `md` breakpoint or wider, THE AboutSection SHALL display a two-column grid with the image on one side and text on the other.
5. WHEN rendered on a viewport narrower than `md`, THE AboutSection SHALL stack the image and text vertically.

---

### Requirement 4: Events Section

**User Story:** As a site visitor, I want to see upcoming church events, so that I can plan my attendance.

#### Acceptance Criteria

1. THE EventsSection SHALL render one EventCard for every `ChurchEvent` in the provided `events` array.
2. THE EventsSection SHALL be a Server_Component with no client-side JavaScript.
3. WHEN rendered on a mobile viewport, THE EventsSection SHALL display EventCards in a single-column grid.
4. WHEN rendered on a `sm` breakpoint viewport, THE EventsSection SHALL display EventCards in a two-column grid.
5. WHEN rendered on an `lg` breakpoint viewport or wider, THE EventsSection SHALL display EventCards in a three-column grid.
6. THE EventCard SHALL render the event's date as a Badge, title, time, location, and description excerpt.
7. WHEN a `ChurchEvent` includes an `image`, THE EventCard SHALL render that image using `next/image`.
8. WHEN a `ChurchEvent` includes a `registrationHref`, THE EventCard SHALL render a registration button linking to that URL.
9. IF a `ChurchEvent` does not include a `registrationHref`, THEN THE EventCard SHALL NOT render a registration button.

---

### Requirement 5: Sermons Section

**User Story:** As a site visitor, I want to browse recent sermon recordings, so that I can engage with church teaching at my own pace.

#### Acceptance Criteria

1. THE SermonsSection SHALL render one SermonCard for every `Sermon` in the provided `sermons` array.
2. THE SermonsSection SHALL be a Server_Component with no client-side JavaScript.
3. WHEN rendered on a mobile viewport, THE SermonsSection SHALL display SermonCards in a horizontally scrollable row.
4. WHEN rendered on an `lg` breakpoint viewport or wider, THE SermonsSection SHALL display SermonCards in a three-column grid.
5. THE SermonCard SHALL render the sermon's thumbnail image, title, speaker name, and date.
6. WHEN a `Sermon` includes a `series` value, THE SermonCard SHALL render a Badge displaying the series name.
7. IF a `Sermon` does not include a `series` value, THEN THE SermonCard SHALL NOT render a series Badge.
8. WHEN a `Sermon` includes a `videoHref`, THE SermonCard SHALL render a video action button linking to that URL.
9. IF a `Sermon` does not include a `videoHref`, THEN THE SermonCard SHALL NOT render a video action button.
10. WHEN a `Sermon` includes an `audioHref`, THE SermonCard SHALL render an audio action button linking to that URL.
11. IF a `Sermon` does not include an `audioHref`, THEN THE SermonCard SHALL NOT render an audio action button.

---

### Requirement 6: Support / Giving CTA Section

**User Story:** As a site visitor, I want a clear call to action for giving and support, so that I can contribute to the church's mission.

#### Acceptance Criteria

1. THE SupportSection SHALL render the provided heading, body text, and primary CTA button.
2. WHEN a `secondaryCta` prop is provided, THE SupportSection SHALL render a secondary CTA button.
3. IF no `secondaryCta` prop is provided, THEN THE SupportSection SHALL NOT render a secondary CTA button.
4. THE SupportSection SHALL apply a full-width background colour determined by the `backgroundVariant` prop (`green`, `navy`, or `light`).
5. THE SupportSection SHALL be a Server_Component with no client-side JavaScript.

---

### Requirement 7: Footer

**User Story:** As a site visitor, I want a comprehensive footer, so that I can find contact information, quick links, and social media channels.

#### Acceptance Criteria

1. THE Footer SHALL render every `FooterColumn` with its heading and all of its `FooterLink` items.
2. THE Footer SHALL render an icon link for every entry in the `socialLinks` array.
3. THE Footer SHALL render the church's address, phone number, and email address from `contactInfo`.
4. THE Footer SHALL render the RCCG Glory Tabernacle, Barnstaple logo using `next/image`.
5. THE Footer SHALL render the `copyrightText` string.
6. THE Footer SHALL be a Server_Component with no client-side JavaScript.
7. WHEN rendered on an `lg` breakpoint viewport or wider, THE Footer SHALL display a four-column grid layout.
8. WHEN rendered on an `sm` breakpoint viewport, THE Footer SHALL display a two-column grid layout.
9. WHEN rendered on a mobile viewport narrower than `sm`, THE Footer SHALL stack all columns vertically.

---

### Requirement 8: Design System Tokens

**User Story:** As a developer, I want a consistent set of design tokens, so that all components share a coherent visual language.

#### Acceptance Criteria

1. THE Design_System SHALL define `--church-green`, `--church-navy`, `--church-light-green`, and `--church-white-transparent` as CSS custom properties in `:root`.
2. THE Design_System SHALL define semantic aliases `--color-brand-primary`, `--color-brand-secondary`, and `--color-brand-accent` that reference the raw brand tokens.
3. THE Design_System SHALL expose brand colour tokens to Tailwind utilities via the `@theme inline` block in `globals.css`.
4. THE Design_System SHALL define `--section-padding-y`, `--section-padding-x`, and `--container-max` spacing tokens.
5. THE Design_System SHALL define `--shadow-card` and `--shadow-nav` shadow tokens.
6. THE Design_System SHALL define `--radius-card` and `--radius-badge` border-radius tokens.
7. WHEN the `.dark` class is present on the `<html>` element, THE Design_System SHALL override `--church-green` and `--church-light-green` with their dark-mode values.

---

### Requirement 9: Dark Mode

**User Story:** As a site visitor, I want to switch between light and dark mode, so that I can read comfortably in any lighting condition.

#### Acceptance Criteria

1. THE ThemeProvider SHALL accept `'light'`, `'dark'`, and `'system'` as valid theme values.
2. WHEN a visitor sets the theme to `'dark'`, THE ThemeProvider SHALL add the `dark` class to the `<html>` element.
3. WHEN a visitor sets the theme to `'light'`, THE ThemeProvider SHALL remove the `dark` class from the `<html>` element.
4. WHEN a visitor sets the theme to `'system'`, THE ThemeProvider SHALL apply the `dark` class if and only if `prefers-color-scheme: dark` is active.
5. WHEN a visitor changes the theme, THE ThemeProvider SHALL persist the selected value to `localStorage`.
6. WHEN the page loads, THE ThemeProvider SHALL read the theme from `localStorage` and apply it before first paint to prevent a flash of incorrect theme.
7. THE ThemeProvider SHALL be a Client_Component wrapping the root layout body.

---

### Requirement 10: Shared UI Component Library

**User Story:** As a developer, I want a set of reusable UI primitives, so that I can build consistent interfaces across all pages.

#### Acceptance Criteria

1. THE Design_System SHALL provide a `Card` component with `default`, `elevated`, and `outlined` variants and `CardHeader`, `CardImage`, `CardBody`, and `CardFooter` slots.
2. THE Design_System SHALL provide a `Badge` component with `default`, `success`, `warning`, `info`, and `outline` variants.
3. THE Design_System SHALL provide a `Modal` component built on `@radix-ui/react-dialog` with `confirmation`, `form`, and `alert` variants.
4. WHEN a `Modal` is open, THE Modal SHALL trap keyboard focus within the dialog.
5. WHEN a visitor presses the `Escape` key while a `Modal` is open, THE Modal SHALL close.
6. THE Modal SHALL include `aria-labelledby` and `aria-describedby` attributes referencing the dialog title and description.
7. THE Design_System SHALL provide a `Toast` component with `success`, `error`, `warning`, and `info` variants built on `@radix-ui/react-toast`.
8. WHEN a toast is shown, THE ToastProvider SHALL automatically dismiss it after 5000 ms by default.
9. WHEN more than 3 toasts are queued, THE ToastProvider SHALL display at most 3 toasts simultaneously.
10. THE Design_System SHALL provide an `Input` component supporting `text`, `email`, `password`, `textarea`, `select`, `checkbox`, and `radio` types.
11. WHEN an `Input` is in an error state, THE Input SHALL set `aria-invalid="true"` and `aria-describedby` referencing the associated error message element.

---

### Requirement 11: Accessibility

**User Story:** As a visitor using assistive technology, I want the site to be navigable and understandable, so that I can access all content regardless of ability.

#### Acceptance Criteria

1. THE Landing_Page SHALL ensure every `next/image` instance has a non-empty `alt` attribute.
2. THE TopNavBar SHALL expose a visible focus indicator on all interactive elements meeting WCAG 2.1 AA contrast requirements.
3. THE HeroSection SHALL include an `aria-label` or `aria-roledescription` on the slideshow container identifying it as a carousel.
4. THE HeroSection dot indicators SHALL be keyboard-navigable and include `aria-label` attributes identifying the slide they represent.
5. THE Modal SHALL meet WCAG 2.1 AA requirements for focus management: focus moves to the dialog on open and returns to the trigger element on close.
6. ALL form inputs SHALL have associated `<label>` elements or `aria-label` attributes.
7. THE TopNavBar mobile drawer SHALL set `aria-expanded` on the hamburger button reflecting the open/closed state.

---

### Requirement 12: Responsive Design

**User Story:** As a visitor on any device, I want the site to be fully usable, so that I can access church information on my phone, tablet, or desktop.

#### Acceptance Criteria

1. THE Landing_Page SHALL be fully functional and readable on viewports from 320 px wide and above.
2. THE TopNavBar SHALL display a hamburger menu icon on viewports narrower than the `md` breakpoint and the full link row on `md` and wider.
3. THE HeroSection SHALL maintain `100svh` minimum height on all viewport sizes.
4. ALL section components SHALL apply `--section-padding-y` vertical padding and `--section-padding-x` horizontal padding with a `--container-max` maximum width.
5. THE Footer SHALL adapt its column layout as specified in Requirement 7 across breakpoints.

---

### Requirement 13: Multi-Page Routing

**User Story:** As a developer, I want the routing structure in place, so that additional pages can be built out incrementally without restructuring the app.

#### Acceptance Criteria

1. THE Landing_Page SHALL be served at the `/` route.
2. THE Stub_Page for sermons SHALL be served at the `/sermons` route and render a placeholder with a link back to `/`.
3. THE Stub_Page for giving SHALL be served at the `/giving` route and render a placeholder with a link back to `/`.
4. THE Stub_Page for books SHALL be served at the `/books` route and render a placeholder with a link back to `/`.
5. THE Landing_Page SHALL include a custom `not-found.tsx` that renders a branded 404 page with a CTA back to `/`.
6. THE Landing_Page SHALL include an `error.tsx` error boundary that renders a friendly error message.
7. ALL pages SHALL share the root `app/layout.tsx` which provides `ThemeProvider` and `ToastProvider`.

---

### Requirement 14: Performance

**User Story:** As a site visitor on a slow connection, I want the page to load quickly, so that I am not frustrated waiting for content.

#### Acceptance Criteria

1. ALL section components except TopNavBar and HeroSection SHALL be Server_Components, contributing zero JavaScript to the client bundle.
2. THE HeroSection SHALL use the `preload` attribute on the first slide's `next/image` to prioritise the LCP image.
3. ALL `next/image` instances SHALL include explicit `width` and `height` props or use `fill` layout to prevent cumulative layout shift.
4. THE Landing_Page SHALL set `scroll-padding-top` in `globals.css` equal to the TopNavBar height to ensure anchor links scroll to the correct position.
5. THE TopNavBar background colour transition SHALL be driven by a CSS class toggle, not a continuous `scroll` event listener, to avoid layout thrashing.
