"use client";

/**
 * Design-canvas chrome — borrowed from the Claude Designer workspace.
 * Sections get a label strip; artboards get a dimension strip + thin
 * frame. Post-it notes float on the right margin.
 *
 * The canvas is deliberately wider than the page viewport (3000px) so
 * artboards can sit at their native 1440px with breathing room and
 * sticky notes. Users scroll horizontally — this is explicitly a
 * design review surface, not a responsive end-user page.
 */

import type { CSSProperties, ReactNode } from "react";

const CANVAS_BG = "#2A2D3B";
const CANVAS_RULE = "rgba(255,255,255,0.06)";
const CANVAS_INK = "#F0F1F5";
const CANVAS_MUTE = "#7A7E94";

const MONO =
  "var(--font-space-mono), 'Space Mono', 'IBM Plex Mono', ui-monospace, monospace";

export function DesignCanvas({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: CANVAS_BG,
        // Subtle grid — 24px squares, honest-to-Figma feel.
        backgroundImage: `
          linear-gradient(${CANVAS_RULE} 1px, transparent 1px),
          linear-gradient(90deg, ${CANVAS_RULE} 1px, transparent 1px)
        `,
        backgroundSize: "24px 24px",
        padding: "40px 80px 120px",
        color: CANVAS_INK,
        fontFamily: MONO,
      }}
    >
      {children}
    </div>
  );
}

export function DCSection({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <section style={{ marginBottom: 80 }}>
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: 20,
          marginBottom: 24,
          paddingBottom: 12,
          borderBottom: `1px solid ${CANVAS_RULE}`,
        }}
      >
        <span
          style={{
            fontSize: 11,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: CANVAS_INK,
          }}
        >
          {title}
        </span>
        {subtitle && (
          <span
            style={{
              fontSize: 11,
              letterSpacing: "0.12em",
              color: CANVAS_MUTE,
              fontFamily:
                "var(--font-inter), Inter, system-ui, sans-serif",
              textTransform: "none",
            }}
          >
            {subtitle}
          </span>
        )}
      </div>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 48,
        }}
      >
        {children}
      </div>
    </section>
  );
}

export function DCArtboard({
  label,
  width,
  height,
  children,
}: {
  label: string;
  width: number;
  height?: number;
  children: ReactNode;
}) {
  return (
    <div style={{ display: "inline-block" }}>
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          marginBottom: 10,
          color: CANVAS_MUTE,
          fontSize: 10,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
        }}
      >
        <span>{label}</span>
        <span>
          {width}
          {height ? `×${height}` : ""}
        </span>
      </div>
      <div
        style={{
          width,
          minHeight: height,
          outline: `1px solid ${CANVAS_RULE}`,
          outlineOffset: 0,
          overflow: "hidden",
        }}
      >
        {children}
      </div>
    </div>
  );
}

export function DCPostIt({
  children,
  top,
  left,
  rotate = 0,
  width = 220,
  style,
}: {
  children: ReactNode;
  top: number;
  left: number;
  rotate?: number;
  width?: number;
  style?: CSSProperties;
}) {
  return (
    <div
      style={{
        position: "absolute",
        top,
        left,
        width,
        padding: "14px 16px",
        background: "#F4E39A",
        color: "#1A1A24",
        fontFamily: "var(--font-inter), Inter, system-ui, sans-serif",
        fontSize: 12,
        lineHeight: 1.4,
        transform: `rotate(${rotate}deg)`,
        boxShadow: "0 16px 40px rgba(0,0,0,0.4)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}
