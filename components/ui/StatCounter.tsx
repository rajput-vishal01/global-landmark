"use client";

import { useRef } from "react";
import { useGSAP, gsap } from "@/lib/gsap";

export function StatCounter({
  value,
  prefix = "",
  suffix = "",
  label,
  tone = "light",
}: {
  value: number;
  prefix?: string;
  suffix?: string;
  label: string;
  tone?: "light" | "dark";
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const decimals = Number.isInteger(value) ? 0 : 1;

  useGSAP(() => {
    if (!ref.current) return;
    const counter = { value: 0 };
    gsap.to(counter, {
      value,
      duration: 1.8,
      ease: "power2.out",
      scrollTrigger: { trigger: ref.current, start: "top 85%", once: true },
      onUpdate: () => {
        if (ref.current) ref.current.textContent = counter.value.toFixed(decimals);
      },
    });
  }, []);

  const numberTone = tone === "dark" ? "text-cream" : "text-ink";
  const labelTone = tone === "dark" ? "text-cream/60" : "text-ink-muted";

  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <p className={`font-serif text-[clamp(2.5rem,4.5vw,4.5rem)] leading-none ${numberTone}`}>
        {prefix}
        <span ref={ref}>0</span>
        {suffix}
      </p>
      <p className={`text-eyebrow font-sans font-medium uppercase tracking-[0.18em] ${labelTone}`}>
        {label}
      </p>
    </div>
  );
}
