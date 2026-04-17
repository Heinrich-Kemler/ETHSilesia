"use client";

/**
 * Theme hook — backed by localStorage + the `data-theme` attribute on
 * <html>. Uses useSyncExternalStore so every consumer stays in sync
 * without a setState-in-effect cascade (React 19 purity rule).
 *
 * The initial DOM attribute is set by an inline <script> in the root
 * layout (prevents FOUC on first paint). Once the user toggles, the
 * writer below keeps both localStorage and the DOM in sync.
 */

import { useCallback, useSyncExternalStore } from "react";

export type Theme = "dark" | "light";

const STORAGE_KEY = "skarbnik-theme";

const listeners = new Set<() => void>();

function subscribe(cb: () => void): () => void {
  listeners.add(cb);
  window.addEventListener("storage", cb);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", cb);
  };
}

function getSnapshot(): Theme {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored === "light" || stored === "dark" ? stored : "dark";
}

function getServerSnapshot(): Theme {
  return "dark";
}

function writeTheme(theme: Theme): void {
  localStorage.setItem(STORAGE_KEY, theme);
  document.documentElement.setAttribute("data-theme", theme);
  listeners.forEach((cb) => cb());
}

export function useTheme() {
  const theme = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot
  );

  const setTheme = useCallback((t: Theme) => {
    writeTheme(t);
  }, []);

  const toggle = useCallback(() => {
    writeTheme(getSnapshot() === "dark" ? "light" : "dark");
  }, []);

  return { theme, setTheme, toggle };
}
