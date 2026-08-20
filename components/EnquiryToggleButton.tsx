"use client";

import { useEnquiryCart, type EnquiryCartItem } from "@/lib/enquiry-cart";

/**
 * "Add to enquiry" toggle (R-05) — a small client island so the server-
 * rendered ListingCard / property detail page don't need "use client" just
 * for this one button. Caller supplies layout/visual classes; toggled state
 * (border) is added on top.
 */
export function EnquiryToggleButton({
  item,
  className = "",
}: {
  item: EnquiryCartItem;
  className?: string;
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

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={!inCart && isFull}
      aria-pressed={inCart}
      title={!inCart && isFull ? "Enquiry list is full (20)" : undefined}
      className={`${className} ${inCart ? "border border-gold" : ""} disabled:cursor-not-allowed disabled:opacity-50`}
    >
      {inCart ? "Added ✓" : "Add to Enquiry"}
    </button>
  );
}
