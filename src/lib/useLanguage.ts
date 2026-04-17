"use client";

/**
 * Language hook — backed by localStorage, synchronised across every
 * consumer and tab via useSyncExternalStore. Replaces the older
 * useState + useEffect-read pattern that violated React 19's
 * `set-state-in-effect` rule.
 */

import { useCallback, useSyncExternalStore } from "react";
import type { Lang } from "./i18n";

const STORAGE_KEY = "skarbnik-lang";

/** Cross-hook listeners so same-tab writes trigger a re-render too. */
const listeners = new Set<() => void>();

function subscribe(cb: () => void): () => void {
  listeners.add(cb);
  window.addEventListener("storage", cb);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", cb);
  };
}

function getSnapshot(): Lang {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored === "en" ? "en" : "pl";
}

// Server render has no storage — default matches <html lang="pl">.
function getServerSnapshot(): Lang {
  return "pl";
}

function writeLang(lang: Lang): void {
  localStorage.setItem(STORAGE_KEY, lang);
  listeners.forEach((cb) => cb());
}

export function useLanguage() {
  const lang = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setLang = useCallback((l: Lang) => {
    writeLang(l);
  }, []);

  const toggle = useCallback(() => {
    writeLang(getSnapshot() === "pl" ? "en" : "pl");
  }, []);

  return { lang, setLang, toggle };
}
