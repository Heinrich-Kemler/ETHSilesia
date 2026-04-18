"use client";

/**
 * Skarbnik Mascot — stylised mine lantern / spirit silhouette.
 *
 * All accent colours (gold flame / cyan handle / magenta dust) resolve
 * through CSS custom properties so the mascot swaps hue with the rest
 * of the theme. Previously every swatch here was a hard-coded hex that
 * pinned the mascot to dark-mode gold even after light mode reshuffled
 * --gold to a deeper copper — that's what made the lantern look like
 * a mustard khaki smudge on the cream background.
 *
 * The only remaining literal hexes are the deep navy body fills and
 * the pale flame highlight. Those are tuned illustration details that
 * shouldn't invert with the theme; the flame's hot core is always
 * near-white regardless of the UI palette it sits on.
 */
export default function SkarbnikMascot({
  size = 120,
  className = "",
  theme = "dark",
}: {
  size?: number;
  className?: string;
  theme?: "dark" | "light";
}) {
  const bodyFill = theme === "dark" ? "#131625" : "#1e2235";
  const eyeFill = theme === "dark" ? "#0B0E17" : "#121640";

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        {/* Glow around the lantern — warm gold haze that reads as
            "something hot inside this metal box". */}
        <radialGradient id="lanternGlow" cx="50%" cy="45%" r="50%">
          <stop offset="0%" stopColor="var(--flame)" stopOpacity="0.3" />
          <stop offset="60%" stopColor="var(--flame)" stopOpacity="0.08" />
          <stop offset="100%" stopColor="var(--flame)" stopOpacity="0" />
        </radialGradient>
        {/* Body outline — cyan handle fading into gold body, echoing the
            "cool metal cap / warm lantern" split you see on miners' lamps. */}
        <linearGradient id="bodyGrad" x1="50%" y1="0%" x2="50%" y2="100%">
          <stop offset="0%" stopColor="var(--cyan)" stopOpacity="0.9" />
          <stop offset="100%" stopColor="var(--flame)" stopOpacity="0.9" />
        </linearGradient>
        {/* Flame — deepest gold at the base tipping to near-white at the
            tip so the eye reads "hot core, cooling edges". The top stops
            intentionally stay as literal hexes; the flame's tip should
            read as pale-hot cream on every theme. */}
        <linearGradient id="flameGrad" x1="50%" y1="100%" x2="50%" y2="0%">
          <stop offset="0%" stopColor="var(--flame)" />
          <stop offset="50%" stopColor="#E8D48B" />
          <stop offset="100%" stopColor="#F5ECD0" />
        </linearGradient>
      </defs>

      <circle cx="60" cy="55" r="55" fill="url(#lanternGlow)" />

      <path
        d="M42 38 C42 22, 78 22, 78 38"
        stroke="url(#bodyGrad)"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />

      <rect x="38" y="36" width="44" height="6" rx="2" fill="var(--cyan)" opacity="0.8" />

      <rect
        x="40"
        y="42"
        width="40"
        height="36"
        rx="3"
        fill={bodyFill}
        stroke="url(#bodyGrad)"
        strokeWidth="1.5"
      />

      <line x1="53" y1="42" x2="53" y2="78" stroke="var(--cyan)" strokeWidth="0.8" opacity="0.4" />
      <line x1="67" y1="42" x2="67" y2="78" stroke="var(--cyan)" strokeWidth="0.8" opacity="0.4" />

      <path
        d="M60 50 C56 56, 52 62, 55 68 C56 70, 58 71, 60 72 C62 71, 64 70, 65 68 C68 62, 64 56, 60 50Z"
        fill="url(#flameGrad)"
      />
      <ellipse cx="60" cy="65" rx="3" ry="5" fill="#FFF8E1" opacity="0.8" />

      <rect x="38" y="78" width="44" height="5" rx="2" fill="var(--flame)" opacity="0.7" />
      <path d="M56 83 L60 90 L64 83" fill="var(--flame)" opacity="0.5" />

      <circle cx="55" cy="58" r="1.5" fill={eyeFill} />
      <circle cx="65" cy="58" r="1.5" fill={eyeFill} />
      <circle cx="55.5" cy="57.5" r="0.6" fill="#F5ECD0" />
      <circle cx="65.5" cy="57.5" r="0.6" fill="#F5ECD0" />

      {/* Floating dust motes — theme-accurate sparkle trio around the lamp. */}
      <circle cx="35" cy="30" r="1" fill="var(--flame)" opacity="0.6" />
      <circle cx="85" cy="25" r="0.8" fill="var(--cyan)" opacity="0.5" />
      <circle cx="30" cy="65" r="0.7" fill="var(--magenta)" opacity="0.4" />
      <circle cx="90" cy="60" r="1" fill="var(--flame)" opacity="0.5" />
      <circle cx="25" cy="48" r="0.5" fill="var(--cyan)" opacity="0.3" />
      <circle cx="95" cy="45" r="0.6" fill="var(--magenta)" opacity="0.3" />
    </svg>
  );
}
