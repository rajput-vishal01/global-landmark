"use client";

import { useRef } from "react";
import Image from "next/image";
import { useGSAP, gsap } from "@/lib/gsap";

/**
 * Scroll-scrubbed parallax image: the image is oversized inside an
 * overflow-hidden frame and drifts vertically as the frame crosses the
 * viewport. Static for reduced-motion users.
 */
export function ParallaxImage({
  src,
  alt,
  sizes,
  className = "",
}: {
  src: string;
  alt: string;
  sizes: string;
  className?: string;
}) {
  const frame = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.fromTo(
          ".parallax-img",
          { yPercent: -8 },
          {
            yPercent: 8,
            ease: "none",
            scrollTrigger: {
              trigger: frame.current,
              start: "top bottom",
              end: "bottom top",
              scrub: true,
            },
          }
        );
      });
    },
    { scope: frame }
  );

  return (
    <div ref={frame} className={`relative overflow-hidden ${className}`}>
      <div className="parallax-img absolute -inset-y-[10%] inset-x-0">
        <Image src={src} alt={alt} fill sizes={sizes} className="object-cover" />
      </div>
    </div>
  );
}
