"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { animate, m, useMotionValue, useReducedMotion } from "framer-motion";
import type { TestimonialVideo } from "@/lib/db/schema";
import { VideoThumb } from "@/components/VideoThumb";
import { VideoLightbox } from "@/components/VideoTestimonials";

/**
 * EXPERIMENT (Sep 2026): the client's reels as a draggable 3D ring, after
 * lightswind's "3D Image Ring". On trial; may be reverted. To go back,
 * `git revert` the commit that added this file, or swap VideoRing for
 * VideoTestimonials in components/sections/Testimonials.tsx.
 *
 * Adapted rather than pasted: `m.*` under the app's LazyMotion strict (a
 * `motion.*` import throws), pointer events instead of separate mouse and
 * touch handlers, and each face is a real button that opens the same
 * lightbox as the reel rail. A drag longer than a few pixels is a spin,
 * not a click.
 *
 * ponytail: the upstream background-position parallax is left out. The
 * faces are <img> thumbnails (Instagram posters can fail and fall back to
 * a branded card), which background-image cannot do.
 */

/** Card i faces the viewer when the ring is at -i * angle, so 0 puts the first card in front. */
const START_ROTATION = 0;
/** Pixels of pointer travel before a press counts as a drag, not a click. */
const DRAG_SLOP = 6;
const DRAG_SENSITIVITY = 0.5;
/** Degrees per wheel pixel for trackpad swipes, and the pause before snapping to a card. */
const WHEEL_SENSITIVITY = 0.15;
const WHEEL_SETTLE_MS = 160;
/** Largest per-move velocity (degrees) that feeds the release spin. */
const MAX_FLICK = 10;
/** How far a release carries: velocity x this, so at most about two cards. */
const FLICK_CARRY = 6;

/** Width of the stage the ring sits in, tracked so the ring can fill it. */
function useStageWidth(ref: React.RefObject<HTMLDivElement | null>): number {
  const [width, setWidth] = useState(1200);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref]);
  return width;
}

/**
 * Ring diameter as a share of the stage. Over 1 because, seen from outside,
 * the far sides recede and project narrower than the diameter; 1.75 carries
 * the outermost cards to both edges of the stage (the overflow clips them).
 */
const RING_SPAN = 1.75;
/** Space between neighbouring cards, as a fraction of a card's width. */
const CARD_GAP = 0.18;
/**
 * Camera distance as a multiple of the radius. Lower = stronger depth: the
 * front card stays full size and the side cards shrink harder.
 */
const PERSPECTIVE = 1.8;

