import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <main className="flex min-h-[100dvh] flex-col items-center justify-center bg-dark-deep px-5 text-center">
      <span aria-hidden className="mb-10 block h-px w-16 bg-gold" />
      <p className="text-eyebrow font-sans font-medium uppercase tracking-[0.3em] text-cream/50">
        404
      </p>
      <h1 className="mt-4 max-w-2xl text-balance font-serif text-h1 uppercase tracking-[0.04em] text-cream">
        This address does not exist
      </h1>
      <p className="mt-6 max-w-md text-pretty text-body font-sans text-cream/70">
        The page you are looking for has been moved, sold, or never listed.
      </p>
      <div className="mt-10">
        <Button href="/" variant="outline" tone="dark">
          Return Home
        </Button>
      </div>
      <Link
        href="/properties"
        className="mt-6 text-meta font-sans text-cream/50 underline decoration-cream/30 underline-offset-4 transition-colors hover:text-cream"
      >
        Or browse the current listings
      </Link>
    </main>
  );
}
