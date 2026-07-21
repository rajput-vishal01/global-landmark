"use client";

import { LazyMotion, domAnimation } from "framer-motion";

/**
 * App-wide LazyMotion: components animate via `m.*` (not `motion.*`), so
 * only the ~6KB entry ships in the shared bundle and the animation runtime
 * loads on demand. `strict` throws if a full `motion.*` import sneaks back.
 */
export function MotionProvider({ children }: { children: React.ReactNode }) {
  return (
    <LazyMotion features={domAnimation} strict>
      {children}
    </LazyMotion>
  );
}
