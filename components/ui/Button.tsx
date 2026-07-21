import Link from "next/link";
import { type ReactNode } from "react";

type ButtonProps = {
  href: string;
  children: ReactNode;
  variant?: "underline" | "outline" | "corner";
  tone?: "light" | "dark";
};

/**
 * Quiet CTAs. `underline` is the default text link. `outline` is a thin
 * bordered box. `corner` draws gold L-corners that expand to a full frame
 * on hover (sobharealty-style signature).
 */
export function Button({
  href,
  children,
  variant = "underline",
  tone = "light",
}: ButtonProps) {
  if (variant === "corner") {
    const text = tone === "dark" ? "text-cream" : "text-ink";
    return (
      <Link
        href={href}
        className={`group relative inline-flex items-center px-10 py-5 text-eyebrow font-sans font-medium uppercase tracking-[0.22em] ${text}`}
      >
        <span
          aria-hidden
          className="absolute left-0 top-0 h-3 w-3 border-l border-t border-gold transition-all duration-500 ease-out group-hover:h-full group-hover:w-full"
        />
        <span
          aria-hidden
          className="absolute bottom-0 right-0 h-3 w-3 border-b border-r border-gold transition-all duration-500 ease-out group-hover:h-full group-hover:w-full"
        />
        {children}
      </Link>
    );
  }

  if (variant === "outline") {
    const toneClasses =
      tone === "dark"
        ? "border-cream/30 text-cream hover:border-gold"
        : "border-ink/25 text-ink hover:border-gold";
    return (
      <Link
        href={href}
        className={`text-eyebrow inline-flex items-center border px-7 py-3.5 font-sans font-medium uppercase tracking-[0.18em] transition-colors duration-300 ${toneClasses}`}
      >
        {children}
      </Link>
    );
  }

  const textTone = tone === "dark" ? "text-cream" : "text-ink";
  return (
    <Link
      href={href}
      className={`group text-eyebrow inline-flex w-fit items-center font-sans font-medium uppercase tracking-[0.18em] ${textTone}`}
    >
      <span className="relative pb-1">
        {children}
        <span className="absolute bottom-0 left-0 h-px w-full origin-left scale-x-100 bg-gold transition-transform duration-500 ease-out group-hover:scale-x-0" />
        <span className="absolute bottom-0 right-0 h-px w-full origin-right scale-x-0 bg-gold transition-transform duration-500 ease-out group-hover:scale-x-100" />
      </span>
    </Link>
  );
}
