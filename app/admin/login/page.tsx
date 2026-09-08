import type { Metadata } from "next";
import { COMPANY } from "@/lib/data";
import { Card, deskFace } from "@/components/admin/desk";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Sign in" };

/**
 * One card on the cream ground.
 *
 * Not a desk screen: there is no rail, because there is nothing yet to
 * navigate to. The wordmark sits above the card so the page still says which
 * product this is before it asks for anything — the rail's job, done in the
 * one place the rail cannot reach.
 *
 * The desk type scale is scoped to `.admin-panel`, which this route is outside
 * of, so sizes here are written out rather than borrowed from `text-body` and
 * friends — those would resolve to the public site's editorial sizing.
 */
export default function AdminLoginPage() {
  return (
    <div className="flex min-h-dvh items-center justify-center p-5">
      <div className="w-full max-w-[380px]">
        <div className="mb-5 px-1">
          <p className={`${deskFace} text-[19px] font-bold tracking-[0.01em] text-ink`}>
            {COMPANY.name}
          </p>
          <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
            Admin
          </p>
        </div>

        {/* Card brings its own padding; overriding it here would be two
            equal-specificity utilities settled by emission order. */}
        <Card>
          <h1 className={`${deskFace} text-[17px] font-bold text-ink`}>Admin access</h1>
          <p className="mt-1.5 text-[13px] text-muted">Enter the panel password to continue.</p>
          <LoginForm />
        </Card>
      </div>
    </div>
  );
}
