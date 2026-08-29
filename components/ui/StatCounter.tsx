/**
 * A single credibility figure.
 *
 * This used to count up from zero when it scrolled into view. Phase A
 * removed that, which fixed a real bug as well as reducing motion: the
 * markup rendered a literal `0` and relied on GSAP to replace it, so any
 * visitor whose scroll trigger had not fired — and every crawler, and every
 * reduced-motion user — was shown "₹0 Cr+" as the headline claim on the
 * live site. The number is now simply rendered.
 *
 * No hooks left, so this is a server component.
 */
export function StatCounter({
  value,
  prefix = "",
  suffix = "",
  label,
}: {
  value: number;
  prefix?: string;
  suffix?: string;
  label: string;
}) {
  const decimals = Number.isInteger(value) ? 0 : 1;

  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <p className="font-serif text-[clamp(2.5rem,4.5vw,4.5rem)] leading-none text-ink">
        {prefix}
        {value.toFixed(decimals)}
        {suffix}
      </p>
      <p className="text-eyebrow font-sans font-medium uppercase tracking-[0.18em] text-ink-muted">
        {label}
      </p>
    </div>
  );
}
