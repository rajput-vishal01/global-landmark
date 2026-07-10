import Image from "next/image";
import Link from "next/link";
import { type Listing } from "@/lib/listings";

export function ListingCard({
  listing,
  className = "",
  sizes = "(min-width: 1024px) 30vw, (min-width: 768px) 42vw, 100vw",
}: {
  listing: Listing;
  className?: string;
  sizes?: string;
}) {
  return (
    <Link href={listing.href} className={`group flex flex-col gap-4 ${className}`}>
      <div className="relative aspect-[4/5] overflow-hidden bg-ink/5">
        <Image
          src={listing.image}
          alt={listing.title}
          fill
          sizes={sizes}
          className="object-cover transition-transform duration-[1400ms] ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:scale-[1.05]"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <h3 className="font-serif text-h4 text-ink">{listing.title}</h3>
        <p className="text-meta font-sans text-ink-muted">{listing.location}</p>
        <div className="mt-1 flex flex-wrap items-baseline justify-between gap-2">
          <span className="text-body font-sans font-medium text-gold-deep">
            {listing.price}
          </span>
          <span className="text-meta font-sans text-ink-muted">
            {listing.beds} Bd · {listing.baths} Ba · {listing.sqft} Sq Ft
          </span>
        </div>
      </div>
    </Link>
  );
}
