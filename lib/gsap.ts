"use client";

import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { SplitText } from "gsap/SplitText";

// ScrollTrigger was dropped in the Phase A motion cull. It backed every
// scroll-driven effect on the site (reveals, parallax, pinning, the
// horizontal listings hijack, the hide-on-scroll header); with those gone
// nothing imports it, and leaving it registered would keep shipping the
// plugin to every visitor for nothing. GSAP now covers exactly one thing:
// the hero's load-in, which runs once on mount and never on scroll.
gsap.registerPlugin(useGSAP, SplitText);

// docs/ANIMATION_GUIDELINES.md#easing--timing — one heavy ease reused site-wide
export const EASE_HEAVY = "power3.inOut";

export { gsap, useGSAP, SplitText };
