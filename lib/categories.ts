// User-facing labels for the four hero/portfolio categories.
export const CATEGORIES = [
  { value: "sale", label: "Sale" },
  { value: "purchase", label: "Purchase" },
  { value: "lease", label: "Lease" },
  { value: "invest", label: "Invest" },
] as const;

export type CategoryValue = (typeof CATEGORIES)[number]["value"];

export function isCategory(value: string): value is CategoryValue {
  return CATEGORIES.some((c) => c.value === value);
}

export function categoryLabel(value: CategoryValue): string {
  return CATEGORIES.find((c) => c.value === value)?.label ?? value;
}
