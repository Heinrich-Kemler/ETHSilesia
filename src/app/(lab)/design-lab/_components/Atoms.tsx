"use client";

/**
 * Shared UI atoms from Claude Designer v1 handoff.
 * Ported verbatim in style — inline styles are kept to stay close
 * to the prototype (the brief calls for pixel-perfect recreation).
 */

import type { CSSProperties, ReactNode } from "react";
import { SKARB, type Tokens } from "./tokens";
import type { BadgeTopic } from "./data";

type AtomProps = { t: Tokens };

export function MonoLabel({
  children,
  t,
  muted,
  style,
}: AtomProps & {
  children: ReactNode;
  muted?: boolean;
  style?: CSSProperties;
}) {
  return (
    <span
      style={{
        fontFamily: SKARB.font.mono,
        fontSize: 10,
        letterSpacing: "0.14em",
        textTransform: "uppercase",
        color: muted ? t.inkMute : t.inkSoft,
        ...style,
      }}
    >
      {children}
    </span>
  );
}

export function XPChip({
  value,
  t,
  size = "md",
  style,
}: AtomProps & {
  value: number | string;
  size?: "sm" | "md";
  style?: CSSProperties;
}) {
  const s =
    size === "sm" ? { pad: "3px 8px", fs: 10 } : { pad: "5px 12px", fs: 11 };
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        fontFamily: SKARB.font.mono,
        fontSize: s.fs,
        letterSpacing: "0.1em",
        padding: s.pad,
        color: t.accentWarm,
        background: t.goldWash,
        border: `1px solid ${t.accentWarm}40`,
        borderRadius: 3,
        textTransform: "uppercase",
        ...style,
      }}
    >
      <span
        style={{
          width: 4,
          height: 4,
          background: t.accentWarm,
          borderRadius: "50%",
        }}
      />
      +{value} XP
    </span>
  );
}

export function StarRating({
  filled,
  total = 3,
  t,
  size = 12,
}: AtomProps & { filled: number; total?: number; size?: number }) {
  return (
    <span style={{ display: "inline-flex", gap: 2 }}>
      {Array.from({ length: total }).map((_, i) => (
        <svg key={i} width={size} height={size} viewBox="0 0 12 12">
          <path
            d="M 6 1 L 7.4 4.4 L 11 4.8 L 8.3 7.3 L 9.1 11 L 6 9 L 2.9 11 L 3.7 7.3 L 1 4.8 L 4.6 4.4 Z"
            fill={i < filled ? t.accentWarm : "none"}
            stroke={i < filled ? t.accentWarm : t.border}
            strokeWidth="0.8"
            strokeLinejoin="round"
          />
        </svg>
      ))}
    </span>
  );
}

/**
 * Streak flame — burning lantern. Intensity 1-3 scales size and glow.
 * Glow opacity is ≤ 0.51 so the hex alpha channel fits 0x00–0xff cleanly.
 */
export function StreakFlame({
  count = 7,
  t,
  size = 36,
}: AtomProps & { count?: number; size?: number }) {
  const intensity = count >= 14 ? 3 : count >= 3 ? 2 : 1;
  const glow = 0.15 + intensity * 0.12;
  const glowHex = Math.round(glow * 255)
    .toString(16)
    .padStart(2, "0");
  return (
    <div style={{ position: "relative", width: size, height: size * 1.3 }}>
      <div
        style={{
          position: "absolute",
          inset: -size * 0.3,
          background: `radial-gradient(circle, ${t.accentWarm}${glowHex} 0%, transparent 65%)`,
        }}
      />
      <svg
        width={size}
        height={size * 1.3}
        viewBox="0 0 36 46"
        style={{ position: "relative" }}
      >
        <line x1="18" y1="2" x2="18" y2="6" stroke={t.ink} strokeWidth="1.2" />
        <path d="M 10 6 L 26 6 L 24 9 L 12 9 Z" fill={t.ink} />
        <rect
          x="11"
          y="9"
          width="14"
          height="18"
          fill={t.card}
          stroke={t.ink}
          strokeWidth="1.2"
        />
        <rect
          x="11"
          y="9"
          width="14"
          height="18"
          fill={t.accentWarm}
          opacity={0.3 + intensity * 0.15}
        />
        <path
          d="M 18 12 Q 14 17 16 22 Q 17 19 18 19 Q 19 22 22 21 Q 21 17 18 12 Z"
          fill={t.accentWarm}
          stroke={t.ink}
          strokeWidth="0.8"
        />
        <path d="M 10 27 L 26 27 L 25 30 L 11 30 Z" fill={t.ink} />
        <rect x="13" y="30" width="10" height="2" fill={t.ink} />
      </svg>
    </div>
  );
}

