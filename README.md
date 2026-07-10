# Global Landmark Realty Group

Luxury real-estate marketing site. Next.js 16 (App Router), Tailwind v4,
GSAP (ScrollTrigger + SplitText), Framer Motion, Lenis smooth scroll.

```bash
npm install
npm run dev   # http://localhost:3000
```

Project context and design decisions live in [CLAUDE.md](CLAUDE.md) and the
docs it links (brand, design language, animation guidelines, tasks).

- `app/` — routes, root layout (fonts, Lenis, global scroll engine)
- `components/sections/` — page sections (Hero, FeaturedListings, ...)
- `components/ui/` — primitives (Button, Magnetic, ParallaxImage, StatCounter)
- `lib/gsap.ts` — GSAP plugin registration + shared easing
