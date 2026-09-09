"use client";

import { useCallback, useEffect, useRef } from "react";

/**
 * Filter bars that apply themselves.
 *
 * Every filter on the panel is a GET form, which is what puts the state in the
 * URL — the back button works, a filtered list is a link you can send, and the
 * view survives the reload a row action triggers. That is worth keeping. What
 * is not worth keeping is the Apply button: picking a status and then having
 * to press a second control is a step nobody wants, and people forget it and
 * conclude the filter is broken.
 *
 * So the form still submits, it just submits itself.
 *
 * Dropdowns and checkboxes fire immediately — one deliberate choice, one
 * navigation. Typing is debounced, because submitting per keystroke would fire
 * a request and a re-render for every letter of "Malhotra" and steal focus on
 * each one.
 *
 * `requestSubmit`, not `submit`: the former runs validation and fires the
 * submit event the way a real button press does, and it is what keeps a
 * required field honest. Both are guarded on the ref because the form can
 * unmount while a debounce is still pending.
 */
export function useAutoSubmit(delay = 400) {
  const formRef = useRef<HTMLFormElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // A pending keystroke must not submit a form that has gone away — that is
  // the classic "setState after unmount" in its DOM form.
  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  /** For dropdowns, checkboxes and anything else chosen in one action. */
  const submitNow = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    formRef.current?.requestSubmit();
  }, []);

  /** For text inputs. Restarts the clock on every keystroke. */
  const submitSoon = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => formRef.current?.requestSubmit(), delay);
  }, [delay]);

  return { formRef, submitNow, submitSoon };
}
