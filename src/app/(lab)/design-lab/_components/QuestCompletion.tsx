"use client";

/**
 * Quest Completion artboard — 1440×900 cinematic but restrained.
 * Full-screen: Skarbnik celebrating, badge in the centre, XP + streak
 * on the right. No confetti-spam.
 */

import {
  BadgeEmblem,
  MonoLabel,
  PrimaryButton,
  SecondaryButton,
  StarRating,
  StreakFlame,
  XPChip,
} from "./Atoms";
import { QUESTS } from "./data";
import { SkarbnikMascot } from "./SkarbnikMascot";
import { SKARB, type Tokens } from "./tokens";

export function QuestCompletion({ t }: { t: Tokens }) {
  // Defensive fallback: if the sample quest ever drops out of the
  // fixture (e.g. someone trims the list), hold the artboard together
  // with the first available quest rather than exploding at runtime.
  const quest =
    QUESTS.find((q) => q.id === "l1-transaction") ?? QUESTS[0];

  const shade = t.name === "dark" ? 0.6 : 0.1;
  const noiseOpacity = t.name === "dark" ? 0.18 : 0.22;
  const noiseBg = `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' seed='7'/><feColorMatrix values='0 0 0 0 ${shade} 0 0 0 0 ${shade} 0 0 0 0 ${shade} 0 0 0 0.5 0'/></filter><rect width='100%25' height='100%25' filter='url(%23n)' opacity='${noiseOpacity}'/></svg>")`;

  return (
    <div
      style={{
        width: 1440,
        minHeight: 900,
        background: t.bg,
        backgroundImage: noiseBg,
        fontFamily: SKARB.font.body,
        color: t.ink,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Faint radial glow behind badge */}
      <div
        style={{
          position: "absolute",
          top: 200,
          left: "50%",
          transform: "translateX(-50%)",
          width: 800,
          height: 800,
          background: `radial-gradient(circle, ${t.accentWarm}22 0%, transparent 55%)`,
          pointerEvents: "none",
        }}
      />

      {/* Top meta */}
      <div
        style={{
          position: "absolute",
          top: 32,
          left: 48,
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        <MonoLabel t={t} muted>
          Lekcja ukończona
        </MonoLabel>
        <span
          style={{
            width: 3,
            height: 3,
            background: t.border,
            borderRadius: "50%",
          }}
        />
        <MonoLabel t={t} muted>
          01 : 42 : 38
        </MonoLabel>
      </div>
      <div style={{ position: "absolute", top: 32, right: 48 }}>
        <MonoLabel t={t} muted>
          Odznaka nr 4 / 14
        </MonoLabel>
      </div>

      {/* MAIN STAGE — 3-col grid: mascot | badge | stats */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr auto 1fr",
          alignItems: "center",
          gap: 80,
          padding: "120px 100px 40px",
          position: "relative",
        }}
      >
        {/* LEFT — celebrating mascot + dialogue */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            paddingRight: 20,
          }}
        >
          <div style={{ transform: "rotate(-2deg)" }}>
            <SkarbnikMascot pose="celebrating" size={280} theme={t} />
          </div>
          <div
            style={{
              marginTop: 8,
              textAlign: "right",
              maxWidth: 300,
            }}
          >
            <div
              style={{
                fontFamily: SKARB.font.display,
                fontSize: 20,
                color: t.ink,
                letterSpacing: "0.01em",
                lineHeight: 1.3,
              }}
            >
              „Honest work.
              <br />
              The ledger remembers.”
            </div>
            <MonoLabel
              t={t}
              muted
              style={{ marginTop: 10, display: "block" }}
            >
              — Skarbnik
            </MonoLabel>
          </div>
        </div>

        {/* CENTER — badge */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <MonoLabel
            t={t}
            style={{ color: t.accentWarm, marginBottom: 20 }}
          >
            Nowa odznaka
          </MonoLabel>

          <div style={{ position: "relative" }}>
            {[0, 1, 2].map((i) => {
              const alpha = (30 - i * 8).toString(16);
              return (
                <div
                  key={i}
                  style={{
                    position: "absolute",
                    inset: -30 - i * 24,
                    borderRadius: "50%",
                    border: `1px solid ${t.accentWarm}${alpha}`,
                    pointerEvents: "none",
                  }}
                />
              );
            })}
            <BadgeEmblem
              topic={quest.topic}
              t={t}
              size={220}
              label="TRANSAKCJA · SKARBNIK"
            />
          </div>

          <div
            style={{
              fontFamily: SKARB.font.display,
              fontSize: 32,
              color: t.ink,
              marginTop: 32,
              textAlign: "center",
              maxWidth: 340,
              letterSpacing: "0.01em",
              lineHeight: 1.2,
            }}
          >
            Jak działa transakcja?
          </div>

          <div
            style={{
              display: "flex",
              gap: 12,
              marginTop: 20,
              alignItems: "center",
            }}
          >
            <StarRating filled={2} t={t} size={16} />
            <span style={{ width: 1, height: 14, background: t.border }} />
            <MonoLabel t={t}>Poziom Uczeń</MonoLabel>
          </div>

          <div
            style={{
              marginTop: 36,
              padding: "12px 20px",
              background: t.cardElev,
              border: `1px solid ${t.border}`,
              display: "flex",
              alignItems: "center",
              gap: 12,
              fontFamily: SKARB.font.mono,
              fontSize: 11,
              color: t.inkSoft,
              letterSpacing: "0.05em",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14">
              <path
                d="M 7 1 L 12 4 L 12 9 L 7 13 L 2 9 L 2 4 Z"
                fill="none"
                stroke={t.success}
                strokeWidth="1.2"
              />
              <path
                d="M 5 7 L 6.5 8.5 L 9 6"
                fill="none"
                stroke={t.success}
                strokeWidth="1.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Zapisane na łańcuchu Base · 0x7a4f…c3e1
            <span
              style={{
                color: t.accentCool,
                textDecoration: "underline",
                marginLeft: 4,
              }}
            >
              Zobacz
            </span>
          </div>
        </div>

        {/* RIGHT — stats */}
        <div
          style={{
            paddingLeft: 20,
            display: "flex",
            flexDirection: "column",
            gap: 24,
          }}
        >
          <div>
            <MonoLabel t={t} muted>
              Zdobyte doświadczenie
            </MonoLabel>
            <div
              style={{
                fontFamily: SKARB.font.display,
                fontSize: 72,
                color: t.accentWarm,
                letterSpacing: "-0.02em",
                lineHeight: 1,
                marginTop: 8,
              }}
            >
              +75
              <span
                style={{
                  fontSize: 28,
                  color: t.inkSoft,
                  marginLeft: 8,
                  letterSpacing: "0.05em",
                }}
              >
                XP
              </span>
            </div>
            <div style={{ marginTop: 16 }}>
              <div
                style={{
                  fontFamily: SKARB.font.mono,
                  fontSize: 10,
                  letterSpacing: "0.14em",
                  color: t.inkMute,
                  marginBottom: 6,
                  textTransform: "uppercase",
                  display: "flex",
                  justifyContent: "space-between",
                }}
              >
                <span>325 / 500 do Biegłego</span>
                <span>65%</span>
              </div>
              <div
                style={{
                  height: 4,
                  background: t.cardElev,
                  border: `1px solid ${t.border}`,
                  position: "relative",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    width: "50%",
                    background: t.border,
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    left: "50%",
                    top: 0,
                    bottom: 0,
                    width: "15%",
                    background: t.accentWarm,
                    boxShadow: `0 0 8px ${t.accentWarm}`,
                  }}
                />
              </div>
              <MonoLabel
                t={t}
                style={{
                  color: t.success,
                  marginTop: 6,
                  display: "block",
                }}
              >
                ▲ +15% do następnego poziomu
              </MonoLabel>
            </div>
          </div>

          <div
            style={{
              padding: "20px 24px",
              background: t.card,
              border: `1px solid ${t.border}`,
              display: "flex",
              alignItems: "center",
              gap: 20,
            }}
          >
            <StreakFlame count={8} t={t} size={48} />
            <div>
              <div
                style={{
                  fontFamily: SKARB.font.display,
                  fontSize: 32,
                  color: t.ink,
                  lineHeight: 1,
                }}
              >
                8 dni
              </div>
              <MonoLabel
                t={t}
                muted
                style={{ marginTop: 6, display: "block" }}
              >
                Seria — lampa płonie jaśniej
              </MonoLabel>
            </div>
          </div>

          <div
            style={{
              padding: "18px 22px",
              background: t.cardElev,
              border: `1px solid ${t.border}`,
              borderLeft: `3px solid ${t.accentCool}`,
            }}
          >
            <MonoLabel t={t} muted>
              Następna lekcja
            </MonoLabel>
            <div
              style={{
                fontFamily: SKARB.font.display,
                fontSize: 18,
                color: t.ink,
                marginTop: 6,
              }}
            >
              Czym jest opłata za gaz?
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                marginTop: 10,
              }}
            >
              <XPChip value={100} t={t} size="sm" />
              <StarRating filled={2} t={t} size={10} />
            </div>
          </div>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          gap: 16,
          justifyContent: "center",
          padding: "20px 0 60px",
        }}
      >
        <SecondaryButton t={t}>Udostępnij</SecondaryButton>
        <PrimaryButton t={t}>Dalej do następnej lekcji →</PrimaryButton>
      </div>
    </div>
  );
}
