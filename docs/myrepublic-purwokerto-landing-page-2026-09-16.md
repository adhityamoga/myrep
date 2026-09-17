# MyRepublic Purwokerto Landing Page

## Goal
Build a responsive, production-ready landing page that closely follows the supplied reference’s composition and pacing while replacing its identity and content with MyRepublic Purwokerto.

## Page structure
- Compact blue navigation with MyRepublic branding, section links, and a strong availability CTA.
- Full-width blue hero with a large centered headline, concise local message, primary CTA, and a customer-focused photographic composition.
- Internet package section using clear price/speed cards and honest package notes.
- Coverage checker with an address search field, explicit search action, and a clearly labeled map placeholder prepared for future Maps/API integration; no fake results.
- Benefits section with restrained iconography and concise service advantages.
- Full-width conversion band followed by a minimal contact-focused footer.

## Visual direction
- Preserve the reference’s blue-led blocks, lime accents, bold geometric typography, compact spacing, square-to-soft card geometry, and alternating white/blue section rhythm.
- Avoid glass effects, decorative gradients, generic split hero composition, fake 3D visuals, and excessive motion.
- Use a generated, locally stored customer image that fits the brand and reference composition without copying the source image.

## Technical details
- Implement at `/` with reusable React + TypeScript section components.
- Define all colors, typography, shadows, and radii as semantic Tailwind v4 tokens in the global design system.
- Add complete route metadata and accessible labels, headings, image alternatives, form controls, and keyboard focus states.
- Keep the coverage checker frontend-only and expose a clean submit boundary for later backend/Maps integration.
- Validate the finished page at desktop and mobile sizes, including interaction and overflow checks.
