"use client";

/**
 * Pure hook: reflects `?demo=true` presence in the URL. Uses
 * useSyncExternalStore so the value is derived synchronously during
 * render — no setState-in-effect cascade (React 19 purity rule).
 */

import { useSyncExternalStore } from "react";

function subscribe(cb: () => void): () => void {
  // React to history changes and (rarely) manual hashchange edits.
  window.addEventListener("popstate", cb);
  window.addEventListener("hashchange", cb);
  return () => {
    window.removeEventListener("popstate", cb);
    window.removeEventListener("hashchange", cb);
  };
}

function getSnapshot(): boolean {
  const params = new URLSearchParams(window.location.search);
  return params.get("demo") === "true";
}

function getServerSnapshot(): boolean {
  return false;
}

export function useDemoMode(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
