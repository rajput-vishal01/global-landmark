"use client";

import { useMounted } from "@/lib/hooks";
import { requestInstall, runInstall, useCanOfferInstall, useInstallEvent } from "@/lib/install";

/**
 * A standing way to install, for anyone who dismissed the timed card or
 * decided later. Renders nothing unless this browser can actually do it,
 * so it never becomes a button that explains why it cannot work.
 *
 * On Chrome/Edge/Android it opens the real dialog straight away — someone
 * who clicks "Install app" does not need the card's pitch first. On iOS
 * there is no API, so it opens the card, which carries the Share → Add to
 * Home Screen steps.
 */
export function InstallButton({
  className = "",
  label = "Install app",
  onAction,
}: {
  className?: string;
  label?: string;
  /** Run after the click — the menu uses it to close, since the card it
      may open is behind the fullscreen overlay. */
  onAction?: () => void;
}) {
  const mounted = useMounted();
  const event = useInstallEvent();
  const canOffer = useCanOfferInstall();

  // Not before mount: the answer depends on browser APIs the server
  // cannot know, and guessing produces a hydration mismatch.
  if (!mounted || !canOffer) return null;

  return (
    <button
      type="button"
      onClick={() => {
        if (event) runInstall();
        else requestInstall();
        onAction?.();
      }}
      className={`flex cursor-pointer items-center gap-2 transition-colors duration-300 ${className}`}
    >
      <svg
        aria-hidden
        width="15"
        height="15"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="shrink-0"
      >
        <path d="M12 3v12" />
        <path d="m7.5 10.5 4.5 4.5 4.5-4.5" />
        <path d="M4 17.5V19a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-1.5" />
      </svg>
      {label}
    </button>
  );
}
