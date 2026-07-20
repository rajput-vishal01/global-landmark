import type { Metadata } from "next";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Sign in" };

export default function AdminLoginPage() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="w-full max-w-sm border border-border bg-white p-8 md:p-10">
        <span aria-hidden className="mb-6 block h-px w-12 bg-gold" />
        <h1 className="font-serif text-h3 text-ink">Admin access</h1>
        <p className="mt-2 text-meta font-sans text-ink-muted">
          Enter the panel password to continue.
        </p>
        <LoginForm />
      </div>
    </div>
  );
}
