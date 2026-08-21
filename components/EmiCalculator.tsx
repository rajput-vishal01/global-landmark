"use client";

import { useState } from "react";
import { computeEmi, seedLoanAmount, EMI_DEFAULTS } from "@/lib/emi";
import { formatIndianShort, formatRupees } from "@/lib/attributes";

/**
 * EMI / loan calculator (R-41) — three sliders, one number.
 *
 * Client-side only, by design: nothing typed here is submitted, logged or
 * persisted, so a visitor can play with their real budget without it
 * becoming a lead. Native <input type="range"> rather than a slider
 * dependency — it is keyboard-accessible and screen-reader-labelled for free.
 */
export function EmiCalculator({ publicPrice }: { publicPrice: number | null }) {
  const [loan, setLoan] = useState(() => seedLoanAmount(publicPrice));
  const [rate, setRate] = useState<number>(EMI_DEFAULTS.ratePercent);
  const [years, setYears] = useState<number>(EMI_DEFAULTS.tenureYears);

  const { monthly, totalInterest, totalPayable } = computeEmi(loan, rate, years);

  return (
    <div className="max-w-2xl border border-border bg-white p-8 md:p-10">
      <div className="grid grid-cols-1 gap-10 md:grid-cols-[1fr_auto] md:items-start md:gap-14">
        <div className="flex flex-col gap-7">
          <Slider
            id="emi-loan"
            label="Loan Amount"
            value={formatIndianShort(loan)}
            min={EMI_DEFAULTS.minLoan}
            max={EMI_DEFAULTS.maxLoan}
            step={EMI_DEFAULTS.step}
            number={loan}
            onChange={setLoan}
          />
          <Slider
            id="emi-rate"
            label="Interest Rate"
            value={`${rate.toFixed(2)}% p.a.`}
            min={5}
            max={15}
            step={0.05}
            number={rate}
            onChange={setRate}
          />
          <Slider
            id="emi-years"
            label="Tenure"
            value={`${years} ${years === 1 ? "year" : "years"}`}
            min={1}
            max={30}
            step={1}
            number={years}
            onChange={setYears}
          />
        </div>

        {/* aria-live: the figure changes as the sliders move, and a screen
            reader following the slider alone would never hear the result. */}
        <div
          aria-live="polite"
          className="border-t border-border pt-7 md:min-w-52 md:border-l md:border-t-0 md:pl-14 md:pt-0"
        >
          <span className="text-eyebrow block font-sans font-medium uppercase tracking-[0.2em] text-ink-muted">
            Monthly EMI
          </span>
          <p className="mt-2 font-serif text-h3 text-ink">{formatRupees(monthly)}</p>
          <dl className="mt-6 flex flex-col gap-3">
            <div className="flex items-baseline justify-between gap-6 border-t border-border pt-3">
              <dt className="text-eyebrow font-sans font-medium uppercase tracking-[0.15em] text-ink-muted">
                Interest
              </dt>
              <dd className="font-sans text-meta text-ink">
                {formatIndianShort(totalInterest)}
              </dd>
            </div>
            <div className="flex items-baseline justify-between gap-6 border-t border-border pt-3">
              <dt className="text-eyebrow font-sans font-medium uppercase tracking-[0.15em] text-ink-muted">
                Total Payable
              </dt>
              <dd className="font-sans text-meta text-ink">
                {formatIndianShort(totalPayable)}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      <p className="mt-8 border-t border-border pt-5 text-pretty text-meta font-sans leading-relaxed text-ink-muted">
        An indicative figure only — your sanctioned rate, tenure and eligibility
        are set by the lender. Speak with us and we will introduce you to the
        banks on panel.
      </p>
    </div>
  );
}

function Slider({
  id,
  label,
  value,
  min,
  max,
  step,
  number,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  min: number;
  max: number;
  step: number;
  number: number;
  onChange: (n: number) => void;
}) {
  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-baseline justify-between gap-4">
        <label
          htmlFor={id}
          className="text-eyebrow font-sans font-medium uppercase tracking-[0.15em] text-ink-muted"
        >
          {label}
        </label>
        <span className="font-sans text-body font-medium text-ink">{value}</span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={number}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-1 w-full cursor-pointer appearance-none rounded-none bg-border accent-gold"
      />
    </div>
  );
}
