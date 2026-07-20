import { COMPANY } from "@/lib/data";

export default function Loading() {
  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center gap-6 bg-cream">
      <p className="animate-pulse font-serif text-xl uppercase tracking-[0.25em] text-ink">
        {COMPANY.name}
      </p>
      <span aria-hidden className="loading-rule block h-px w-24 bg-gold" />
      <span className="sr-only">Loading</span>
    </div>
  );
}
