"use client";

import { useActionState } from "react";
import { Req } from "@/components/ui/RequiredMark";
import { deskButtonPrimary, deskField } from "@/components/admin/desk";
import { login, type LoginState } from "./actions";

const initialState: LoginState = {};

export function LoginForm() {
  const [state, formAction, isPending] = useActionState(login, initialState);

  return (
    <form action={formAction} className="mt-5 flex flex-col gap-2">
      <label
        htmlFor="password"
        className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted"
      >
        Password
        <Req />
      </label>
      <input
        id="password"
        name="password"
        type="password"
        required
        autoComplete="current-password"
        className={`${deskField} w-full`}
      />
      {state.error && (
        <p role="alert" className="text-[12px] text-error">
          {state.error}
        </p>
      )}
      <button
        type="submit"
        disabled={isPending}
        className={`${deskButtonPrimary} mt-3 w-full justify-center disabled:cursor-wait disabled:opacity-60`}
      >
        {isPending ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}
