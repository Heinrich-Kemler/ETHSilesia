"use client";

/**
 * Route-group layout for the public marketing surface.
 *
 * Renders the transparent landing `Navbar` (anchor links to in-page
 * sections like `#features`, `#coach`) so every future landing-adjacent
 * page shares the same chrome. URLs are unaffected — the `(landing)`
 * folder is a Next.js route group and is stripped from the path.
 *
 * Keeping the Navbar here (instead of inside `page.tsx`) means the
 * component tree stays stable during any in-group navigation, so the
 * nav doesn't re-mount and lose scroll state.
 */

import Navbar from "@/components/landing/Navbar";
import { useLanguage } from "@/lib/useLanguage";
import { useTheme } from "@/lib/useTheme";

export default function LandingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { lang } = useLanguage();
  const { theme, toggle: toggleTheme } = useTheme();

  return (
    <>
      <Navbar lang={lang} theme={theme} onToggleTheme={toggleTheme} />
      {children}
    </>
  );
}
