"use client";

/**
 * Design-Lab: preview of the Claude Designer v1 handoff.
 *
 * SANDBOXED. This route lives in the `(lab)` route group and
 * does not touch `(app)` or `(landing)`. Nothing here imports from
 * live quest/badge/user state — all data comes from the static
 * `_components/data.ts` fixture.
 *
 * Goal of this page: let a reviewer see Quest Hub + Quiz + Completion
 * artboards side-by-side, toggle between dark and light theme, and
 * decide which pieces (if any) to promote into the real app.
 *
 * Safe to delete this whole folder if the redesign isn't promoted —
 * no other routes reference it.
 */

import { useTheme, type Theme } from "@/lib/useTheme";
import {
  DesignCanvas,
  DCSection,
  DCArtboard,
  DCPostIt,
} from "./_components/DesignCanvas";
import { QuestHub } from "./_components/QuestHub";
import { QuizRuntime } from "./_components/QuizRuntime";
import { QuestCompletion } from "./_components/QuestCompletion";
import { buildTokens } from "./_components/tokens";

export default function DesignLabPage() {
  const { theme, setTheme } = useTheme();
  const t = buildTokens(theme);

  return (
    <>
      <ControlBar theme={theme} onSetTheme={setTheme} />

      <div style={{ position: "relative" }}>
        <DesignCanvas>
          <DCSection
            title="Skarbnik — Game Redesign, pierwszy przebieg"
            subtitle="Quest Hub · Quiz Runtime · Completion — desktop (1440), motyw instytucjonalny"
          >
            <DCArtboard
              label="01 · Quest Hub (hero) — desktop 1440"
              width={1440}
            >
              <QuestHub t={t} />
            </DCArtboard>
          </DCSection>

          <DCSection
            title="Quiz runtime"
            subtitle="Dwa stany: pytanie i odsłonięta odpowiedź z wyjaśnieniem Skarbnika"
          >
            <DCArtboard
              label="02 · Quiz — stan: pytanie"
              width={1440}
              height={900}
            >
              <QuizRuntime t={t} state="asking" />
            </DCArtboard>
            <DCArtboard
              label="03 · Quiz — odpowiedź + wyjaśnienie"
              width={1440}
              height={900}
            >
              <QuizRuntime t={t} state="reveal" />
            </DCArtboard>
          </DCSection>

          <DCSection
            title="Celebracja ukończenia lekcji"
            subtitle="Kinowa, ale powściągliwa — żadnego confetti-spamu"
          >
            <DCArtboard
              label="04 · Completion"
              width={1440}
              height={900}
            >
              <QuestCompletion t={t} />
            </DCArtboard>
          </DCSection>

          <DCPostIt top={180} left={1500} rotate={-3} width={220}>
            Nota projektowa: gra używa wyłącznie polskich terminów
            przyjaznych dla 45-latka z Katowic — żadnych skrótów typu
            „TX”, „L2” czy „DYOR”.
          </DCPostIt>
          <DCPostIt top={560} left={1500} rotate={2} width={220}>
            Złoto-cyjanowy gradient = jedyny sygnał „aktywne”. Pojawia
            się na pasku XP, pulsie aktywnej lekcji i FAB-ie Skarbnika.
          </DCPostIt>
        </DesignCanvas>
      </div>
    </>
  );
}

function ControlBar({
  theme,
  onSetTheme,
}: {
  theme: Theme;
  onSetTheme: (t: Theme) => void;
}) {
  return (
    <div
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        background: "#14161F",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
        padding: "12px 24px",
        display: "flex",
        alignItems: "center",
        gap: 20,
        fontFamily:
          "var(--font-space-mono), 'Space Mono', ui-monospace, monospace",
        fontSize: 11,
        letterSpacing: "0.14em",
        textTransform: "uppercase",
        color: "#F0F1F5",
      }}
    >
      <span style={{ color: "#C9A84C" }}>
        Design Lab · Skarbnik Redesign v1
      </span>
      <span style={{ color: "#7A7E94" }}>
        sandbox · not wired to production state
      </span>
      <span style={{ flex: 1 }} />
      <span style={{ color: "#7A7E94" }}>Motyw</span>
      <ThemeButton
        label="Jasny"
        active={theme === "light"}
        onClick={() => onSetTheme("light")}
      />
      <ThemeButton
        label="Ciemny"
        active={theme === "dark"}
        onClick={() => onSetTheme("dark")}
      />
    </div>
  );
}

function ThemeButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        fontFamily: "inherit",
        fontSize: 11,
        letterSpacing: "0.14em",
        padding: "6px 14px",
        background: active ? "#C9A84C" : "transparent",
        color: active ? "#14161F" : "#F0F1F5",
        border: `1px solid ${active ? "#C9A84C" : "rgba(255,255,255,0.14)"}`,
        borderRadius: 3,
        cursor: "pointer",
        textTransform: "uppercase",
      }}
    >
      {label}
    </button>
  );
}
