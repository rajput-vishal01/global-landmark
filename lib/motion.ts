/**
 * House Framer Motion easing — the site's signature decelerate curve.
 * (GSAP animations use their own eases in lib/gsap.ts; this file stays
 * GSAP-free so client components don't pull gsap into their bundle.)
 */
export const EASE = [0.23, 1, 0.32, 1] as const;
