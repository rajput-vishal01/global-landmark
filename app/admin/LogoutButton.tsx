"use client";

import { useActionForm } from "@/lib/use-action-form";
import { deskLinkButton } from "@/components/admin/desk";
import { logout } from "./login/actions";

export function LogoutButton() {
  const { isPending, formProps } = useActionForm(logout, undefined);

  return (
    <form {...formProps}>
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
