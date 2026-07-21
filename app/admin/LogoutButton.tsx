"use client";

import { useActionState, useEffect } from "react";
import { logout, type LogoutState } from "./login/actions";

const initialState: LogoutState = {};

export function LogoutButton() {
  const [state, formAction, isPending] = useActionState(logout, initialState);

  // Hard navigation so the request passes through the proxy's host rewrite.
  useEffect(() => {
    if (state.done) window.location.replace("/admin/login");
  }, [state.done]);

  return (
    <form action={formAction}>
      <button
        type="submit"
        disabled={isPending}
        className="text-eyebrow cursor-pointer font-sans font-medium uppercase tracking-[0.18em] text-gold-deep transition-colors hover:text-ink disabled:opacity-60"
      >
        {isPending || state.done ? "Logging out..." : "Log out"}
      </button>
    </form>
  );
}
