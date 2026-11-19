import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Defs } from "./rig/Defs";
import { Char, Pose } from "./rig/Char";
import { CHARS } from "./rig/chars";

const CAST: [string, Pose][] = [
  ["tanjiro", { sword: "R", aR: [60, 70], sw: 135, aL: [-30, 60], expr: "fierce", lR: [14, -6], lL: [-14, 4] }],
  ["nezuko", { demon: true, aL: [-40, -20], aR: [30, 30], expr: "angry" }],
  ["zenitsu", { sword: "R", aR: [40, 40], sw: 110, expr: "closed", lean: 8, lR: [30, -40], lL: [-24, 10] }],
  ["inosuke", { sword: "R", aR: [120, 20], aL: [-120, -20], sw: 120 }],
  ["giyu", { sword: "R", aR: [50, 40], sw: 165, expr: "neutral" }],
  ["rengoku", { sword: "R", aR: [150, 20], sw: 175, expr: "smile", aL: [-20, 10] }],
  ["kanao", { expr: "soft", aL: [-6, 50], aR: [6, -50] }],
  ["muichiro", { sword: "R", aR: [90, 60], sw: 160 }],
  ["akaza", { expr: "smile", aR: [70, 80], aL: [-70, -80], lR: [16, -6], lL: [-16, 6] }],
  ["muzan", { expr: "neutral", aR: [10, -6], aL: [-10, 6] }],
];

export const Cast: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: "linear-gradient(#1b1d2b, #3a2a3a 60%, #e0703a)" }}>
      <svg viewBox="0 0 1920 1080" width={1920} height={1080}>
        <Defs />
        {CAST.map(([id, p], i) => (
          <g key={id}>
            <Char id={id} p={{ x: 120 + i * 187, y: 1000, s: 0.86, ...p }} t={f / 30} />
            <text x={120 + i * 187} y={1052} textAnchor="middle" fontSize={26} fontWeight={800} fill="#fff" fontFamily="sans-serif">{CHARS[id].name}</text>
          </g>
        ))}
      </svg>
    </AbsoluteFill>
  );
};
