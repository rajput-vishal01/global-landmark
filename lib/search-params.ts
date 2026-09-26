/**
 * A repeated query key (`?q=a&q=b`) reaches a page as an array, and every
 * page here reads its filters as single strings — `.trim()` on the array
 * threw, and a crafted link turned into a 500. Taking the first value is what
 * URLSearchParams.get() would have done.
 */
export function firstValues(
  params: Record<string, string | string[] | undefined>
): Record<string, string | undefined> {
  return Object.fromEntries(
    Object.entries(params).map(([key, value]) => [key, Array.isArray(value) ? value[0] : value])
  );
}
