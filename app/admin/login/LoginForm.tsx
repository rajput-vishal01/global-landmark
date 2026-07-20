"use client";

import { useActionState, useEffect } from "react";
import { login, type LoginState } from "./actions";

const initialState: LoginState = {};

export function LoginForm() {
  const [state, formAction, isPending] = useActionState(login, initialState);

  // Hard navigation so the request passes through the proxy's host rewrite.
  useEffect(() => {
    if (state.success) window.location.replace("/");
  }, [state.success]);

  return (
    <form action={formAction} className="mt-6 flex flex-col gap-5">
      <label
        htmlFor="password"
        className="text-eyebrow font-sans font-medium uppercase tracking-[0.15em] text-ink"
      >
        Password
      </label>
      <input
        id="password"
        name="password"
        type="password"
        required
        autoComplete="current-password"
        className="w-full appearance-none rounded-none border-b border-border bg-transparent py-3 font-sans text-body text-ink focus:border-gold focus:outline-none"
      />
      {state.error && (
        <p role="alert" className="text-meta font-sans text-[#9a2b2b]">
          {state.error}
        </p>
      )}
      <button
        type="submit"
        disabled={isPending}
        className="mt-2 w-fit cursor-pointer bg-ink px-8 py-3.5 text-eyebrow font-sans font-medium uppercase tracking-[0.22em] text-cream transition-opacity hover:opacity-90 disabled:cursor-wait disabled:opacity-60"
      >
        {isPending || state.success ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}
