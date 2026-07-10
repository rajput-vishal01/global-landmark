# Animation Guidelines

GSAP + Framer Motion, split by job. Distilled from the gsap-core/scrolltrigger/timeline/react/performance/plugins skills and the motion catalogue in [DESIGN_REFERENCES.md](DESIGN_REFERENCES.md). No dedicated Framer Motion skill is installed in this environment — its patterns below follow official Framer Motion conventions.

## Division of labor

**GSAP (ScrollTrigger + timeline) owns:**
- Scroll-scrubbed reveals tied to scroll position (the sobharealty.com arch/scale unveil, the locomotive.ca parallax hero background).
- Pinned/sticky sections (property gallery, floor-plan viewer).
- Multi-step sequenced timelines (hero load-in: eyebrow → headline → CTA → scroll cue, staggered).
- SplitText character/line reveals (hero headline only — reserve, don't overuse per locomotive.ca's rejected pattern).
- Anything that must stay in sync with scroll position frame-by-frame.

**Framer Motion owns:**
- Component enter/exit (route transitions, modal/lightbox open-close, mobile nav overlay).
- Layout animation (`layout` prop) for filter/sort re-ordering on listing grids, FLIP-style card reshuffling.
- Hover/tap micro-interactions on interactive components (buttons, cards) where the interaction is component-state-driven, not scroll-driven.
- Anything living inside a React component's own state machine (open/closed, active/inactive).

Rule of thumb: **if it's driven by scroll position, GSAP ScrollTrigger. If it's driven by component/UI state, Framer Motion.** Do not use both libraries for the same element's same interaction.

## Scroll-animation catalogue

| Pattern | Library | Where | Notes |
|---|---|---|---|
| Staggered fade-up on grid entry | GSAP `ScrollTrigger.batch()` | Listing cards, press logos, team grid | `opacity: 0, y: 24 → opacity: 1, y: 0`, stagger 0.06–0.1s, `power2.out` |
| Arch/mask scrubbed reveal | GSAP ScrollTrigger, `scrub: 1` | One signature image per property/community page | `scale(.65)` + arch `border-radius` → `scale(1)` + square, per sobharealty.com |
| Parallax hero background | GSAP ScrollTrigger, `scrub: true` | Homepage hero, community hero | Background moves at ~0.3–0.5x foreground scroll speed via `y` transform, not `background-position` |
| Pinned gallery/floor-plan panel | GSAP ScrollTrigger, `pin: true` | Property detail — floor plans, gallery walkthrough | Pin the wrapper, animate children only, never the pinned element itself |
| Hero load-in sequence | GSAP timeline (no ScrollTrigger — plays on mount) | Every hero | Eyebrow → headline (SplitText lines) → subcopy → CTA → scroll cue, `0.1–0.15s` stagger via position parameter |
| Stat counter count-up | GSAP `ScrollTrigger` + `gsap.to(obj, {value: target})` | Credibility band | `toggleActions: "play none none none"`, `once: true` |
| Direction-aware header hide/show | GSAP `Observer` plugin | Global header | Hide on scroll-down, show on scroll-up, per locomotive.ca/makemepulse.com |

## Micro-interaction catalogue (Framer Motion)

| Pattern | Where | Notes |
|---|---|---|
| Nav overlay slide-in | Mobile/hamburger menu | `initial={{x: "100%"}} animate={{x: 0}}`, staggered `children` for nav items |
| Card hover lift | Listing cards | `whileHover={{y: -4, scale: 1.02}}`, spring, capped — no `scale(1.2)` per rejected pattern |
| Image zoom on hover | Gallery/listing images only | `scale(1.04–1.08)` over `0.6–0.8s ease`, never on icons/logos/UI chrome |
| Animated outline button | Primary CTAs | SVG `pathLength` draw-on over ~0.4–0.6s on hover, per omniyat.com's signature technique — candidate for Global Landmark's primary-CTA hover |
| Lightbox/gallery open | Property gallery | `AnimatePresence` + scale/opacity, shared-layout `layoutId` from thumbnail to full view |
| Filter/sort re-order | Listing grid | `layout` prop on cards, `AnimatePresence` for add/remove |
| Route/page transition | Between top-level pages | Fade + slight `y` shift, kept short (250–350ms) — do not replicate locomotive.ca's full AJAX page-transition system (rejected: agency flourish, SEO/perceived-speed risk) |

## Easing & timing — pick once, reuse everywhere

locomotive.ca's strongest lesson: two consistent cubic-beziers used sitewide beat ad hoc eases per animation.

- **General transitions:** `power2.out` (GSAP) / `[0.215, 0.61, 0.355, 1]` (Framer) — hovers, fades, most UI motion.
- **Heavier reveals:** `power3.inOut` (GSAP) / `[0.23, 1, 0.32, 1]` (Framer) — hero load-ins, scrubbed image reveals.
- Durations: micro-interactions 0.2–0.4s, section reveals 0.5–0.8s, hero sequences 0.8–1.4s total, scroll-scrubbed animations tied to scroll distance (no fixed duration).

## Performance rules

- **Animate `transform`/`opacity` only.** Never animate `width`/`height`/`top`/`left`/`margin` for movement — use GSAP transform aliases (`x`, `y`, `scale`, `rotation`) or Framer's transform props.
- **`will-change: transform`** only on elements actively animating — not blanket-applied.
- **Lazy-init heavy effects.** Register ScrollTrigger/SplitText instances inside `useGSAP()` (React) scoped to the component; don't run scroll-linked setup for off-screen/below-the-fold sections until they're near viewport.
- **`gsap.matchMedia()`** for responsive behavior and `prefers-reduced-motion` — reduce duration to near-zero or skip entirely when the user prefers reduced motion. Framer Motion: use `useReducedMotion()` and branch animation props accordingly.
- **Never block LCP on animation.** Hero image/video must render immediately; the hero *load-in sequence* (headline stagger etc.) can animate in after, but the underlying content must be visible without JS.
- **No layout thrash.** Batch reads before writes; avoid triggering synchronous layout inside scroll callbacks. `ScrollTrigger.batch()` over N individual ScrollTrigger instances on a grid.
- **Kill/revert on unmount.** `useGSAP()` handles this automatically in React — never leave orphaned ScrollTrigger/tween instances when navigating away (App Router client-side nav).
- **One `ScrollTrigger.refresh()`** after dynamic content/image/font load, not on every resize (resize is auto-debounced).
- **No markers, no GSDevTools in production builds.**

## Accessibility

- Every scroll/hover animation must have a `prefers-reduced-motion` fallback — buildinamsterdam.com's blanket override pattern is the model: wrap animated CSS/JS so reduced-motion users get instant state changes, not a stripped-down slow version.
- Content must be reachable and readable with JavaScript/animation disabled — GSAP-hidden (`opacity: 0` pre-JS) elements need a no-JS or animation-failure fallback to visible.
- Keyboard focus states are never suppressed by custom cursor or hover-only interaction patterns (and per [DESIGN_REFERENCES.md](DESIGN_REFERENCES.md), custom cursor followers are rejected sitewide anyway).
- Autoplay video hero: muted by default, pausable, no flashing/strobing content.

## What we explicitly do not build

Per the cross-site synthesis in [DESIGN_REFERENCES.md](DESIGN_REFERENCES.md#cross-site-synthesis-used-to-write-design_languagemd-and-animation_guidelinesmd): custom cursor followers, full AJAX page-transition systems (Barba.js-style), `mix-blend-mode: difference` as a legibility mechanism, blanket image-hover-zoom on non-gallery elements, deep multi-level mega-nav motion.