export function LevelBanner({
  level,
  title,
  subtitle,
  t,
  tone = "apprentice",
}: AtomProps & {
  level: number;
  title: string;
  subtitle?: string;
  tone?: "apprentice" | "adept" | "master";
}) {
  const palette = {
    apprentice: { fg: t.success, wash: "rgba(46,107,74,0.08)" },
    adept: { fg: t.accentCool, wash: "rgba(56,189,248,0.08)" },
    master: { fg: t.accentWarm, wash: "rgba(201,168,76,0.10)" },
  }[tone];

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 20,
        padding: "24px 0",
        position: "relative",
      }}
    >
      <div style={{ flex: 1, height: 1, background: t.border }} />
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          padding: "12px 20px",
          background: palette.wash,
          border: `1px solid ${palette.fg}33`,
          borderRadius: 2,
        }}
      >
        <span
          style={{
            fontFamily: SKARB.font.mono,
            fontSize: 10,
            letterSpacing: "0.18em",
            color: palette.fg,
            textTransform: "uppercase",
          }}
        >
          Poziom {level}
        </span>
        <span
          style={{ width: 1, height: 14, background: `${palette.fg}66` }}
        />
        <span
          style={{
            fontFamily: SKARB.font.display,
            fontSize: 18,
            color: t.ink,
            letterSpacing: "0.02em",
          }}
        >
          {title}
        </span>
        {subtitle && (
          <span style={{ fontSize: 12, color: t.inkMute, marginLeft: 4 }}>
            {subtitle}
          </span>
        )}
      </div>
      <div style={{ flex: 1, height: 1, background: t.border }} />
    </div>
  );
}

// Static palette for the badge coin itself — this is an engraved token,
// not a themed surface, so its gold stays constant across light/dark.
const BADGE_GOLD = "#C9A84C";
const BADGE_GOLD_DARK = "#8B6F28";
const BADGE_GOLD_LIGHT = "#E4C36B";
const BADGE_INK = "#1A1A24";
const BADGE_PAPER = "#F5EEDB";

/**
 * Badge emblem — the ERC-1155 achievement coin. `topic` selects a glyph.
 * Designed to read at 48px and 300px. Lock overlay for unearned state.
 */
export function BadgeEmblem({
  topic = "wallet",
  t,
  size = 120,
  label,
  earned = true,
}: AtomProps & {
  topic?: BadgeTopic;
  size?: number;
  label?: string;
  earned?: boolean;
}) {
  const glyph = GLYPHS[topic] ?? GLYPHS.wallet;

  // Stable per-instance gradient ids — scoped with topic + size so two
  // badges at different scales on the same page don't collide.
  const gradId = `coin-${topic}-${size}`;
  const innerId = `coinInner-${topic}-${size}`;
  const arcId = `arc-${topic}-${size}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="-60 -60 120 120"
      style={{ display: "block" }}
    >
      <defs>
        <radialGradient id={gradId} cx="0.3" cy="0.3" r="0.9">
          <stop offset="0%" stopColor={BADGE_GOLD_LIGHT} />
          <stop offset="55%" stopColor={BADGE_GOLD} />
          <stop offset="100%" stopColor={BADGE_GOLD_DARK} />
        </radialGradient>
        <radialGradient id={innerId} cx="0.5" cy="0.4" r="0.6">
          <stop offset="0%" stopColor={BADGE_PAPER} />
          <stop offset="100%" stopColor="#E8DEBE" />
        </radialGradient>
      </defs>

      <circle
        cx="0"
        cy="0"
        r="54"
        fill={earned ? `url(#${gradId})` : t.border}
      />
      <circle
        cx="0"
        cy="0"
        r="54"
        fill="none"
        stroke={BADGE_INK}
        strokeWidth="1.2"
        opacity="0.5"
      />
      <circle
        cx="0"
        cy="0"
        r="44"
        fill={earned ? `url(#${innerId})` : t.cardElev}
      />
      <circle
        cx="0"
        cy="0"
        r="44"
        fill="none"
        stroke={earned ? BADGE_GOLD_DARK : t.borderStrong}
        strokeWidth="0.8"
      />

      {earned &&
        Array.from({ length: 36 }).map((_, i) => {
          const a = (i / 36) * Math.PI * 2;
          const r1 = 48,
            r2 = 52;
          return (
            <line
              key={i}
              x1={Math.cos(a) * r1}
              y1={Math.sin(a) * r1}
              x2={Math.cos(a) * r2}
              y2={Math.sin(a) * r2}
              stroke={BADGE_INK}
              strokeWidth="0.4"
              opacity="0.4"
            />
          );
        })}

      <g opacity={earned ? 1 : 0.3}>{glyph}</g>

      {label && earned && (
        <>
          <defs>
            <path id={arcId} d="M -36 -4 A 36 36 0 0 1 36 -4" />
          </defs>
          <text
            fontFamily="Space Mono, monospace"
            fontSize="6"
            letterSpacing="2"
            fill={BADGE_INK}
            opacity="0.7"
          >
            <textPath href={`#${arcId}`} startOffset="50%" textAnchor="middle">
              {label}
            </textPath>
          </text>
        </>
      )}

      {!earned && (
        <g transform="translate(0, 8)">
          <rect
            x="-6"
            y="-2"
            width="12"
            height="10"
            rx="1"
            fill={t.inkMute}
            stroke={t.ink}
            strokeWidth="0.8"
          />
          <path
            d="M -4 -2 L -4 -6 Q -4 -10 0 -10 Q 4 -10 4 -6 L 4 -2"
            fill="none"
            stroke={t.ink}
            strokeWidth="1.2"
          />
        </g>
      )}
    </svg>
  );
}

