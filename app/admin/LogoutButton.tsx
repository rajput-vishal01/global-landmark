"use client";

import { useActionState } from "react";
import { deskLinkButton } from "@/components/admin/desk";
import { logout } from "./login/actions";

export function LogoutButton() {
  const [, formAction, isPending] = useActionState(logout, undefined);

  return (
    <form action={formAction}>
      <button
        type="submit"
        disabled={isPending}
        className={`${deskLinkButton} disabled:cursor-wait disabled:opacity-60`}
      >
        {isPending ? "Logging out..." : "Log out"}
      </button>
    </form>
  );
}
