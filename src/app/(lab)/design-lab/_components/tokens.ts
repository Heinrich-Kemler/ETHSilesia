/**
 * Design tokens for the Claude Designer v1 handoff.
 *
 * The handoff shipped two palette objects (LIGHT + DARK) that every
 * component consumed via a `t` prop. We preserve that API so porting
 * components stays a one-to-one translation, but the values are
 * expressed as CSS custom property references — meaning the existing
 * `data-theme="dark|light"` switch on <html> drives them without the
 * component tree having to care which theme is active.
 *
 * Fonts match the family aliases already wired through `next/font`
 * in `src/app/layout.tsx` (Cinzel / Inter / Space Mono).
 */

export const SKARB = {
  font: {
    display:
      "var(--font-cinzel), 'Cinzel', 'Cormorant Garamond', Georgia, serif",
    body: "var(--font-inter), 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    mono: "var(--font-space-mono), 'Space Mono', 'IBM Plex Mono', ui-monospace, monospace",
  },
  radius: { sm: 6, md: 10, lg: 14, xl: 20, pill: 999 },
  motion: {
    fast: "160ms cubic-bezier(0.2, 0.8, 0.2, 1)",
    base: "280ms cubic-bezier(0.2, 0.8, 0.2, 1)",
    slow: "520ms cubic-bezier(0.2, 0.8, 0.2, 1)",
  },
} as const;

/** Token shape consumed by every design-lab component. */
export type Tokens = {
  /** Flag used by a few components to branch on theme (noise colour, coat shade). */
  name: "light" | "dark";
  bg: string;
  bgDeep: string;
  card: string;
  cardElev: string;
  border: string;
  borderStrong: string;
  ink: string;
  inkSoft: string;
  inkMute: string;
  /** Navy/indigo anchor — the institutional primary in light, warm gold in dark. */
  primary: string;
  primarySoft: string;
  /** The "cool" active accent. Maps to --cyan (dark) / --cyan=green (light). */
  accentCool: string;
  /** The "warm" cross-theme anchor. Maps to --gold (dark) / --gold=navy (light). */
  accentWarm: string;
  success: string;
  warn: string;
  danger: string;
  goldWash: string;
  navyWash: string;
};

/**
 * Build a token set for a given theme. Most colour slots resolve to
 * project CSS variables so dark↔light hand-off happens by toggling
 * `data-theme` on `<html>` — nothing in the component tree changes.
 *
 * A few slots keep literal hex values because the existing globals.css
 * doesn't yet export tokens for e.g. "deep institutional navy" or
 * "guild green". These are opinionated additions that the design
 * brief called out explicitly; if we promote the lab, we'll roll them
 * into globals.css as first-class vars.
 */
export function buildTokens(theme: "light" | "dark"): Tokens {
  if (theme === "dark") {
    return {
      name: "dark",
      bg: "var(--bg-primary)",
      bgDeep: "#070911",
      card: "var(--bg-card)",
      cardElev: "var(--bg-elevated)",
      border: "var(--border-color)",
      borderStrong: "rgba(255, 255, 255, 0.14)",
      ink: "var(--text-primary)",
      inkSoft: "var(--text-secondary)",
      inkMute: "var(--text-muted)",
      primary: "var(--gold)",
      primarySoft: "#E4C36B",
      accentCool: "var(--cyan)",
      accentWarm: "var(--gold)",
      success: "#4DB27C",
      warn: "#E0A04A",
      danger: "#D9534F",
      goldWash: "var(--gold-glow)",
      navyWash: "var(--cyan-glow)",
    };
  }

  return {
    name: "light",
    bg: "var(--bg-primary)",
    bgDeep: "#E9E4D8",
    card: "var(--bg-card)",
    cardElev: "var(--bg-elevated)",
    border: "var(--border-color)",
    borderStrong: "rgba(0, 0, 0, 0.14)",
    ink: "var(--text-primary)",
    inkSoft: "var(--text-secondary)",
    inkMute: "var(--text-muted)",
    primary: "var(--gold)",
    primarySoft: "#2B3A74",
    accentCool: "var(--cyan)",
    accentWarm: "var(--gold)",
    success: "#2E6B4A",
    warn: "#B4681C",
    danger: "var(--magenta)",
    goldWash: "var(--gold-glow)",
    navyWash: "var(--cyan-glow)",
  };
}
