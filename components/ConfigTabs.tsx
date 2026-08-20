import Link from "next/link";
import { CONFIGURATIONS } from "@/lib/attributes";
import { propertiesHref, type PropertiesFilterParams } from "@/lib/properties-url";

/**
 * R-09 — configuration as clickable tabs (1-5 BHK, 2+1, Duplex, ...) rather
 * than a dropdown. Server-rendered like the category chip row above it: no
 * client JS needed, and it composes with every other filter via `current`.
 */
export function ConfigTabs({
  configuration,
  current,
}: {
  configuration?: string;
  current: PropertiesFilterParams;
}) {
  const tabs: { value: string | undefined; label: string }[] = [
    { value: undefined, label: "Any configuration" },
    ...CONFIGURATIONS.map((c) => ({ value: c as string | undefined, label: c })),
  ];

  return (
    <nav
      aria-label="Filter by configuration"
      className="flex flex-wrap items-center gap-x-6 gap-y-3"
    >
      <span className="text-eyebrow font-sans font-medium uppercase tracking-[0.2em] text-ink-muted">
        Configuration
      </span>
      {tabs.map((tab) => {
        const isActive = tab.value ? tab.value === configuration : !configuration;
        return (
          <Link
            key={tab.label}
            href={propertiesHref(current, { configuration: tab.value })}
            aria-current={isActive ? "page" : undefined}
            className={`text-eyebrow relative pb-1 font-sans font-medium uppercase tracking-[0.15em] transition-colors duration-300 ${
              isActive ? "text-ink" : "text-ink-muted hover:text-ink"
            }`}
          >
            {tab.label}
            <span
              aria-hidden
              className={`absolute bottom-0 left-0 h-px w-full origin-left bg-gold transition-transform duration-500 ease-out ${
                isActive ? "scale-x-100" : "scale-x-0"
              }`}
            />
          </Link>
        );
      })}
    </nav>
  );
}