export function VideoRing({ videos }: { videos: TestimonialVideo[] }) {
  const [openVideo, setOpenVideo] = useState<TestimonialVideo | null>(null);
  const closeVideo = useCallback(() => setOpenVideo(null), []);
  const reduceMotion = useReducedMotion();

  const stageRef = useRef<HTMLDivElement>(null);
  const stageWidth = useStageWidth(stageRef);
  const cardWidth = stageWidth < 768 ? 150 : stageWidth < 1280 ? 210 : 250;
  const cardHeight = Math.round((cardWidth * 16) / 9);

  // The ring's diameter tracks the stage, so on a wide screen it spans the
  // full width instead of sitting as a small cluster in the middle. The
  // circle is then filled with cards: when there are fewer reels than
  // slots, the list repeats round the ring. Repeats are hidden from
  // assistive tech and the tab order; the originals are the real controls.
  const minRadius = cardWidth / (2 * Math.tan(Math.PI / Math.max(videos.length, 3))) + 24;
  const distance = Math.max(minRadius, (stageWidth * RING_SPAN) / 2);
  const slots = Math.floor((2 * Math.PI * distance) / (cardWidth * (1 + CARD_GAP)));
  const faces = Array.from(
    { length: Math.max(videos.length, slots) },
    (_, i) => ({ video: videos[i % videos.length], isRepeat: i >= videos.length })
  );
  const angle = 360 / faces.length;

  const rotation = useMotionValue(START_ROTATION);
  const drag = useRef({ active: false, lastX: 0, travelled: 0, velocity: 0 });

  /**
   * After a drag: carry on a little in the flick's direction, then glide onto
   * the nearest card. A plain eased tween rather than inertia physics, which
   * took seconds to come to rest and overshot by several cards.
   */
  const settle = useCallback(
    (velocity: number) => {
      const carried = rotation.get() + velocity * FLICK_CARRY;
      animate(rotation, Math.round(carried / angle) * angle, {
        duration: reduceMotion ? 0 : 0.7,
        ease: [0.23, 1, 0.32, 1],
      });
    },
    [rotation, angle, reduceMotion]
  );

  /** Turn the ring so card `index` faces the viewer, by the short way round. */
  const bringToFront = useCallback(
    (index: number) => {
      const current = rotation.get();
      const base = START_ROTATION - index * angle;
      const target = base + 360 * Math.round((current - base) / 360);
      rotation.stop();
      animate(rotation, target, { duration: reduceMotion ? 0 : 0.6, ease: [0.23, 1, 0.32, 1] });
    },
    [rotation, angle, reduceMotion]
  );

  // Trackpad two-finger swipes and Shift + mouse wheel arrive as horizontal
  // wheel events, not pointer drags. A mostly-vertical wheel is left alone
  // so the page still scrolls past the ring. Non-passive, because a
  // horizontal swipe must not also trigger the browser's back gesture.
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    let snapTimer: ReturnType<typeof setTimeout> | undefined;
    const onWheel = (e: WheelEvent) => {
      const dx = e.shiftKey && e.deltaX === 0 ? e.deltaY : e.deltaX;
      if (Math.abs(dx) <= Math.abs(e.shiftKey ? 0 : e.deltaY)) return;
      e.preventDefault();
      rotation.stop();
      // Swiping left moves the cards left, the same as dragging left.
      rotation.set(rotation.get() - dx * WHEEL_SENSITIVITY);
      clearTimeout(snapTimer);
      snapTimer = setTimeout(() => {
        const target = Math.round(rotation.get() / angle) * angle;
        animate(rotation, target, { duration: reduceMotion ? 0 : 0.45, ease: [0.23, 1, 0.32, 1] });
      }, WHEEL_SETTLE_MS);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      clearTimeout(snapTimer);
      el.removeEventListener("wheel", onWheel);
    };
  }, [rotation, angle, reduceMotion]);

  function onPointerDown(event: React.PointerEvent) {
    if (event.button !== 0) return;
    rotation.stop();
    drag.current = { active: true, lastX: event.clientX, travelled: 0, velocity: 0 };

    // Listeners on window, not pointer capture: capture would retarget the
    // click to the container and a tap on a card would never reach it.
    const move = (e: PointerEvent) => {
      const state = drag.current;
      if (!state.active) return;
      const dx = e.clientX - state.lastX;
      state.lastX = e.clientX;
      state.travelled += Math.abs(dx);
      // Seen from outside, a positive rotateY carries the front card to the
      // right, so the ring turns with the pointer at +dx.
      rotation.set(rotation.get() + dx * DRAG_SENSITIVITY);
      // Capped for the release spin only, so a hard flick carries a few
      // cards instead of whirling the ring round several times.
      state.velocity = Math.max(-MAX_FLICK, Math.min(MAX_FLICK, dx * DRAG_SENSITIVITY));
    };
    const up = () => {
      drag.current.active = false;
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
      if (drag.current.travelled > DRAG_SLOP) settle(drag.current.velocity);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
  }

  function step(direction: -1 | 1) {
    rotation.stop();
    const target = Math.round((rotation.get() + direction * angle) / angle) * angle;
    animate(rotation, target, { duration: reduceMotion ? 0 : 0.6, ease: [0.23, 1, 0.32, 1] });
  }

  return (
    <>
      <div
        ref={stageRef}
        onPointerDown={onPointerDown}
        // The browser's own drag-and-drop (of a thumbnail, or selected
        // text) swallows the pointer stream mid-drag and the ring stops.
        onDragStart={(e) => e.preventDefault()}
        // pan-y: a vertical swipe still scrolls the page on a phone; only a
        // sideways drag turns the ring.
        className="group/ring relative w-full cursor-grab select-none overflow-hidden active:cursor-grabbing [touch-action:pan-y]"
        style={{ height: cardHeight + 140 }}
        role="region"
        aria-roledescription="carousel"
        aria-label="Client video reels. Drag to turn."
      >
        <div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
          // Perspective scales with the ring so the depth reads the same at any width.
          style={{ perspective: distance * PERSPECTIVE, width: cardWidth, height: cardHeight }}
        >
          {/* Seen from OUTSIDE the ring: each card sits on the rim facing
              out, and the whole ring is pushed back by its radius, so the
              front card is at the screen plane (largest) and the rest
              shrink as they curve away. pointer-events-none on the ring so
              only the cards take clicks; they opt back in. */}
          <m.ul
            className="pointer-events-none absolute inset-0"
            style={{ transformStyle: "preserve-3d", z: -distance, rotateY: rotation }}
          >
            {faces.map(({ video, isRepeat }, index) => (
              <li
                key={`${video.id}-${index}`}
                aria-hidden={isRepeat || undefined}
                className="absolute inset-0"
                // Not preserve-3d: the card flattens into this one plane, so
                // backface-visibility hides the whole card once it turns away.
                style={{
                  backfaceVisibility: "hidden",
                  transform: `rotateY(${index * angle}deg) translateZ(${distance}px)`,
                }}
              >
                {/* Entrance on an inner wrapper: Framer writes its own
                    transform, which would replace the placement above. */}
                <m.div
                  className="h-full w-full"
                  initial={reduceMotion ? false : { y: 200, opacity: 0 }}
                  whileInView={{ y: 0, opacity: 1 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ delay: Math.min(index, 12) * 0.08, duration: 1.2, ease: [0.23, 1, 0.32, 1] }}
                >
                <button
                  type="button"
                  tabIndex={isRepeat ? -1 : undefined}
                  onClick={(e) => {
                    // detail 0 = keyboard activation, never the tail of a drag.
                    if (e.detail !== 0 && drag.current.travelled > DRAG_SLOP) return;
                    setOpenVideo(video);
                  }}
                  onFocus={(e) => {
                    // Keyboard focus only: a mouse press should not spin the ring.
                    if (e.currentTarget.matches(":focus-visible")) bringToFront(index);
                  }}
                  aria-label={`Play video${video.caption ? ` — ${video.caption}` : ""}`}
                  // Dimming lives here, not on the wrapper: Framer writes an
                  // inline opacity on the wrapper for its entrance.
                  className="pointer-events-auto group relative block h-full w-full cursor-pointer overflow-hidden bg-dark-deep transition-opacity duration-200 group-hover/ring:opacity-50 hover:!opacity-100 focus-visible:!opacity-100 shadow-[0_30px_60px_-25px_rgba(0,0,0,0.7)] ring-1 ring-gold/25 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold"
                >
                  <VideoThumb
                    provider={video.provider}
                    videoId={video.videoId}
                    className="pointer-events-none h-full w-full object-cover"
                  />
                  <span
                    aria-hidden
                    className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/5 to-black/20"
                  />
                  <span
                    aria-hidden
                    className="absolute left-1/2 top-1/2 flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-gold/70 bg-dark-deep/60 backdrop-blur-sm transition-transform duration-300 group-hover:scale-110"
                  >
                    <svg width="14" height="16" viewBox="0 0 18 20" fill="none" className="ml-0.5 text-cream">
                      <path d="M1 1.5v17L16.5 10 1 1.5Z" fill="currentColor" />
                    </svg>
                  </span>
                  {video.caption && (
                    <span className="absolute inset-x-0 bottom-0 p-3 text-left text-[12px] font-sans leading-snug text-cream md:p-4 md:text-meta">
                      {video.caption}
                    </span>
                  )}
                </button>
                </m.div>
              </li>
            ))}
          </m.ul>
        </div>
      </div>

      {/* Buttons as well as dragging: a mouse user may not guess the ring
          drags, and a keyboard user cannot drag at all. */}
      <div className="mt-2 flex justify-center gap-2">
        {(
          [
            [1, "Previous video", "M15 5l-7 7 7 7"],
            [-1, "Next video", "M9 5l7 7-7 7"],
          ] as const
        ).map(([direction, label, path]) => (
          <button
            key={label}
            type="button"
            onClick={() => step(direction)}
            aria-label={label}
            className="flex h-11 w-11 cursor-pointer items-center justify-center border border-cream/25 text-cream transition-colors duration-300 hover:border-cta hover:text-cta"
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d={path} />
            </svg>
          </button>
        ))}
      </div>

      <VideoLightbox video={openVideo} onClose={closeVideo} />
    </>
  );
}
