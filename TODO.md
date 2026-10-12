# TODO — Your Body, Now

Everything between today's prototype and an Awwwards submission. Ordered by priority within each section. **P0** = must have before launch, **P1** = strongly improves the score, **P2** = nice to have.

---

## ✅ Done

- [x] Astro + TypeScript project, static build, unit tests (Vitest)
- [x] 24-hour dial: drag, inertia, quarter-hour snap, keyboard (arrows, Page Up/Down, Home/End), time input, "Back to now"
- [x] Live mode follows the real clock; explore mode with shareable URL (`?t=HH:MM`)
- [x] WebGL sky (OGL shader) whose colour and tempo follow the hour
- [x] Day palette interpolated in OKLab, WCAG AA contrast guaranteed against background and glow (tested every 5 minutes of the day)
- [x] Variable display font that "breathes" with alertness (weight + width)
- [x] Four stylised curves (alertness, core temperature, cortisol, melatonin) with trend labels, not distinguished by colour alone
- [x] Eight phases of the day with headline, explanation and tip
- [x] Opening animation: title → dial assembles → a full day spins by → lands on now. Skippable, once per session, off with reduced motion
- [x] Reduced-motion support, screen reader announcements, no horizontal scroll on mobile
- [x] Verified sources for every claim (`docs/CONTENT.md`), reference list on `/sources`, each chapter links its sources
- [x] **"A day in your body"**: scroll-driven journey through all 8 phases. Scrolling moves the clock (sky, palette, type), sticky chapters, Lenis smooth scroll, progress rail (side on desktop, bottom bar on mobile) to jump between phases, "Back to now"
- [x] Idle hint: the dial knob wiggles once if nobody touches it
- [x] Deployed on Vercel

---

## 1. Content & science

- [x] **P0** Find and verify a reliable source for every claim in `docs/CONTENT.md` (24 references; copy adjusted where it went beyond the evidence)
- [ ] **P0** Read the full text for the claims marked 🟡 in `docs/CONTENT.md` (cortisol peak window, exact temperature minimum/maximum times, page numbers, full author lists)
- [ ] **P0** Have someone with a medical or biology background proofread the copy
- [ ] **P1** Per-hour details: one fact and one tip for each of the 24 hours, inside the 8 phases
- [ ] **P1** Chronotype toggle ("Are you a morning or an evening person?") that shifts every curve and phase by ±1–2 hours
- [ ] **P1** Short "Why this matters" intro text for first-time visitors (without a pop-up)
- [ ] **P2** Dutch translation (`/nl/`), with language switch
- [ ] **P2** Extra curves: heart rate, blood pressure, digestion (only if well sourced)

## 2. UX research & testing

- [ ] **P0** Usability test with 5 people from the target audience (think-aloud, task-based):
  - Do they understand that the dial can be dragged?
  - Do they find "Back to now"?
  - Do they understand the curves and labels?
  - Is the intro too long?
- [ ] **P0** Analyse results (affinity mapping) and fix the top issues
- [ ] **P1** Second test round after fixes
- [ ] **P2** Short survey after launch: what did people learn, what will they try?

## 3. Design

- [ ] **P1** Moodboard and final art direction: lock fonts, colour keyframes and imagery style
- [ ] **P1** Illustration of the body that changes per phase (Rive or a shader-based abstract figure): sleeping, waking, focused, sluggish, active, winding down
- [ ] **P1** Fine-tune the 24-hour palette on real screens (OLED phone, laptop, external monitor)
- [ ] **P1** Micro-interactions: dial hover state, magnetic knob, haptic-feeling snap
- [ ] **P2** Custom cursor that shows the time when hovering over the dial
- [ ] **P2** Phase transition effect in the shader (a soft "pulse" when crossing into a new phase)

## 4. Features

- [ ] **P1** Journey: per-chapter visual (illustration or shader state) so each phase has its own image, not only colour
- [ ] **P1** Journey: scroll-scrubbed mini curve chart inside each chapter
- [ ] **P1** Mobile: horizontal time scrubber at the bottom of the screen, thumb-friendly, in place of the large dial
- [ ] **P1** Optional ambient sound per phase (off by default, clear on/off toggle, fades between phases)
- [ ] **P1** "Share this moment": copy link to the current time
- [ ] **P2** Personal mode: enter your own bedtime and wake time, and everything shifts
- [ ] **P2** Notification-free "daily rhythm" summary image to download/share (social card per phase)

## 5. Performance

- [ ] **P0** Lighthouse: Performance ≥ 90 on mobile, Accessibility 100, Best Practices 100, SEO 100
- [ ] **P0** Test the shader on a low-end Android phone; add a quality fallback (lower resolution, fewer noise octaves)
- [ ] **P1** Pause the shader when the tab is hidden or the canvas is off-screen
- [ ] **P1** Preload the display font; subset fonts to the characters used
- [ ] **P1** Check bundle size (GSAP plugins, OGL) and lazy-load what isn't needed on first paint
- [ ] **P2** Respect `prefers-reduced-data`

## 6. Accessibility

- [ ] **P0** Full keyboard pass: every control reachable, visible focus everywhere
- [ ] **P0** Screen reader test with VoiceOver (macOS/iOS) and NVDA (Windows)
- [ ] **P0** 400% zoom test
- [ ] **P1** Text alternative for the curves (a short description or data table per phase)
- [ ] **P1** Check colour contrast of non-text elements (curves, dial ticks) for 3:1

## 7. Cross-browser & device QA

- [ ] **P0** Safari macOS + **Safari iOS** (WebGL, `font-stretch`, `color-mix`, time input)
- [ ] **P0** Chrome Android, Samsung Internet
- [ ] **P0** Firefox desktop
- [ ] **P1** Tablet portrait and landscape
- [ ] **P1** Very wide screens (2560px+) and short laptop screens (768px high)

## 8. SEO & sharing

- [ ] **P0** Open Graph image (1200×630) and Twitter card
- [ ] **P0** Favicon set (SVG + PNG + apple-touch-icon) and web manifest
- [ ] **P1** Dynamic OG image per phase for shared `?t=` links
- [ ] **P1** Structured data and a proper `<meta name="description">` per page
- [ ] **P2** Sitemap and `robots.txt`

## 9. Hosting & launch

- [ ] **P0** Custom domain (e.g. `yourbodynow.com` or `yourbody.now`) with HTTPS
- [ ] **P1** Vercel Web Analytics (privacy-friendly, no cookie banner needed)
- [ ] **P1** Preview deployments per branch for testing
- [ ] **P2** Error monitoring for WebGL failures

## 10. Awwwards submission

- [ ] **P0** Final QA checklist complete (sections 5–7)
- [ ] **P0** Submission assets:
  - Cover image / screenshots (desktop + mobile, several times of day)
  - Short video (15–30 s) of the intro and the dial
  - Description in English: concept, the science, how it was built
  - Credits (design, development, content review) and tags/technologies
- [ ] **P1** Write a case study (Medium / portfolio) explaining concept, process and tech
- [ ] **P1** Share before submitting to gather feedback and first visitors (LinkedIn, X, Reddit r/web_design, Dribbble)
- [ ] **P1** Also submit to CSS Design Awards, FWA and Godly
- [ ] **P2** Submit for the Developer Award as well (semantics, performance, accessibility count there)
