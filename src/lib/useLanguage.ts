"use client";

/**
 * Language hook — Polish-only for the first release.
 *
 * The codebase still carries both PL and EN translation strings in
 * `i18n.ts` (deliberately — a future handover to the bank may re-enable
 * the toggle), but every consumer of this hook now gets `"pl"` back
 * regardless of localStorage. `setLang` and `toggle` are kept as no-ops
 * so downstream call sites that reference them (e.g. `(app)/layout.tsx`)
 * don't have to change shape.
 *
 * To re-enable the toggle later: restore the original body that read /
 * wrote `localStorage[STORAGE_KEY]` via `useSyncExternalStore` and make
 * `setLang` / `toggle` call `writeLang` again.
 */

import { useCallback } from "react";
import type { Lang } from "./i18n";

const FIXED_LANG: Lang = "pl";

export function useLanguage() {
  const lang: Lang = FIXED_LANG;

  // Kept for API stability. Both are no-ops — call sites that used to
  // flip the language still compile, they just don't do anything now.
  const setLang = useCallback<(l: Lang) => void>(() => {
    /* no-op — PL only for this release */
  }, []);

  const toggle = useCallback(() => {
    /* no-op — PL only for this release */
  }, []);

  return { lang, setLang, toggle };
}