const GLYPHS: Record<BadgeTopic, ReactNode> = {
  blockchain: (
    <g>
      <rect x="-12" y="-12" width="10" height="10" fill="none" stroke={BADGE_INK} strokeWidth="1.5" />
      <rect x="2" y="-6" width="10" height="10" fill="none" stroke={BADGE_INK} strokeWidth="1.5" />
      <rect x="-5" y="2" width="10" height="10" fill="none" stroke={BADGE_INK} strokeWidth="1.5" />
      <line x1="-2" y1="-7" x2="2" y2="-5" stroke={BADGE_INK} strokeWidth="1.2" />
      <line x1="5" y1="4" x2="5" y2="2" stroke={BADGE_INK} strokeWidth="1.2" />
    </g>
  ),
  wallet: (
    <g>
      <rect x="-14" y="-10" width="28" height="20" rx="2" fill="none" stroke={BADGE_INK} strokeWidth="1.5" />
      <path d="M -14 -6 L 14 -6" stroke={BADGE_INK} strokeWidth="1.2" />
      <circle cx="8" cy="2" r="2" fill={BADGE_INK} />
    </g>
  ),
  usdc: (
    <g>
      <text x="0" y="6" fontFamily="Cinzel, serif" fontSize="22" fontWeight="700" fill={BADGE_INK} textAnchor="middle">$</text>
      <circle cx="0" cy="0" r="14" fill="none" stroke={BADGE_INK} strokeWidth="1.2" />
    </g>
  ),
  transaction: (
    <g>
      <path d="M -12 -4 L 10 -4 L 6 -8 M 12 4 L -10 4 L -6 8" fill="none" stroke={BADGE_INK} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </g>
  ),
  gas: (
    <g>
      <path d="M -8 -12 L 8 -12 L 8 12 L -8 12 Z" fill="none" stroke={BADGE_INK} strokeWidth="1.5" />
      <path d="M 8 -6 L 13 -6 L 13 6 L 10 8" fill="none" stroke={BADGE_INK} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M -4 -6 L 4 -6" stroke={BADGE_INK} strokeWidth="1.2" />
      <path d="M -4 0 L 4 0" stroke={BADGE_INK} strokeWidth="1.2" />
    </g>
  ),
  defi: (
    <g>
      <path d="M -14 2 Q -7 -10 0 2 Q 7 14 14 2" fill="none" stroke={BADGE_INK} strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="-10" cy="-6" r="2" fill={BADGE_INK} />
      <circle cx="10" cy="-6" r="2" fill={BADGE_INK} />
    </g>
  ),
  dex: (
    <g>
      <path d="M -12 -6 L 12 -6 L 8 -10 M 12 6 L -12 6 L -8 10" fill="none" stroke={BADGE_INK} strokeWidth="1.5" strokeLinejoin="round" />
      <circle cx="-4" cy="-6" r="1.8" fill={BADGE_INK} />
      <circle cx="4" cy="6" r="1.8" fill={BADGE_INK} />
    </g>
  ),
  yield: (
    <g>
      <path d="M 0 -12 L 0 10 M -8 2 L 0 10 L 8 2" fill="none" stroke={BADGE_INK} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M -10 -8 Q -5 -4 0 -10 Q 5 -4 10 -8" fill="none" stroke={BADGE_INK} strokeWidth="1.2" />
    </g>
  ),
  liquidity: (
    <g>
      <path d="M 0 -12 Q -10 0 -8 6 Q -6 12 0 12 Q 6 12 8 6 Q 10 0 0 -12 Z" fill="none" stroke={BADGE_INK} strokeWidth="1.5" />
      <path d="M -6 4 Q 0 2 6 4" fill="none" stroke={BADGE_INK} strokeWidth="1.2" />
    </g>
  ),
  smart: (
    <g>
      <rect x="-12" y="-10" width="24" height="18" fill="none" stroke={BADGE_INK} strokeWidth="1.5" />
      <path d="M -8 -5 L -4 -5 M -8 0 L 4 0 M -8 5 L 0 5" stroke={BADGE_INK} strokeWidth="1.2" strokeLinecap="round" />
    </g>
  ),
  il: (
    <g>
      <circle cx="-6" cy="0" r="7" fill="none" stroke={BADGE_INK} strokeWidth="1.5" />
      <circle cx="6" cy="0" r="7" fill="none" stroke={BADGE_INK} strokeWidth="1.5" />
      <path d="M -2 -4 L -2 4 M 2 -4 L 2 4" stroke={BADGE_INK} strokeWidth="1.2" />
    </g>
  ),
  rwa: (
    <g>
      <rect x="-10" y="-2" width="20" height="12" fill="none" stroke={BADGE_INK} strokeWidth="1.5" />
      <path d="M -12 -2 L 0 -12 L 12 -2" fill="none" stroke={BADGE_INK} strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M -4 10 L -4 2 L 4 2 L 4 10" fill="none" stroke={BADGE_INK} strokeWidth="1.2" />
    </g>
  ),
  risk: (
    <g>
      <path d="M 0 -13 L 12 10 L -12 10 Z" fill="none" stroke={BADGE_INK} strokeWidth="1.5" strokeLinejoin="round" />
      <line x1="0" y1="-4" x2="0" y2="4" stroke={BADGE_INK} strokeWidth="1.5" />
      <circle cx="0" cy="7" r="1.2" fill={BADGE_INK} />
    </g>
  ),
  rug: (
    <g>
      <path d="M -12 6 L -4 -10 L 4 -2 L 12 -12" fill="none" stroke={BADGE_INK} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M 12 -12 L 14 -6 M 12 -12 L 6 -10" stroke={BADGE_INK} strokeWidth="1.2" strokeLinecap="round" />
      <path d="M -12 10 L 12 10" stroke={BADGE_INK} strokeWidth="1.2" />
    </g>
  ),
  boss: (
    <g>
      <path d="M -10 -10 L 10 10 M 10 -10 L -10 10" stroke={BADGE_INK} strokeWidth="2" strokeLinecap="round" />
      <path d="M -14 -8 L -8 -14 M 8 -14 L 14 -8 M -14 8 L -8 14 M 14 8 L 8 14" stroke={BADGE_INK} strokeWidth="1.2" strokeLinecap="round" />
    </g>
  ),
};

export function PrimaryButton({
  children,
  t,
  onClick,
  disabled,
}: AtomProps & {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        fontFamily: SKARB.font.body,
        fontSize: 14,
        fontWeight: 500,
        padding: "12px 28px",
        background: disabled ? t.border : t.ink,
        color: disabled ? t.inkMute : t.bg,
        border: `1px solid ${t.ink}`,
        borderRadius: 2,
        cursor: disabled ? "default" : "pointer",
        letterSpacing: "0.01em",
      }}
    >
      {children}
    </button>
  );
}

export function SecondaryButton({
  children,
  t,
  onClick,
}: AtomProps & {
  children: ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        fontFamily: SKARB.font.body,
        fontSize: 14,
        fontWeight: 500,
        padding: "12px 24px",
        background: "transparent",
        color: t.ink,
        border: `1px solid ${t.borderStrong}`,
        borderRadius: 2,
        cursor: "pointer",
        letterSpacing: "0.01em",
      }}
    >
      {children}
    </button>
  );
}
