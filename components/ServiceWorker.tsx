"use client";

import { useEffect } from "react";

/**
 * Registers the service worker after the page has loaded.
 *
 * Registration is deferred to the `load` event on purpose: installing a
 * worker competes for bandwidth with the hero image, and on a phone that is
 * the difference between a fast first paint and a slow one. Nothing on the
 * site depends on the worker being ready, so it can wait.
 *
 * Dev is skipped — a service worker caching a dev bundle produces
 * stale-asset confusion that looks exactly like a code bug.
 */
export function ServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;

    const register = () => {
      navigator.serviceWorker.register("/sw.js").catch((err) => {
        // A failed registration costs installability, not the site.
        console.error("Service worker registration failed:", err);
      });
    };

    if (document.readyState === "complete") {
      register();
      return;
    }
    window.addEventListener("load", register);
    return () => window.removeEventListener("load", register);
  }, []);

  return null;
}
