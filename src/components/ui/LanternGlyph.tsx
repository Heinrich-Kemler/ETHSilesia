"use client";

/**
 * Nav-sized mine lantern glyph.
 *
 * Simplified cousin of <SkarbnikMascot />: same lantern silhouette
 * (cyan handle / navy body / amber flame / amber base) but stripped
 * of the face + floating sparkles so it reads cleanly at 28–32px in
 * the navbar. The mascot has eyes and dust motes because it's meant
 * to be 120px+ and feel like a character; at nav-size those details
 * collapse into pixel mush.
 *
 * All the warm-metal parts — frame, grille, flame, base — render
 * from --flame so the lantern stays amber on both themes. --flame
 * is decoupled from --gold (which in light mode is PKO navy for
 * the UI chrome) on purpose: a miner's lamp with a navy flame would
 * look like a broken icon.
 */
export default function LanternGlyph({
  size = 28,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 44"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Handle — cool cyan bail arc over the top of the lamp. */}
      <path
        d="M 12 8 Q 20 1 28 8"
        fill="none"
        stroke="var(--cyan)"
        strokeWidth="2.4"
        strokeLinecap="round"
      />

      {/* Top cap — thin cyan ring binding the handle to the body. */}
      <rect x="10" y="8" width="20" height="3" rx="0.8" fill="var(--cyan)" />

      {/* Main body — deep navy pane framed in warm flame metal. */}
      <rect
        x="9"
        y="11"
        width="22"
        height="22"
        rx="1.6"
        fill="var(--navy)"
        stroke="var(--flame)"
        strokeWidth="1"
      />

      {/* 2x2 window grille — thin flame-metal cross, low opacity so the
          flame still carries the visual weight. */}
      <line x1="20" y1="12" x2="20" y2="32" stroke="var(--flame)" strokeWidth="0.5" opacity="0.5" />
      <line x1="10" y1="22" x2="30" y2="22" stroke="var(--flame)" strokeWidth="0.5" opacity="0.5" />

      {/* Flame — asymmetrical teardrop pointed slightly right, closer
          to the profile of an actual oil-lamp wick than a symmetric
          diamond. Paired with a soft highlight so it has depth even
          at this size. */}
      <path
        d="M 20 15 C 16.5 19, 16 25, 19 27.5 C 21.5 28.5, 24 27, 24.5 24.5 C 25 21, 23 17, 20 15 Z"
        fill="var(--flame)"
      />
      <ellipse cx="20.2" cy="23" rx="1.3" ry="2.8" fill="var(--flame-soft)" opacity="0.75" />

      {/* Base — flame-metal trapezoid flared under the body like a stand. */}
      <path d="M 11 33 L 29 33 L 26.5 38 L 13.5 38 Z" fill="var(--flame)" />
    </svg>
  );
}
