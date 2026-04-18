"use client";

/**
 * Skarbnik mascot — woodcut/editorial style.
 * Two variants ('woodcut' | 'soft') and five poses.
 * Lifted directly from the Claude Designer v1 handoff, typed for TS.
 *
 * The mascot is SVG-only, no imports beyond tokens, so it composes
 * into any surface (avatar card, full-screen celebration, inline
 * badge hover). `size` scales proportionally; viewBox is 200×260.
 */

import type { Tokens } from "./tokens";

type Pose = "idle" | "walking" | "celebrating" | "proud" | "thinking";
type Variant = "woodcut" | "soft";

export function SkarbnikMascot({
  pose = "idle",
  variant = "woodcut",
  size = 140,
  theme,
}: {
  pose?: Pose;
  variant?: Variant;
  size?: number;
  theme: Tokens;
}) {
  const t = theme;
  const ink = t.ink;
  const paper = t.card;
  const lamp = "#E8B14A";
  const skin = variant === "woodcut" ? "#E9D9BE" : "#EFD9B4";
  const beard = "#B9AF97";
  const coat = t.name === "dark" ? "#2B3A74" : "#1E2A57";
  const coatShade = t.name === "dark" ? "#1A224A" : "#141C3D";
  const helmet = "#3A2E24";
  const helmetEdge = "#241C16";

  const patternDefs = (
    <defs>
      <pattern
        id={`hatch-${pose}`}
        width="4"
        height="4"
        patternUnits="userSpaceOnUse"
        patternTransform="rotate(35)"
      >
        <line
          x1="0"
          y1="0"
          x2="0"
          y2="4"
          stroke={ink}
          strokeWidth="0.6"
          opacity="0.35"
        />
      </pattern>
      <pattern
        id={`hatch2-${pose}`}
        width="3"
        height="3"
        patternUnits="userSpaceOnUse"
        patternTransform="rotate(-40)"
      >
        <line
          x1="0"
          y1="0"
          x2="0"
          y2="3"
          stroke={ink}
          strokeWidth="0.5"
          opacity="0.5"
        />
      </pattern>
      <radialGradient id={`lampGlow-${pose}`} cx="0.5" cy="0.5" r="0.5">
        <stop offset="0%" stopColor={lamp} stopOpacity="0.9" />
        <stop offset="60%" stopColor={lamp} stopOpacity="0.15" />
        <stop offset="100%" stopColor={lamp} stopOpacity="0" />
      </radialGradient>
    </defs>
  );

  const hatch = variant === "woodcut" ? `url(#hatch-${pose})` : "none";
  const hatch2 = variant === "woodcut" ? `url(#hatch2-${pose})` : "none";
  const stroke = ink;
  const strokeW = variant === "woodcut" ? 1.2 : 1.8;

  const poseAngle =
    (
      { idle: 0, walking: -4, celebrating: 0, proud: 2, thinking: -2 } as const
    )[pose] ?? 0;

  // Pose-dependent body geometry. Tuples rather than arrays so we can
  // index by position (x1,y1,x2,y2,handx,handy) in the SVG paths.
  type Arm = readonly [number, number, number, number, number, number];
  type Legs = readonly [number, number];

  const armL: Arm = ({
    idle: [78, 108, 72, 140, 70, 148],
    walking: [78, 108, 70, 138, 68, 146],
    celebrating: [78, 108, 58, 70, 52, 58],
    proud: [78, 108, 72, 150, 70, 158],
    thinking: [78, 108, 92, 96, 100, 78],
  } as const satisfies Record<Pose, Arm>)[pose];

  const armR: Arm = ({
    idle: [122, 108, 132, 146, 138, 154],
    walking: [122, 108, 136, 140, 142, 148],
    celebrating: [122, 108, 142, 70, 150, 58],
    proud: [122, 108, 128, 150, 130, 158],
    thinking: [122, 108, 134, 146, 140, 154],
  } as const satisfies Record<Pose, Arm>)[pose];

  const legOffset: Legs = ({
    idle: [0, 0],
    walking: [-8, 6],
    celebrating: [4, 4],
    proud: [-2, 0],
    thinking: [0, 0],
  } as const satisfies Record<Pose, Legs>)[pose];

  // Eye/brow tuning per pose — drives the mascot's expression.
  const eyes = {
    idle: { L: "●" as const, R: "●" as const, brow: 0 },
    walking: { L: "●" as const, R: "●" as const, brow: 0 },
    celebrating: { L: "^" as const, R: "^" as const, brow: -2 },
    proud: { L: "●" as const, R: "●" as const, brow: -1 },
    thinking: { L: "●" as const, R: "●" as const, brow: -3 },
  }[pose];

  return (
    <svg
      viewBox="0 0 200 260"
      width={size}
      height={(size * 260) / 200}
      style={{ display: "block" }}
    >
      {patternDefs}

      {(pose === "idle" ||
        pose === "walking" ||
        pose === "thinking" ||
        pose === "proud") && (
        <circle
          cx={armR[4]}
          cy={armR[5] + 4}
          r="34"
          fill={`url(#lampGlow-${pose})`}
        />
      )}

      <ellipse cx="100" cy="244" rx="46" ry="5" fill={ink} opacity="0.12" />

      <g transform={`rotate(${poseAngle} 100 150)`}>
        {/* Legs */}
        <g>
          <path
            d={`M 86 ${186 + legOffset[0]} L ${82 + legOffset[0]} ${232} L ${92 + legOffset[0]} ${232} L 96 ${186}`}
            fill={coatShade}
            stroke={stroke}
            strokeWidth={strokeW}
            strokeLinejoin="round"
          />
          <path
            d={`M 104 ${186} L ${108 + legOffset[1]} ${232} L ${118 + legOffset[1]} ${232} L 114 ${186 + legOffset[1]}`}
            fill={coatShade}
            stroke={stroke}
            strokeWidth={strokeW}
            strokeLinejoin="round"
          />
          <ellipse
            cx={87 + legOffset[0]}
            cy={234}
            rx="9"
            ry="4"
            fill={helmet}
            stroke={stroke}
            strokeWidth={strokeW}
          />
          <ellipse
            cx={113 + legOffset[1]}
            cy={234}
            rx="9"
            ry="4"
            fill={helmet}
            stroke={stroke}
            strokeWidth={strokeW}
          />
        </g>

        {/* Coat / torso */}
        <path
          d="M 70 108 Q 70 140 76 190 L 124 190 Q 130 140 130 108 Q 118 98 100 98 Q 82 98 70 108 Z"
          fill={coat}
          stroke={stroke}
          strokeWidth={strokeW}
          strokeLinejoin="round"
        />
        <path
          d="M 70 108 Q 70 140 76 190 L 124 190 Q 130 140 130 108 Q 118 98 100 98 Q 82 98 70 108 Z"
          fill={hatch}
          opacity="0.9"
        />
        <rect
          x="72"
          y="156"
          width="56"
          height="7"
          fill={helmet}
          stroke={stroke}
          strokeWidth={strokeW * 0.9}
        />
        <rect
          x="96"
          y="155"
          width="8"
          height="9"
          fill={lamp}
          stroke={stroke}
          strokeWidth={strokeW * 0.9}
        />
        <line
          x1="100"
          y1="108"
          x2="100"
          y2="156"
          stroke={stroke}
          strokeWidth={strokeW * 0.7}
          opacity="0.6"
        />

        {/* Arms */}
        <path
          d={`M ${armL[0]} ${armL[1]} Q ${(armL[0] + armL[2]) / 2 - 4} ${(armL[1] + armL[3]) / 2} ${armL[2]} ${armL[3]}`}
          fill="none"
          stroke={stroke}
          strokeWidth={10}
          strokeLinecap="round"
        />
        <path
          d={`M ${armL[0]} ${armL[1]} Q ${(armL[0] + armL[2]) / 2 - 4} ${(armL[1] + armL[3]) / 2} ${armL[2]} ${armL[3]}`}
          fill="none"
          stroke={coat}
          strokeWidth={7.5}
          strokeLinecap="round"
        />
        <circle
          cx={armL[4]}
          cy={armL[5]}
          r="6"
          fill={skin}
          stroke={stroke}
          strokeWidth={strokeW}
        />

        <path
          d={`M ${armR[0]} ${armR[1]} Q ${(armR[0] + armR[2]) / 2 + 4} ${(armR[1] + armR[3]) / 2} ${armR[2]} ${armR[3]}`}
          fill="none"
          stroke={stroke}
          strokeWidth={10}
          strokeLinecap="round"
        />
        <path
          d={`M ${armR[0]} ${armR[1]} Q ${(armR[0] + armR[2]) / 2 + 4} ${(armR[1] + armR[3]) / 2} ${armR[2]} ${armR[3]}`}
          fill="none"
          stroke={coat}
          strokeWidth={7.5}
          strokeLinecap="round"
        />
        <circle
          cx={armR[4]}
          cy={armR[5]}
          r="6"
          fill={skin}
          stroke={stroke}
          strokeWidth={strokeW}
        />

        {/* Lantern — shown when the arm is hanging */}
        {pose !== "celebrating" && (
          <g transform={`translate(${armR[4]}, ${armR[5] + 4})`}>
            <line
              x1="0"
              y1="-6"
              x2="0"
              y2="-1"
              stroke={stroke}
              strokeWidth="1.2"
            />
            <rect
              x="-8"
              y="-1"
              width="16"
              height="4"
              fill={helmet}
              stroke={stroke}
              strokeWidth="1"
            />
            <rect
              x="-7"
              y="3"
              width="14"
              height="14"
              fill={paper}
              stroke={stroke}
              strokeWidth={strokeW}
            />
            <rect
              x="-7"
              y="3"
              width="14"
              height="14"
              fill={lamp}
              opacity="0.75"
            />
            <path
              d="M 0 6 Q -2 10 0 14 Q 2 10 0 6 Z"
              fill={lamp}
              stroke={stroke}
              strokeWidth="0.8"
            />
            <rect
              x="-9"
              y="17"
              width="18"
              height="3"
              fill={helmet}
              stroke={stroke}
              strokeWidth="1"
            />
          </g>
        )}

        {/* Pickaxe raised — celebrating only */}
        {pose === "celebrating" && (
          <g transform={`translate(${armR[4]}, ${armR[5]}) rotate(-20)`}>
            <rect
              x="-1.5"
              y="-30"
              width="3"
              height="42"
              fill={helmet}
              stroke={stroke}
              strokeWidth="1"
            />
            <path
              d="M -14 -32 Q 0 -38 14 -32 L 10 -26 Q 0 -30 -10 -26 Z"
              fill={lamp}
              stroke={stroke}
              strokeWidth={strokeW}
            />
          </g>
        )}

        {/* Head */}
        <rect
          x="94"
          y="92"
          width="12"
          height="10"
          fill={skin}
          stroke={stroke}
          strokeWidth={strokeW}
        />

        <ellipse
          cx="100"
          cy="78"
          rx="20"
          ry="22"
          fill={skin}
          stroke={stroke}
          strokeWidth={strokeW}
        />
        <path
          d="M 100 56 A 20 22 0 0 0 80 78 A 20 22 0 0 0 100 100 Z"
          fill={hatch2}
          opacity="0.6"
        />

        {/* Beard */}
        <path
          d="M 82 82 Q 84 106 100 112 Q 116 106 118 82 Q 118 96 110 98 Q 100 100 90 98 Q 82 96 82 82 Z"
          fill={beard}
          stroke={stroke}
          strokeWidth={strokeW}
        />
        <path
          d="M 82 82 Q 84 106 100 112 Q 116 106 118 82 Q 118 96 110 98 Q 100 100 90 98 Q 82 96 82 82 Z"
          fill={hatch}
          opacity="0.7"
        />
        <path
          d="M 86 82 Q 92 86 100 84 Q 108 86 114 82 Q 108 90 100 89 Q 92 90 86 82 Z"
          fill={beard}
          stroke={stroke}
          strokeWidth="1"
        />

        {/* Eyes — expression per pose */}
        <g>
          <path
            d={`M 87 ${66 + eyes.brow} Q 92 ${64 + eyes.brow} 96 ${66 + eyes.brow}`}
            fill="none"
            stroke={stroke}
            strokeWidth={strokeW * 1.2}
            strokeLinecap="round"
          />
          <path
            d={`M 104 ${66 + eyes.brow} Q 108 ${64 + eyes.brow} 113 ${66 + eyes.brow}`}
            fill="none"
            stroke={stroke}
            strokeWidth={strokeW * 1.2}
            strokeLinecap="round"
          />
          {eyes.L === "●" ? (
            <>
              <circle cx="92" cy="74" r="1.8" fill={stroke} />
              <circle cx="108" cy="74" r="1.8" fill={stroke} />
            </>
          ) : (
            <>
              <path
                d="M 89 76 Q 92 72 95 76"
                fill="none"
                stroke={stroke}
                strokeWidth={strokeW * 1.1}
                strokeLinecap="round"
              />
              <path
                d="M 105 76 Q 108 72 111 76"
                fill="none"
                stroke={stroke}
                strokeWidth={strokeW * 1.1}
                strokeLinecap="round"
              />
            </>
          )}
        </g>

        {/* Helmet */}
        <path
          d="M 78 62 Q 78 50 100 48 Q 122 50 122 62 L 124 66 L 76 66 Z"
          fill={helmet}
          stroke={stroke}
          strokeWidth={strokeW}
          strokeLinejoin="round"
        />
        <path
          d="M 78 62 Q 78 50 100 48 Q 122 50 122 62 L 124 66 L 76 66 Z"
          fill={hatch}
          opacity="0.5"
        />
        <rect x="76" y="62" width="48" height="4" fill={helmetEdge} />
        <g>
          <rect
            x="94"
            y="52"
            width="12"
            height="9"
            rx="1"
            fill={lamp}
            stroke={stroke}
            strokeWidth="1"
          />
          <circle
            cx="100"
            cy="56.5"
            r="2.5"
            fill="#FFF4C2"
            stroke={stroke}
            strokeWidth="0.6"
          />
        </g>
      </g>
    </svg>
  );
}
