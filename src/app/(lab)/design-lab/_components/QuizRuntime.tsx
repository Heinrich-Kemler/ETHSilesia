"use client";

/**
 * Quiz Runtime artboard — 1440×900 desktop layout.
 * Two sub-states: ASKING (pristine) and REVEAL (with Skarbnik's explainer).
 * Lantern-fuel gauge across the header, options indexed A-D.
 */

import type { ReactNode } from "react";
import { MonoLabel, PrimaryButton, XPChip } from "./Atoms";
import { SAMPLE_QUIZ } from "./data";
import { SkarbnikMascot } from "./SkarbnikMascot";
import { SKARB, type Tokens } from "./tokens";

type QuizState = "asking" | "reveal";

export function QuizRuntime({
  t,
  state = "asking",
}: {
  t: Tokens;
  state?: QuizState;
}) {
  const quiz = SAMPLE_QUIZ;
  const q = quiz.questions[0];
  const current = 2; // showing question 2 of 6
  const selected = state === "reveal" ? q.correct : null;

  const shade = t.name === "dark" ? 0.6 : 0.1;
  const noiseOpacity = t.name === "dark" ? 0.18 : 0.22;
  const noiseBg = `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' seed='5'/><feColorMatrix values='0 0 0 0 ${shade} 0 0 0 0 ${shade} 0 0 0 0 ${shade} 0 0 0 0.5 0'/></filter><rect width='100%25' height='100%25' filter='url(%23n)' opacity='${noiseOpacity}'/></svg>")`;

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
      }}
    >
      {/* TOP BAR */}
      <header
        style={{
          display: "flex",
          alignItems: "center",
          gap: 32,
          padding: "20px 48px",
          borderBottom: `1px solid ${t.border}`,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <svg width="18" height="18" viewBox="0 0 18 18">
            <path
              d="M 12 2 L 6 2 L 2 9 L 6 16 L 12 16"
              fill="none"
              stroke={t.ink}
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <MonoLabel t={t}>Wyjdź</MonoLabel>
        </div>

        <div style={{ flex: 1 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 8,
            }}
          >
            <MonoLabel t={t} muted>
              Lekcja · Jak działa transakcja?
            </MonoLabel>
            <MonoLabel t={t}>
              <span style={{ color: t.ink }}>
                {String(current).padStart(2, "0")}
              </span>
              <span style={{ color: t.inkMute }}> / 06</span>
            </MonoLabel>
          </div>
          {/* Lantern-fuel gauge: 6 cells */}
          <div style={{ display: "flex", gap: 6 }}>
            {Array.from({ length: quiz.total }).map((_, i) => {
              const done = i < current - 1;
              const active = i === current - 1;
              return (
                <div
                  key={i}
                  style={{
                    flex: 1,
                    height: 6,
                    background:
                      done || active ? t.accentWarm : t.cardElev,
                    border: `1px solid ${
                      done || active ? t.accentWarm : t.border
                    }`,
                    opacity: done || active ? 1 : 0.5,
                    position: "relative",
                  }}
                >
                  {active && (
                    <div
                      style={{
                        position: "absolute",
                        right: -2,
                        top: -3,
                        bottom: -3,
                        width: 2,
                        background: t.accentWarm,
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <XPChip value="+75" t={t} />
      </header>

      {/* BODY */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1px 1fr",
          gap: 0,
          minHeight: 820,
        }}
      >
        {/* LEFT — question + mascot */}
        <div
          style={{
            padding: "80px 80px 40px",
            display: "flex",
            flexDirection: "column",
            position: "relative",
          }}
        >
          <MonoLabel t={t} muted style={{ marginBottom: 24 }}>
            Pytanie {current} z {quiz.total}
          </MonoLabel>

          <h1
            style={{
              fontFamily: SKARB.font.display,
              fontSize: 42,
              lineHeight: 1.2,
              color: t.ink,
              margin: 0,
              letterSpacing: "-0.005em",
              textWrap: "pretty",
              maxWidth: 520,
            }}
          >
            {q.q}
          </h1>

          <div
            style={{
              marginTop: "auto",
              display: "flex",
              alignItems: "flex-end",
              gap: 20,
            }}
          >
            <SkarbnikMascot
              pose={state === "reveal" ? "proud" : "idle"}
              size={180}
              theme={t}
            />
            {state === "reveal" && (
              <SpeechBubble t={t}>
                <div
                  style={{
                    fontFamily: SKARB.font.display,
                    fontSize: 14,
                    color: t.success,
                    letterSpacing: "0.04em",
                    marginBottom: 8,
                  }}
                >
                  Dobrze.
                </div>
                <div
                  style={{
                    fontFamily: SKARB.font.body,
                    fontSize: 15,
                    lineHeight: 1.55,
                    color: t.ink,
                    textWrap: "pretty",
                  }}
                >
                  {q.explainer}
                </div>
              </SpeechBubble>
            )}
          </div>
        </div>

        <div style={{ background: t.border }} />

        {/* RIGHT — options */}
        <div
          style={{
            padding: "80px 80px 40px",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <MonoLabel t={t} muted style={{ marginBottom: 24 }}>
            Wybierz jedną odpowiedź
          </MonoLabel>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {q.options.map((opt, i) => {
              const isCorrect = i === q.correct;
              const isSelected = selected === i;
              const revealed = state === "reveal";

              let bg = t.card;
              let borderColor = t.border;
              let textColor = t.ink;
              let letterColor = t.inkSoft;
              let letterBg = t.cardElev;

              if (revealed && isCorrect) {
                bg = "rgba(46, 107, 74, 0.08)";
                borderColor = t.success;
                letterColor = t.card;
                letterBg = t.success;
              } else if (revealed && !isCorrect) {
                bg = t.card;
                borderColor = t.border;
                textColor = t.inkMute;
              }

              return (
                <div
                  key={i}
                  aria-selected={isSelected}
                  style={{
                    display: "flex",
                    alignItems: "stretch",
                    border: `1px solid ${borderColor}`,
                    background: bg,
                    cursor: revealed ? "default" : "pointer",
                    transition: "all 200ms",
                    position: "relative",
                  }}
                >
                  <div
                    style={{
                      width: 52,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: letterBg,
                      borderRight: `1px solid ${borderColor}`,
                      fontFamily: SKARB.font.mono,
                      fontSize: 14,
                      color: letterColor,
                      letterSpacing: "0.05em",
                    }}
                  >
                    {revealed && isCorrect ? (
                      <svg width="18" height="18" viewBox="0 0 18 18">
                        <path
                          d="M 4 9 L 8 13 L 14 5"
                          fill="none"
                          stroke={t.card}
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    ) : (
                      String.fromCharCode(65 + i)
                    )}
                  </div>
                  <div
                    style={{
                      flex: 1,
                      padding: "18px 22px",
                      fontFamily: SKARB.font.body,
                      fontSize: 15,
                      lineHeight: 1.45,
                      color: textColor,
                      textWrap: "pretty",
                    }}
                  >
                    {opt}
                  </div>
                </div>
              );
            })}
          </div>

          {state === "reveal" && (
            <div
              style={{
                marginTop: "auto",
                paddingTop: 32,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: 12 }}
              >
                <svg width="16" height="16" viewBox="0 0 16 16">
                  <circle
                    cx="8"
                    cy="8"
                    r="7"
                    fill="none"
                    stroke={t.success}
                    strokeWidth="1.5"
                  />
                  <path
                    d="M 5 8 L 7 10 L 11 6"
                    fill="none"
                    stroke={t.success}
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <MonoLabel t={t} style={{ color: t.success }}>
                  Pierwsza próba · +12 XP
                </MonoLabel>
              </div>
              <PrimaryButton t={t}>Następne pytanie →</PrimaryButton>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SpeechBubble({
  children,
  t,
}: {
  children: ReactNode;
  t: Tokens;
}) {
  return (
    <div
      style={{
        position: "relative",
        maxWidth: 400,
        padding: "20px 24px",
        background: t.card,
        border: `1px solid ${t.border}`,
        borderLeft: `3px solid ${t.success}`,
        marginBottom: 24,
      }}
    >
      <div
        style={{
          position: "absolute",
          left: -9,
          bottom: 28,
          width: 0,
          height: 0,
          borderTop: "8px solid transparent",
          borderBottom: "8px solid transparent",
          borderRight: `8px solid ${t.border}`,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: -7,
          bottom: 29,
          width: 0,
          height: 0,
          borderTop: "7px solid transparent",
          borderBottom: "7px solid transparent",
          borderRight: `7px solid ${t.card}`,
        }}
      />
      {children}
    </div>
  );
}
