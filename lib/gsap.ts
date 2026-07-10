"use client";

import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";

gsap.registerPlugin(useGSAP, ScrollTrigger, SplitText);

// ANIMATION_GUIDELINES.md#easing--timing — one heavy ease reused site-wide
export const EASE_HEAVY = "power3.inOut";

export { gsap, useGSAP, ScrollTrigger, SplitText };
