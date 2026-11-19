import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Defs } from "./rig/Defs";
import { Char, Pose } from "./rig/Char";
import { CHARS } from "./rig/chars";

export const ModelSheet: React.FC<{ page?: number }> = ({ page = 0 }) => {
  const f = useCurrentFrame();
  const ids = Object.keys(CHARS);
  const per = 9;
  const list = ids.slice(page * per, page * per + per);
  const poses: Pose[] = [
    {}, { expr: "angry", sword: "R", aR: [70, 50], sw: 140 }, { expr: "smile", aL: [-40, -70] }, { expr: "sad" }, { expr: "shout" },
    { expr: "happy" }, { expr: "shock" }, { expr: "cry" }, { expr: "fierce", sword: "R", aR: [100, 10], sw: 120 },
  ];
  return (
    <AbsoluteFill style={{ background: "#e9e2d4" }}>
      <svg viewBox="0 0 1920 1080" width={1920} height={1080}>
        <Defs />
        {list.map((id, i) => (
          <g key={id}>
            <Char id={id} p={{ x: 110 + i * 212, y: 1020, s: 0.92, ...poses[i % poses.length] }} t={f / 30} />
            <text x={110 + i * 212} y={1066} textAnchor="middle" fontSize={22} fontFamily="sans-serif">{id}</text>
          </g>
        ))}
      </svg>
    </AbsoluteFill>
  );
};

export const FaceSheet: React.FC<{ ids: string[]; exprs?: Pose[] }> = ({ ids, exprs }) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: "#e9e2d4" }}>
      <svg viewBox="0 0 1920 1080" width={1920} height={1080}>
        <Defs />
        {ids.map((id, i) => {
          const col = i % 4, row = Math.floor(i / 4);
          return (
            <g key={id + i}>
              <Char id={id} p={{ x: 240 + col * 480, y: 520 + row * 540 + 1080, s: 2.6, ...(exprs ? exprs[i % exprs.length] : {}) }} t={f / 30} />
              <text x={240 + col * 480} y={520 + row * 540} textAnchor="middle" fontSize={24} fontFamily="sans-serif">{id}</text>
            </g>
          );
        })}
      </svg>
    </AbsoluteFill>
  );
};
