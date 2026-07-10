"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-[100dvh] flex-col items-center justify-center bg-cream px-5 text-center">
      <span aria-hidden className="mb-10 block h-px w-16 bg-gold" />
      <h1 className="max-w-2xl text-balance font-serif text-h2 uppercase tracking-[0.04em] text-ink">
        Something went wrong
      </h1>
      <p className="mt-6 max-w-md text-pretty text-body font-sans text-ink-muted">
        An unexpected error interrupted the page. Trying again usually
        resolves it.
      </p>
      <button
        onClick={reset}
        className="text-eyebrow mt-10 inline-flex cursor-pointer items-center border border-ink/25 px-7 py-3.5 font-sans font-medium uppercase tracking-[0.18em] text-ink transition-colors duration-300 hover:border-gold active:scale-[0.98]"
      >
        Try Again
      </button>
    </main>
  );
}
