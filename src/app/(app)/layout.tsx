"use client";

/**
 * Route-group layout for the authenticated product surface
 * (quest hub, quiz, leaderboard, badges, profile, assessment).
 *
 * Responsibilities:
 *  - Render the fixed `AppNav` so every in-app page shares the same
 *    chrome without re-mounting between navigations.
 *  - Surface the current auth state (user, demo flag) to AppNav so
 *    the login/logout button and profile link stay correct.
 *
 * Notes:
 *  - The `(app)` folder is a Next.js route group — it does NOT add a
 *    URL segment. /quest, /leaderboard, etc. are unchanged.
 *  - We intentionally do NOT redirect unauthenticated users here
 *    because /leaderboard is public. Pages that require auth keep
 *    their own redirect useEffect (see /quest, /badges, /profile).
 *  - Each page still calls `useSkarbnikUser` for its own data needs;
 *    the hook is idempotent, so calling it twice per render is safe.
 */

import AppNav from "@/components/app/AppNav";
import { useDemoMode } from "@/lib/useDemoMode";
import { useLanguage } from "@/lib/useLanguage";
import { useSkarbnikUser } from "@/lib/useSkarbnikUser";
import { useTheme } from "@/lib/useTheme";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { lang, toggle: toggleLang } = useLanguage();
  const { theme, toggle: toggleTheme } = useTheme();
  const demo = useDemoMode();
  const { user, login, logout } = useSkarbnikUser();

  return (
    <>
      {/* onToggleLang was removed when useLanguage became a PL-only no-op
          (see src/lib/useLanguage.ts — kept in place for future rehydration). */}
      <AppNav
        lang={lang}
        theme={theme}
        onToggleTheme={toggleTheme}
        authenticated={!!user}
        onLogin={login}
        onLogout={logout}
        demo={demo}
      />
      {children}
    </>
  );
}
