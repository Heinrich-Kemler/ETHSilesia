"use client";

/**
 * Quest Hub artboard — hero screen, 1440px editorial desktop layout.
 * One column with a hand-drawn zig-zag trail, leaderboard preview
 * below, and a floating AI coach chest.
 *
 * Data is read from the static `data` module — the lab is a preview
 * and does not pull from live Supabase quest tables.
 */

import {
  BadgeEmblem,
  LevelBanner,
  MonoLabel,
  StarRating,
  StreakFlame,
  XPChip,
} from "./Atoms";
import { QUESTS, LEVEL_META, type LabQuest } from "./data";
import { SkarbnikMascot } from "./SkarbnikMascot";
import { SKARB, type Tokens } from "./tokens";

export function QuestHub({ t }: { t: Tokens }) {
  const isDark = t.name === "dark";
  // SVG noise texture — baseFrequency 0.85 gives paper-grain feel.
  // Alpha pushed slightly higher on light theme because warm paper
  // eats more of the turbulence than near-black does.
  const shade = isDark ? 0.6 : 0.1;
  const noiseOpacity = isDark ? 0.18 : 0.22;
  const noiseBg = `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' seed='3'/><feColorMatrix values='0 0 0 0 ${shade} 0 0 0 0 ${shade} 0 0 0 0 ${shade} 0 0 0 0.5 0'/></filter><rect width='100%25' height='100%25' filter='url(%23n)' opacity='${noiseOpacity}'/></svg>")`;

  const levels = ([1, 2, 3] as const).map((L) => ({
    level: L,
    quests: QUESTS.filter((q) => q.level === L),
  }));

  return (
    <div
      style={{
        width: 1440,
        minHeight: 2600,
        background: t.bg,
        backgroundImage: noiseBg,
        fontFamily: SKARB.font.body,
        color: t.ink,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* TOP NAV */}
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "24px 64px",
          borderBottom: `1px solid ${t.border}`,
          background: t.bg,
          backdropFilter: "blur(6px)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <svg width="28" height="28" viewBox="0 0 28 28">
            <rect x="4" y="10" width="20" height="14" fill={t.ink} />
            <rect x="4" y="10" width="20" height="4" fill={t.accentWarm} />
            <path
              d="M 4 10 Q 4 4 14 4 Q 24 4 24 10"
              fill="none"
              stroke={t.ink}
              strokeWidth="1.5"
            />
            <rect x="12" y="14" width="4" height="5" fill={t.accentWarm} />
            <circle cx="14" cy="16" r="0.8" fill={t.ink} />
          </svg>
          <span
            style={{
              fontFamily: SKARB.font.display,
              fontSize: 20,
              letterSpacing: "0.06em",
              color: t.ink,
            }}
          >
            SKARBNIK
          </span>
        </div>

        <nav style={{ display: "flex", gap: 36 }}>
          {["Kopalnia", "Ranking", "Odznaki", "Profil"].map((n, i) => (
            <span
              key={n}
              style={{
                fontFamily: SKARB.font.mono,
                fontSize: 11,
                letterSpacing: "0.14em",
                color: i === 0 ? t.ink : t.inkMute,
                textTransform: "uppercase",
                paddingBottom: 4,
                borderBottom:
                  i === 0
                    ? `1px solid ${t.ink}`
                    : "1px solid transparent",
              }}
            >
              {n}
            </span>
          ))}
        </nav>

        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <MonoLabel t={t}>PL / EN</MonoLabel>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              background: t.cardElev,
              border: `1px solid ${t.border}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: SKARB.font.mono,
              fontSize: 11,
              color: t.inkSoft,
            }}
          >
            MK
          </div>
        </div>
      </header>

      {/* CHARACTER-SHEET HERO STRIP */}
      <section style={{ padding: "56px 64px 40px" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "120px 1fr auto auto",
            alignItems: "center",
            gap: 40,
            padding: "32px 40px",
            background: t.card,
            border: `1px solid ${t.border}`,
            borderRadius: 4,
            position: "relative",
          }}
        >
          <div
            style={{
              width: 120,
              height: 120,
              background: t.cardElev,
              border: `1px solid ${t.border}`,
              borderRadius: 4,
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "center",
              overflow: "hidden",
            }}
          >
            <div style={{ marginBottom: -8 }}>
              <SkarbnikMascot
                pose="idle"
                variant="woodcut"
                size={110}
                theme={t}
              />
            </div>
          </div>

          <div>
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                gap: 14,
                marginBottom: 8,
              }}
            >
              <MonoLabel t={t}>Górnik · Poziom 1</MonoLabel>
              <span
                style={{
                  width: 3,
                  height: 3,
                  background: t.border,
                  borderRadius: "50%",
                  alignSelf: "center",
                }}
              />
              <MonoLabel t={t}>Uczeń</MonoLabel>
            </div>
            <div
              style={{
                fontFamily: SKARB.font.display,
                fontSize: 34,
                lineHeight: 1.1,
                color: t.ink,
                marginBottom: 18,
                letterSpacing: "0.01em",
              }}
            >
              Marta Kowalska
            </div>

            <div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontFamily: SKARB.font.mono,
                  fontSize: 10,
                  letterSpacing: "0.14em",
                  color: t.inkMute,
                  marginBottom: 6,
                  textTransform: "uppercase",
                }}
              >
                <span>250 / 500 XP do Biegłego</span>
                <span>50%</span>
              </div>
              <div
                style={{
                  height: 6,
                  background: t.cardElev,
                  border: `1px solid ${t.border}`,
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: "50%",
                    background: `linear-gradient(90deg, ${t.accentWarm}, ${t.accentCool})`,
                  }}
                />
                {[25, 50, 75].map((p) => (
                  <div
                    key={p}
                    style={{
                      position: "absolute",
                      top: 0,
                      bottom: 0,
                      left: `${p}%`,
                      width: 1,
                      background: `${t.ink}30`,
                    }}
                  />
                ))}
              </div>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              paddingLeft: 32,
              borderLeft: `1px solid ${t.border}`,
            }}
          >
            <StreakFlame count={7} t={t} size={36} />
            <div
              style={{
                fontFamily: SKARB.font.display,
                fontSize: 28,
                color: t.ink,
                marginTop: 4,
              }}
            >
              7
            </div>
            <MonoLabel t={t} muted>
              Dni z rzędu
            </MonoLabel>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              paddingLeft: 32,
              borderLeft: `1px solid ${t.border}`,
              minWidth: 120,
            }}
          >
            <MonoLabel t={t} muted>
              Miejsce w rankingu
            </MonoLabel>
            <div
              style={{
                fontFamily: SKARB.font.display,
                fontSize: 28,
                color: t.ink,
                marginTop: 8,
              }}
            >
              #42
            </div>
            <div
              style={{
                fontFamily: SKARB.font.mono,
                fontSize: 10,
                letterSpacing: "0.1em",
                color: t.success,
                marginTop: 4,
              }}
            >
              ▲ 3 w tym tygodniu
            </div>
          </div>
        </div>
      </section>

      {/* DAILY CHALLENGE */}
      <section style={{ padding: "0 64px 40px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "20px 28px",
            background: t.goldWash,
            border: `1px solid ${t.accentWarm}44`,
            borderLeft: `3px solid ${t.accentWarm}`,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <svg width="22" height="22" viewBox="0 0 22 22">
              <circle
                cx="11"
                cy="11"
                r="9"
                fill="none"
                stroke={t.accentWarm}
                strokeWidth="1.5"
              />
              <path
                d="M 11 6 L 11 11 L 14 13"
                stroke={t.accentWarm}
                strokeWidth="1.5"
                fill="none"
                strokeLinecap="round"
              />
            </svg>
            <div>
              <MonoLabel t={t} style={{ color: t.accentWarm }}>
                Wyzwanie dnia · 18 godz. do końca
              </MonoLabel>
              <div
                style={{
                  fontFamily: SKARB.font.display,
                  fontSize: 18,
                  color: t.ink,
                  marginTop: 4,
                }}
              >
                Ukończ dwie lekcje, zdobądź potrójne doświadczenie.
              </div>
            </div>
          </div>
          <XPChip value="2×" t={t} />
        </div>
      </section>

      {/* TRAIL */}
      <section style={{ padding: "20px 0 80px", position: "relative" }}>
        <div
          style={{ maxWidth: 820, margin: "0 auto", position: "relative" }}
        >
          {levels.map((lvl) => (
            <div key={lvl.level}>
              <LevelBanner
                level={lvl.level}
                title={LEVEL_META[lvl.level].title}
                subtitle={LEVEL_META[lvl.level].subtitle}
                tone={LEVEL_META[lvl.level].tone}
                t={t}
              />
              <TrailSection quests={lvl.quests} t={t} />
            </div>
          ))}

          <VaultDoor t={t} />
        </div>
      </section>

      {/* RIVALS */}
      <section style={{ padding: "0 64px 80px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: 14,
            marginBottom: 20,
          }}
        >
          <MonoLabel t={t}>Rywale</MonoLabel>
          <div style={{ flex: 1, height: 1, background: t.border }} />
          <span
            style={{
              fontFamily: SKARB.font.mono,
              fontSize: 10,
              letterSpacing: "0.12em",
              color: t.inkMute,
              textTransform: "uppercase",
              cursor: "pointer",
            }}
          >
            Pełny ranking →
          </span>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 16,
          }}
        >
          {[
            { name: "Jan Nowak", xp: 3840, lvl: "Mistrz", rank: 1 },
            { name: "Ola Kowal", xp: 2910, lvl: "Biegły", rank: 2 },
            { name: "0x7a...f3e1", xp: 2640, lvl: "Biegły", rank: 3 },
          ].map((p, i) => (
            <div
              key={p.rank}
              style={{
                padding: "20px 24px",
                background: t.card,
                border: `1px solid ${t.border}`,
                display: "flex",
                alignItems: "center",
                gap: 16,
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  background: i === 0 ? t.accentWarm : t.cardElev,
                  border: `1px solid ${i === 0 ? t.accentWarm : t.border}`,
                  color: i === 0 ? t.card : t.ink,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: SKARB.font.display,
                  fontSize: 16,
                }}
              >
                {p.rank}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontFamily: p.name.startsWith("0x")
                      ? SKARB.font.mono
                      : SKARB.font.body,
                    fontSize: p.name.startsWith("0x") ? 12 : 14,
                    color: t.ink,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {p.name}
                </div>
                <MonoLabel t={t} muted>
                  {p.lvl}
                </MonoLabel>
              </div>
              <div
                style={{
                  fontFamily: SKARB.font.mono,
                  fontSize: 12,
                  color: t.accentWarm,
                  letterSpacing: "0.05em",
                }}
              >
                {p.xp} XP
              </div>
            </div>
          ))}
        </div>

        <div
          style={{
            marginTop: 12,
            padding: "14px 24px",
            background: t.cardElev,
            border: `1px solid ${t.border}`,
            borderLeft: `3px solid ${t.accentCool}`,
            display: "flex",
            alignItems: "center",
            gap: 16,
          }}
        >
          <MonoLabel t={t} style={{ color: t.accentCool }}>
            Ty
          </MonoLabel>
          <span
            style={{
              fontFamily: SKARB.font.display,
              fontSize: 16,
              color: t.ink,
            }}
          >
            #42 · Marta Kowalska
          </span>
          <span style={{ flex: 1 }} />
          <span
            style={{
              fontFamily: SKARB.font.body,
              fontSize: 13,
              color: t.inkMute,
            }}
          >
            do miejsca #41 brakuje Ci 120 XP
          </span>
        </div>
      </section>

      {/* AI COACH FAB */}
      <div
        style={{
          position: "absolute",
          bottom: 32,
          right: 32,
          zIndex: 10,
        }}
      >
        <CoachFab t={t} />
      </div>
    </div>
  );
}

function TrailSection({ quests, t }: { quests: LabQuest[]; t: Tokens }) {
  const ROW_H = 180;
  const W = 820;
  const CENTER = W / 2;
  const AMPLITUDE = 240;

  const positions = quests.map((_, i) => ({
    x: i % 2 === 0 ? CENTER - AMPLITUDE : CENTER + AMPLITUDE,
    y: 90 + i * ROW_H,
  }));

  let path = `M ${positions[0].x} ${positions[0].y}`;
  for (let i = 1; i < positions.length; i++) {
    const p0 = positions[i - 1];
    const p1 = positions[i];
    const midY = (p0.y + p1.y) / 2;
    path += ` C ${p0.x} ${midY}, ${p1.x} ${midY}, ${p1.x} ${p1.y}`;
  }

  const totalH = 90 + quests.length * ROW_H;
  const lastCompleted = quests.map((q) => q.status).lastIndexOf("completed");

  return (
    <div
      style={{ position: "relative", height: totalH, width: W, margin: "0 auto" }}
    >
      <svg
        width={W}
        height={totalH}
        style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
      >
        <path
          d={path}
          fill="none"
          stroke={t.border}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray="2 8"
        />
        <path
          d={path}
          fill="none"
          stroke={t.accentWarm}
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={lastCompleted >= 0 ? "4000" : "0"}
          strokeDashoffset={
            lastCompleted >= 0
              ? 4000 - ((lastCompleted + 1) / quests.length) * 1200
              : 4000
          }
          opacity="0.8"
        />
      </svg>

      {quests.map((q, i) => (
        <div
          key={q.id}
          style={{
            position: "absolute",
            left: positions[i].x - 44,
            top: positions[i].y - 44,
          }}
        >
          <QuestBubble
            quest={q}
            side={i % 2 === 0 ? "right" : "left"}
            t={t}
            showMascot={q.status === "active"}
          />
        </div>
      ))}
    </div>
  );
}

function QuestBubble({
  quest,
  side,
  t,
  showMascot,
}: {
  quest: LabQuest;
  side: "left" | "right";
  t: Tokens;
  showMascot: boolean;
}) {
  const isActive = quest.status === "active";
  const isCompleted = quest.status === "completed";
  const isLocked = quest.status === "locked";

  const bubbleColor = isActive
    ? t.accentWarm
    : isCompleted
      ? t.card
      : isLocked
        ? t.cardElev
        : t.card;

  const borderColor = isActive
    ? t.accentWarm
    : isCompleted
      ? t.accentWarm
      : t.border;

  return (
    <div style={{ position: "relative" }}>
      {isActive && (
        <>
          <div
            style={{
              position: "absolute",
              inset: -12,
              borderRadius: "50%",
              border: `1px solid ${t.accentWarm}66`,
            }}
          />
          <div
            style={{
              position: "absolute",
              inset: -24,
              borderRadius: "50%",
              border: `1px solid ${t.accentWarm}22`,
            }}
          />
        </>
      )}

      {showMascot && (
        <div
          style={{
            position: "absolute",
            bottom: 78,
            left: "50%",
            transform: "translateX(-50%)",
          }}
        >
          <SkarbnikMascot pose="walking" size={90} theme={t} />
        </div>
      )}

      <div
        style={{
          width: 88,
          height: 88,
          borderRadius: "50%",
          background: bubbleColor,
          border: `2px solid ${borderColor}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: isActive
            ? `0 8px 32px ${t.accentWarm}55`
            : `0 2px 8px ${t.ink}10`,
          position: "relative",
        }}
      >
        <BadgeEmblem
          topic={quest.topic}
          t={t}
          size={70}
          earned={isCompleted}
        />
        {isCompleted && (
          <div style={{ position: "absolute", top: -6, right: -4 }}>
            <svg width="22" height="28" viewBox="0 0 22 28">
              <line
                x1="3"
                y1="0"
                x2="3"
                y2="28"
                stroke={t.ink}
                strokeWidth="1.5"
              />
              <path
                d="M 3 2 L 20 6 L 14 11 L 20 16 L 3 20 Z"
                fill={t.accentWarm}
                stroke={t.ink}
                strokeWidth="1"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        )}
        {isLocked && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg width="18" height="22" viewBox="0 0 18 22">
              <rect
                x="3"
                y="9"
                width="12"
                height="11"
                rx="1"
                fill={t.inkMute}
                stroke={t.ink}
                strokeWidth="1"
                opacity="0.6"
              />
              <path
                d="M 6 9 L 6 6 Q 6 2 9 2 Q 12 2 12 6 L 12 9"
                fill="none"
                stroke={t.ink}
                strokeWidth="1.3"
                opacity="0.6"
              />
            </svg>
          </div>
        )}
      </div>

      <div
        style={{
          position: "absolute",
          top: 8,
          [side]: 110,
          width: 280,
          padding: "14px 18px",
          background: isActive ? t.card : `${t.card}CC`,
          border: `1px solid ${isActive ? t.accentWarm : t.border}`,
          borderLeft: isActive ? `3px solid ${t.accentWarm}` : undefined,
          opacity: isLocked ? 0.5 : 1,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 6,
          }}
        >
          <MonoLabel t={t} muted>
            {isCompleted
              ? "Ukończono"
              : isActive
                ? "Teraz"
                : isLocked
                  ? "Zablokowane"
                  : "Dostępne"}
          </MonoLabel>
          <StarRating filled={quest.stars} t={t} />
        </div>
        <div
          style={{
            fontFamily: SKARB.font.display,
            fontSize: 15,
            lineHeight: 1.3,
            color: t.ink,
            marginBottom: 10,
          }}
        >
          {quest.title}
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <XPChip value={quest.xp} t={t} size="sm" />
          {isActive && (
            <span
              style={{
                fontFamily: SKARB.font.mono,
                fontSize: 10,
                letterSpacing: "0.12em",
                color: t.accentWarm,
                textTransform: "uppercase",
              }}
            >
              Zacznij →
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function VaultDoor({ t }: { t: Tokens }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "60px 0 20px",
      }}
    >
      <svg width="140" height="180" viewBox="0 0 140 180">
        <rect
          x="10"
          y="20"
          width="120"
          height="150"
          fill={t.cardElev}
          stroke={t.border}
          strokeWidth="2"
        />
        <rect
          x="22"
          y="30"
          width="96"
          height="130"
          fill={t.card}
          stroke={t.borderStrong}
          strokeWidth="1.5"
        />
        {[0, 1, 2, 3].map((i) => (
          <circle
            key={`tl-${i}`}
            cx={30 + i * 27}
            cy={38}
            r="2"
            fill={t.borderStrong}
          />
        ))}
        {[0, 1, 2, 3].map((i) => (
          <circle
            key={`bl-${i}`}
            cx={30 + i * 27}
            cy={152}
            r="2"
            fill={t.borderStrong}
          />
        ))}
        <circle
          cx="70"
          cy="95"
          r="32"
          fill="none"
          stroke={t.accentWarm}
          strokeWidth="2"
        />
        <circle
          cx="70"
          cy="95"
          r="22"
          fill="none"
          stroke={t.borderStrong}
          strokeWidth="1"
        />
        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
          const a = (i / 8) * Math.PI * 2;
          return (
            <line
              key={i}
              x1={70 + Math.cos(a) * 22}
              y1={95 + Math.sin(a) * 22}
              x2={70 + Math.cos(a) * 32}
              y2={95 + Math.sin(a) * 32}
              stroke={t.accentWarm}
              strokeWidth="1.5"
            />
          );
        })}
        <circle cx="70" cy="95" r="6" fill={t.accentWarm} />
      </svg>
      <MonoLabel t={t} style={{ marginTop: 16, color: t.inkSoft }}>
        Skarbiec · Już niedługo
      </MonoLabel>
      <div
        style={{
          fontFamily: SKARB.font.display,
          fontSize: 20,
          color: t.ink,
          marginTop: 8,
          textAlign: "center",
          letterSpacing: "0.02em",
        }}
      >
        Dalsze rozdziały otwierają się wkrótce
      </div>
    </div>
  );
}

function CoachFab({ t }: { t: Tokens }) {
  return (
    <div
      style={{
        width: 72,
        height: 72,
        borderRadius: "50%",
        background: `linear-gradient(135deg, ${t.accentWarm}, ${t.accentCool})`,
        padding: 3,
        boxShadow: `0 12px 32px ${t.ink}30`,
        cursor: "pointer",
      }}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          borderRadius: "50%",
          background: t.card,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
        }}
      >
        <svg width="32" height="32" viewBox="0 0 32 32">
          <rect x="4" y="12" width="24" height="14" fill={t.ink} />
          <rect x="4" y="12" width="24" height="3" fill={t.accentWarm} />
          <path
            d="M 4 12 Q 4 5 16 5 Q 28 5 28 12"
            fill="none"
            stroke={t.ink}
            strokeWidth="1.5"
          />
          <rect x="14" y="16" width="4" height="5" fill={t.accentCool} />
        </svg>
        <div
          style={{
            position: "absolute",
            top: 6,
            right: 6,
            width: 10,
            height: 10,
            borderRadius: "50%",
            background: t.accentCool,
            border: `2px solid ${t.card}`,
          }}
        />
      </div>
    </div>
  );
}
