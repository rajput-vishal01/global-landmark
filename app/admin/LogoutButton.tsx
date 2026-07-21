"use client";

import { useActionState } from "react";
import { logout } from "./login/actions";

export function LogoutButton() {
  const [, formAction, isPending] = useActionState(logout, undefined);

  return (
    <form action={formAction}>
      <button
        type="submit"
        disabled={isPending}
        className="text-eyebrow cursor-pointer font-sans font-medium uppercase tracking-[0.18em] text-gold-deep transition-colors hover:text-ink disabled:opacity-60"
      >
        {isPending ? "Logging out..." : "Log out"}
      </button>
    </form>
  );
}
