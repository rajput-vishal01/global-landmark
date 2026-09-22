"use client";

import { useEnquiryCart, type EnquiryCartItem } from "@/lib/enquiry-cart";

/**
 * "Add to enquiry" toggle (R-05) — a small client island so the server-
 * rendered ListingCard / property detail page don't need "use client" just
 * for this one button. Caller supplies layout/visual classes.
 *
 * `icon` renders a round bookmark-plus / check glyph instead of the words,
 * for the listing card, where a text button competed with the photograph.
 * The words move to aria-label and a tooltip, so nothing is lost to a
 * screen reader.
 */
export function EnquiryToggleButton({
  item,
  className = "",
  icon = false,
}: {
  item: EnquiryCartItem;
  className?: string;
  icon?: boolean;
}) {
  const { has, add, remove, isFull } = useEnquiryCart();
  const inCart = has(item.id);

  function handleClick(e: React.MouseEvent) {
    // The card wraps this button in a <Link> — never let the click navigate.
    e.preventDefault();
    e.stopPropagation();
    if (inCart) remove(item.id);
    else add(item);
  }

  const label = inCart ? "Remove from enquiry" : "Add to enquiry";

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={!inCart && isFull}
      aria-pressed={inCart}
      aria-label={icon ? label : undefined}
      title={!inCart && isFull ? "Enquiry list is full (20)" : icon ? label : undefined}
      className={`${className} ${inCart && !icon ? "border border-gold" : ""} disabled:cursor-not-allowed disabled:opacity-50`}
    >
      {icon ? (
        inCart ? (
          <svg aria-hidden width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 12.5l4.5 4.5L19 7.5" />
          </svg>
        ) : (
          <svg aria-hidden width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M6 3h12v18l-6-4-6 4V3Z" />
            <path d="M12 7v6M9 10h6" />
          </svg>
        )
      ) : inCart ? (
        "Added ✓"
      ) : (
        "Add to Enquiry"
      )}
    </button>
  );
}
