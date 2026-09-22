"use client";

import {
  startTransition,
  useActionState,
  useEffect,
  useRef,
  type FormEvent,
} from "react";

/**
 * The one way a form in this app submits to a server action.
 *
 * Why it exists. React 19 resets a `<form action={dispatch}>` to its default
 * values every time the action returns — including when it returns a
 * validation error. That shipped as two real bugs on the property form: the
 * broker lost everything they had typed on any error, and the reset also
 * emptied the hidden id that autosave had written, so the retry INSERTED a
 * second copy of the listing. Every other `useActionState` form here had the
 * same first bug waiting.
 *
 * What it does instead. It submits through `onSubmit` + `startTransition`,
 * which React does not auto-reset, so:
 *
 *   - on an error, every field keeps what the user typed;
 *   - on success, the form resets only when `resetOnSuccess` is set — for the
 *     few forms that stay on screen to take another entry (Add payment).
 *     Forms that redirect or swap in a thank-you screen leave it
 *     off, since they are gone anyway.
 *
 * The browser's own `required` / `type="email"` checks still run first: the
 * submit event only fires once the form is natively valid.
 *
 * scripts/check-forms.mjs fails the build if a `useActionState` dispatcher is
 * wired straight to `<form action>` again, so this cannot quietly regress.
 */

/** The two result shapes our actions return: admin `{ error }`, public `{ status: "error" }`. */
export function formFailed(state: unknown): boolean {
  if (!state || typeof state !== "object") return false;
  const s = state as { error?: unknown; status?: unknown };
  return Boolean(s.error) || s.status === "error";
}

type FormAction<S> = (state: Awaited<S>, formData: FormData) => S | Promise<S>;

export function useActionForm<S>(
  action: FormAction<S>,
  initialState: Awaited<S>,
  options: {
    /** Clear the form after a successful submit. For forms that stay on screen. */
    resetOnSuccess?: boolean;
    /** Runs once after a successful submit from this form — never after an error. */
    onSuccess?: (state: Awaited<S>) => void;
    /**
     * Awaited before the form is read — e.g. an autosave still on the wire,
     * whose response writes the row id into the form.
     */
    beforeSubmit?: () => Promise<unknown> | null | undefined;
  } = {}
) {
  const [state, dispatch, isPending] = useActionState(action, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  // Set when this form dispatched, cleared once its result has been handled —
  // so a success reset only ever follows a submit from this form.
  const awaitingResult = useRef(false);
  const { resetOnSuccess = false, beforeSubmit, onSuccess } = options;

  useEffect(() => {
    if (!awaitingResult.current || isPending) return;
    awaitingResult.current = false;
    if (formFailed(state)) return;
    if (resetOnSuccess) formRef.current?.reset();
    onSuccess?.(state);
    // onSuccess is often an inline arrow, so this effect re-runs on most
    // renders — harmless, because awaitingResult lets it act once per submit.
  }, [state, isPending, resetOnSuccess, onSuccess]);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isPending) return;
    const form = event.currentTarget;
    const submitter = (event.nativeEvent as SubmitEvent).submitter;

    const send = () => {
      // Read after beforeSubmit settles, so anything it wrote is included.
      const formData = new FormData(form, submitter);
      awaitingResult.current = true;
      startTransition(() => dispatch(formData));
    };

    const waitFor = beforeSubmit?.();
    if (waitFor) void waitFor.catch(() => undefined).then(send);
    else send();
  }

  return {
    state,
    isPending,
    formRef,
    // `action` stays on the form for the moment BEFORE hydration: React renders
    // a server-action form as a real POST, so a submit that lands before the
    // JavaScript has loaded (a slow phone, a fast tap) still reaches the
    // server. Without it the browser falls back to a GET and puts every field
    // — phone numbers, emails — in the URL, the history and the access log.
    // Once hydrated, onSubmit's preventDefault() tells React to skip the
    // action, and the submit goes through startTransition above instead, which
    // is what avoids the reset.
    formProps: { ref: formRef, action: dispatch, onSubmit },
  } as const;
}
